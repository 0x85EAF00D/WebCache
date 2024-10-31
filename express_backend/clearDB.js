//Deletes the database data
//Run before uploading changes to GitHub

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

//Run SQL query to delete all rows from table websites
const database = new sqlite3.Database('../database/websites.db', sqlite3.OPEN_READWRITE, (err) => {
    if(err) {return console.error(err.message);}
});

database.run('DELETE FROM websites;', [], (err) => {
    if (err) {return console.error(err.message)};
})

database.close();

//Use fs module to delete every item in Websites directory
fs.rmSync('../database/Websites', {recursive: true, force: true});
fs.mkdirSync('../database/Websites');