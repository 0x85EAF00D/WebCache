const { insertWebsite, deleteWebsite, getWebsites, sortWebsites, stringifySites } = require('./database.js'); // Import SQLite functions

async function displayWebsiteData() {
    let sites = await getWebsites();
    console.log(sites);
    console.log(typeof(sites));

    let jsonData = JSON.stringify(sites);
    console.log(jsonData);
    console.log(typeof(jsonData))
}

displayWebsiteData();


