//Eventually this file will talk to server.js to save websites
//For now, run this this file in the terminal to test its functionality

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const database = new sqlite3.Database('./websites.db', sqlite3.OPEN_READWRITE, (err) => {
    if(err) {return console.error(err.message);}
});

function insertWebsite(web_url, title, file_path) {
    //Stores website files in proper directory
    //Placeholder text

    //Runs SQL query to insert website into database table
    let query = fs.readFileSync('./SQL/insert_website.sql', 'utf-8');
    database.run(query, [web_url, title, file_path], (err) => {
        if(err) return console.error(err.message);
    });

    //Confirmation for testing
    console.log(`${title} has been added to the database.`);
}

function deleteWebsite(web_url, title) {
    //Removes website files from the directory
    //Placeholder text

    //Runs SQL query to delete website from database table
    let query = fs.readFileSync('./SQL/delete_website.sql', 'utf-8');
    database.run(query, [web_url], (err) => {
        if(err) return console.error(err.message);
    });

    //Confirmation for testing
    console.log(`${title} has been deleted from the database.`);
}

function queryAll() {
    let query = `SELECT * FROM websites;`;
    database.all(query, [], (err, rows) => {
        if (err) {return console.error(err);}
        console.log('Displaying table rows:')
        for (let row in rows) {
            console.log(rows[row]);
        }
    });
}

function sortWebsites() {
    let query = fs.readFileSync('./SQL/sort_websites.sql', 'utf-8');
    database.all(query, [], (err, rows) => {
        if (err) {return console.error(err);}
        console.log('Displaying table sorted by title:')
        for (let row in rows) {
            console.log(rows[row]);
        }
    });
}

//Testing the functions
insertWebsite('www.apple.com', 'Apple', './apple');
queryAll();
deleteWebsite('www.apple.com', 'Apple');
sortWebsites();

//Close the database file
database.close();
