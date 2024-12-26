const UserModel = require('../models/userModel');
const db = require('../config/db')();
const userModel = new UserModel(db);

exports.getUserLimits = async (req, res) => {
  try {
    const userId = req.user.id;
    const limits = await userModel.getUserLimits(userId);
    res.json(limits);
  } catch (error) {
    res.status(500).json({ message: 'Error getting user limits', error: error.message });
  }
};

// Other user-related controller methods...