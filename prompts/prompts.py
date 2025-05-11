import argparse
import yaml
import pathlib

def load_prompt(name: str):
    base = yaml.safe_load(open("./base.yml", encoding="utf-8"))
    child = yaml.safe_load(open(f"./{name}.yml", encoding="utf-8"))
    # shallow-merge → 深い階層は各テンプレで override
    base["prompt"].update(child.get("prompt", {}))
    return base

def main():
    parser = argparse.ArgumentParser(
        description="Merge base.yaml と子テンプレートを組み合わせて出力"
    )
    parser.add_argument("template_name", help="使用するテンプレート名（例: bugfix）")
    parser.add_argument(
        "--out", "-o", help="マージ結果を保存するファイル（省略時は標準出力）"
    )
    args = parser.parse_args()

    merged = load_prompt(args.template_name)
    dump = yaml.safe_dump(merged, allow_unicode=True, sort_keys=False)

    if args.out:
        pathlib.Path(args.out).write_text(dump, encoding="utf-8")
        print(f"→ {args.out} に保存しました")
    else:
        print(dump)

if __name__ == "__main__":
    main()
