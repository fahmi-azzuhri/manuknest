export type SmartTagInput = {
  title?: string;
  url?: string;
  note?: string;
};

const domainRules: Record<string, string> = {
  "github.com": "Development",
  "gitlab.com": "Development",
  "stackoverflow.com": "Development",
  "dev.to": "Development",
  "docs.microsoft.com": "Referensi",
  "developer.mozilla.org": "Referensi",
  "music.youtube.com": "Lagu",
  "spotify.com": "Lagu",
  "figma.com": "Desain",
  "dribbble.com": "Desain",
  "behance.net": "Desain",
  "medium.com": "Artikel",
  "theverge.com": "Berita",
  "techcrunch.com": "Berita",
  "cnn.com": "Berita",
  "notion.so": "Productivity",
};

const keywordRules: Array<[RegExp, string]> = [
  [/tutorial|guide|walkthrough|how[- ]to|learning|course|lesson|\bcara\b|\bpanduan\b|tips/i, "Tutorial"],
  [/design system|ui\s*ux|ux|figma|wireframe|layout|designer|branding/i, "Desain"],
  [/react|next|typescript|javascript|node|backend|frontend|api|database|docker|kubernetes|python|cli|tool|library/i, "Development"],
  [/productivity|workflow|planning|calendar|task|todo|notion|organizer/i, "Productivity"],
  [/music|song|album|playlist|spotify|youtube music|audio/i, "Lagu"],
  [/movie|film|cinema|documentary|trailer|watchlist/i, "Film"],
  [/article|blog|essay|opinion|post|readme|resource|reference/i, "Artikel"],
  [/education|academy|study|learning|knowledge|learn/i, "Edukasi"],
  [/news|breaking|update|analysis|report|journal|tech|headline/i, "Berita"],
  [/docs|doc|manual|spec|reference|cheatsheet|documentation/i, "Referensi"],
];

export function suggestSmartTags(input: SmartTagInput): string[] {
  const combined = [input.title, input.url, input.note].filter(Boolean).join(" ");
  if (!combined.trim()) return ["Other"];

  const scores = new Map<string, number>();

  const addScore = (tag: string, score: number) => {
    scores.set(tag, (scores.get(tag) ?? 0) + score);
  };

  try {
    const url = new URL(input.url ?? "https://example.com");
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const matchedDomain = domainRules[host];
    if (matchedDomain) addScore(matchedDomain, 5);

    const hostParts = host.split(".");
    for (const part of hostParts) {
      const rule = domainRules[part];
      if (rule) addScore(rule, 2);
    }
  } catch {
    // Ignore invalid URLs and continue with title/note-based suggestions.
  }

  for (const [pattern, tag] of keywordRules) {
    if (pattern.test(combined)) addScore(tag, 6);
  }

  const ranked = [...scores.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([tag]) => tag);

  if (ranked.length === 0) return ["Other"];

  return [...new Set(ranked)].slice(0, 4);
}
