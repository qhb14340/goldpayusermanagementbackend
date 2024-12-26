const express = require('express');
const { getUserLimits } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/limits', getUserLimits);

module.exports = router;