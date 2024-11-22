const Database = require("../services/databaseService.js");

class DeleteController {
    static async deletePage(req, resp) {
        try {
            // Get the ID of the website to delete
            const { id } = req.params;
            
            if(!id) {
                return resp.status(400).json({ error: "ID is required" });
            }
            // Call the delete function in DatabaseService
            await DatabaseService.deleteWebsite(id);

            resp.status(200).json({ message: "Website successfully deleted" });
        } catch (error) {
            console.error("Error deleting website:", error);
            resp.status(500).json({ error: "An error occurred while deleting the website" });
        }
    }
}

module.exports = DeleteController;