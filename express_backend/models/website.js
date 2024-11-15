const DatabaseService = require("../services/databaseService");

class Website {
  constructor(data) {
    this.id = data.id;
    this.web_url = data.web_url;
    this.title = data.title;
    this.file_path = data.file_path;
    this.created = data.created;
  }

  static async create(web_url, title, file_path) {
    try {
      const websiteData = await DatabaseService.createWebsite(
        web_url,
        title,
        file_path
      );
      return new Website(websiteData);
    } catch (error) {
      console.error("Error creating website:", error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const websites = await DatabaseService.getAllWebsites();
      return websites.map((website) => new Website(website));
    } catch (error) {
      console.error("Error getting all websites:", error);
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      web_url: this.web_url,
      title: this.title,
      file_path: this.file_path,
      created: this.created,
    };
  }
}

module.exports = Website;
