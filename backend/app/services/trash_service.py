"""回收站管理"""

import os
import shutil
import time
from pathlib import Path
from app.config import settings


def clean_expired_trash():
    """清理过期回收站文件"""
    trash_dir = settings.TRASH_DIR
    if not trash_dir.exists():
        return

    cutoff = time.time() - settings.TRASH_AUTO_CLEAN_DAYS * 86400
    for item in trash_dir.iterdir():
        try:
            if item.stat().st_mtime < cutoff:
                if item.is_dir():
                    shutil.rmtree(str(item))
                else:
                    os.remove(str(item))
        except OSError:
            pass


def get_trash_stats() -> dict:
    """获取回收站统计"""
    trash_dir = settings.TRASH_DIR
    if not trash_dir.exists():
        return {"total_items": 0, "total_size": 0}

    total_size = 0
    total_items = 0
    for item in trash_dir.iterdir():
        try:
            total_items += 1
            if item.is_file():
                total_size += item.stat().st_size
            elif item.is_dir():
                total_size += sum(
                    f.stat().st_size for f in item.rglob("*") if f.is_file()
                )
        except OSError:
            pass
    return {"total_items": total_items, "total_size": total_size}
