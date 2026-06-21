// ─── Centralized Error Handler Middleware ─────────────────────────────────────
// Placed LAST in app.js after all routes.
// Controllers call next(err) to reach here, or errors thrown inside async
// handlers are caught by Express if you wrap them (see asyncHandler below).

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message    = err.message    || 'Internal server error';
    let errors     = null;

    // ── Mongoose: field-level validation failed ────────────────────────────────
    // e.g. required field missing, enum value invalid, minlength violated
    if (err.name === 'ValidationError') {
        statusCode = 400;
        errors  = Object.values(err.errors).map(e => e.message);
        message = 'Validation failed';
    }

    // ── Mongoose: duplicate unique field (e.g. email already registered) ───────
    // err.code 11000 = MongoDB duplicate key error
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message = `${field} is already in use`;
    }

    // ── Mongoose: bad ObjectId format (e.g. /users/not-a-valid-id) ────────────
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid value for field "${err.path}"`;
    }

    // ── JWT: token signature invalid ───────────────────────────────────────────
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token. Please log in again.';
    }

    // ── JWT: token has expired ─────────────────────────────────────────────────
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Your session has expired. Please log in again.';
    }

    // ── Unexpected / unhandled errors — log the full stack in dev ─────────────
    if (statusCode === 500) {
        console.error('[Unhandled Error]', err);
    }

    const body = { success: false, message };
    if (errors) body.errors = errors;

    return res.status(statusCode).json(body);
};

// ─── asyncHandler ─────────────────────────────────────────────────────────────
// Wraps async route handlers so thrown errors automatically reach errorHandler
// without needing try/catch in every controller.
// Usage: router.get('/route', asyncHandler(async (req, res) => { ... }))
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
