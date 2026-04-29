"""FastAPI应用入口"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.files import router as files_router
from app.api.preview import router as preview_router
from app.api.system import router as system_router
from app.api.ai_rename import router as ai_rename_router
from app.api.organize import router as organize_router
from app.api.search import router as search_router

app.include_router(files_router, prefix="/api/files", tags=["文件操作"])
app.include_router(preview_router, prefix="/api/preview", tags=["文件预览"])
app.include_router(system_router, prefix="/api/system", tags=["系统"])
app.include_router(ai_rename_router, prefix="/api/ai-rename", tags=["AI重命名"])
app.include_router(organize_router, prefix="/api/organize", tags=["自动整理"])
app.include_router(search_router, prefix="/api/search", tags=["搜索"])
