/**
 * Web search provider for the monthly KB-refresh cron. Behind a thin interface
 * so the backend (Exa today) is swappable. Used ONLY by the cron — never on the
 * user request path (hard rule: no live search at runtime).
 */

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export interface SearchProvider {
  search(query: string, numResults?: number): Promise<SearchResult[]>;
}

/** Exa: neural search + clean content extraction in one call. */
export class ExaSearchProvider implements SearchProvider {
  constructor(private readonly apiKey: string) {}

  async search(query: string, numResults = 5): Promise<SearchResult[]> {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "x-api-key": this.apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        query,
        numResults,
        type: "auto",
        contents: { text: { maxCharacters: 2000 } },
      }),
    });
    if (!res.ok) {
      throw new Error(`Exa search failed: ${res.status} ${await res.text().catch(() => "")}`);
    }
    const data = (await res.json()) as { results?: Array<{ title?: string; url: string; text?: string }> };
    return (data.results ?? []).map((r) => ({
      title: r.title ?? "",
      url: r.url,
      content: r.text ?? "",
    }));
  }
}

/** The configured provider, or null when no search key is set (cron is skipped). */
export function getSearchProvider(): SearchProvider | null {
  const key = process.env.EXA_API_KEY;
  return key ? new ExaSearchProvider(key) : null;
}
