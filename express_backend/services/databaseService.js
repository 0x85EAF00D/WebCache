// services/databaseService.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const util = require("util");

class DatabaseService {
  static #db = new sqlite3.Database(
    path.join(process.cwd(), "database", "websites.db"),
    (err) => {
      if (err) {
        console.error("Database connection error:", err);
      } else {
        // Initialize tables when database is connected
        this.initializeTables().catch(console.error);
      }
    }
  );

  // Convert callback-based db methods to Promise-based
  static #dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.#db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this); // 'this' contains lastID and changes
      });
    });
  }

  static #dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.#db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static #dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.#db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Create new website record with duplicate handling
  static async createWebsite(web_url, title, file_path) {
    try {
      // First check if website already exists
      const existingWebsite = await this.#dbGet(
        "SELECT * FROM websites WHERE web_url = ?",
        [web_url]
      );

      if (existingWebsite) {
        // Update existing record
        const result = await this.#dbRun(
          `UPDATE websites 
           SET file_path = ?, 
               title = ?,
               created = datetime('now')
           WHERE web_url = ?`,
          [file_path, title, web_url]
        );

        return {
          id: existingWebsite.id,
          web_url,
          title,
          file_path,
          created: new Date().toISOString(),
        };
      }

      // Create new record
      const result = await this.#dbRun(
        `INSERT INTO websites (web_url, title, file_path, created) 
         VALUES (?, ?, ?, datetime('now'))`,
        [web_url, title, file_path]
      );

      if (!result || typeof result.lastID === "undefined") {
        throw new Error("Failed to get lastID from insert operation");
      }

      return {
        id: result.lastID,
        web_url,
        title,
        file_path,
        created: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error creating/updating website:", error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  // Initialize database tables
  static async initializeTables() {
    try {
      await this.#dbRun(`
        CREATE TABLE IF NOT EXISTS websites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          web_url TEXT NOT NULL,
          title TEXT NOT NULL,
          file_path TEXT NOT NULL,
          created DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("Database tables initialized successfully");
    } catch (error) {
      console.error("Error initializing database tables:", error);
      throw error;
    }
  }

  // Get all websites
  static async getAllWebsites() {
    try {
      return await this.#dbAll("SELECT * FROM websites ORDER BY created DESC");
    } catch (error) {
      console.error("Error fetching websites:", error);
      throw error;
    }
  }

  // Get single website by ID
  static async getWebsiteById(id) {
    try {
      return await this.#dbGet("SELECT * FROM websites WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error fetching website:", error);
      throw error;
    }
  }

  // Delete website from database
  static async deleteWebsite(id) {
    try {
      await this.#dbRun(`
        DELETE FROM websites
        WHERE id = ?;
      `, [id]
    );
      console.log("Website successfully deleted");
    } catch (error) {
      console.error("Error deleting website from database:", error);
      throw error;
    }
}

  // Close database connection
  static async close() {
    return new Promise((resolve, reject) => {
      this.#db.close((err) => {
        if (err) {
          console.error("Error closing database:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  static async deleteWebsite(web_url, title) {
    return new Promise((resolve, reject) => {
        const database = new sqlite3.Database(path.join(__dirname, '../database', 'websites.db'), sqlite3.OPEN_READWRITE, (err) => {
            if(err) {
                reject(err);
                database.close();
            }
        });
    
        //Runs SQL query to delete website from database table
        let query = fs.readFileSync(path.join(__dirname, 'SQL', 'delete_website.sql'), 'utf-8');
        database.run(query, [web_url], (err) => {
            if(err) {
                reject(err);
                database.close();
            }
        });
    
        //Confirmation for testing
        resolve(`${title} has been deleted from the database.`);
        database.close();
    });
}
}

module.exports = DatabaseService;
