/**
 * Optional Local Development Server
 * Run `node server.js` to test live NVIDIA NIM locally on http://localhost:3000
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { handler } = require('./netlify/functions/chat');

const PORT = 3000;
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4'
};

const server = http.createServer(async (req, res) => {
    // API endpoint for NVIDIA proxy
    if (req.url === '/api/chat' || req.url === '/.netlify/functions/chat') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const event = {
                    httpMethod: req.method,
                    body: body,
                    headers: req.headers
                };
                const result = await handler(event, {});
                res.writeHead(result.statusCode, result.headers);
                res.end(result.body);
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // Serve static files
    let reqUrl = req.url.split('?')[0];
    let filePath = path.join(__dirname, reqUrl === '/' ? 'index.html' : reqUrl);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + err.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Rahul Portfolio Local Server running at http://localhost:${PORT}`);
    console.log(`💬 Live NVIDIA AI Chatbot active at /api/chat`);
});
