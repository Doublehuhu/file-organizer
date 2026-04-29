"""文件预览服务 - 基于macOS原生预览(qlmanage)"""

import hashlib
import os
import subprocess
import tempfile
import io
from pathlib import Path
from app.config import settings
from app.utils.security import resolve_safe_path, validate_path_exists
from app.utils.file_types import get_preview_type


def _ql_thumbnail(file_path: Path, size: int = 1024) -> bytes | None:
    """使用macOS qlmanage生成预览图，支持几乎所有文件类型"""
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            subprocess.run(
                ["qlmanage", "-t", "-s", str(size), "-o", tmpdir, str(file_path)],
                capture_output=True, timeout=10,
            )
            png_path = Path(tmpdir) / (file_path.name + ".png")
            if png_path.exists():
                try:
                    from PIL import Image
                    img = Image.open(str(png_path))
                    buf = io.BytesIO()
                    img.save(buf, format="WEBP", quality=85)
                    return buf.getvalue()
                except Exception:
                    return png_path.read_bytes()
    except Exception:
        pass
    return None


def get_thumbnail(file_path: str, size: int = 256) -> bytes | None:
    """获取文件缩略图（qlmanage万能预览，支持macOS能预览的所有文件）"""
    path = resolve_safe_path(file_path)
    validate_path_exists(path)
    if path.is_dir():
        return None

    stat = path.stat()
    cache_key = hashlib.md5(
        f"{path.resolve()}{stat.st_size}{stat.st_mtime}".encode()
    ).hexdigest()
    cache_file = settings.CACHE_DIR / f"{cache_key}.webp"

    if cache_file.exists():
        return cache_file.read_bytes()

    preview_type = get_preview_type(file_path)

    try:
        if preview_type == "image":
            from PIL import Image
            img = Image.open(str(path))
            img.thumbnail((size, size), Image.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="WEBP", quality=80)
            data = buf.getvalue()
            cache_file.write_bytes(data)
            return data

        # 所有其他文件用qlmanage
        data = _ql_thumbnail(path, size)
        if data:
            cache_file.write_bytes(data)
            return data
    except Exception:
        pass
    return None


def get_preview_content(file_path: str, max_size: int | None = None) -> dict:
    """获取预览内容。文本文件返回文本，其他用qlmanage预览图"""
    if max_size is None:
        max_size = settings.MAX_PREVIEW_TEXT_SIZE

    path = resolve_safe_path(file_path)
    validate_path_exists(path)

    if path.is_dir():
        return {"type": "directory", "content": f"目录: {path.name}", "encoding": "utf-8", "total_chars": 0, "truncated": False}

    preview_type = get_preview_type(file_path)

    if preview_type == "text":
        return _extract_text(path, max_size)
    elif preview_type == "image":
        return {"type": "image", "content": "", "encoding": "", "total_chars": 0, "truncated": False}
    elif preview_type in ("video", "audio"):
        return {"type": preview_type, "content": "", "encoding": "", "total_chars": 0, "truncated": False}

    # 文档/PDF/未知：用qlmanage生成大预览图
    preview_data = _ql_thumbnail(path, 2048)
    if preview_data:
        return {"type": "ql_preview", "content": "", "encoding": "", "total_chars": 0, "truncated": False}

    return {"type": "unknown", "content": f"不支持预览: {path.suffix}", "encoding": "utf-8", "total_chars": 0, "truncated": False}


def _extract_text(path: Path, max_size: int) -> dict:
    import chardet
    try:
        file_size = path.stat().st_size
        truncated = file_size > max_size
        with open(path, "rb") as f:
            raw = f.read(max_size) if truncated else f.read()
        result = chardet.detect(raw)
        encoding = result.get("encoding", "utf-8") or "utf-8"
        try:
            content = raw.decode(encoding)
        except (UnicodeDecodeError, LookupError):
            content = raw.decode("utf-8", errors="replace")
        return {"type": "text", "content": content, "encoding": encoding, "total_chars": len(content), "truncated": truncated}
    except OSError as e:
        return {"type": "text", "content": f"读取失败: {e}", "encoding": "utf-8", "total_chars": 0, "truncated": False}


def get_preview_image(file_path: str, size: int = 1024) -> bytes | None:
    """获取全尺寸预览图"""
    path = resolve_safe_path(file_path)
    validate_path_exists(path)

    cache_key = hashlib.md5(
        f"full_{path.resolve()}{path.stat().st_size}{path.stat().st_mtime}".encode()
    ).hexdigest()
    cache_file = settings.CACHE_DIR / f"{cache_key}.webp"
    if cache_file.exists():
        return cache_file.read_bytes()

    preview_type = get_preview_type(file_path)

    if preview_type == "image":
        from PIL import Image
        img = Image.open(str(path))
        img.thumbnail((size, size), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="WEBP", quality=85)
        data = buf.getvalue()
        cache_file.write_bytes(data)
        return data

    data = _ql_thumbnail(path, size)
    if data:
        cache_file.write_bytes(data)
    return data


def get_metadata(file_path: str) -> dict:
    path = resolve_safe_path(file_path)
    validate_path_exists(path)
    preview_type = get_preview_type(file_path)
    metadata = {}
    try:
        stat = path.stat()
        metadata["size"] = stat.st_size
        metadata["modified"] = stat.st_mtime
        if preview_type == "image":
            from PIL import Image
            with Image.open(str(path)) as img:
                metadata["dimensions"] = {"width": img.width, "height": img.height}
    except Exception:
        pass
    return {"file_type": preview_type, "metadata": metadata}


def open_native(file_path: str) -> bool:
    """用macOS默认应用打开文件"""
    path = resolve_safe_path(file_path)
    validate_path_exists(path)
    try:
        subprocess.Popen(["open", str(path)])
        return True
    except Exception:
        return False
