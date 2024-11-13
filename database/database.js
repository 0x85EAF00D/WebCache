const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

function initializeDatabase(web_url, title, file_path) {
    const filePath = path.join(__dirname, 'websites.db');
    // Create a new database (or open if it exists)
    const db = new sqlite3.Database(filePath, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
        return;
      }
      console.log("Database opened successfully.");
    });
  
    // Create tables and insert initial data
    db.serialize(() => {
      // Example table: websites
      db.run(`CREATE TABLE IF NOT EXISTS websites (
        web_url TEXT PRIMARY KEY,
        title TEXT,
        file_path TEXT NOT NULL,
        created DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
  
      // Insert initial data
    const query = `INSERT INTO websites (web_url, title, file_path) VALUES (?, ?, ?)`;
    db.run(query, [web_url, title, file_path], (err) => {
    if (err) {
        console.error("Error inserting data:", err.message);
    } else {
        console.log("Initial data inserted.");
    }
    });

    });
  
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Database closed successfully.");
      }
    });
  }
  
function insertWebsite(web_url, title, file_path) {
    // this file isnt saved to github, this function builds the database after fresh clone
    const filePath = path.join(__dirname, 'websites.db');
    if (!fs.existsSync(filePath)) {
        // File doesn't exist, so create it with initial content
        initializeDatabase(web_url, title, file_path);
        console.log("Data Base created:", filePath);
    } else {
        console.log("Data Base already exists:", filePath);
        const database = new sqlite3.Database(path.join(__dirname, 'websites.db'), sqlite3.OPEN_READWRITE, (err) => {
            if(err) {return console.error(err.message);}
        });
        //Checks if the website already exists in the database
        let query = fs.readFileSync(path.join(__dirname, 'SQL', 'check_duplicates.sql'), 'utf-8');
        database.get(query, [web_url], (err, row) => {
            if(err) {return console.error(err);}
            //If website already exists, overwrite with updated data
            if(row) {
                query = fs.readFileSync(path.join(__dirname, 'SQL', 'overwrite_duplicate.sql'), 'utf-8');
                database.run(query, [title, file_path, web_url], (err) => {
                    if(err) return console.error(err.message);
                });
                //Confirmation for testing
                console.log(`Website data for ${title} has been updated in the database.`);
            } else {
                //Otherwise, runs SQL query to insert website into database table
                query = fs.readFileSync(path.join(__dirname, 'SQL', 'insert_website.sql'), 'utf-8');
                database.run(query, [web_url, title, file_path], (err) => {
                    if(err) return console.error(err.message);
                });
                //Confirmation for testing
                console.log(`${title} has been added to the database.`);
            }
        });
        database.close();
    }
}

function deleteWebsite(web_url, title) {
    const database = new sqlite3.Database(path.join(__dirname, 'websites.db'), sqlite3.OPEN_READWRITE, (err) => {
        if(err) {return console.error(err.message);}
    });

    //Runs SQL query to delete website from database table
    let query = fs.readFileSync(path.join(__dirname, 'SQL', 'delete_website.sql'), 'utf-8');
    database.run(query, [web_url], (err) => {
        if(err) return console.error(err.message);
    });

    //Confirmation for testing
    console.log(`${title} has been deleted from the database.`);
    database.close();
}

//Returns table of saved websites in an array of objects
function queryAll() {
    return new Promise((resolve, reject) => {
        const database = new sqlite3.Database(path.join(__dirname, 'websites.db'), sqlite3.OPEN_READWRITE, (err) => {
            if(err) {return console.error(err.message);}
        });
        let query = `SELECT * FROM websites;`;
        database.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
            database.close();
        });
    });
}

async function getWebsites() {
    let websites = await queryAll();
    return websites;
}

//Export the functions to server.js
module.exports = { insertWebsite, deleteWebsite, getWebsites };



