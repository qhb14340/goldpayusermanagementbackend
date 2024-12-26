class UserModel {
  constructor(db) {
    this.db = db;
  }

  createUser(userData) {
    return new Promise((resolve, reject) => {
      const { email, password, user_type, address, public_key, kyc_status } = userData;
      const sql = `INSERT INTO users (email, password, user_type, address, public_key, kyc_status) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
      this.db.run(sql, [email, password, user_type, address, public_key, kyc_status], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  async updateEmailVerificationStatus(userId, status) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE users SET email_verified = ? WHERE id = ?`;
      this.db.run(sql, [status, userId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }
  
  findUserByEmail(email) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT *, email_verified FROM users WHERE email = ?`;
      this.db.get(sql, [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  findUserById(id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE id = ?`;
      this.db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  findUserByVerificationToken(token) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE verification_token = ?`;
      this.db.get(sql, [token], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  updateEmailVerificationStatus(userId, status) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE users SET email_verified = ?, verification_token = NULL WHERE id = ?`;
      this.db.run(sql, [status ? 1 : 0, userId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  updateUser(id, updateData) {
    const keys = Object.keys(updateData);
    const values = Object.values(updateData);
    const sql = `UPDATE users SET ${keys.map(key => `${key} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [...values, id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  createKYC(userId, kycData, userType) {
    return new Promise((resolve, reject) => {
      const table = userType === 'individual' ? 'individual_KYC' : 'merchant_KYC';
      const columns = Object.keys(kycData).join(', ');
      const placeholders = Object.keys(kycData).map(() => '?').join(', ');
      const sql = `INSERT INTO ${table} (user_id, ${columns}) VALUES (?, ${placeholders})`;
      this.db.run(sql, [userId, ...Object.values(kycData)], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  getKYCStatus(userId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT kyc_status, kyc_submission_date, kyc_deadline FROM users WHERE id = ?`;
      this.db.get(sql, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  updateKYCStatus(userId, status) {
    return new Promise((resolve, reject) => {
      let buySellLimit = 1000;
      let transactionLimit = 2000;
      if (status === 'completed') {
        buySellLimit = null;  // null represents no limit
        transactionLimit = null;
      }

      const sql = `UPDATE users SET kyc_status = ?, kyc_submission_date = CURRENT_TIMESTAMP, 
                   buy_sell_limit = ?, transaction_limit = ? WHERE id = ?`;
      this.db.run(sql, [status, buySellLimit, transactionLimit, userId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  setKYCDeadline(userId) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7); // 7 days from now
    return new Promise((resolve, reject) => {
      const sql = `UPDATE users SET kyc_deadline = ? WHERE id = ?`;
      this.db.run(sql, [deadline.toISOString(), userId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  checkKYCDeadline(userId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT kyc_status, kyc_deadline FROM users WHERE id = ?`;
      this.db.get(sql, [userId], (err, row) => {
        if (err) reject(err);
        else {
          if (row.kyc_status === 'pending' && new Date() > new Date(row.kyc_deadline)) {
            this.updateUser(userId, { account_status: 'restricted' })
              .then(() => resolve({ status: 'restricted' }))
              .catch(reject);
          } else {
            resolve({ status: row.kyc_status });
          }
        }
      });
    });
  }

  getUserLimits(userId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT kyc_status, buy_sell_limit, transaction_limit, kyc_deadline FROM users WHERE id = ?`;
      this.db.get(sql, [userId], (err, row) => {
        if (err) reject(err);
        else {
          let limits = {
            buySellLimit: row.buy_sell_limit,
            transactionLimit: row.transaction_limit
          };
          if (row.kyc_status === 'pending' && new Date() <= new Date(row.kyc_deadline)) {
            limits.buySellLimit = 100; // Restricted limit during grace period
            limits.transactionLimit = 100;
          }
          resolve(limits);
        }
      });
    });
  }
}

module.exports = UserModel;