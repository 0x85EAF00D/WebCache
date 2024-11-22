const { createWebsite, deleteWebsite, getAllWebsites, getFilePath } = require('../express_backend/services/databaseServices.js'); // Import SQLite functions

//Test function to verify that insertWebsite() and updateWebsite() works as intended
async function addToDatabase(web_url, title, file_path) {
    createWebsite(web_url, title, file_path);
}

//Set this url and title with test information
let title = "Wikipedia";
let web_url = "www.wikipedia.org/index.html";
let file_path = "/Users/Chris/Development/GitHub/WebCache/express_backend/DownloadedHTML/www.wikipedia.org/index.html";

addToDatabase(web_url, title, file_path);

//Check the database table to verify it has been added

//Run this program again to trigger updateWebsite()
//Check the "created" column in the table to verify that the row has been updated 