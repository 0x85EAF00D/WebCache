const { createWebsite, deleteWebsite, getAllWebsites, getFilePath } = require('../services/databaseServices.js'); // Import SQLite functions

async function displayWebsiteData(url) {
    let site = await getFilePath(url);
    console.log(url);
    console.log(site);
    console.log(typeof(site));

}

displayWebsiteData("www.wikipedia.org/index.html");