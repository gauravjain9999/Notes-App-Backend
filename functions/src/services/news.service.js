const cron = require("node-cron");
const Parser = require("rss-parser");

const parser = new Parser();
const cache = new Map();
const imageCache = new Map();
const timezone = "Asia/Kolkata";
const FEED_BASE = process.env.GOOGLE_NEWS;

const feeds = {
  business: `${FEED_BASE}/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en`,
  sports: `${FEED_BASE}/headlines/section/topic/SPORTS?hl=en-IN&gl=IN&ceid=IN:en`,
  technology: `${FEED_BASE}/headlines/section/topic/TECHNOLOGY?hl=en-IN&gl=IN&ceid=IN:en`,
  entertainment: `${FEED_BASE}/headlines/section/topic/ENTERTAINMENT?hl=en-IN&gl=IN&ceid=IN:en`,
  culture: `${FEED_BASE}/search?q=culture%20India&hl=en-IN&gl=IN&ceid=IN:en`,
  bollywood: `${FEED_BASE}/search?q=Bollywood&hl=en-IN&gl=IN&ceid=IN:en`,
};

const getAttribute = (tag, name) => {
  const match = tag.match(
    new RegExp(String.raw`\b${name}=["']([^"']*)["']`, "i"),
  );
  return match?.[1]?.replaceAll("&amp;", "&") || null;
};

const findImageUrl = (html) => {
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of metaTags) {
    const property = getAttribute(tag, "property") || getAttribute(tag, "name");
    if (property === "og:image" || property === "twitter:image") {
      const imageUrl = getAttribute(tag, "content");
      if (imageUrl) return imageUrl;
    }
  }
  return null;
};

const fetchArticleImage = async (articleUrl) => {
  let requestUrl;
  try {
    requestUrl = new URL(articleUrl);
    if (requestUrl.protocol !== "https:") return null;
  } catch {
    return null;
  }

  let response;
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    try {
      response = await fetch(requestUrl, {
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
        headers: { "user-agent": "Mozilla/5.0" },
      });
    } catch (error) {
      console.error(`Unable to fetch news article image: ${error.message}`);
      return null;
    }

    if (response.status < 300 || response.status >= 400) break;

    const location = response.headers.get("location");
    if (!location) return null;
    try {
      requestUrl = new URL(location, requestUrl);
    } catch {
      return null;
    }
    if (requestUrl.protocol !== "https:") return null;
  }

  if (
    !response?.ok ||
    !response.headers.get("content-type")?.includes("text/html")
  ) {
    return null;
  }

  try {
    const html = await response.text();
    const imageUrl = findImageUrl(html);
    if (!imageUrl) return null;
    const parsedImageUrl = new URL(imageUrl, requestUrl);
    return parsedImageUrl.protocol === "https:" ? parsedImageUrl.href : null;
  } catch (error) {
    console.error(`Unable to read news article image: ${error.message}`);
    return null;
  }
};

const addImages = async (articles) => {
  const enriched = new Array(articles.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < articles.length) {
      const index = nextIndex++;
      const article = articles[index];
      let imageUrl = imageCache.get(article.url);
      if (!imageCache.has(article.url)) {
        imageUrl = await fetchArticleImage(article.url);
        imageCache.set(article.url, imageUrl);
      }
      enriched[index] = { ...article, imageUrl };
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(5, articles.length) }, worker),
  );
  return enriched;
};

const fetchCategory = async (category) => {
  const feed = await parser.parseURL(feeds[category]);
  const articles = (feed.items || []).map((item) => ({
    title: item.title || "",
    url: item.link || "",
    imageUrl: null,
    publishedAt: item.isoDate || item.pubDate || null,
    source: item.creator || item.source || feed.title || "",
    summary: item.contentSnippet || "",
  }));

  const result = {
    category,
    updatedAt: new Date().toISOString(),
    articles,
  };
  cache.set(category, result);
  return result;
};

const refreshAll = async () => {
  const results = await Promise.allSettled(
    Object.keys(feeds).map((category) => fetchCategory(category)),
  );
  const failedCategories = results
    .map((result, index) => ({ result, category: Object.keys(feeds)[index] }))
    .filter(({ result }) => result.status === "rejected")
    .map(({ category }) => category);

  if (failedCategories.length) {
    console.error(
      "News refresh failed for categories:",
      failedCategories.join(", "),
    );
  }
};

const startDailyRefresh = () => {
  cron.schedule("0 6 * * *", refreshAll, { timezone });
  refreshAll().catch((error) =>
    console.error("Initial news refresh failed:", error),
  );
};

const getCategory = async (category) => {
  if (!cache.has(category)) {
    return fetchCategory(category);
  }
  return cache.get(category);
};

module.exports = {
  categories: Object.keys(feeds),
  addImages,
  getCategory,
  startDailyRefresh,
};
