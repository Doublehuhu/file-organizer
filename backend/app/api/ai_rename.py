"""AI重命名API"""
from fastapi import APIRouter, HTTPException, Query
from app.services.rename_service import (
    get_rename_suggestions, apply_renames,
    get_templates, get_rename_history, get_learned_patterns,
)
from app.models.schemas import AIRenameSuggestRequest, AIRenameApplyRequest, NamingTemplateRequest
from app.models.database import get_db

router = APIRouter()


@router.post("/suggest")
async def api_suggest(req: AIRenameSuggestRequest):
    try:
        suggestions = get_rename_suggestions(req.paths, req.template, req.context)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/apply")
async def api_apply(req: AIRenameApplyRequest):
    try:
        return apply_renames(req.renames, req.template_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates")
async def api_templates():
    return {"templates": get_templates()}


@router.post("/templates")
async def api_create_template(req: NamingTemplateRequest):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO naming_templates (name, pattern, description) VALUES (?,?,?)",
        (req.name, req.pattern, req.description),
    )
    conn.commit()
    tid = cursor.lastrowid
    conn.close()
    return {"id": tid, "name": req.name, "pattern": req.pattern}


@router.get("/history")
async def api_history(page: int = Query(1), page_size: int = Query(50)):
    return get_rename_history(page, page_size)


@router.get("/patterns")
async def api_patterns():
    return {"patterns": get_learned_patterns()}
