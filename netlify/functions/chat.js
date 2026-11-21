/**
 * Netlify Serverless Function: /api/chat
 * Secure server-side proxy for NVIDIA NIM API
 * Solves browser CORS and protects API key from client exposure.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Check local .env for local development without external dependencies
if (!process.env.NVIDIA_API_KEY) {
    try {
        const envPath = path.resolve(__dirname, '../../.env');
        if (fs.existsSync(envPath)) {
            const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('NVIDIA_API_KEY=')) {
                    process.env.NVIDIA_API_KEY = trimmed.slice('NVIDIA_API_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
                    break;
                }
            }
        }
    } catch (e) {
        // Ignore if unable to read local .env
    }
}

// API key stored securely in environment variables (never committed to repo)
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';

exports.handler = async function (event, context) {
    // CORS headers for permissive browser access
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const payload = JSON.parse(event.body || '{}');
        const messages = payload.messages || [];

        if (!messages.length) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Missing messages array' })
            };
        }

        const postData = JSON.stringify({
            model: payload.model || 'minimaxai/minimax-m3.1-flash',
            messages: messages,
            max_tokens: payload.max_tokens || 1024,
            temperature: payload.temperature !== undefined ? payload.temperature : 0.7
        });

        const nvidiaResponse = await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'integrate.api.nvidia.com',
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        body: responseData
                    });
                });
            });

            req.on('error', err => reject(err));
            req.write(postData);
            req.end();
        });

        return {
            statusCode: nvidiaResponse.statusCode,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            },
            body: nvidiaResponse.body
        };
    } catch (err) {
        console.error('NVIDIA proxy error:', err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Failed to communicate with NVIDIA API', details: err.message })
        };
    }
};
