"""核心文件系统操作 + 撤销支持"""

import json
import os
import shutil
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from app.config import settings
from app.models.database import get_db
from app.utils.security import resolve_safe_path, validate_path_exists, PathSecurityError


def list_files(dir_path: str, page: int = 1, page_size: int = 100,
               sort_by: str = "name", sort_order: str = "asc") -> dict:
    """列出目录内容"""
    path = resolve_safe_path(dir_path)
    validate_path_exists(path)
    validate_is_dir(path)

    items = []
    for entry in sorted(path.iterdir(), key=lambda e: _sort_key(e, sort_by)):
        try:
            stat = entry.stat()
            items.append({
                "name": entry.name,
                "path": str(entry.resolve()),
                "is_dir": entry.is_dir(),
                "size": stat.st_size if not entry.is_dir() else 0,
                "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "created_at": datetime.fromtimestamp(stat.st_birthtime if hasattr(stat, 'st_birthtime') else stat.st_ctime).isoformat(),
                "extension": entry.suffix.lower() if not entry.is_dir() else "",
                "mime_type": "",
            })
        except OSError:
            continue

    if sort_order == "desc":
        items.reverse()

    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "files": items[start:end],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def _sort_key(entry: Path, sort_by: str):
    if sort_by == "name":
        return (not entry.is_dir(), entry.name.lower())
    elif sort_by == "size":
        try:
            return (not entry.is_dir(), entry.stat().st_size)
        except OSError:
            return (not entry.is_dir(), 0)
    elif sort_by == "date":
        try:
            return (not entry.is_dir(), entry.stat().st_mtime)
        except OSError:
            return (not entry.is_dir(), 0)
    elif sort_by == "type":
        return (not entry.is_dir(), entry.suffix.lower())
    return (not entry.is_dir(), entry.name.lower())


def validate_is_dir(path: Path):
    if not path.is_dir():
        raise PathSecurityError(f"路径不是目录: {path}", "NOT_DIRECTORY")


def get_file_info(file_path: str) -> dict:
    """获取单个文件信息"""
    path = resolve_safe_path(file_path)
    validate_path_exists(path)
    stat = path.stat()
    return {
        "name": path.name,
        "path": str(path.resolve()),
        "is_dir": path.is_dir(),
        "size": stat.st_size if not path.is_dir() else 0,
        "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        "created_at": datetime.fromtimestamp(
            stat.st_birthtime if hasattr(stat, 'st_birthtime') else stat.st_ctime
        ).isoformat(),
        "extension": path.suffix.lower() if not path.is_dir() else "",
        "mime_type": "",
        "permissions": oct(stat.st_mode)[-3:],
        "is_symlink": path.is_symlink(),
    }


def move_files(source_paths: list[str], destination_dir: str) -> dict:
    """移动文件到目标目录"""
    dest_path = resolve_safe_path(destination_dir)
    validate_path_exists(dest_path)
    validate_is_dir(dest_path)

    operation_id = str(uuid.uuid4())
    results = []
    undo_data = []

    for src in source_paths:
        src_path = resolve_safe_path(src)
        validate_path_exists(src_path)
        target = dest_path / src_path.name

        try:
            if target.exists():
                results.append({"source": src, "dest": str(target), "success": False, "error": "目标文件已存在"})
                continue

            shutil.move(str(src_path), str(target))
            undo_data.append({"original": str(target), "restore_to": str(src_path)})
            results.append({"source": src, "dest": str(target), "success": True})
        except OSError as e:
            results.append({"source": src, "dest": str(target), "success": False, "error": str(e)})

    expires_at = (datetime.now() + timedelta(minutes=settings.UNDO_WINDOW_MINUTES)).isoformat()
    _record_operation(operation_id, "move", source_paths, str(dest_path), len(source_paths), {"results": results, "undo": undo_data}, expires_at)

    return {
        "operation_id": operation_id,
        "results": results,
        "undo_available_until": expires_at,
    }


def copy_files(source_paths: list[str], destination_dir: str) -> dict:
    """复制文件到目标目录"""
    dest_path = resolve_safe_path(destination_dir)
    validate_path_exists(dest_path)
    validate_is_dir(dest_path)

    operation_id = str(uuid.uuid4())
    results = []

    for src in source_paths:
        src_path = resolve_safe_path(src)
        validate_path_exists(src_path)
        target = dest_path / src_path.name

        try:
            if src_path.is_dir():
                shutil.copytree(str(src_path), str(target))
            else:
                shutil.copy2(str(src_path), str(target))
            results.append({"source": src, "dest": str(target), "success": True})
        except OSError as e:
            results.append({"source": src, "dest": str(target), "success": False, "error": str(e)})

    _record_operation(operation_id, "copy", source_paths, str(dest_path), len(source_paths), {"results": results}, None)

    return {"operation_id": operation_id, "results": results, "undo_available_until": ""}


