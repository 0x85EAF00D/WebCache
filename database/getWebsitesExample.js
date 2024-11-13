const { insertWebsite, deleteWebsite, getWebsites } = require('./database.js'); // Import SQLite functions

let websites;
async function displayWebsiteData(websites) {
    let sites = await getWebsites();
    console.log(sites);
    console.log(typeof(sites));

    let jsonData = JSON.stringify(sites);
    console.log(jsonData);
    console.log(typeof(jsonData))

    websites = await sites;
}

displayWebsiteData(websites);