const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { validateUser } = require('../utils/validators');
const { login, getProfile, createDefaultAdmin } = require('../controllers/authController');

// Public routes
router.post('/login', validateUser, login);
router.post('/setup-admin', createDefaultAdmin);

// Protected routes
router.get('/profile', auth, getProfile);

module.exports = router;
