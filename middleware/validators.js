// ─── Register Validation ──────────────────────────────────────────────────────
const validateRegister = (data) => {
    const errors = [];

    const { name, email, password, preferences } = data;

    // Name
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        errors.push('Name is required and must be at least 2 characters');
    }

    // Email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email || !emailRegex.test(email)) {
        errors.push('A valid email is required');
    }

    // Password
    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }

    // Preferences (optional but validate if provided)
    const validCategories = ['technology', 'sports', 'business', 'entertainment', 'health', 'science', 'politics'];
    if (preferences && preferences.categories) {
        if (!Array.isArray(preferences.categories)) {
            errors.push('Preferences categories must be an array');
        } else {
            const invalid = preferences.categories.filter(c => !validCategories.includes(c));
            if (invalid.length > 0) {
                errors.push(`Invalid categories: ${invalid.join(', ')}. Valid: ${validCategories.join(', ')}`);
            }
        }
    }

    return errors;
};

// ─── Login Validation ─────────────────────────────────────────────────────────
const validateLogin = (data) => {
    const errors = [];
    const { email, password } = data;

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email || !emailRegex.test(email)) {
        errors.push('A valid email is required');
    }

    if (!password || password.length < 1) {
        errors.push('Password is required');
    }

    return errors;
};

// ─── Preferences Validation ───────────────────────────────────────────────────
const validatePreferences = (data) => {
    const errors = [];
    const validCategories = ['technology', 'sports', 'business', 'entertainment', 'health', 'science', 'politics'];

    const { categories, language, country } = data;

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
        errors.push('Categories must be a non-empty array');
    } else {
        const invalid = categories.filter(c => !validCategories.includes(c));
        if (invalid.length > 0) {
            errors.push(`Invalid categories: ${invalid.join(', ')}. Valid: ${validCategories.join(', ')}`);
        }
    }

    if (language && typeof language !== 'string') {
        errors.push('Language must be a string (e.g. "en")');
    }

    if (country && typeof country !== 'string') {
        errors.push('Country must be a string (e.g. "us")');
    }

    return errors;
};

module.exports = { validateRegister, validateLogin, validatePreferences };
