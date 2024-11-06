//Eventually this file will talk to server.js to save websites
//For now, run this this file in the terminal to test its functionality

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

function insertWebsite(web_url, title, file_path) {

    // this file isnt saved to github, this function builds the database after fresh clone
    const filePath = path.join(__dirname, 'websites.db');
    if (!fs.existsSync(filePath)) {
        // File doesn't exist, so create it with initial content
        fs.writeFileSync(filePath, 'Initial content', 'utf-8');
        console.log("File created:", filePath);
    } else {
        console.log("File already exists:", filePath);
    }


    const database = new sqlite3.Database(path.join(__dirname, 'websites.db'), sqlite3.OPEN_READWRITE, (err) => {
        if(err) {return console.error(err.message);}
    });

    //Runs SQL query to insert website into database table
    let query = fs.readFileSync(path.join(__dirname, 'SQL', 'insert_website.sql'), 'utf-8');
    database.run(query, [web_url, title, file_path], (err) => {
        if(err) return console.error(err.message);
    });

    //Confirmation for testing
    console.log(`${title} has been added to the database.`);
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
        for (let row in rows) {
            console.log(rows[row]);
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
        for (let row in rows) {
            console.log(rows[row]);
        }
    });
    database.close();
}

//Testing the functions
//insertWebsite('www.apple.com', 'Apple', './apple');
//queryAll();
// deleteWebsite('www.apple.com', 'Apple');
//sortWebsites();

//Export the functions to server.js
module.exports = { insertWebsite, deleteWebsite, queryAll, sortWebsites };



