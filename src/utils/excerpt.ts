export function getExcerpt(body: string, maxLength = 240): string {
  const text = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/^\s*-{3,}\s*$/gm, '')
    .replace(/^\|.*\|\s*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}
