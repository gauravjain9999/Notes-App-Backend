const newsService = require("../services/news.service");

const getNews = async (req, res) => {
  const category = (req.query.category || "business").toLowerCase();
  const limit = Number.parseInt(req.query.limit || "20", 10);

  if (!newsService.categories.includes(category)) {
    return res.status(400).json({
      apiResponseStatus: false,
      apiResponseMessage: "Unsupported news category.",
      categories: newsService.categories,
    });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return res.status(400).json({
      apiResponseStatus: false,
      apiResponseMessage: "Limit must be an integer between 1 and 50.",
    });
  }

  try {
    const result = await newsService.getCategory(category);
    const articles = await newsService.addImages(
      result.articles.slice(0, limit),
    );
    return res.status(200).json({
      apiResponseStatus: true,
      apiResponseData: {
        ...result,
        articles,
      },
    });
  } catch (error) {
    console.error(`Unable to fetch ${category} news:`, error.message);
    return res.status(502).json({
      apiResponseStatus: false,
      apiResponseMessage:
        "News is temporarily unavailable. Please try again later.",
    });
  }
};

const getFilteredNews = async (req, res) => {
  const category = req.body.category?.toLowerCase();
  const limit = Number.parseInt(req.body.limit ?? "20", 10);
  const page = Number.parseInt(req.body.page ?? "1", 10);

  if (category && !newsService.categories.includes(category)) {
    return res.status(400).json({
      apiResponseStatus: false,
      apiResponseData: {
        apiResponseMessage: "Unsupported news category.",
        categories: newsService.categories,
      },
    });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return res.status(400).json({
      apiResponseStatus: false,
      apiResponseData: {
        apiResponseMessage: "Limit must be an integer between 1 and 50.",
      },
    });
  }

  if (!Number.isInteger(page) || page < 1) {
    return res.status(400).json({
      apiResponseStatus: false,
      apiResponseData: {
        apiResponseMessage: "Page must be a positive integer.",
      },
    });
  }

  try {
    const categories = category ? [category] : newsService.categories;
    const results = await Promise.all(
      categories.map((item) => newsService.getCategory(item)),
    );
    const seenUrls = new Set();
    const articles = results
      .flatMap((result) =>
        result.articles.map((article) => ({
          ...article,
          category: result.category,
        })),
      )
      .filter((article) => {
        if (seenUrls.has(article.url)) return false;
        seenUrls.add(article.url);
        return true;
      })
      .sort(
        (first, second) =>
          new Date(second.publishedAt || 0) - new Date(first.publishedAt || 0),
      );

    const totalRecords = articles.length;
    const offset = (page - 1) * limit;
    const articlesWithImages = await newsService.addImages(
      articles.slice(offset, offset + limit),
    );
    return res.status(200).json({
      apiResponseStatus: true,
      apiResponseData: {
        apiResponseMessage: "News fetched successfully.",
        filters: { category: category || null },
        totalRecords,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalRecords / limit),
        },
        articles: articlesWithImages,
      },
    });
  } catch (error) {
    console.error("Unable to filter news:", error.message);
    return res.status(502).json({
      apiResponseStatus: false,
      apiResponseData: {
        apiResponseMessage:
          "News is temporarily unavailable. Please try again later.",
      },
    });
  }
};

module.exports = { getNews, getFilteredNews };
