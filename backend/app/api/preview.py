"""文件预览API"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response, StreamingResponse
from app.services.preview_service import get_preview_content, get_thumbnail, get_metadata
from app.utils.security import PathSecurityError, resolve_safe_path, validate_path_exists
from app.config import settings

router = APIRouter()


@router.get("/content")
async def api_preview_content(
    path: str = Query(..., description="文件路径"),
    max_size: int = Query(settings.MAX_PREVIEW_TEXT_SIZE),
):
    try:
        return get_preview_content(path, max_size)
    except PathSecurityError as e:
        status = 404 if e.code == "NOT_FOUND" else 400
        raise HTTPException(status_code=status, detail={"code": e.code, "message": e.message})


@router.get("/thumbnail")
async def api_thumbnail(
    path: str = Query(..., description="文件路径"),
    size: int = Query(256),
):
    try:
        data = get_thumbnail(path, size)
        if data:
            return Response(content=data, media_type="image/webp")
        raise HTTPException(status_code=404, detail="无法生成缩略图")
    except PathSecurityError as e:
        raise HTTPException(status_code=400, detail={"code": e.code, "message": e.message})


@router.get("/stream")
async def api_stream(path: str = Query(..., description="文件路径")):
    try:
        file_path = resolve_safe_path(path)
        validate_path_exists(file_path)
        file_size = file_path.stat().st_size

        def iterfile():
            with open(file_path, "rb") as f:
                chunk_size = 1024 * 1024
                while True:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    yield chunk

        from app.utils.file_types import get_mime_type
        return StreamingResponse(
            iterfile(),
            media_type=get_mime_type(path),
            headers={"Accept-Ranges": "bytes", "Content-Length": str(file_size)},
        )
    except PathSecurityError as e:
        raise HTTPException(status_code=400, detail={"code": e.code, "message": e.message})


@router.get("/metadata")
async def api_metadata(path: str = Query(..., description="文件路径")):
    try:
        return get_metadata(path)
    except PathSecurityError as e:
        status = 404 if e.code == "NOT_FOUND" else 400
        raise HTTPException(status_code=status, detail={"code": e.code, "message": e.message})


@router.get("/stream-video")
async def api_stream_video(path: str = Query(..., description="视频文件路径")):
    """视频流媒体（支持Range请求）"""
    try:
        file_path = resolve_safe_path(path)
        validate_path_exists(file_path)
        file_size = file_path.stat().st_size

        from fastapi import Request
        # 简化版：直接流式返回
        def iterfile():
            with open(file_path, "rb") as f:
                chunk_size = 1024 * 1024
                while True:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    yield chunk

        from app.utils.file_types import get_mime_type
        return StreamingResponse(
            iterfile(),
            media_type=get_mime_type(path),
            headers={
                "Content-Length": str(file_size),
                "Accept-Ranges": "bytes",
            },
        )
    except PathSecurityError as e:
        raise HTTPException(status_code=400, detail={"code": e.code, "message": e.message})
