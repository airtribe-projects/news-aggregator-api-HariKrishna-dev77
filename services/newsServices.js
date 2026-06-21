const axios  = require('axios');
const { getCache, setCache, buildCacheKey } = require('../utils/cache');

const TOP_HEADLINES_URL = 'https://newsapi.org/v2/top-headlines';
const EVERYTHING_URL    = 'https://newsapi.org/v2/everything';
const CACHE_TTL         = 5 * 60 * 1000; // 5 minutes

// ─── NewsAPI categories (supported by top-headlines endpoint) ─────────────────
const TOP_HEADLINE_CATEGORIES = [
    'business', 'entertainment', 'health', 'science', 'sports', 'technology'
];

// ─── Shared axios helper ──────────────────────────────────────────────────────
const callNewsAPI = async (url, params) => {
    try {
        const response = await axios.get(url, {
            params: { ...params, apiKey: process.env.NEWS_API_KEY },
            timeout: 8000
        });

        if (response.data.status === 'error') {
            const err = new Error(response.data.message || 'NewsAPI returned an error');
            err.code = response.data.code;
            throw err;
        }

        return response.data.articles || [];

    } catch (err) {
        // Rethrow with clean structure for controller to handle
        if (err.response) {
            const apiErr = new Error(err.response.data?.message || 'NewsAPI request failed');
            apiErr.statusCode = err.response.status;
            apiErr.isAxiosError = true;
            throw apiErr;
        }
        if (err.code === 'ECONNABORTED') {
            const timeoutErr = new Error('NewsAPI request timed out after 8 seconds');
            timeoutErr.isTimeout = true;
            throw timeoutErr;
        }
        throw err;
    }
};

// ─── Fetch news by user preferences ──────────────────────────────────────────
// Strategy:
//   • Single category that NewsAPI supports → use top-headlines (fresher)
//   • Multiple categories or custom → use everything with OR query
const fetchNewsByPreferences = async (preferences) => {
    const { categories = [], language = 'en', country = 'us' } = preferences;

    if (categories.length === 0) {
        const err = new Error('No categories in preferences. Update via PUT /auth/preferences');
        err.statusCode = 400;
        throw err;
    }

    const cacheKey = buildCacheKey('prefs', categories.join('-'), language);
    const cached   = getCache(cacheKey);
    if (cached) return { articles: cached, fromCache: true };

    let articles;

    if (categories.length === 1 && TOP_HEADLINE_CATEGORIES.includes(categories[0])) {
        // Use top-headlines for a single standard category — fresher results
        articles = await callNewsAPI(TOP_HEADLINES_URL, {
            category: categories[0],
            language,
            country,
            pageSize: 20
        });
    } else {
        // Use everything for multi-category or custom queries
        articles = await callNewsAPI(EVERYTHING_URL, {
            q: categories.join(' OR '),
            language,
            sortBy: 'publishedAt',
            pageSize: 20
        });
    }

    setCache(cacheKey, articles, CACHE_TTL);
    return { articles, fromCache: false };
};

// ─── Search news by keyword ───────────────────────────────────────────────────
const fetchNewsByKeyword = async (keyword, language = 'en') => {
    if (!keyword || keyword.trim().length < 2) {
        const err = new Error('Keyword must be at least 2 characters');
        err.statusCode = 400;
        throw err;
    }

    const cacheKey = buildCacheKey('search', keyword.toLowerCase(), language);
    const cached   = getCache(cacheKey);
    if (cached) return { articles: cached, fromCache: true };

    const articles = await callNewsAPI(EVERYTHING_URL, {
        q: keyword.trim(),
        language,
        sortBy: 'relevancy',
        pageSize: 20
    });

    setCache(cacheKey, articles, CACHE_TTL);
    return { articles, fromCache: false };
};

// ─── Mark article as read ─────────────────────────────────────────────────────
const markAsRead = async (user, articleId, articleData) => {
    const alreadyRead = user.readArticles.some(a => a.articleId === articleId);
    if (alreadyRead) return user;

    user.readArticles.push({
        articleId,
        title: articleData.title || '',
        url:   articleData.url   || ''
    });

    await user.save();
    return user;
};

// ─── Mark article as favorite ─────────────────────────────────────────────────
const markAsFavorite = async (user, articleId, articleData) => {
    const alreadyFav = user.favoriteArticles.some(a => a.articleId === articleId);
    if (alreadyFav) return { user, alreadyExists: true };

    user.favoriteArticles.push({
        articleId,
        title:       articleData.title       || '',
        url:         articleData.url         || '',
        description: articleData.description || ''
    });

    await user.save();
    return { user, alreadyExists: false };
};

// ─── Remove from favorites ────────────────────────────────────────────────────
const removeFromFavorites = async (user, articleId) => {
    user.favoriteArticles = user.favoriteArticles.filter(a => a.articleId !== articleId);
    await user.save();
    return user;
};

module.exports = {
    fetchNewsByPreferences,
    fetchNewsByKeyword,
    markAsRead,
    markAsFavorite,
    removeFromFavorites
};
