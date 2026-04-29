"""AI重命名编排、模式学习"""

import json
import uuid
from datetime import datetime, timedelta
from app.config import settings
from app.models.database import get_db
from app.services.ai_service import suggest_rename_names
from app.services.preview_service import get_preview_content


def get_rename_suggestions(paths: list[str], template: str = "", context: str = "") -> list[dict]:
    """获取AI重命名建议"""
    # 收集文件信息
    file_infos = []
    for path in paths[:settings.MAX_AI_BATCH]:
        from app.utils.security import resolve_safe_path, validate_path_exists
        try:
            p = resolve_safe_path(path)
            validate_path_exists(p)
            stat = p.stat()

            info = {
                "name": p.name,
                "path": str(p.resolve()),
                "size": stat.st_size,
                "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "file_type": p.suffix.lower(),
                "content_summary": "",
            }

            # 提取内容摘要
            try:
                preview = get_preview_content(str(p.resolve()), max_size=2000)
                if preview.get("content"):
                    info["content_summary"] = preview["content"][:500]
            except Exception:
                pass

            file_infos.append(info)
        except Exception:
            continue

    if not file_infos:
        return []

    # 获取用户命名习惯
    patterns = get_learned_patterns()
    templates = get_templates()

    # 调用AI
    suggestions = suggest_rename_names(file_infos, patterns, templates, context)

    # 注入提取信息
    for i, suggestion in enumerate(suggestions):
        if i < len(file_infos):
            suggestion["file_type"] = file_infos[i]["file_type"]
            suggestion["extracted_info"] = {
                "has_content": bool(file_infos[i].get("content_summary")),
                "has_metadata": False,
                "content_summary": file_infos[i].get("content_summary", ""),
            }

    return suggestions


def apply_renames(renames: list[dict], template_id: int | None = None) -> dict:
    """应用重命名"""
    import os
    from pathlib import Path
    from app.utils.security import resolve_safe_path, validate_path_exists

    operation_id = str(uuid.uuid4())
    results = []
    undo_data = []

    for item in renames:
        orig_path = item["original_path"]
        new_name = item["new_name"]

        try:
            src = resolve_safe_path(orig_path)
            validate_path_exists(src)
            dest = src.parent / new_name

            if dest.exists() and dest != src:
                results.append({"original_path": orig_path, "new_path": str(dest), "success": False, "error": "目标文件已存在"})
                continue

            os.rename(str(src), str(dest))
            undo_data.append({"original": str(dest), "restore_to": str(src)})
            results.append({"original_path": orig_path, "new_path": str(dest), "success": True})

            # 记录重命名历史
            _record_rename(operation_id, orig_path, src.name, new_name, template_id)
            # 学习命名模式
            learn_pattern(src.name, new_name)

        except Exception as e:
            results.append({"original_path": orig_path, "new_path": "", "success": False, "error": str(e)})

    expires_at = (datetime.now() + timedelta(minutes=settings.UNDO_WINDOW_MINUTES)).isoformat()
    _record_rename_operation(operation_id, renames, undo_data, expires_at)

    return {"operation_id": operation_id, "results": results, "undo_available_until": expires_at}


def _record_rename(operation_id: str, file_path: str, old_name: str, new_name: str, template_id: int | None):
    conn = get_db()
    conn.execute(
        """INSERT INTO rename_history (operation_id, file_path, original_name, new_name, ai_generated, template_id)
           VALUES (?,?,?,?,1,?)""",
        (operation_id, file_path, old_name, new_name, template_id),
    )
    conn.commit()
    conn.close()


def _record_rename_operation(operation_id: str, renames: list[dict], undo_data: list[dict], expires_at: str):
    conn = get_db()
    conn.execute(
        """INSERT INTO operation_history (operation_id, op_type, source_paths, dest_paths, file_count, metadata, undo_data, expires_at)
           VALUES (?,?,?,?,?,?,?,?)""",
        (operation_id, "rename",
         json.dumps([r["original_path"] for r in renames]),
         json.dumps([r["new_name"] for r in renames]),
         len(renames),
         json.dumps([], ensure_ascii=False),
         json.dumps(undo_data, ensure_ascii=False),
         expires_at),
    )
    conn.commit()
    conn.close()


def learn_pattern(old_name: str, new_name: str):
    """从重命名中学习模式"""
    import re

    # 检测分隔符
    for sep in ["_", "-", " ", "."]:
        if sep in new_name and sep not in old_name:
            _update_pattern("separator", sep)

    # 检测日期格式
    date_patterns = [
        (r"\d{4}-\d{2}-\d{2}", "YYYY-MM-DD"),
        (r"\d{4}\d{2}\d{2}", "YYYYMMDD"),
        (r"\d{2}\d{2}\d{2}", "YYMMDD"),
    ]
    old_stem = old_name.rsplit(".", 1)[0] if "." in old_name else old_name
    new_stem = new_name.rsplit(".", 1)[0] if "." in new_name else new_name

    for pat, name in date_patterns:
        if re.search(pat, new_stem) and not re.search(pat, old_stem):
            _update_pattern("date_format", name)
            break


def _update_pattern(pattern_type: str, pattern_value: str):
    conn = get_db()
    existing = conn.execute(
        "SELECT id, confidence, sample_count FROM naming_patterns WHERE pattern_type=? AND pattern_value=?",
        (pattern_type, pattern_value),
    ).fetchone()
    if existing:
        new_count = existing["sample_count"] + 1
        new_conf = min(1.0, existing["confidence"] + 0.05)
        conn.execute(
            "UPDATE naming_patterns SET sample_count=?, confidence=?, last_used=datetime('now','localtime') WHERE id=?",
            (new_count, new_conf, existing["id"]),
        )
    else:
        conn.execute(
            "INSERT INTO naming_patterns (pattern_type, pattern_value) VALUES (?,?)",
            (pattern_type, pattern_value),
        )
    conn.commit()
    conn.close()


def get_learned_patterns() -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT pattern_type, pattern_value, confidence, sample_count FROM naming_patterns ORDER BY confidence DESC"
    ).fetchall()
    conn.close()
    return [{"pattern_type": r["pattern_type"], "pattern_value": r["pattern_value"], "confidence": r["confidence"], "sample_count": r["sample_count"]} for r in rows]


def get_templates() -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT id, name, pattern, description, use_count FROM naming_templates ORDER BY use_count DESC"
    ).fetchall()
    conn.close()
    return [{"id": r["id"], "name": r["name"], "pattern": r["pattern"], "description": r["description"], "use_count": r["use_count"]} for r in rows]


def get_rename_history(page: int = 1, page_size: int = 50) -> dict:
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) FROM rename_history").fetchone()[0]
    rows = conn.execute(
        "SELECT * FROM rename_history ORDER BY created_at DESC LIMIT ? OFFSET ?",
        (page_size, (page - 1) * page_size),
    ).fetchall()
    conn.close()
    items = [dict(r) for r in rows]
    return {"items": items, "total": total, "page": page, "page_size": page_size}
