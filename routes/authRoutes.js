const express = require('express');
const { register, login, verifyEmail, checkAuthStatus } = require('../controllers/authController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.get('/status', auth, checkAuthStatus);

module.exports = router;