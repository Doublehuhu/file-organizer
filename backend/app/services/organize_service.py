"""自动整理服务"""

import json
import uuid
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from app.config import settings
from app.models.database import get_db
from app.utils.security import resolve_safe_path, validate_path_exists


def validate_is_dir(path: Path):
    if not path.is_dir():
        from app.utils.security import PathSecurityError
        raise PathSecurityError(f"不是目录: {path}", "NOT_DIRECTORY")


def get_categories() -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT c.*, (SELECT COUNT(*) FROM category_rules WHERE category_id=c.id) as rule_count FROM categories c ORDER BY c.sort_order"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_category(name: str, path: str, parent_id: int | None = None,
                    color: str = "#1890ff", description: str = "") -> dict:
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO categories (name, path, parent_id, color, description) VALUES (?,?,?,?,?)",
        (name, path, parent_id, color, description),
    )
    conn.commit()
    cat_id = cursor.lastrowid
    conn.close()
    return {"id": cat_id, "name": name, "path": path}


def delete_category(category_id: int):
    conn = get_db()
    conn.execute("DELETE FROM category_rules WHERE category_id=?", (category_id,))
    conn.execute("DELETE FROM categories WHERE id=?", (category_id,))
    conn.commit()
    conn.close()


def add_rule(category_id: int, rule_type: str, rule_value: str, priority: int = 0) -> dict:
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO category_rules (category_id, rule_type, rule_value, priority) VALUES (?,?,?,?)",
        (category_id, rule_type, rule_value, priority),
    )
    conn.commit()
    rule_id = cursor.lastrowid
    conn.close()
    return {"id": rule_id, "category_id": category_id, "rule_type": rule_type}


def preview_sort(source_dir: str) -> dict:
    src = resolve_safe_path(source_dir)
    validate_path_exists(src)
    validate_is_dir(src)
    categories = get_categories()
    conn = get_db()
    rules_rows = conn.execute(
        """SELECT cr.*, c.name as cat_name, c.path as cat_path
           FROM category_rules cr JOIN categories c ON cr.category_id=c.id
           WHERE cr.is_active=1 ORDER BY cr.priority"""
    ).fetchall()
    conn.close()
    groups = {}
    for cat in categories:
        groups[cat["name"]] = {
            "category_id": cat["id"], "category_name": cat["name"],
            "cat_path": cat["path"], "files": [],
        }
    unclassified = []
    for entry in sorted(src.iterdir()):
        if entry.name.startswith("."):
            continue
        matched = False
        for rule in rules_rows:
            if _match_rule(entry, dict(rule)):
                cat_name = rule["cat_name"]
                if cat_name not in groups:
                    groups[cat_name] = {
                        "category_id": rule["category_id"],
                        "category_name": cat_name,
                        "cat_path": rule["cat_path"],
                        "files": [],
                    }
                groups[cat_name]["files"].append({
                    "name": entry.name, "path": str(entry.resolve()),
                })
                matched = True
                break
        if not matched:
            unclassified.append({"name": entry.name, "path": str(entry.resolve())})
    return {"groups": [g for g in groups.values() if g["files"]], "unclassified": unclassified}


def _match_rule(entry: Path, rule: dict) -> bool:
    rule_type = rule["rule_type"]
    rule_value = rule["rule_value"]
    if rule_type == "extension":
        extensions = json.loads(rule_value).get("extensions", [])
        return entry.suffix.lower() in [e.lower() for e in extensions]
    elif rule_type == "keyword":
        keywords = json.loads(rule_value).get("keywords", [])
        return any(kw.lower() in entry.name.lower() for kw in keywords)
    elif rule_type == "regex":
        import re
        pattern = json.loads(rule_value).get("regex", "")
        return bool(re.search(pattern, entry.name))
    return False


def apply_sort(source_dir: str, assignments: list[dict]) -> dict:
    operation_id = str(uuid.uuid4())
    results = []
    undo_data = []
    for item in assignments:
        file_path = item["file_path"]
        target_dir = item["target_dir"]
        try:
            src = resolve_safe_path(file_path)
            validate_path_exists(src)
            dest_dir = Path(target_dir)
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest = dest_dir / src.name
            if dest.exists():
                results.append({
                    "file_path": file_path, "target_dir": target_dir,
                    "success": False, "error": "目标已存在",
                })
                continue
            shutil.move(str(src), str(dest))
            undo_data.append({"original": str(dest), "restore_to": str(src)})
            results.append({
                "file_path": file_path, "target_dir": target_dir, "success": True,
            })
        except Exception as e:
            results.append({
                "file_path": file_path, "target_dir": target_dir,
                "success": False, "error": str(e),
            })
    expires_at = (datetime.now() + timedelta(minutes=settings.UNDO_WINDOW_MINUTES)).isoformat()
    conn = get_db()
    conn.execute(
        """INSERT INTO operation_history
           (operation_id, op_type, source_paths, dest_paths, file_count, metadata, undo_data, expires_at)
           VALUES (?,?,?,?,?,?,?,?)""",
        (operation_id, "move",
         json.dumps([a["file_path"] for a in assignments]),
         json.dumps([a["target_dir"] for a in assignments]),
         len(assignments),
         json.dumps(results, ensure_ascii=False),
         json.dumps(undo_data, ensure_ascii=False),
         expires_at),
    )
    conn.commit()
    conn.close()
    return {
        "operation_id": operation_id, "results": results,
        "undo_available_until": expires_at,
    }


def auto_categorize(source_dir: str) -> dict:
    from app.services.ai_service import suggest_categories
    src = resolve_safe_path(source_dir)
    validate_path_exists(src)
    files = []
    for entry in sorted(src.iterdir()):
        if entry.name.startswith("."):
            continue
        try:
            stat = entry.stat()
            files.append({
                "name": entry.name, "path": str(entry.resolve()),
                "size": stat.st_size, "ext": entry.suffix.lower(),
                "is_dir": entry.is_dir(),
            })
        except OSError:
            continue
    categories = suggest_categories(files)
    return {"categories": categories, "total_files": len(files)}
