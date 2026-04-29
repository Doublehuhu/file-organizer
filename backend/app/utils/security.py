"""路径安全验证 - 防止路径遍历攻击和沙箱逃逸"""

import os
from pathlib import Path
from app.config import settings


class PathSecurityError(Exception):
    def __init__(self, message: str, code: str = "PATH_NOT_ALLOWED"):
        self.message = message
        self.code = code


def resolve_safe_path(input_path: str) -> Path:
    """解析路径并验证其在允许的目录内"""
    try:
        resolved = Path(input_path).resolve(strict=False)
    except (OSError, ValueError) as e:
        raise PathSecurityError(f"无效路径: {e}", "INVALID_PATH")

    # 检查是否在允许的目录内
    allowed = False
    for allowed_dir in settings.allowed_directories:
        try:
            allowed_path = Path(allowed_dir).resolve(strict=False)
            resolved.relative_to(allowed_path)
            allowed = True
            break
        except ValueError:
            continue

    if not allowed:
        raise PathSecurityError(
            f"路径不在允许的范围内: {input_path}",
            "PATH_NOT_ALLOWED",
        )

    return resolved


def validate_path_exists(path: Path) -> Path:
    """验证路径存在"""
    if not path.exists():
        raise PathSecurityError(f"路径不存在: {path}", "NOT_FOUND")
    return path


def validate_is_directory(path: Path) -> Path:
    """验证路径是目录"""
    if not path.is_dir():
        raise PathSecurityError(f"路径不是目录: {path}", "NOT_DIRECTORY")
    return path


def is_path_allowed(path: str) -> bool:
    """检查路径是否在允许范围内"""
    try:
        resolve_safe_path(path)
        return True
    except PathSecurityError:
        return False
