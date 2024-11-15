const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

function initializeDatabase(web_url, title, file_path) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(__dirname, 'websites.db');
        const db = new sqlite3.Database(filePath, (err) => {
            if (err) {
                return reject(`Error opening database: ${err.message}`);
            }
            console.log("Database opened successfully.");
        });

        // Create tables and insert initial data
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS websites (
                web_url TEXT PRIMARY KEY,
                title TEXT,
                file_path TEXT NOT NULL,
                created DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    db.close();
                    return reject(`Error creating table: ${err.message}`);
                }

                // Insert initial data
                const query = `INSERT INTO websites (web_url, title, file_path) VALUES (?, ?, ?)`;
                db.run(query, [web_url, title, file_path], (err) => {
                    if (err) {
                        db.close();
                        return reject(`Error inserting data: ${err.message}`);
                    }
                    console.log("Initial data inserted.");

                    // Close the database after resolving
                    db.close((closeErr) => {
                        if (closeErr) {
                            return reject(`Error closing database: ${closeErr.message}`);
                        }
                        console.log("Database closed successfully.");
                        resolve("Database initialized and data inserted.");
                    });
                });
            });
        });
    });
}

//Need to update server.js so that it uses await  
async function insertWebsite(web_url, title, file_path) {
    const filePath = path.join(__dirname, 'websites.db');
    try {
        if (!fs.existsSync(filePath)) {
            // Await for initializeDatabase to finish
            await initializeDatabase(web_url, title, file_path);
            return "Database created.";
        } else {
            console.log("Database already exists:", filePath);
            
            const database = new sqlite3.Database(filePath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    throw new Error(`Error opening database: ${err.message}`);
                }
            });

            // Check if the website already exists in the database
            const checkQuery = fs.readFileSync(path.join(__dirname, 'SQL', 'check_duplicates.sql'), 'utf-8');
            const row = await new Promise((resolve, reject) => {
                database.get(checkQuery, [web_url], (err, row) => {
                    if (err) {
                        reject(`Error checking for duplicate: ${err.message}`);
                    } else {
                        resolve(row);
                    }
                });
            });

            if (row) {
                const updateQuery = fs.readFileSync(path.join(__dirname, 'SQL', 'overwrite_duplicate.sql'), 'utf-8');
                await new Promise((resolve, reject) => {
                    database.run(updateQuery, [title, file_path, web_url], (err) => {
                        if (err) {
                            reject(`Error updating website: ${err.message}`);
                        } else {
                            resolve();
                        }
                    });
                });
                database.close();
                return `Website data for ${title} has been updated.`;
            } else {
                const insertQuery = fs.readFileSync(path.join(__dirname, 'SQL', 'insert_website.sql'), 'utf-8');
                await new Promise((resolve, reject) => {
                    database.run(insertQuery, [web_url, title, file_path], (err) => {
                        if (err) {
                            reject(`Error inserting website: ${err.message}`);
                        } else {
                            resolve();
                        }
                    });
                });
                database.close();
                return `${title} has been added to the database.`;
            }
        }
    } catch (err) {
        console.error("Error:", err);
        throw err;
    }
}

function updateWebsite() {
    //Will update website fields based on the input values
}

function getFilePath() {
    //1: Query web_url
    //2: If web_url is found, return the file_path
    //3: Else return "Not found"
}


function deleteWebsite(web_url, title) {
    return new Promise((resolve, reject) => {
        const database = new sqlite3.Database(path.join(__dirname, 'websites.db'), sqlite3.OPEN_READWRITE, (err) => {
            if(err) {reject(err);}
        });
    
        //Runs SQL query to delete website from database table
        let query = fs.readFileSync(path.join(__dirname, 'SQL', 'delete_website.sql'), 'utf-8');
        database.run(query, [web_url], (err) => {
            if(err) {
                reject(err);
            }
        });
    
        //Confirmation for testing
        resolve(`${title} has been deleted from the database.`);
        database.close();
    });
}

//Returns table of saved websites in an array of objects
function getWebsites() {
    return new Promise((resolve, reject) => {
        const database = new sqlite3.Database(path.join(__dirname, 'websites.db'), sqlite3.OPEN_READWRITE, (err) => {
            if(err) {reject(err);}
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

//Export the functions to server.js
module.exports = { insertWebsite, deleteWebsite, getWebsites };