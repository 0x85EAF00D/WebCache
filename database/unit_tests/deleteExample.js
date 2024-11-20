const { insertWebsite, deleteWebsite, getWebsites, getFilePath } = require('../database.js'); // Import SQLite functions

//Test function to verify that deleteWebsite() works as intended
async function deleteFromDatabase(web_url, title) {
    //deleteWebsite will return a confirmation string that the website was deleted
    let confirmation = await deleteWebsite(web_url, title);
    console.log(confirmation);
}

//Set this url and title with information from your database table
let web_url = "www.wikipedia.org/index.html";
let title = "Wikipedia"


deleteFromDatabase(web_url, title);

//Check the database table to verify it has been deleted