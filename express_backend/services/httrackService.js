const { exec } = require("child_process");
const path = require("path");

class HttrackService {
  static async downloadWebsite(link) {
    // Ensure output directory is absolute path
    const outputDir = path.join(process.cwd(), "WebsiteTempDatabase");

    // Build httrack command with proper options
    const command = `httrack "${link}" -r1 -O "${outputDir}" -%eN0 -q`;

    try {
      const { stdout, stderr } = await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve({ stdout, stderr });
          }
        });
      });

      console.log("Httrack output:", stdout);

      if (stderr && stderr.length > 0) {
        console.warn("Httrack stderr:", stderr);
      }

      return { success: true, output: stdout };
    } catch (error) {
      console.error("Httrack error:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = HttrackService;
