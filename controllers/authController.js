const UserModel = require('../models/userModel');
const { hashPassword, comparePassword, generateToken } = require('../utils/authUtils');
const { generateAddress } = require('../utils/addressUtils');
const { sendVerificationEmail } = require('../services/emailService');
const crypto = require('crypto');
const db = require('../config/db')();
const userModel = new UserModel(db);

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate blockchain address
    const { address, publicKey } = generateAddress('ind');

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Create user with default information
    const userData = {
      email,
      password: hashedPassword,
      user_type: 'individual', // Default user type
      address,
      public_key: publicKey,
      kyc_status: 'not_submitted',
      email_verified: false,
      verification_token: verificationToken
    };

    const { id } = await userModel.createUser(userData);

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ 
      userId: id,
      address,
      message: 'User registered successfully. Please check your email to verify your account.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.email_verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    const token = generateToken(user.id);
    await userModel.updateUser(user.id, { last_login: new Date().toISOString() });

    const kycStatus = await userModel.getKYCStatus(user.id);
    res.json({ 
      token, 
      userId: user.id, 
      address: user.address,
      kycStatus: kycStatus.kyc_status 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await userModel.findUserByVerificationToken(token);
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    await userModel.updateEmailVerificationStatus(user.id, true);
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying email', error: error.message });
  }
};

exports.checkAuthStatus = async (req, res) => {
  try {
    // If the middleware passes, the user is authenticated
    const kycStatus = await userModel.getKYCStatus(req.user.id);
    res.json({ 
      isAuthenticated: true, 
      userId: req.user.id,
      kycStatus: kycStatus.kyc_status,
      kycDeadline: kycStatus.kyc_deadline
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking auth status', error: error.message });
  }
};

// You might want to add a method for changing user type to merchant later
// exports.changeToMerchant = async (req, res) => { ... }