def rename_file(file_path: str, new_name: str) -> dict:
    """重命名文件"""
    src_path = resolve_safe_path(file_path)
    validate_path_exists(src_path)
    dest_path = src_path.parent / new_name

    if dest_path.exists():
        raise PathSecurityError(f"目标文件名已存在: {new_name}", "CONFLICT")

    operation_id = str(uuid.uuid4())
    try:
        os.rename(str(src_path), str(dest_path))
        expires_at = (datetime.now() + timedelta(minutes=settings.UNDO_WINDOW_MINUTES)).isoformat()
        undo_data = {"original": str(dest_path), "restore_to": str(src_path)}
        _record_operation(operation_id, "rename", [file_path], str(dest_path), 1, {"undo": [undo_data]}, expires_at)

        return {
            "operation_id": operation_id,
            "old_path": str(src_path),
            "new_path": str(dest_path),
        }
    except OSError as e:
        raise PathSecurityError(f"重命名失败: {e}", "RENAME_FAILED")


def delete_files(paths: list[str], permanent: bool = False) -> dict:
    """删除文件（默认移入回收站）"""
    operation_id = str(uuid.uuid4())
    results = []
    undo_data = []

    if not permanent:
        trash_op_dir = settings.TRASH_DIR / operation_id
        trash_op_dir.mkdir(parents=True, exist_ok=True)

    for file_path in paths:
        src_path = resolve_safe_path(file_path)
        validate_path_exists(src_path)

        try:
            if permanent:
                if src_path.is_dir():
                    shutil.rmtree(str(src_path))
                else:
                    os.remove(str(src_path))
                undo_data.append(None)
            else:
                dest = trash_op_dir / src_path.name
                shutil.move(str(src_path), str(dest))
                undo_data.append({"original": str(dest), "restore_to": str(src_path)})

            results.append({"source": file_path, "dest": str(trash_op_dir) if not permanent else "", "success": True})
        except OSError as e:
            results.append({"source": file_path, "dest": "", "success": False, "error": str(e)})

    expires_at = (datetime.now() + timedelta(minutes=settings.UNDO_WINDOW_MINUTES)).isoformat() if not permanent else None
    _record_operation(operation_id, "delete", paths, str(trash_op_dir) if not permanent else "", len(paths), {"undo": undo_data, "permanent": permanent}, expires_at)

    return {
        "operation_id": operation_id,
        "results": results,
        "undo_available_until": expires_at or "",
    }


def create_folder(parent_path: str, folder_name: str) -> dict:
    """创建新文件夹"""
    parent = resolve_safe_path(parent_path)
    validate_path_exists(parent)
    validate_is_dir(parent)

    new_folder = parent / folder_name
    if new_folder.exists():
        raise PathSecurityError(f"文件夹已存在: {folder_name}", "CONFLICT")

    new_folder.mkdir(parents=True)
    return {"path": str(new_folder.resolve()), "name": folder_name}


def undo_operation(operation_id: str) -> dict:
    """撤销操作"""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM operation_history WHERE operation_id=? AND undone=0",
        (operation_id,)
    ).fetchone()
    conn.close()

    if not row:
        raise PathSecurityError("操作记录不存在或已撤销", "NOT_FOUND")

    expires_at = row["expires_at"]
    if expires_at and datetime.now() > datetime.fromisoformat(expires_at):
        raise PathSecurityError("撤销窗口已过期", "EXPIRED")

    undo_data = json.loads(row["undo_data"]) if row["undo_data"] else {}
    op_type = row["op_type"]

    if op_type == "delete":
        for item in undo_data.get("undo", []):
            if item:
                shutil.move(item["original"], item["restore_to"])
    elif op_type == "move" or op_type == "rename":
        for item in undo_data.get("undo", []):
            shutil.move(item["original"], item["restore_to"])

    conn = get_db()
    conn.execute(
        "UPDATE operation_history SET undone=1 WHERE operation_id=?",
        (operation_id,)
    )
    conn.commit()
    conn.close()

    return {"success": True, "operation_id": operation_id}


def _record_operation(operation_id: str, op_type: str, source_paths: list[str],
                      dest_paths: str, file_count: int, metadata: dict,
                      expires_at: str | None):
    conn = get_db()
    conn.execute(
        """INSERT INTO operation_history
           (operation_id, op_type, source_paths, dest_paths, file_count, metadata, undo_data, expires_at)
           VALUES (?,?,?,?,?,?,?,?)""",
        (operation_id, op_type, json.dumps(source_paths), dest_paths, file_count,
         json.dumps(metadata.get("results", []), ensure_ascii=False),
         json.dumps(metadata.get("undo", []), ensure_ascii=False),
         expires_at),
    )
    conn.commit()
    conn.close()
