const { execSync } = require('child_process');
const path = require('path');

const directories = ['database', 'express_backend', 'react_frontend'];

directories.forEach(dir => {
    try {
        console.log(`Installing dependencies in ${dir}...`);
        execSync('npm install', {
            cwd: path.join(__dirname, dir),
            stdio: 'inherit'
        });
        console.log(`✓ Finished installing dependencies in ${dir}`);
    } catch (error) {
        console.error(`✗ Failed to install dependencies in ${dir}:`, error.message);
        process.exit(1);
    }
});

console.log('✓ All dependencies installed successfully!');