const DatabaseService = require("../services/databaseService.js");
const fs = require("fs-extra");
const path = require("path");


class DeleteController {
    static async deletePage(req, res) {
        try {
            const { websiteId } = req.params;
            
            if (!websiteId) {
                return res.status(400).json({ 
                    error: "Website ID is required"
                });
            }

            const id = parseInt(websiteId, 10);
            
            if (isNaN(id)) {
                return res.status(400).json({ 
                    error: "Invalid website ID"
                });
            }

            // Get website info before deletion to know which files to remove
            const website = await DatabaseService.getWebsiteById(id);
            
            if (!website) {
                return res.status(404).json({ 
                    error: "Website not found"
                });
            }

            // Start both operations concurrently
            await Promise.all([
                // Delete from database
                DatabaseService.deleteWebsite(id),
                // Delete associated files
                DeleteController.cleanupWebsiteFiles(website.file_path)
            ]);
            
            return res.status(200).json({ 
                message: "Website successfully deleted",
                deletedId: id
            });

        } catch (error) {
            console.error("Error in deletePage controller:", error);
            return res.status(500).json({ 
                error: "Failed to delete website",
                details: error.message
            });
        }
    }

    static async cleanupWebsiteFiles(filePath) {
        try {
            if (!filePath) return;

            const normalizedPath = path.normalize(filePath);
            
            // Check if file exists before attempting deletion
            if (await fs.pathExists(normalizedPath)) {
                const stats = await fs.stat(normalizedPath);
                
                if (stats.isDirectory()) {
                    // If it's a directory, remove it and all contents
                    await fs.remove(normalizedPath);
                } else {
                    // If it's a file, remove the file and its parent directory if empty
                    await fs.remove(normalizedPath);
                    
                    // Try to remove parent directory if empty
                    const parentDir = path.dirname(normalizedPath);
                    const parentContents = await fs.readdir(parentDir);
                    if (parentContents.length === 0) {
                        await fs.remove(parentDir);
                    }
                }
            }
        } catch (error) {
            console.error("Error cleaning up website files:", error);
            // Don't throw - we want the database deletion to succeed even if file cleanup fails
        }
    }
}

module.exports = DeleteController;