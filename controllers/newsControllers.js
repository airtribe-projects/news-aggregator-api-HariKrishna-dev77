const {
    fetchNewsByPreferences,
    fetchNewsByKeyword,
    markAsRead,
    markAsFavorite,
    removeFromFavorites
} = require('../services/newsServices');
const { asyncHandler } = require('../middleware/errorHandler');

// ─── Helper: translate NewsAPI/axios errors to HTTP responses ─────────────────
const handleNewsError = (err, res) => {
    // Wrong or missing API key
    if (err.statusCode === 401 || err.code === 'apiKeyInvalid') {
        return res.status(502).json({
            success: false,
            message: 'Invalid NEWS_API_KEY. Get a free key at https://newsapi.org'
        });
    }
    // Rate limit (free plan: 100 req/day)
    if (err.statusCode === 429 || err.code === 'rateLimited') {
        return res.status(429).json({
            success: false,
            message: 'NewsAPI rate limit reached. Free plan allows 100 requests/day.'
        });
    }
    // Request timeout
    if (err.isTimeout) {
        return res.status(504).json({
            success: false,
            message: 'NewsAPI request timed out. Try again in a moment.'
        });
    }
    // Our own validation (bad category, missing prefs)
    if (err.statusCode === 400) {
        return res.status(400).json({ success: false, message: err.message });
    }
    // NewsAPI unreachable
    if (err.isAxiosError || err.code === 'ENOTFOUND') {
        return res.status(503).json({
            success: false,
            message: 'Cannot reach NewsAPI. Check your internet connection.'
        });
    }
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
};

// ─── GET /news ────────────────────────────────────────────────────────────────
const getNewsByPreferences = asyncHandler(async (req, res) => {
    try {
        const { articles, fromCache } = await fetchNewsByPreferences(req.user.preferences);

        if (!articles || articles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No articles found for your preferences. Try updating them via PUT /auth/preferences'
            });
        }

        return res.status(200).json({
            success: true,
            fromCache,
            count: articles.length,
            preferences: req.user.preferences.categories,
            articles
        });
    } catch (err) {
        return handleNewsError(err, res);
    }
});

// ─── GET /news/search/:keyword ────────────────────────────────────────────────
const searchNews = asyncHandler(async (req, res) => {
    try {
        const { keyword }   = req.params;
        const { language }  = req.query;

        const { articles, fromCache } = await fetchNewsByKeyword(keyword, language);

        if (!articles || articles.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No articles found for "${keyword}"`
            });
        }

        return res.status(200).json({
            success: true,
            fromCache,
            keyword,
            count: articles.length,
            articles
        });
    } catch (err) {
        return handleNewsError(err, res);
    }
});

// ─── POST /news/:id/read ──────────────────────────────────────────────────────
const markArticleAsRead = asyncHandler(async (req, res) => {
    const { id: articleId } = req.params;
    await markAsRead(req.user, articleId, req.body);
    return res.status(200).json({ success: true, message: 'Article marked as read', articleId });
});

// ─── POST /news/:id/favorite ──────────────────────────────────────────────────
const markArticleAsFavorite = asyncHandler(async (req, res) => {
    const { id: articleId } = req.params;
    const { alreadyExists } = await markAsFavorite(req.user, articleId, req.body);
    return res.status(200).json({
        success: true,
        message: alreadyExists ? 'Article already in favorites' : 'Article added to favorites',
        articleId
    });
});

// ─── DELETE /news/:id/favorite ────────────────────────────────────────────────
const removeFavorite = asyncHandler(async (req, res) => {
    const { id: articleId } = req.params;
    await removeFromFavorites(req.user, articleId);
    return res.status(200).json({ success: true, message: 'Removed from favorites', articleId });
});

// ─── GET /news/read ───────────────────────────────────────────────────────────
const getReadArticles = asyncHandler(async (req, res) => {
    const articles = req.user.readArticles;
    return res.status(200).json({ success: true, count: articles.length, articles });
});

// ─── GET /news/favorites ──────────────────────────────────────────────────────
const getFavoriteArticles = asyncHandler(async (req, res) => {
    const articles = req.user.favoriteArticles;
    return res.status(200).json({ success: true, count: articles.length, articles });
});

module.exports = {
    getNewsByPreferences,
    searchNews,
    markArticleAsRead,
    markArticleAsFavorite,
    removeFavorite,
    getReadArticles,
    getFavoriteArticles
};
