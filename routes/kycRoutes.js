const express = require('express');
const { submitKYC, getKYCStatus, updateKYCStatus, uploadMiddleware } = require('../controllers/kycController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.post('/submit', uploadMiddleware, submitKYC);
router.get('/status', getKYCStatus);
router.put('/status/:userId', updateKYCStatus); // This should be protected for admin use

module.exports = router;