const UserModel = require('../models/userModel');
const db = require('../config/db')();
const userModel = new UserModel(db);

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel.findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password, ...profile } = user;
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    const allowedUpdates = ['username', 'preferred_currency', 'language', 'physical_address', 'notification_preferences'];
    const filteredUpdates = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});
    await userModel.updateUser(userId, filteredUpdates);
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};