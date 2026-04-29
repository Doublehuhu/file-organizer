"""搜索API"""
from fastapi import APIRouter, HTTPException, Query
from app.utils.security import resolve_safe_path, is_path_allowed
from pathlib import Path
import os

router = APIRouter()


@router.get("")
async def api_search(
    q: str = Query(""),
    path: str = Query(""),
    page: int = Query(1),
    page_size: int = Query(50),
):
    if not q:
        return {"results": [], "total": 0, "page": page, "page_size": page_size}

    search_path = Path(path) if path and is_path_allowed(path) else Path.home()
    results = []
    try:
        for entry in search_path.rglob("*"):
            if entry.name.startswith("."):
                continue
            if q.lower() in entry.name.lower():
                if len(results) >= page_size:
                    break
                try:
                    stat = entry.stat()
                    results.append({
                        "name": entry.name,
                        "path": str(entry.resolve()),
                        "is_dir": entry.is_dir(),
                        "size": stat.st_size if not entry.is_dir() else 0,
                        "modified_at": "",
                        "extension": entry.suffix.lower(),
                        "match_context": entry.name,
                    })
                except OSError:
                    continue
    except Exception:
        pass

    return {"results": results, "total": len(results), "page": page, "page_size": page_size}
