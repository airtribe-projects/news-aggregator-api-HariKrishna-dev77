const { registerUser, loginUser, updatePreferences, getPreferences } = require('../services/authServices');
const { validateRegister, validateLogin, validatePreferences }        = require('../utils/validators');
const { asyncHandler }                                                 = require('../middleware/errorHandler');

// ─── POST /auth/register ──────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
    const errors = validateRegister(req.body);
    if (errors.length > 0)
        return res.status(400).json({ success: false, errors });

    const { name, email, password, preferences } = req.body;
    const result = await registerUser({ name, email, password, preferences });

    return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token: result.token,
        user:  result.user
    });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
    const errors = validateLogin(req.body);
    if (errors.length > 0)
        return res.status(400).json({ success: false, errors });

    const { email, password } = req.body;
    const result = await loginUser({ email, password });

    return res.status(200).json({
        success: true,
        message: 'Login successful',
        token: result.token,
        user:  result.user
    });
});

// ─── GET /auth/preferences ────────────────────────────────────────────────────
const getUserPreferences = asyncHandler(async (req, res) => {
    const preferences = await getPreferences(req.user._id);
    return res.status(200).json({ success: true, preferences });
});

// ─── PUT /auth/preferences ────────────────────────────────────────────────────
const updateUserPreferences = asyncHandler(async (req, res) => {
    const errors = validatePreferences(req.body);
    if (errors.length > 0)
        return res.status(400).json({ success: false, errors });

    const { categories, language, country } = req.body;
    const user = await updatePreferences(req.user._id, { categories, language, country });

    return res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: user.preferences
    });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
    return res.status(200).json({
        success: true,
        user: {
            id:            req.user._id,
            name:          req.user.name,
            email:         req.user.email,
            preferences:   req.user.preferences,
            readCount:     req.user.readArticles.length,
            favoriteCount: req.user.favoriteArticles.length,
            memberSince:   req.user.createdAt
        }
    });
});

module.exports = { register, login, getUserPreferences, updateUserPreferences, getMe };
