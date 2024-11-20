const { insertWebsite, deleteWebsite, getWebsites, getFilePath } = require('../database.js'); // Import SQLite functions

async function displayFilePath(web_url) {
    let path = await getFilePath(web_url);
    console.log(`File path for ${web_url}: ${path}`);
}

displayFilePath('www.wikipedia.org/index.html');