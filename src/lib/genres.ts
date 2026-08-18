export const DEFAULT_GENRES = [
  '仕事',
  '生き方',
  '生活',
  '健康',
  'AI',
  '時間活用',
  'マーケティング',
  '歴史',
  '精神',
  '娯楽',
  '文学',
  '哲学',
  '農業',
  '地域',
] as const;

export const MAX_GENRES_PER_USER = 2;

export function normalizeGenres(input: unknown, allowed: string[]): string[] {
  if (!Array.isArray(input)) return [];
  const unique: string[] = [];
  for (const item of input) {
    const tag = String(item || '').trim();
    if (!tag || !allowed.includes(tag) || unique.includes(tag)) continue;
    unique.push(tag);
    if (unique.length >= MAX_GENRES_PER_USER) break;
  }
  return unique;
}
