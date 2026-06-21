const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Generate JWT ─────────────────────────────────────────────────────────────
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// ─── Register User ────────────────────────────────────────────────────────────
const registerUser = async ({ name, email, password, preferences }) => {
    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        const error = new Error('Email already registered. Please login instead.');
        error.statusCode = 409;
        throw error;
    }

    // Create user — password hashed via pre('save') hook in model
    const user = await User.create({
        name,
        email,
        password,
        preferences: preferences || { categories: ['technology'], language: 'en' }
    });

    const token = generateToken(user._id);

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            preferences: user.preferences
        }
    };
};

// ─── Login User ───────────────────────────────────────────────────────────────
const loginUser = async ({ email, password }) => {
    // Find user (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    // Compare password using model method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const token = generateToken(user._id);

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            preferences: user.preferences
        }
    };
};

// ─── Update Preferences ───────────────────────────────────────────────────────
const updatePreferences = async (userId, preferences) => {
    const user = await User.findByIdAndUpdate(
        userId,
        { preferences },
        { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return user;
};

// ─── Get Preferences ──────────────────────────────────────────────────────────
const getPreferences = async (userId) => {
    const user = await User.findById(userId).select('preferences');
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    return user.preferences;
};

module.exports = { registerUser, loginUser, updatePreferences, getPreferences };
