"""自动整理API"""
from fastapi import APIRouter, HTTPException, Query
from app.services.organize_service import (
    get_categories, create_category, delete_category, add_rule,
    preview_sort, apply_sort, auto_categorize,
)
from app.models.schemas import CategoryRequest, CategoryRuleRequest, SortPreviewRequest, ApplySortRequest

router = APIRouter()


@router.get("/categories")
async def api_categories():
    return {"categories": get_categories()}


@router.post("/categories")
async def api_create_category(req: CategoryRequest):
    try:
        return create_category(req.name, req.path, req.parent_id, req.color, req.description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/categories/{category_id}")
async def api_delete_category(category_id: int):
    delete_category(category_id)
    return {"success": True}


@router.post("/rules")
async def api_add_rule(req: CategoryRuleRequest):
    return add_rule(req.category_id, req.rule_type, req.rule_value, req.priority)


@router.post("/preview-sort")
async def api_preview_sort(req: SortPreviewRequest):
    try:
        return preview_sort(req.source_dir)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/apply-sort")
async def api_apply_sort(req: ApplySortRequest):
    try:
        return apply_sort(req.source_dir, req.assignments)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/auto-categorize")
async def api_auto_categorize(req: SortPreviewRequest):
    try:
        return auto_categorize(req.source_dir)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
