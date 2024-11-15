// build-copy.js
const fs = require('fs-extra');
const path = require('path');

async function buildAndCopy() {
    try {
        // Define paths
        const buildDir = path.join(__dirname, 'build');
        const destDir = path.join(__dirname, '..', 'express_backend', 'build');

        // Delete existing build folder in express_backend if it exists
        if (fs.existsSync(destDir)) {
            console.log('Removing existing build folder in express_backend...');
            await fs.remove(destDir);
        }

        // Copy the build folder to express_backend
        console.log('Copying build folder to express_backend...');
        await fs.copy(buildDir, destDir);

        console.log('Build folder successfully copied to express_backend!');
    } catch (err) {
        console.error('Error during build and copy process:', err);
        process.exit(1);
    }
}

buildAndCopy();