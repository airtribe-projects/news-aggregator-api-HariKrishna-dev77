const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const { startPeriodicCacheCleanup } = require('./utils/cache');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Malformed JSON handler ───────────────────────────────────────────────────
// Catches requests where the body is invalid JSON (e.g. missing a quote/brace)
// Must sit right after body parsers, before routes
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON in request body. Check your syntax.'
        });
    }
    next(err);
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', require('./routes/authRoutes'));
app.use('/news', require('./routes/newsRoutes'));

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
    res.json({ success: true, message: "News API is running" })
})

// ─── 404 — unknown route ──────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

// ─── Global error handler (must be last, must have 4 params) ─────────────────
app.use(errorHandler);

// ─── Connect DB + start server ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        startPeriodicCacheCleanup(10 * 60 * 1000);
        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

module.exports = app;
