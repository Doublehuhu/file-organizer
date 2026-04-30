"""自动整理API"""
import subprocess
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from app.services.organize_service import (
    get_categories, create_category, delete_category, add_rule,
    preview_sort, apply_sort, auto_categorize,
)
from app.models.schemas import CategoryRequest, CategoryRuleRequest, SortPreviewRequest, ApplySortRequest
from app.config import settings

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


@router.post("/run-skill")
async def api_run_skill(source_dir: str = Query(...), dry_run: bool = Query(False)):
    """运行整理skill脚本 - 按子文件夹名称归类文件"""
    skill_path = Path(settings.BASE_DIR).parent / "claude-skill" / "organize_skill.py"
    if not skill_path.exists():
        raise HTTPException(status_code=500, detail="Skill脚本未找到")

    try:
        cmd = ["python3", str(skill_path), source_dir]
        if dry_run: cmd.append("--dry-run")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return {
            "success": result.returncode == 0,
            "output": result.stdout,
            "error": result.stderr,
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="整理超时")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
