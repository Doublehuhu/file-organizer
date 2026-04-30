"""文件操作API"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.models.schemas import (
    FileListResponse, FileInfoResponse, BatchOperationRequest,
    RenameRequest, CreateFolderRequest, DeleteRequest, UndoRequest,
    BatchOperationResponse,
)
from app.services.file_service import (
    list_files, get_file_info, move_files, copy_files,
    rename_file, delete_files, create_folder, undo_operation,
)
from pathlib import Path as FSPath
from app.utils.security import PathSecurityError, resolve_safe_path
from app.models.database import get_db

router = APIRouter()


@router.get("/list", response_model=FileListResponse)
async def api_list_files(
    path: str = Query(..., description="目录路径"),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    sort: str = Query("name"),
    order: str = Query("asc"),
):
    try:
        return list_files(path, page, page_size, sort, order)
    except PathSecurityError as e:
        raise HTTPException(status_code=400, detail={"code": e.code, "message": e.message})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/info", response_model=FileInfoResponse)
async def api_file_info(path: str = Query(..., description="文件路径")):
    try:
        return get_file_info(path)
    except PathSecurityError as e:
        status = 400 if e.code not in ("NOT_FOUND",) else 404
        raise HTTPException(status_code=status, detail={"code": e.code, "message": e.message})


@router.post("/move", response_model=BatchOperationResponse)
async def api_move_files(req: BatchOperationRequest):
    try:
        return move_files(req.source_paths, req.destination_dir)
    except PathSecurityError as e:
        status = 400 if e.code != "NOT_FOUND" else 404
        raise HTTPException(status_code=status, detail={"code": e.code, "message": e.message})


@router.post("/copy", response_model=BatchOperationResponse)
async def api_copy_files(req: BatchOperationRequest):
    try:
        return copy_files(req.source_paths, req.destination_dir)
    except PathSecurityError as e:
        status = 400 if e.code != "NOT_FOUND" else 404
        raise HTTPException(status_code=status, detail={"code": e.code, "message": e.message})


@router.post("/rename")
async def api_rename(req: RenameRequest):
    try:
        return rename_file(req.path, req.new_name)
    except PathSecurityError as e:
        status_map = {"CONFLICT": 409, "NOT_FOUND": 404}
        status = status_map.get(e.code, 400)
        raise HTTPException(status_code=status, detail={"code": e.code, "message": e.message})


@router.post("/delete", response_model=BatchOperationResponse)
async def api_delete(req: DeleteRequest):
    try:
        return delete_files(req.paths, req.permanent)
    except PathSecurityError as e:
        raise HTTPException(status_code=400, detail={"code": e.code, "message": e.message})


@router.post("/create-folder")
async def api_create_folder(req: CreateFolderRequest):
    try:
        return create_folder(req.parent_path, req.folder_name)
    except PathSecurityError as e:
        status = 409 if e.code == "CONFLICT" else 400
        raise HTTPException(status_code=status, detail={"code": e.code, "message": e.message})


@router.post("/undo")
async def api_undo(req: UndoRequest):
    try:
        return undo_operation(req.operation_id)
    except PathSecurityError as e:
        status_map = {"NOT_FOUND": 404, "EXPIRED": 400}
        status = status_map.get(e.code, 400)
        raise HTTPException(status_code=status, detail={"code": e.code, "message": e.message})


# --- 收藏夹 ---
@router.get("/favorites")
async def api_favorites():
    conn = get_db()
    rows = conn.execute("SELECT * FROM favorites ORDER BY sort_order").fetchall()
    conn.close()
    return {"favorites": [dict(r) for r in rows]}

class FavRequest(BaseModel):
    path: str
    label: str = ""

@router.post("/favorites")
async def api_add_favorite(req: FavRequest):
    from pathlib import Path
    try:
        resolve_safe_path(req.path)
        conn = get_db()
        conn.execute("INSERT OR IGNORE INTO favorites (path, label) VALUES (?,?)", (req.path, req.label or Path(req.path).name))
        conn.commit(); conn.close()
        return {"success": True}
    except PathSecurityError as e:
        raise HTTPException(status_code=400, detail={"code": e.code, "message": e.message})

@router.delete("/favorites/{fav_id}")
async def api_remove_favorite(fav_id: int):
    conn = get_db()
    conn.execute("DELETE FROM favorites WHERE id=?", (fav_id,))
    conn.commit(); conn.close()
    return {"success": True}
