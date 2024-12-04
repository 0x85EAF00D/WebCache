const DatabaseService = require("../services/databaseService.js");

class DeleteController {
    static async deletePage(req, res) {
        try {
            const { websiteId } = req.params;
            
            if (!websiteId) {
                return res.status(400).json({ 
                    error: "Website ID is required",
                    details: "No website ID was provided in the request"
                });
            }

            // Convert websiteId to number since URLs params are strings
            const id = parseInt(websiteId, 10);
            
            if (isNaN(id)) {
                return res.status(400).json({ 
                    error: "Invalid website ID",
                    details: "Website ID must be a valid number"
                });
            }

            // Attempt to delete the website
            await DatabaseService.deleteWebsite(id);
            
            // If successful, send 200 response
            return res.status(200).json({ 
                message: "Website successfully deleted",
                deletedId: id
            });

        } catch (error) {
            console.error("Error in deletePage controller:", error);
            
            // Send appropriate error response
            if (error.message.includes("No website found")) {
                return res.status(404).json({ 
                    error: "Website not found",
                    details: error.message
                });
            }
            
            return res.status(500).json({ 
                error: "Failed to delete website",
                details: error.message
            });
        }
    }
}

module.exports = DeleteController;