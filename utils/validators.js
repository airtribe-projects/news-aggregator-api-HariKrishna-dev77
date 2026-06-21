const VALID_CATEGORIES = ['technology', 'sports', 'business', 'entertainment', 'health', 'science', 'politics'];
const VALID_LANGUAGES  = ['en', 'ar', 'de', 'es', 'fr', 'he', 'it', 'nl', 'no', 'pt', 'ru', 'sv', 'ud', 'zh'];
const VALID_COUNTRIES  = ['ae','ar','at','au','be','bg','br','ca','ch','cn','co','cu','cz','de',
                          'eg','fr','gb','gr','hk','hu','id','ie','il','in','it','jp','kr','lt',
                          'lv','ma','mx','my','ng','nl','no','nz','ph','pl','pt','ro','rs','ru',
                          'sa','se','sg','si','sk','th','tr','tw','ua','us','ve','za'];

// ─── Shared helpers ───────────────────────────────────────────────────────────
const isString  = (v) => typeof v === 'string';
const isNonEmpty = (v) => isString(v) && v.trim().length > 0;

// Strict email — requires local@domain.tld with no spaces
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Password must have at least one letter and one number
const PASSWORD_LETTER_NUM = /^(?=.*[A-Za-z])(?=.*\d).+$/;

// Name — letters, spaces, hyphens, apostrophes only
const NAME_REGEX = /^[A-Za-z\s'\-]+$/;

// ─── Register Validation ──────────────────────────────────────────────────────
const validateRegister = (data) => {
    const errors = [];

    if (!data || typeof data !== 'object') {
        return ['Request body must be a JSON object'];
    }

    const { name, email, password, preferences } = data;

    // name
    if (!isNonEmpty(name)) {
        errors.push('name is required');
    } else if (name.trim().length < 2) {
        errors.push('name must be at least 2 characters');
    } else if (name.trim().length > 50) {
        errors.push('name must be 50 characters or fewer');
    } else if (!NAME_REGEX.test(name.trim())) {
        errors.push('name may only contain letters, spaces, hyphens, and apostrophes');
    }

    // email
    if (!isNonEmpty(email)) {
        errors.push('email is required');
    } else if (!EMAIL_REGEX.test(email.trim())) {
        errors.push('email must be a valid address (e.g. user@example.com)');
    }

    // password
    if (!isNonEmpty(password)) {
        errors.push('password is required');
    } else if (password.length < 6) {
        errors.push('password must be at least 6 characters');
    } else if (password.length > 128) {
        errors.push('password must be 128 characters or fewer');
    } else if (!PASSWORD_LETTER_NUM.test(password)) {
        errors.push('password must contain at least one letter and one number');
    }

    // preferences (optional at register)
    if (preferences !== undefined) {
        const prefErrors = _validatePreferencesFields(preferences);
        errors.push(...prefErrors);
    }

    return errors;
};

// ─── Login Validation ─────────────────────────────────────────────────────────
const validateLogin = (data) => {
    const errors = [];

    if (!data || typeof data !== 'object') {
        return ['Request body must be a JSON object'];
    }

    const { email, password } = data;

    if (!isNonEmpty(email)) {
        errors.push('email is required');
    } else if (!EMAIL_REGEX.test(email.trim())) {
        errors.push('email must be a valid address (e.g. user@example.com)');
    }

    if (!isNonEmpty(password)) {
        errors.push('password is required');
    }

    return errors;
};

// ─── Preferences Validation ───────────────────────────────────────────────────
const validatePreferences = (data) => {
    if (!data || typeof data !== 'object') {
        return ['Request body must be a JSON object'];
    }
    return _validatePreferencesFields(data);
};

// ─── Internal: shared preferences field checks ────────────────────────────────
const _validatePreferencesFields = ({ categories, language, country } = {}) => {
    const errors = [];

    // categories — required, non-empty array of known values
    if (categories === undefined) {
        errors.push('categories is required');
    } else if (!Array.isArray(categories)) {
        errors.push('categories must be an array (e.g. ["technology", "sports"])');
    } else if (categories.length === 0) {
        errors.push('categories must contain at least one item');
    } else if (categories.length > 5) {
        errors.push('categories must contain 5 or fewer items');
    } else {
        const nonStrings = categories.filter(c => !isString(c));
        if (nonStrings.length > 0) {
            errors.push('every category must be a string');
        } else {
            const invalid = categories.filter(c => !VALID_CATEGORIES.includes(c));
            if (invalid.length > 0) {
                errors.push(
                    `invalid categories: "${invalid.join('", "')}". ` +
                    `Allowed: ${VALID_CATEGORIES.join(', ')}`
                );
            }
        }
    }

    // language — optional, must be 2-char ISO code
    if (language !== undefined) {
        if (!isString(language) || language.trim().length === 0) {
            errors.push('language must be a string (e.g. "en")');
        } else if (!VALID_LANGUAGES.includes(language.toLowerCase())) {
            errors.push(
                `invalid language "${language}". ` +
                `Allowed: ${VALID_LANGUAGES.join(', ')}`
            );
        }
    }

    // country — optional, must be 2-char ISO code
    if (country !== undefined) {
        if (!isString(country) || country.trim().length === 0) {
            errors.push('country must be a string (e.g. "us")');
        } else if (!VALID_COUNTRIES.includes(country.toLowerCase())) {
            errors.push(`invalid country code "${country}". Must be a valid 2-letter ISO code (e.g. "us", "gb", "in")`);
        }
    }

    return errors;
};

module.exports = { validateRegister, validateLogin, validatePreferences, VALID_CATEGORIES };
