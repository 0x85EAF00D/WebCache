// middleware/requestLogger.js
require('colors');

const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const clientIP = req.ip || req.socket.remoteAddress;
    
    // Color-code different HTTP methods
    const colorMethod = {
        'GET': method.green,
        'POST': method.yellow,
        'PUT': method.blue,
        'DELETE': method.red
    }[method] || method.white;

    // Log the basic request info
    console.log(
        `[${timestamp.gray}] ${colorMethod} ${url.cyan} from ${clientIP.gray}`
    );

    // Log query parameters if present
    if (Object.keys(req.query).length > 0) {
        console.log('Query Params:'.gray, JSON.stringify(req.query, null, 2).cyan);
    }

    // Log request body if present (for POST/PUT requests)
    if (req.body && Object.keys(req.body).length > 0) {
        // Filter out sensitive information
        const sanitizedBody = { ...req.body };
        ['password', 'token', 'secret'].forEach(key => {
            if (sanitizedBody[key]) sanitizedBody[key] = '[REDACTED]';
        });
        console.log('Request Body:'.gray, JSON.stringify(sanitizedBody, null, 2).cyan);
    }

    // Add a divider for better readability
    console.log('-'.repeat(80).gray);

    next();
};

module.exports = requestLogger;