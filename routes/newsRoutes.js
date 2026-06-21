const express = require('express');
const router  = express.Router();
const protect = require('../middleware/auth');
const {
  getNewsByPreferences,
  searchNews,
  markArticleAsRead,
  markArticleAsFavorite,
  removeFavorite,
  getReadArticles,
  getFavoriteArticles
} = require('../controllers/newsControllers');

router.use(protect);

router.get('/', getNewsByPreferences);               // GET    /news
router.get('/read', getReadArticles);                // GET    /news/read
router.get('/favorites', getFavoriteArticles);       // GET    /news/favorites
router.get('/search/:keyword', searchNews);          // GET    /news/search/:keyword
router.post('/:id/read', markArticleAsRead);         // POST   /news/:id/read
router.post('/:id/favorite', markArticleAsFavorite); // POST   /news/:id/favorite
router.delete('/:id/favorite', removeFavorite);      // DELETE /news/:id/favorite

module.exports = router;
