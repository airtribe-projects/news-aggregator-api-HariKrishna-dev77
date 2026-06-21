const express = require('express');
const router  = express.Router();
const protect = require('../middleware/auth');
const {
    register,
    login,
    getUserPreferences,
    updateUserPreferences,
    getMe
} = require('../controllers/authControllers');

// ── Public routes (no token needed) ──────────────────────────────────────────
router.post('/register', register);   // POST /auth/register
router.post('/login',    login);      // POST /auth/login

// ── Protected routes (JWT required) ──────────────────────────────────────────
router.get ('/me',          protect, getMe);                 // GET  /auth/me
router.get ('/preferences', protect, getUserPreferences);    // GET  /auth/preferences
router.put ('/preferences', protect, updateUserPreferences); // PUT  /auth/preferences

module.exports = router;
