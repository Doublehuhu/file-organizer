"""文件类型检测与分类"""

import mimetypes
from pathlib import Path

# 初始化MIME类型
mimetypes.init()

# 预览支持的类型
PREVIEWABLE_IMAGES = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".svg", ".ico"}
PREVIEWABLE_VIDEOS = {".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v"}
PREVIEWABLE_AUDIO = {".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma"}
PREVIEWABLE_PDF = {".pdf"}
PREVIEWABLE_DOCUMENTS = {".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls", ".csv"}
PREVIEWABLE_TEXT = {
    ".txt", ".md", ".json", ".xml", ".yaml", ".yml", ".log",
    ".py", ".js", ".ts", ".jsx", ".tsx", ".html", ".css",
    ".c", ".cpp", ".h", ".java", ".go", ".rs", ".rb", ".sh", ".bat",
    ".ini", ".cfg", ".conf", ".toml",
}

# 不支持预览的常见格式
UNSUPPORTED = {".exe", ".dll", ".so", ".dylib", ".bin", ".dat", ".iso", ".dmg", ".pkg"}

# 分类规则
CATEGORY_MAP = {
    "图片": PREVIEWABLE_IMAGES,
    "视频": PREVIEWABLE_VIDEOS,
    "音频": PREVIEWABLE_AUDIO,
    "PDF文档": PREVIEWABLE_PDF,
    "办公文档": PREVIEWABLE_DOCUMENTS,
    "文本文件": PREVIEWABLE_TEXT,
}


def get_file_category(extension: str) -> str:
    """根据扩展名返回文件分类"""
    ext = extension.lower()
    for category, extensions in CATEGORY_MAP.items():
        if ext in extensions:
            return category
    if ext in UNSUPPORTED:
        return "其他"
    return "其他文件"


def get_mime_type(file_path: str) -> str:
    """获取文件的MIME类型"""
    mime, _ = mimetypes.guess_type(file_path)
    return mime or "application/octet-stream"


def is_previewable(file_path: str) -> bool:
    """检查文件是否支持预览"""
    ext = Path(file_path).suffix.lower()
    return ext in (
        PREVIEWABLE_IMAGES | PREVIEWABLE_VIDEOS | PREVIEWABLE_AUDIO
        | PREVIEWABLE_PDF | PREVIEWABLE_DOCUMENTS | PREVIEWABLE_TEXT
    )


def get_preview_type(file_path: str) -> str:
    """获取预览类型"""
    ext = Path(file_path).suffix.lower()
    if ext in PREVIEWABLE_IMAGES:
        return "image"
    if ext in PREVIEWABLE_VIDEOS:
        return "video"
    if ext in PREVIEWABLE_AUDIO:
        return "audio"
    if ext in PREVIEWABLE_PDF:
        return "pdf"
    if ext in PREVIEWABLE_DOCUMENTS:
        return "document"
    if ext in PREVIEWABLE_TEXT:
        return "text"
    return "unknown"
