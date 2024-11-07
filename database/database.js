//Eventually this file will talk to server.js to save websites
//For now, run this this file in the terminal to test its functionality

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

function insertWebsite(web_url, title, file_path) {
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

function queryAll() {
    const database = new sqlite3.Database(path.join(__dirname, 'websites.db'), sqlite3.OPEN_READWRITE, (err) => {
        if(err) {return console.error(err.message);}
    });
    let query = `SELECT * FROM websites;`;
    database.all(query, [], (err, rows) => {
        if (err) {return console.error(err);}
        console.log('Displaying table rows:')
        for (let row of rows) {
            console.log(rows[row]);
        }
    });
    database.close();
}

function duplicates(website) {
    const database = new sqlite3.Database(path.join(__dirname, 'websites.db'), sqlite3.OPEN_READWRITE, (err) => {
        if(err) {return console.error(err.message);}
    });
    let query = `SELECT web_url FROM websites 
                    WHERE web_url = ?;`;
    database.get(query, [website], (err, row) => {
        if (err) {return console.error(err);}
        if(row) {
            console.log(row.web_url);
        } else {
            console.log("Not found");
        }
    });
    database.close();
}

function sortWebsites() {
    const database = new sqlite3.Database(path.join(__dirname, 'websites.db'), sqlite3.OPEN_READWRITE, (err) => {
        if(err) {return console.error(err.message);}
    });
    let query = fs.readFileSync(path.join(__dirname, 'SQL', 'sort_websites.sql'), 'utf-8');
    database.all(query, [], (err, rows) => {
        if (err) {return console.error(err);}
        console.log('Displaying table sorted by title:')
        for (let row of rows) {
            console.log(rows[row]);
        }
    });
    database.close();
}

//Testing the functions
//insertWebsite('www.apple.com', 'Apple', './apple');
//queryAll();
duplicates("www.apple.com");

//deleteWebsite('www.apple.com', 'Apple');
//sortWebsites();

//Export the functions to server.js
module.exports = { insertWebsite, deleteWebsite, queryAll, sortWebsites };



