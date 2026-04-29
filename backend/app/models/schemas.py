"""Pydantic请求/响应模型"""

from datetime import datetime
from pydantic import BaseModel, Field


class FileInfo(BaseModel):
    name: str
    path: str
    is_dir: bool
    size: int
    modified_at: str
    created_at: str
    extension: str = ""
    mime_type: str = ""


class FileListResponse(BaseModel):
    files: list[FileInfo]
    total: int
    page: int
    page_size: int


class FileInfoResponse(BaseModel):
    name: str
    path: str
    is_dir: bool
    size: int
    modified_at: str
    created_at: str
    extension: str
    mime_type: str
    permissions: str = ""
    is_symlink: bool = False


class OperationResult(BaseModel):
    source: str
    dest: str = ""
    success: bool
    error: str = ""


class BatchOperationRequest(BaseModel):
    source_paths: list[str]
    destination_dir: str = ""


class RenameRequest(BaseModel):
    path: str
    new_name: str


class CreateFolderRequest(BaseModel):
    parent_path: str
    folder_name: str


class DeleteRequest(BaseModel):
    paths: list[str]
    permanent: bool = False


class UndoRequest(BaseModel):
    operation_id: str


class BatchOperationResponse(BaseModel):
    operation_id: str
    results: list[OperationResult]
    undo_available_until: str = ""


class AIRenameSuggestion(BaseModel):
    original_name: str
    suggested_names: list[dict]
    file_type: str
    extracted_info: dict


class AIRenameSuggestRequest(BaseModel):
    paths: list[str]
    template: str = ""
    context: str = ""


class AIRenameApplyRequest(BaseModel):
    renames: list[dict]
    template_id: int | None = None


class NamingTemplateRequest(BaseModel):
    name: str
    pattern: str
    description: str = ""


class CategoryRequest(BaseModel):
    name: str
    path: str
    parent_id: int | None = None
    color: str = "#1890ff"
    description: str = ""


class CategoryRuleRequest(BaseModel):
    category_id: int
    rule_type: str
    rule_value: str
    priority: int = 0


class SortPreviewRequest(BaseModel):
    source_dir: str
    mode: str = "by_category"


class ApplySortRequest(BaseModel):
    source_dir: str
    assignments: list[dict]


class SearchRequest(BaseModel):
    q: str = ""
    path: str = ""
    file_type: str = ""
    date_from: str = ""
    date_to: str = ""
    min_size: int = 0
    max_size: int = 0
    page: int = 1
    page_size: int = 50


class PreviewContent(BaseModel):
    type: str
    content: str
    encoding: str = "utf-8"
    total_chars: int = 0
    truncated: bool = False


class FileMetadata(BaseModel):
    file_type: str
    metadata: dict = {}


class SystemStats(BaseModel):
    total_operations: int = 0
    rename_count: int = 0
    organize_count: int = 0


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    uptime: float = 0
