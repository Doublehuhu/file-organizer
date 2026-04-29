"""DeepSeek V4 API客户端 (OpenAI兼容接口)"""

import json
from openai import OpenAI
from app.config import settings


def get_client() -> OpenAI | None:
    if not settings.DEEPSEEK_API_KEY:
        return None
    return OpenAI(
        api_key=settings.DEEPSEEK_API_KEY,
        base_url=settings.DEEPSEEK_BASE_URL + "/v1",
    )


def suggest_rename_names(
    file_infos: list[dict],
    patterns: list[dict],
    templates: list[dict],
    user_context: str = "",
) -> list[dict]:
    """调用DeepSeek V4获取重命名建议"""
    client = get_client()
    if not client:
        return _fallback_suggestions(file_infos)

    # 构建提示词
    file_descriptions = []
    for f in file_infos:
        desc = f"- 原文件名: {f['name']}\n  类型: {f.get('file_type', '未知')}\n  大小: {f.get('size', 0)} 字节\n  修改日期: {f.get('modified_at', '')}"
        if f.get("content_summary"):
            desc += f"\n  内容摘要: {f['content_summary'][:500]}"
        file_descriptions.append(desc)

    pattern_text = "\n".join(
        f"- {p['pattern_type']}: {p['pattern_value']} (置信度: {p['confidence']:.0%})"
        for p in patterns[:10]
    ) if patterns else "暂无历史模式"

    template_text = "\n".join(
        f"- {t['name']}: {t['pattern']}" for t in templates[:10]
    ) if templates else "暂无模板"

    prompt = f"""你是一个文件命名助手，帮助用户用清晰、可搜索的方式重命名文件。

## 用户的命名习惯（历史模式）：
{pattern_text}

## 可用的命名模板：
{template_text}

## 需要重命名的文件：
{chr(10).join(file_descriptions)}

## 额外要求：
{user_context or "无特殊要求"}

请为每个文件推荐2-3个新名字。建议应：
1. 遵循用户的命名习惯
2. 使用清晰的中文描述
3. 包含关键信息（日期、课程、主题等）
4. 便于日后搜索

返回JSON格式：
{{"suggestions": [
  {{"original_name": "原文件名",
   "suggestions": [
     {{"name": "建议名", "confidence": 0.9, "reasoning": "理由"}}
   ]
  }}
]}}"""

    try:
        response = client.chat.completions.create(
            model=settings.DEEPSEEK_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2048,
            temperature=0.7,
        )
        result_text = response.choices[0].message.content or ""
        # 尝试解析JSON
        result_text = result_text.strip()
        if result_text.startswith("```"):
            lines = result_text.split("\n")
            result_text = "\n".join(lines[1:-1])
        data = json.loads(result_text)
        return data.get("suggestions", [])
    except Exception as e:
        return _fallback_suggestions(file_infos, str(e))


def suggest_categories(files: list[dict]) -> list[dict]:
    """调用AI分析文件并建议分类"""
    client = get_client()
    if not client:
        return []

    file_list = "\n".join(
        f"- {f['name']} ({f.get('ext', '')}, {f.get('size', 0)} bytes)"
        for f in files[:200]
    )

    prompt = f"""分析以下文件列表，建议适合的文件夹分类。
每个分类需包含名称、描述和匹配规则（如文件扩展名、文件名关键词等）。

文件列表：
{file_list}

返回JSON：
{{"categories": [
  {{"name": "分类名", "description": "描述", "criteria": "匹配规则", "files": ["文件名1", "文件名2"]}}
]}}"""

    try:
        response = client.chat.completions.create(
            model=settings.DEEPSEEK_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2048,
            temperature=0.3,
        )
        result_text = response.choices[0].message.content or ""
        if result_text.startswith("```"):
            lines = result_text.split("\n")
            result_text = "\n".join(lines[1:-1])
        data = json.loads(result_text)
        return data.get("categories", [])
    except Exception:
        return []


def _fallback_suggestions(file_infos: list[dict], error: str = "") -> list[dict]:
    """当AI不可用时的兜底建议"""
    suggestions = []
    for f in file_infos:
        name = f["name"]
        stem = name.rsplit(".", 1)[0] if "." in name else name
        suggestions.append({
            "original_name": name,
            "suggestions": [
                {"name": stem, "confidence": 0.5, "reasoning": "保持原名"},
            ],
            "file_type": f.get("file_type", "unknown"),
            "extracted_info": {},
        })
    return suggestions
