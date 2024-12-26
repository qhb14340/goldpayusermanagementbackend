const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../users.db');

const connectDB = () => {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to SQLite database:', err);
      process.exit(1);
    }
    console.log('Connected to the SQLite database.');
  });

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN DEFAULT FALSE,
      verification_token VARCHAR(255),
      password TEXT NOT NULL,
      user_type TEXT NOT NULL,
      address TEXT UNIQUE,
      public_key TEXT UNIQUE,
      profile_picture TEXT,
      preferred_currency TEXT DEFAULT 'EUR',
      language TEXT DEFAULT 'en',
      physical_address TEXT,
      notification_preferences TEXT,
      two_factor_auth_enabled BOOLEAN DEFAULT 0,
      last_login DATETIME,
      account_status TEXT DEFAULT 'active',
      kyc_status TEXT DEFAULT 'not_submitted',
      kyc_submission_date DATETIME,
      kyc_deadline DATETIME,
      buy_sell_limit REAL DEFAULT 1000,
      transaction_limit REAL DEFAULT 2000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS individual_KYC (
      user_id INTEGER PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      date_of_birth DATE,
      nationality TEXT,
      selfie_path TEXT,
      id_path TEXT,
      kyc_status TEXT DEFAULT 'pending',
      kyc_verified_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS merchant_KYC (
      user_id INTEGER PRIMARY KEY,
      business_name TEXT,
      registration_number TEXT,
      country_of_incorporation TEXT,
      business_type TEXT,
      kyb_status TEXT DEFAULT 'pending',
      kyb_verified_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
  });

  return db;
};

module.exports = connectDB;