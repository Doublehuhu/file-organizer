#!/usr/bin/env python3
"""Claude Code Skill: 一键整理文件夹"""

import argparse
import json
import os
import sys
from pathlib import Path
try:
    import requests
except ImportError:
    requests = None

BACKEND_URL = os.environ.get("FILE_ORGANIZER_URL", "http://localhost:8721")


def call_backend(endpoint, method="get", data=None):
    if requests is None:
        return None
    url = f"{BACKEND_URL}{endpoint}"
    try:
        if method == "post":
            resp = requests.post(url, json=data, timeout=30)
        else:
            resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return None


def organize_with_backend(target_dir: str):
    result = call_backend("/api/organize/auto-categorize", "post", {"source_dir": target_dir})
    if result:
        categories = result.get("categories", [])
        print(f"分析完成: 找到 {len(categories)} 个分类，共 {result.get('total_files', 0)} 个文件")
        for cat in categories:
            print(f"  - {cat['name']}: {len(cat.get('files', []))} 个文件")
        return result
    return None


def main():
    parser = argparse.ArgumentParser(description="一键整理文件夹")
    parser.add_argument("path", nargs="?", default=".", help="要整理的目录路径")
    parser.add_argument("--mode", choices=["backend", "auto"], default="backend")
    args = parser.parse_args()

    target_dir = os.path.abspath(args.path)
    if not os.path.isdir(target_dir):
        print(f"错误: 路径不存在或不是目录: {target_dir}")
        sys.exit(1)

    print(f"整理目录: {target_dir}")

    if args.mode == "backend":
        result = organize_with_backend(target_dir)
        if result:
            print("使用后端服务完成分析")
        else:
            print("后端服务未运行，启动方式: cd backend && python run.py")
    else:
        print("自主模式暂未实现，请先启动后端服务")


if __name__ == "__main__":
    main()
