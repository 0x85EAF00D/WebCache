const os = require('os');
const { execSync } = require('child_process');

function checkPackageManager() {
    const platform = os.platform();
    
    if (platform === 'darwin') {
        try {
            execSync('brew --version');
            console.log('✓ Homebrew is installed');
            return 'brew';
        } catch {
            console.error('✗ Homebrew is not installed. Please install it first.');
            process.exit(1);
        }
    } else if (platform === 'win32') {
        try {
            execSync('choco -v');
            console.log('✓ Chocolatey is installed');
            return 'choco';
        } catch {
            console.error('✗ Chocolatey is not installed. Please install it first.');
            process.exit(1);
        }
    } else {
        console.error('✗ Unsupported OS for this script.');
        process.exit(1);
    }
}

function checkHttrack(packageManager) {
    try {
        if (packageManager === 'brew') {
            execSync('brew list httrack');
            console.log('✓ httrack is installed');
        } else {
            execSync('choco list httrack');
            console.log('✓ httrack is installed');
        }
    } catch {
        const installCommand = packageManager === 'brew' ? 'brew install httrack' : 'choco install httrack';
        console.error(`✗ httrack is not installed. You can install it with: ${installCommand}`);
        process.exit(1);
    }
}

try {
    const packageManager = checkPackageManager();
    checkHttrack(packageManager);
} catch (error) {
    console.error('An error occurred while checking dependencies:', error.message);
    process.exit(1);
}