/**
 * Netlify Serverless Function: /api/chat
 * Secure server-side proxy for NVIDIA NIM API with automated resilient fallback
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

function queryPollinations(messages) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            messages: messages,
            model: 'openai',
            temperature: 0.7
        });
        const req = https.request({
            hostname: 'text.pollinations.ai',
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300 && data.trim()) {
                    resolve({
                        statusCode: 200,
                        body: JSON.stringify({
                            choices: [
                                {
                                    message: {
                                        role: 'assistant',
                                        content: data.trim()
                                    }
                                }
                            ]
                        })
                    });
                } else {
                    reject(new Error(`Pollinations HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', err => reject(err));
        req.setTimeout(9000, () => {
            req.destroy();
            reject(new Error('Pollinations timeout'));
        });
        req.write(postData);
        req.end();
    });
}

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

        // 1. If NVIDIA_API_KEY is available, try NVIDIA NIM first
        if (NVIDIA_API_KEY && NVIDIA_API_KEY.length > 10) {
            try {
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
                    req.setTimeout(8000, () => {
                        req.destroy();
                        reject(new Error('NVIDIA API timeout'));
                    });
                    req.write(postData);
                    req.end();
                });

                if (nvidiaResponse.statusCode === 200) {
                    return {
                        statusCode: 200,
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json'
                        },
                        body: nvidiaResponse.body
                    };
                }
                console.warn('NVIDIA NIM returned non-200:', nvidiaResponse.statusCode, '- falling back to direct AI tier');
            } catch (nvidiaErr) {
                console.warn('NVIDIA NIM request failed:', nvidiaErr.message, '- falling back to direct AI tier');
            }
        }

        // 2. Resilient AI Fallback Tier (Pollinations AI)
        try {
            const fallbackResult = await queryPollinations(messages);
            return {
                statusCode: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                },
                body: fallbackResult.body
            };
        } catch (pollErr) {
            console.error('All AI endpoints failed:', pollErr);
            return {
                statusCode: 502,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'AI generation service temporarily unavailable', details: pollErr.message })
            };
        }
    } catch (err) {
        console.error('Chat function error:', err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Internal handler failure', details: err.message })
        };
    }
};
