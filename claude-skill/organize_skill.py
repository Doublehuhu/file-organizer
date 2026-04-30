#!/usr/bin/env python3
"""
Claude Code Skill: 一键整理文件夹

用法: /organize-folder <目录路径>

工作方式:
  1. 扫描目标目录的子文件夹作为分类
  2. 将文件按名称关键词匹配到对应文件夹
  3. 无法匹配的文件留在原地
"""

import argparse
import os
import re
import shutil
import sys
from pathlib import Path


def get_folders(target: Path) -> list[Path]:
    return [e for e in sorted(target.iterdir()) if e.is_dir() and not e.name.startswith('.')]


def match_file(filename: str, folder_names: list[str]) -> str | None:
    name = filename.lower()
    best, best_score = None, 0
    for fn in folder_names:
        fl = fn.lower()
        score = 0
        if fl in name: score = 10
        for kw in re.split(r'[-_\s]', fl):
            if len(kw) >= 2 and kw in name: score += 5
        if len(fl) >= 3:
            for i in range(len(fl)-2):
                if fl[i:i+3] in name: score += 1
        if score > best_score:
            best_score, best = score, fn
    return best if best_score >= 5 else None


def organize(target_dir: str, dry_run: bool = False) -> dict:
    target = Path(target_dir).resolve()
    if not target.is_dir():
        return {"success": False, "error": f"目录不存在: {target}"}

    folders = get_folders(target)
    if not folders:
        return {"success": False, "error": "没有子文件夹，请先创建分类文件夹"}

    folder_names = [f.name for f in folders]
    results = {"folders": {}, "unmatched": [], "total": 0}

    for entry in sorted(target.iterdir()):
        if entry.is_dir() or entry.name.startswith('.'):
            continue
        results["total"] += 1
        matched = match_file(entry.name, folder_names)
        if matched:
            dest = target / matched / entry.name
            if not dry_run:
                try: shutil.move(str(entry), str(dest))
                except shutil.Error: pass
            results["folders"].setdefault(matched, []).append(entry.name)
        else:
            results["unmatched"].append(entry.name)
    return {"success": True, **results}


def main():
    parser = argparse.ArgumentParser(description="一键整理文件夹")
    parser.add_argument("path", nargs="?", default=".", help="目录路径")
    parser.add_argument("--dry-run", action="store_true", help="仅预览")
    args = parser.parse_args()
    target_dir = os.path.abspath(args.path)

    if not os.path.isdir(target_dir):
        print(f"错误: {target_dir} 不是有效目录")
        print("请先创建分类子文件夹，例如: mkdir 课件 作业 参考资料")
        sys.exit(1)

    print(f"整理目录: {target_dir}\n")
    folders = get_folders(Path(target_dir))
    if not folders:
        print("未找到子文件夹。请先创建分类文件夹，我会按照文件夹名自动归类文件。")
        print("示例: mkdir 课件 作业 参考资料 素材")
        sys.exit(1)

    print(f"发现 {len(folders)} 个分类文件夹:")
    for f in folders: print(f"  📁 {f.name}")

    result = organize(target_dir, dry_run=args.dry_run)
    if not result["success"]:
        print(f"错误: {result['error']}")
        sys.exit(1)

    print(f"\n共 {result['total']} 个文件:")
    for folder, files in result["folders"].items():
        print(f"  → {folder}: {len(files)} 个")
        for f in files[:3]: print(f"      {f}")
        if len(files) > 3: print(f"      ... 等 {len(files)} 个")

    if result["unmatched"]:
        print(f"  未分类: {len(result['unmatched'])} 个")
        for f in result["unmatched"][:3]: print(f"      {f}")

    if args.dry_run: print("\n(预览模式，去掉 --dry-run 执行真实整理)")
    else: print("\n整理完成!")


if __name__ == "__main__":
    main()
