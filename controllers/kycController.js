const UserModel = require('../models/userModel');
const db = require('../config/db')();
const userModel = new UserModel(db);
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

exports.submitKYC = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.user_type;
    const kycData = req.body;

    if (req.files) {
      if (req.files['selfie']) kycData.selfie_path = req.files['selfie'][0].path;
      if (req.files['id']) kycData.id_path = req.files['id'][0].path;
    }

    await userModel.createKYC(userId, kycData, userType);
    await userModel.updateKYCStatus(userId, 'submitted');
    await userModel.updateUser(userId, { kyc_deadline: null }); // Remove deadline after submission
    res.status(201).json({ message: 'KYC submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting KYC', error: error.message });
  }
};

exports.getKYCStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await userModel.getKYCStatus(userId);
    await userModel.checkKYCDeadline(userId); // Check and update status if deadline passed
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Error getting KYC status', error: error.message });
  }
};

exports.updateKYCStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    await userModel.updateKYCStatus(userId, status);
    res.json({ message: 'KYC status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating KYC status', error: error.message });
  }
};

exports.uploadMiddleware = upload.fields([
  { name: 'selfie', maxCount: 1 },
  { name: 'id', maxCount: 1 }
]);