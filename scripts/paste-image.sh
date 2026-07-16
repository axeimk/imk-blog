#!/usr/bin/env bash
# クリップボードの画像を記事の images/ ディレクトリに保存し、
# Markdown リンクをクリップボードに入れる。
# 使い方: paste-image.sh <Markdownファイルの絶対パス>
set -euo pipefail

md_file="${1:?usage: paste-image.sh <markdown-file>}"

if [[ "$md_file" != *.md ]]; then
  echo "エラー: Markdownファイル（.md）を開いた状態で実行してください: $md_file" >&2
  exit 1
fi

dir="$(cd "$(dirname "$md_file")" && pwd)"
stem="$(basename "$md_file" .md)"
images_dir="$dir/images"
mkdir -p "$images_dir"

n=1
while [ -e "$images_dir/$stem-$n.png" ]; do
  n=$((n + 1))
done
out="$images_dir/$stem-$n.png"

if ! osascript >/dev/null 2>&1 <<OSA; then
set pngData to the clipboard as «class PNGf»
set f to open for access POSIX file "$out" with write permission
write pngData to f
close access f
OSA
  echo "エラー: クリップボードに画像がありません" >&2
  exit 1
fi

link="![](./images/$stem-$n.png)"
printf '%s' "$link" | pbcopy

echo "保存しました: ${out#"$PWD"/}"
echo "クリップボードにコピー済み: $link （そのままペーストしてください）"
