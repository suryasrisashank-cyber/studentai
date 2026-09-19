/**
 * StudentAI Live Web Retrieval & Source Grounding Service
 * 
 * Retrieves real-time information from verified public knowledge APIs (Wikipedia API, DuckDuckGo,
 * and optional Google Custom Search). Adheres strictly to the Zero-Deception Policy:
 * - Never fabricates citations, titles, or URLs.
 * - Extracts real domains and links.
 * - Formats grounded context for LLM synthesis.
 */

export interface SourceCitation {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  retrievedAt: string;
}

export interface RetrievalResult {
  sources: SourceCitation[];
  groundedPromptContext: string;
  retrievalUsed: boolean;
  provider: 'google_custom' | 'wikipedia' | 'duckduckgo' | 'none';
  latencyMs: number;
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'web';
  }
}

/**
 * Attempts Google Custom Search if API credentials are configured.
 */
async function searchGoogleCustom(query: string, timeoutMs = 3500): Promise<SourceCitation[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY?.trim();
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID?.trim();

  if (!apiKey || !cx) return [];

  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&num=4`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.items || [];
    const timestamp = new Date().toISOString();

    return items.slice(0, 4).map((item: any) => ({
      title: item.title || 'Web Result',
      url: item.link,
      domain: extractDomain(item.link),
      snippet: cleanHtml(item.snippet || ''),
      retrievedAt: timestamp,
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Queries Wikipedia's search API for factual, academic, and historical topics.
 */
async function searchWikipedia(query: string, timeoutMs = 3000): Promise<SourceCitation[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'StudentAI-Assistant/2.0 (studentai-five.vercel.app; educational non-commercial)',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const searchResults = data?.query?.search || [];
    const timestamp = new Date().toISOString();

    return searchResults.slice(0, 3).map((item: any) => {
      const pageTitle = item.title;
      const articleUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/\s+/g, '_'))}`;
      return {
        title: pageTitle,
        url: articleUrl,
        domain: 'wikipedia.org',
        snippet: cleanHtml(item.snippet || ''),
        retrievedAt: timestamp,
      };
    });
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Queries DuckDuckGo Instant Answer API for factual summaries and definitions.
 */
async function searchDuckDuckGo(query: string, timeoutMs = 3000): Promise<SourceCitation[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'StudentAI-Assistant/2.0 (studentai-five.vercel.app; educational non-commercial)',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const citations: SourceCitation[] = [];
    const timestamp = new Date().toISOString();

    if (data.AbstractText && data.AbstractURL) {
      citations.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        domain: extractDomain(data.AbstractURL),
        snippet: cleanHtml(data.AbstractText),
        retrievedAt: timestamp,
      });
    }

    if (Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 3)) {
        if (topic.Text && topic.FirstURL) {
          citations.push({
            title: topic.Text.split(' - ')[0] || query,
            url: topic.FirstURL,
            domain: extractDomain(topic.FirstURL),
            snippet: cleanHtml(topic.Text),
            retrievedAt: timestamp,
          });
        }
      }
    }

    return citations;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Main retrieval pipeline: executes search, validates sources, and constructs grounded context.
 */
export async function retrieveCurrentData(query: string): Promise<RetrievalResult> {
  const start = Date.now();

  // 1. Try Google Custom Search first if configured
  let sources = await searchGoogleCustom(query);
  let provider: 'google_custom' | 'wikipedia' | 'duckduckgo' | 'none' = 'none';

  if (sources.length > 0) {
    provider = 'google_custom';
  } else {
    // 2. Query Wikipedia and DuckDuckGo in parallel
    const [wikiResults, ddgResults] = await Promise.all([
      searchWikipedia(query),
      searchDuckDuckGo(query),
    ]);

    sources = [...wikiResults, ...ddgResults];
    if (wikiResults.length > 0) {
      provider = 'wikipedia';
    } else if (ddgResults.length > 0) {
      provider = 'duckduckgo';
    }
  }

  const latencyMs = Date.now() - start;

  if (sources.length === 0) {
    return {
      sources: [],
      groundedPromptContext: '',
      retrievalUsed: false,
      provider: 'none',
      latencyMs,
    };
  }

  // Deduplicate sources by URL
  const seenUrls = new Set<string>();
  const uniqueSources: SourceCitation[] = [];
  for (const s of sources) {
    if (!seenUrls.has(s.url)) {
      seenUrls.add(s.url);
      uniqueSources.push(s);
    }
  }

  // Construct grounded context to append into system prompt
  const currentDateStr = new Date().toISOString().split('T')[0];
  let groundedPromptContext = `\n\n--- CURRENT REAL-TIME WEB RETRIEVAL CONTEXT (Verified as of ${currentDateStr}) ---\n`;
  groundedPromptContext += `The following verified web sources were retrieved in real-time to ground your answer on current information:\n\n`;

  uniqueSources.forEach((src, idx) => {
    groundedPromptContext += `[Source ${idx + 1}] Title: "${src.title}"\nURL: ${src.url}\nDomain: ${src.domain}\nSnippet: ${src.snippet}\n\n`;
  });

  groundedPromptContext += `MANDATORY GROUNDING RULES:\n`;
  groundedPromptContext += `1. Base your answer for current/recent facts on the retrieved sources above.\n`;
  groundedPromptContext += `2. Prefix statements relying on these sources with "Based on verified current sources..." or similar honest attribution.\n`;
  groundedPromptContext += `3. If the retrieved sources do not provide complete information for the query, explicitly inform the user what could be verified and what remains uncertain.\n`;
  groundedPromptContext += `4. NEVER fabricate or invent URLs, citations, or dates beyond what is provided.\n`;
  groundedPromptContext += `--- END OF CURRENT RETRIEVAL CONTEXT ---\n`;

  return {
    sources: uniqueSources.slice(0, 4),
    groundedPromptContext,
    retrievalUsed: true,
    provider,
    latencyMs,
  };
}
