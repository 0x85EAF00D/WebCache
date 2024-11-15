// services/encryptionService.js
const crypto = require("crypto");

class EncryptionService {
  static ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-256-bit-secret";
  static IV_LENGTH = 16;

  static async encrypt(data) {
    try {
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        Buffer.from(this.ENCRYPTION_KEY),
        iv
      );

      let encryptedData = cipher.update(data, "utf8", "hex");
      encryptedData += cipher.final("hex");

      return {
        encryptedData,
        iv: iv.toString("hex"),
      };
    } catch (error) {
      console.error("Error encrypting data:", error.message);
      throw new Error("Encryption failed");
    }
  }

  static async decrypt(encryptedData, iv) {
    try {
      const ivBuffer = Buffer.from(iv, "hex");
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(this.ENCRYPTION_KEY),
        ivBuffer
      );

      let decryptedData = decipher.update(encryptedData, "hex", "utf8");
      decryptedData += decipher.final("utf8");

      return decryptedData;
    } catch (error) {
      console.error("Error decrypting data:", error.message);
      throw new Error("Decryption failed");
    }
  }

  static async hashPassword(password) {
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, "salt", 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString("hex"));
      });
    });
  }

  static async verifyPassword(password, hash) {
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, "salt", 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString("hex") === hash);
      });
    });
  }

  static generateToken(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }

  static async encryptFile(fileData) {
    try {
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        Buffer.from(this.ENCRYPTION_KEY),
        iv
      );

      const encryptedBuffer = Buffer.concat([
        cipher.update(fileData),
        cipher.final(),
      ]);

      return {
        encryptedData: encryptedBuffer,
        iv: iv.toString("hex"),
      };
    } catch (error) {
      console.error("Error encrypting file:", error.message);
      throw new Error("File encryption failed");
    }
  }

  static async decryptFile(encryptedData, iv) {
    try {
      const ivBuffer = Buffer.from(iv, "hex");
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(this.ENCRYPTION_KEY),
        ivBuffer
      );

      const decryptedBuffer = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]);

      return decryptedBuffer;
    } catch (error) {
      console.error("Error decrypting file:", error.message);
      throw new Error("File decryption failed");
    }
  }
}

module.exports = EncryptionService;
