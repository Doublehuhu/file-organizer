"""SQLite数据库初始化与迁移"""

import sqlite3
from pathlib import Path
from app.config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS naming_templates (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    pattern       TEXT NOT NULL,
    description   TEXT,
    is_builtin    INTEGER DEFAULT 0,
    use_count     INTEGER DEFAULT 0,
    created_at    TEXT DEFAULT (datetime('now','localtime')),
    updated_at    TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS rename_history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_id  TEXT NOT NULL,
    file_path     TEXT NOT NULL,
    original_name TEXT NOT NULL,
    new_name      TEXT NOT NULL,
    ai_generated  INTEGER DEFAULT 0,
    template_id   INTEGER REFERENCES naming_templates(id),
    reasoning     TEXT,
    created_at    TEXT DEFAULT (datetime('now','localtime')),
    undone        INTEGER DEFAULT 0,
    undone_at     TEXT
);

CREATE INDEX IF NOT EXISTS idx_rename_history_op ON rename_history(operation_id);
CREATE INDEX IF NOT EXISTS idx_rename_history_path ON rename_history(file_path);

CREATE TABLE IF NOT EXISTS operation_history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_id  TEXT NOT NULL UNIQUE,
    op_type       TEXT NOT NULL,
    source_paths  TEXT NOT NULL,
    dest_paths    TEXT,
    file_count    INTEGER,
    metadata      TEXT,
    undo_data     TEXT,
    created_at    TEXT DEFAULT (datetime('now','localtime')),
    undone        INTEGER DEFAULT 0,
    expires_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_op_history_created ON operation_history(created_at);

CREATE TABLE IF NOT EXISTS naming_patterns (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_type  TEXT NOT NULL,
    pattern_value TEXT NOT NULL,
    confidence    REAL DEFAULT 1.0,
    sample_count  INTEGER DEFAULT 1,
    first_seen    TEXT DEFAULT (datetime('now','localtime')),
    last_used     TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS categories (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    parent_id     INTEGER REFERENCES categories(id),
    path          TEXT NOT NULL,
    color         TEXT DEFAULT '#1890ff',
    icon          TEXT DEFAULT 'FolderOutlined',
    description   TEXT,
    sort_order    INTEGER DEFAULT 0,
    created_at    TEXT DEFAULT (datetime('now','localtime')),
    updated_at    TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS category_rules (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id   INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    rule_type     TEXT NOT NULL,
    rule_value    TEXT NOT NULL,
    priority      INTEGER DEFAULT 0,
    is_active     INTEGER DEFAULT 1,
    created_at    TEXT DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_cat_rules_category ON category_rules(category_id);

CREATE TABLE IF NOT EXISTS settings (
    key           TEXT PRIMARY KEY,
    value         TEXT NOT NULL,
    updated_at    TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS favorites (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    path          TEXT NOT NULL UNIQUE,
    label         TEXT,
    sort_order    INTEGER DEFAULT 0,
    created_at    TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS file_tags (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path     TEXT NOT NULL,
    tag           TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(file_path, tag)
);

CREATE INDEX IF NOT EXISTS idx_file_tags_path ON file_tags(file_path);
CREATE INDEX IF NOT EXISTS idx_file_tags_tag ON file_tags(tag);
"""

SEED_TEMPLATES = [
    ("日期_名称", "{date}_{name}", "按日期+原始名称", 1),
    ("日期_课程_主题", "{date}_{course}_{topic}", "适合教学文件", 1),
    ("完整日期_课程_课题_版本", "{date_full}_{course}_{topic}_{version}", "详细命名", 1),
    ("分类_日期_描述", "{category}_{date}_{description}", "按分类整理", 1),
    ("学期_课程_类型", "{semester}_{course}_{type}", "按学期归档", 1),
]


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(settings.DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    settings.TRASH_DIR.mkdir(parents=True, exist_ok=True)
    settings.CACHE_DIR.mkdir(parents=True, exist_ok=True)

    conn = get_db()
    conn.executescript(SCHEMA)

    # Seed built-in templates
    existing = conn.execute(
        "SELECT COUNT(*) FROM naming_templates WHERE is_builtin=1"
    ).fetchone()[0]
    if existing == 0:
        conn.executemany(
            "INSERT INTO naming_templates (name, pattern, description, is_builtin) VALUES (?,?,?,?)",
            SEED_TEMPLATES,
        )
    conn.commit()
    conn.close()
