const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const db = require('../config/db')();
const userModel = new UserModel(db);

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Check KYC deadline and update status if necessary
    await userModel.checkKYCDeadline(req.user.id);

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
};