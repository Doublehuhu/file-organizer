"""系统状态API"""

import time
from fastapi import APIRouter
from pydantic import BaseModel
from app.config import settings
from app.models.database import get_db

router = APIRouter()
_start_time = time.time()


@router.get("/health")
async def api_health():
    return {
        "status": "ok",
        "version": settings.VERSION,
        "uptime": round(time.time() - _start_time, 1),
    }


@router.get("/stats")
async def api_stats():
    conn = get_db()
    total_ops = conn.execute("SELECT COUNT(*) FROM operation_history").fetchone()[0]
    renames = conn.execute(
        "SELECT COUNT(*) FROM rename_history"
    ).fetchone()[0] if _table_exists(conn, "rename_history") else 0
    conn.close()
    return {
        "total_operations": total_ops,
        "rename_count": renames,
        "organize_count": 0,
    }


@router.get("/settings")
async def api_get_settings():
    conn = get_db()
    rows = conn.execute("SELECT key, value FROM settings").fetchall()
    conn.close()
    result = {}
    for row in rows:
        result[row["key"]] = row["value"]
    result["allowed_directories"] = settings.allowed_directories
    return result


@router.get("/drives")
async def api_drives():
    return {"drives": [{"mount_point": "/", "name": "Macintosh HD"}]}


class SettingsUpdate(BaseModel):
    key: str
    value: str


@router.put("/settings")
async def api_update_settings(req: SettingsUpdate):
    conn = get_db()
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?,?,datetime('now','localtime'))",
        (req.key, req.value),
    )
    conn.commit()
    conn.close()
    return {"success": True}


def _table_exists(conn, table_name: str) -> bool:
    row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (table_name,),
    ).fetchone()
    return row is not None
