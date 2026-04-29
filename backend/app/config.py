"""应用配置"""

import os
from pathlib import Path


class Settings:
    APP_NAME: str = "电脑文件整理助手"
    VERSION: str = "1.0.0"
    HOST: str = "127.0.0.1"
    PORT: int = 8721

    # 项目根目录
    BASE_DIR: Path = Path(__file__).resolve().parent.parent

    # SQLite数据库
    DB_PATH: Path = BASE_DIR / "fileorganizer.db"

    # 回收站目录
    TRASH_DIR: Path = BASE_DIR / "trash"

    # 缩略图缓存
    CACHE_DIR: Path = BASE_DIR / "cache" / "thumbnails"

    # DeepSeek API配置 (OpenAI兼容接口)
    DEEPSEEK_API_KEY: str = os.environ.get("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL: str = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    DEEPSEEK_MODEL: str = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")

    # 允许操作的目录（安全沙箱，用户可在UI中配置）
    allowed_directories: list[str] = [
        str(Path.home() / "Desktop"),
        str(Path.home() / "Documents"),
        str(Path.home() / "Downloads"),
    ]

    # 撤销窗口（分钟）
    UNDO_WINDOW_MINUTES: int = 30

    # 预览限制
    MAX_PREVIEW_TEXT_SIZE: int = 1 * 1024 * 1024  # 1MB
    THUMBNAIL_SIZE: int = 256
    THUMBNAIL_CACHE_MAX: int = 1000
    PAGE_SIZE: int = 100
    MAX_AI_BATCH: int = 10

    # 回收站自动清理（天）
    TRASH_AUTO_CLEAN_DAYS: int = 7


settings = Settings()
