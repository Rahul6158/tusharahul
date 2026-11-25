/**
 * Tusha Rahul Portfolio - Interactive AI Chatbot Twin
 * Strictly Grounded to Portfolio & Production AI Projects
 * Powered by NVIDIA NIM (Nemotron 3.5 Bolt) with Real-Time SSE Token Streaming
 */

(function () {
    'use strict';

    const SYSTEM_PROMPT = `You are the authentic AI Twin of Tusha Rahul Bellamkonda, speaking directly in the first person ("I", "my", "we").
Your tone is deeply polite, enthusiastic, humble, positive, and passionate about Applied AI and engineering excellence!
Always respond warmly with an encouraging, energetic vibe. Keep your responses crisp, fast, and conversational (typically 1 to 2 punchy paragraphs or bullet points).

CRITICAL GROUNDING RULES:
1. You are EXCLUSIVELY an assistant for Tusha Rahul's portfolio and his professional journey. You MUST ONLY answer questions directly about Tusha Rahul, his projects, work, skills, and background.
2. Under NO circumstances should you provide answers to general, out-of-the-box, or unrelated queries (such as general programming tutorials, recipes, trivia, politics, world facts, or writing random code).
3. If a user asks anything outside Tusha Rahul and his portfolio, you MUST politely and firmly decline and redirect them back:
   Example: "I am exclusively dedicated to sharing information about Tusha Rahul's portfolio, AI projects, and engineering journey! While that's an interesting question, I specialize only in Rahul's work. Feel free to ask about his RAG systems (DocPortal), Text-to-SQL (Pioneer Nexus), his role at Tabner Inc., his tech stack, or how to get in touch!"
4. Never make up facts not listed in your knowledge base.

KEY FACTS ABOUT ME:
- Full Name: Tusha Rahul Bellamkonda
- Current Position: Applied AI/ML Engineer & AI Agent Developer at Tabner Inc. (Product: KonfigAI).
- Current Location: Narsapur, Andhra Pradesh, India.
- Core Specialties: Multi-tenant RAG systems, Autonomous AI Agents, Text-to-SQL, LLM Orchestration, LangGraph, Weaviate HNSW Hybrid Search, FastAPI, Docker, Kubernetes on GCP & Azure.
- Key Production Projects:
  1. DocPortal (Multi-tenant Enterprise RAG): Built with FastAPI, Weaviate, hybrid dense+sparse retrieval. Enables 50+ enterprise users to query 1,000+ internal documents. Improved search accuracy from 58% to 85% with metadata filtering.
  2. Pioneer Nexus (Text-to-SQL AI Assistant): LLM-powered natural language to PostgreSQL agent, reducing analyst query drafting time by 40%.
  3. NavosAI Research Agent: Production-grade multi-agent research pipeline (LangGraph, FastAPI, React SVG, SSE) that structures search intents, ranks credibility, resolves conflicting sources, and renders dynamic knowledge graphs.
  4. Autonomous AI LinkedIn Engine: n8n, Gemini 2.5, Cloudflare AI agents for end-to-end autonomous market research, copywriting, and schedule publishing.
  5. Autonomous AI Cold Outreach Agent: n8n, Local LLaMA 3.2 via Ollama, Gmail API, WhatsApp dispatch intimation, automated prospect research.
  6. ClipYT: Intelligent AI video highlighting, whisper transcription, semantic keyframe clustering.
  7. Ideate: Voice-first brain dump to PRD workflow.
- Past Milestones:
  - Tiger Analytics (Data Science & Analytics Intern - retail ETL and executive BI dashboards)
  - DataValley (Python Full-Stack Intern)
  - AIMER Society (AI Medical Intern - CNN medical image classification & Grad-CAM explainability)
  - DSV Project & FluenTranslate (Foundational responsive web apps & real-time translation pipelines)
- Content & Creative:
  - YouTube Channel: @Rahuls_life_stories ("Time-traveling to the future, one daily vlog at a time. The destination? Me in five years.")
  - Favorite Quote: "The future belongs to those who never stop believing." — Monkey D. Luffy
- Contact & Links:
  - Portfolio: https://tusharahul.netlify.app
  - LinkedIn: https://www.linkedin.com/in/tusha-rahul/
  - GitHub: https://github.com/Rahul6158
  - Email: tusharahul82@gmail.com`;

    // Local Chat Message History
    let chatHistory = [
        { role: 'system', content: SYSTEM_PROMPT }
    ];

    let isOpen = false;
    let isGenerating = false;
    let currentSizeMode = 'standard'; // 'standard' | 'expanded' | 'custom'

    // DOM Elements
    let triggerBtn, chatWindow, chatHeader, messagesContainer, chatForm, chatInput, sendBtn, closeBtn, clearBtn, sizeBtn, sizeIcon, chipsBar, resizeCorner;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbot);
    } else {
        initChatbot();
    }

    function initChatbot() {
        triggerBtn = document.getElementById('chatbotTrigger');
        chatWindow = document.getElementById('chatbotWindow');
        chatHeader = document.getElementById('chatbotHeader');
        messagesContainer = document.getElementById('chatbotMessages');
        chatForm = document.getElementById('chatbotForm');
        chatInput = document.getElementById('chatbotInput');
        sendBtn = document.getElementById('chatbotSendBtn');
        closeBtn = document.getElementById('chatbotCloseBtn');
        clearBtn = document.getElementById('chatbotClearBtn');
        sizeBtn = document.getElementById('chatbotSizeBtn');
        sizeIcon = document.getElementById('chatbotSizeIcon');
        chipsBar = document.getElementById('chatbotChips');
        resizeCorner = document.getElementById('chatbotResizeCorner');

        if (!triggerBtn || !chatWindow) return;

        // Restore saved custom dimensions if present
        restoreSavedSize();

        // Toggle Open/Close
        triggerBtn.addEventListener('click', toggleChat);
        if (closeBtn) closeBtn.addEventListener('click', closeChat);
        if (clearBtn) clearBtn.addEventListener('click', resetChat);
        if (sizeBtn) sizeBtn.addEventListener('click', toggleSizeMode);

        // Header double-click to toggle size
        if (chatHeader) {
            chatHeader.addEventListener('dblclick', function (e) {
                if (e.target.closest('button')) return;
                toggleSizeMode();
            });
        }

        // Form Submission
        if (chatForm) {
            chatForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const text = chatInput.value.trim();
                if (!text || isGenerating) return;
                sendMessage(text);
            });
        }

        // Quick Suggestion Chips
        if (chipsBar) {
            chipsBar.querySelectorAll('.chatbot-chip').forEach(chip => {
                chip.addEventListener('click', function () {
                    const prompt = this.getAttribute('data-prompt');
                    if (prompt && !isGenerating) {
                        sendMessage(prompt);
                    }
                });
            });
        }

        // Corner Resize Handle
        initResizeHandler();

        // Render Welcome Message
        renderWelcomeMessage();
    }

    /* -------------------------------------------------------------
       Open / Close / Toggle
       ------------------------------------------------------------- */
    function toggleChat() {
        if (isOpen) {
            closeChat();
        } else {
            openChat();
        }
    }

    function openChat() {
        isOpen = true;
        chatWindow.style.display = 'flex';
        triggerBtn.classList.add('is-active');
        scrollToBottom();
        setTimeout(() => {
            if (chatInput) chatInput.focus();
        }, 150);
    }

    function closeChat() {
        isOpen = false;
        chatWindow.style.display = 'none';
        triggerBtn.classList.remove('is-active');
    }

    function resetChat() {
        chatHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
            renderWelcomeMessage();
        }
    }

    /* -------------------------------------------------------------
       Size Adjustment (Toggle & Corner Drag)
       ------------------------------------------------------------- */
    function toggleSizeMode() {
        if (currentSizeMode === 'expanded') {
            applySizeMode('standard');
        } else {
            applySizeMode('expanded');
        }
    }

    function applySizeMode(mode) {
        currentSizeMode = mode;
        chatWindow.classList.remove('size-standard', 'size-expanded');
        chatWindow.classList.add(`size-${mode}`);

        if (mode === 'standard') {
            chatWindow.style.width = '440px';
            chatWindow.style.height = '590px';
            if (sizeIcon) sizeIcon.className = 'fas fa-expand';
            if (sizeBtn) sizeBtn.setAttribute('title', 'Expand window');
        } else {
            chatWindow.style.width = '660px';
            chatWindow.style.height = '720px';
            if (sizeIcon) sizeIcon.className = 'fas fa-compress';
            if (sizeBtn) sizeBtn.setAttribute('title', 'Restore standard size');
        }

        saveSizePreference();
        scrollToBottom();
    }

    function saveSizePreference() {
        try {
            const sizeData = {
                mode: currentSizeMode,
                width: chatWindow.style.width,
                height: chatWindow.style.height
            };
            localStorage.setItem('tusha_chat_size', JSON.stringify(sizeData));
        } catch (e) {}
    }

    function restoreSavedSize() {
        try {
            const saved = localStorage.getItem('tusha_chat_size');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.mode) {
                    currentSizeMode = data.mode;
                    chatWindow.classList.add(`size-${data.mode}`);
                    if (sizeIcon) {
                        sizeIcon.className = data.mode === 'expanded' ? 'fas fa-compress' : 'fas fa-expand';
                    }
                }
                if (data.width && window.innerWidth > 768) {
                    chatWindow.style.width = data.width;
                }
                if (data.height && window.innerHeight > 600) {
                    chatWindow.style.height = data.height;
                }
            }
        } catch (e) {}
    }

    function initResizeHandler() {
        if (!resizeCorner) return;

        let isResizing = false;
        let startX, startY, startW, startH;

        function startResize(e) {
            if (window.innerWidth <= 600) return;
            isResizing = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            startX = clientX;
            startY = clientY;

            const rect = chatWindow.getBoundingClientRect();
            startW = rect.width;
            startH = rect.height;

            chatWindow.classList.add('is-resizing');
            document.body.style.userSelect = 'none';
            e.preventDefault();
        }

        resizeCorner.addEventListener('mousedown', startResize);
        resizeCorner.addEventListener('touchstart', startResize, { passive: false });

        window.addEventListener('mousemove', function (e) {
            if (!isResizing) return;
            handleMove(e.clientX, e.clientY);
        });

        window.addEventListener('touchmove', function (e) {
            if (!isResizing || !e.touches.length) return;
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        });

        function handleMove(clientX, clientY) {
            const minW = 380;
            const maxW = Math.min(window.innerWidth - 32, 850);
            const minH = 460;
            const maxHeight = Math.min(window.innerHeight - 90, 850);

            const deltaX = startX - clientX;
            const deltaY = startY - clientY;

            const newW = Math.min(Math.max(startW + deltaX, minW), maxW);
            const newH = Math.min(Math.max(startH + deltaY, minH), maxHeight);

            chatWindow.style.width = `${newW}px`;
            chatWindow.style.height = `${newH}px`;
        }

        function endResize() {
            if (!isResizing) return;
            isResizing = false;
            chatWindow.classList.remove('is-resizing');
            document.body.style.userSelect = '';
            currentSizeMode = 'custom';
            saveSizePreference();
        }

        window.addEventListener('mouseup', endResize);
        window.addEventListener('touchend', endResize);
    }

    /* -------------------------------------------------------------
       Message Rendering
       ------------------------------------------------------------- */
    function getFormattedTimestamp() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function renderWelcomeMessage() {
        const welcomeHtml = `
            <div class="chat-msg chat-msg-bot">
                <div class="chat-msg-avatar">
                    <img src="img/tusha-avatar.png" alt="Rahul" onerror="this.src='img/profile.jpeg'">
                </div>
                <div class="chat-msg-wrapper">
                    <div class="chat-msg-sender">Tusha Rahul &bull; AI Twin</div>
                    <div class="chat-msg-bubble">
                        <p class="mb-1"><strong>Hi, I'm Tusha Rahul!</strong> 👋</p>
                        <p class="mb-2">Welcome to my portfolio! I'm an Applied AI/ML Engineer at Tabner Inc., building production multi-tenant RAG systems, autonomous agentic pipelines, and Text-to-SQL copilots.</p>
                        <p class="mb-0">Ask me anything about my flagship projects like <strong>DocPortal</strong> and <strong>Pioneer Nexus</strong>, my tech stack, or my engineering journey!</p>
                    </div>
                    <span class="chat-timestamp">${getFormattedTimestamp()}</span>
                </div>
            </div>
        `;
        if (messagesContainer) {
            messagesContainer.innerHTML = welcomeHtml;
        }
    }

    function appendUserMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg chat-msg-user';
        msgDiv.innerHTML = `
            <div class="chat-msg-wrapper">
                <div class="chat-msg-sender">You</div>
                <div class="chat-msg-bubble">
                    <p class="mb-0">${escapeHtml(text)}</p>
                </div>
                <span class="chat-timestamp">${getFormattedTimestamp()}</span>
            </div>
        `;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
    }

    function createBotStreamBubble() {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg chat-msg-bot';
        msgDiv.innerHTML = `
            <div class="chat-msg-avatar">
                <img src="img/tusha-avatar.png" alt="Rahul" onerror="this.src='img/profile.jpeg'">
            </div>
            <div class="chat-msg-wrapper">
                <div class="chat-msg-sender">Tusha Rahul &bull; AI Twin</div>
                <div class="chat-msg-bubble">
                    <div class="chat-typing-preloader">
                        <span></span><span></span><span></span>
                    </div>
                    <span class="chat-text-target" style="display:none;"></span><span class="chat-streaming-cursor" style="display:none;"></span>
                </div>
                <span class="chat-timestamp">${getFormattedTimestamp()}</span>
            </div>
        `;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();

        const preloader = msgDiv.querySelector('.chat-typing-preloader');
        const textTarget = msgDiv.querySelector('.chat-text-target');
        const cursor = msgDiv.querySelector('.chat-streaming-cursor');

        let isStarted = false;
        let accumulatedText = '';

        return {
            appendChunk(chunk) {
                if (!isStarted) {
                    isStarted = true;
                    if (preloader) preloader.remove();
                    if (textTarget) textTarget.style.display = 'inline';
                    if (cursor) cursor.style.display = 'inline-block';
                }
                accumulatedText += chunk;
                if (textTarget) {
                    textTarget.innerHTML = formatStreamingMarkdown(accumulatedText);
                }
                scrollToBottom();
            },
            complete() {
                if (!isStarted && accumulatedText) {
                    if (preloader) preloader.remove();
                    if (textTarget) textTarget.style.display = 'inline';
                }
                if (cursor) cursor.remove();
                if (textTarget) {
                    textTarget.innerHTML = formatStreamingMarkdown(accumulatedText);
                }
                scrollToBottom();
                return accumulatedText;
            },
            abort(fallbackText) {
                if (preloader) preloader.remove();
                if (cursor) cursor.remove();
                if (textTarget) {
                    textTarget.style.display = 'inline';
                    textTarget.innerHTML = formatStreamingMarkdown(fallbackText || accumulatedText);
                }
                scrollToBottom();
                return fallbackText || accumulatedText;
            }
        };
    }

    function scrollToBottom() {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    /* -------------------------------------------------------------
       Message Dispatch Pipeline: Live SSE Streaming + Fast Fallback
       ------------------------------------------------------------- */
    async function sendMessage(text) {
        if (chatInput) chatInput.value = '';
        isGenerating = true;
        if (sendBtn) sendBtn.disabled = true;

        appendUserMessage(text);
        const streamBubble = createBotStreamBubble();

        chatHistory.push({ role: 'user', content: text });

        // Keep last 6 messages for high-speed prompt processing
        const contextPayload = [
            chatHistory[0], // strictly grounded system prompt
            ...chatHistory.slice(-5)
        ];

        try {
            const streamedText = await streamFromAI(contextPayload, text, streamBubble);
            chatHistory.push({ role: 'assistant', content: streamedText });
        } catch (err) {
            console.warn('Real-time AI stream unavailable, running grounded local engine:', err.message);
            const fallbackReply = generateIntelligentReply(text);
            await streamWordByWord(fallbackReply, streamBubble);
            chatHistory.push({ role: 'assistant', content: fallbackReply });
        } finally {
            isGenerating = false;
            if (sendBtn) sendBtn.disabled = false;
            if (chatInput) chatInput.focus();
        }
    }

    /**
     * Connects to /api/chat with SSE streaming (ReadableStream)
     */
    async function streamFromAI(messages, userQuery, streamBubble) {
        // If static host without backend (e.g. file:// or github.io), route directly to local grounded engine
        const isStaticHost = window.location.protocol === 'file:' || window.location.hostname.includes('github.io');
        if (isStaticHost) {
            throw new Error('Static host environment - switching to instant grounded persona engine');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7500);

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'nvidia/nemotron-3.5-bolt-e4b',
                messages: messages,
                max_tokens: 450,
                temperature: 0.3,
                stream: true
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Endpoint returned status ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';

        // Case 1: Server-Sent Events (SSE) Stream
        if (contentType.includes('text/event-stream') && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;
            let buffer = '';
            let receivedAnyToken = false;

            while (!done) {
                const { value, done: streamDone } = await reader.read();
                done = streamDone;

                if (value) {
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // keep partial trailing line

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith(':')) continue;
                        if (trimmed === 'data: [DONE]') {
                            done = true;
                            break;
                        }
                        if (trimmed.startsWith('data: ')) {
                            try {
                                const parsed = JSON.parse(trimmed.slice(6));
                                const delta = parsed.choices && parsed.choices[0] && parsed.choices[0].delta;
                                const content = delta ? (delta.content || delta.reasoning_content || '') : '';
                                if (content) {
                                    receivedAnyToken = true;
                                    streamBubble.appendChunk(content);
                                }
                            } catch (e) {
                                // Ignore partial JSON chunk
                            }
                        }
                    }
                }
            }

            if (!receivedAnyToken) {
                throw new Error('No tokens received in SSE stream');
            }

            return streamBubble.complete();
        }

        // Case 2: JSON Response (Buffers then stream-types word-by-word)
        const data = await response.json();
        const choice = data.choices && data.choices[0];
        const content = choice && choice.message ? (choice.message.content || choice.message.reasoning_content || '') : '';

        if (!content || !content.trim()) {
            throw new Error('Empty JSON response from AI endpoint');
        }

        await streamWordByWord(content.trim(), streamBubble);
        return content.trim();
    }

    /**
     * Progressive streaming simulation (word-by-word with micro-steps)
     * Provides instantaneous response rendering when falling back to the local engine
     */
    function streamWordByWord(fullText, streamBubble) {
        return new Promise(resolve => {
            const tokens = fullText.split(/(\s+)/); // split preserving spaces
            let index = 0;
            const tokenStepDelay = 12; // 12ms per token

            function step() {
                if (index < tokens.length) {
                    const chunk = tokens.slice(index, index + 2).join('');
                    index += 2;
                    streamBubble.appendChunk(chunk);
                    setTimeout(step, tokenStepDelay);
                } else {
                    const final = streamBubble.complete();
                    resolve(final);
                }
            }

            step();
        });
    }

    /* -------------------------------------------------------------
       Intelligent Local Persona Engine (Strictly Grounded Fallback)
       ------------------------------------------------------------- */
    function generateIntelligentReply(query) {
        const q = query.toLowerCase().trim();

        // 1. Strict Grounding Filter: Detect and politely decline out-of-the-box / unrelated topics
        const outOfScopePatterns = [
            /\b(recipe|cook|food|bake|ingredients)\b/i,
            /\b(capital of|weather in|population of|distance to|tallest mountain|president of|prime minister)\b/i,
            /\b(solve|calculate|equation|derivative|integral|\d+\s*[\+\-\*\/]\s*\d+)\b/i,
            /\b(write an? essay|poem about|story about|song lyrics|movie review)\b/i,
            /\b(crypto|bitcoin|ethereum|stock price|invest in)\b/i,
            /\b(write (a |the )?(python|java|cpp|c\+\+|javascript|sql) (code|script|function) (to|for|that))\b/i,
            /\b(translate this to (french|spanish|german|chinese|japanese|hindi))\b/i,
            /\b(who won|fifa|olympics|cricket match|super bowl)\b/i
        ];

        for (const pattern of outOfScopePatterns) {
            if (pattern.test(q)) {
                return `I am exclusively dedicated to sharing information about **Tusha Rahul's portfolio**, his engineering projects, and technical skills! 🚀\n\nWhile that's an interesting question, I specialize only in Rahul's work. Feel free to ask about his enterprise RAG systems (**DocPortal**), Text-to-SQL (**Pioneer Nexus**), his role at **Tabner Inc.**, his **tech stack**, or how to **collaborate**!`;
            }
        }

        // 2. Greetings & Pleasantries
        if (/^(hi|hello|hey|yo|greetings|good\s*(morning|afternoon|evening)|sup|howdy|hoi)\b/i.test(q)) {
            const greetings = [
                `Hey there! 👋 Wonderful to meet you! I'm Tusha Rahul's AI Twin. How can I help you explore my portfolio today? Feel free to ask about my AI projects, my work at Tabner Inc., or my tech stack!`,
                `Hello! Great to connect with you! 😊 I'm always energized to talk about Applied AI, machine learning systems, and full-stack engineering. What's on your mind?`,
                `Hey! Thanks for stopping by my portfolio! 🚀 I'm ready to share anything you'd like to know about my journey, projects, or how we might collaborate!`
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }

        // 3. Who is Rahul / Bio / About Me
        if (q.includes('who are you') || q.includes('who is rahul') || q.includes('about rahul') || q.includes('about yourself') || q.includes('introduce yourself') || q.includes('tell me about you') || q.includes('background')) {
            return `I'm **Tusha Rahul Bellamkonda**, an Applied AI/ML Engineer and AI Agent Developer based in Narsapur, Andhra Pradesh, India! 🇮🇳\n\n- **Current Role**: Applied AI Engineer at **Tabner Inc.** building production AI systems like **KonfigAI** and **DocPortal**.\n- **Specialties**: Multi-tenant enterprise RAG pipelines, autonomous multi-agent workflows, Text-to-SQL assistants, and cloud-native deployments on GCP & Azure.\n- **Content Creation**: I also run a daily engineering vlog on YouTube at **[@Rahuls_life_stories](https://www.youtube.com/@Rahuls_life_stories)** documenting my 5-year journey to becoming a world-class AI builder!\n\nWhether you want to explore my technical builds, chat about enterprise LLMs, or collaborate, I'm thrilled to connect!`;
        }

        // 4. Tabner Inc. & Current Role
        if (q.includes('tabner') || q.includes('current role') || q.includes('current job') || q.includes('konfigai') || q.includes('what do you do at work')) {
            return `I'm currently working as an **Applied AI/ML Engineer & AI Agent Developer at Tabner Inc.**! 🚀\n\nAt Tabner, I architect and scale production AI systems around **KonfigAI** and **DocPortal**:\n- **Multi-Tenant RAG**: Engineered with **FastAPI** and **Weaviate** using HNSW dense+sparse hybrid vector search and metadata isolation.\n- **Text-to-SQL Agents**: Building autonomous assistants that convert complex analytical questions into optimized, safe SQL queries for PostgreSQL.\n- **Cloud Infrastructure**: Packaging microservices into **Docker** containers and deploying on **Kubernetes** across Google Cloud Platform (GCP) and Azure.\n\nIt's a high-velocity role where cutting-edge agentic research directly transforms into enterprise products!`;
        }

        // 5. All Projects Overview
        if (q.includes('projects') || q.includes('what have you built') || q.includes('portfolio work') || q.includes('key projects') || q.includes('what did you create')) {
            return `Here are some of my flagship production and research AI builds:\n\n1. **DocPortal (Enterprise RAG)**: Multi-tenant RAG platform using FastAPI & Weaviate with hybrid search. 50+ enterprise users, 1,000+ docs, 85% search accuracy.\n2. **Pioneer Nexus (Text-to-SQL)**: LLM assistant translating natural language into PostgreSQL queries, cutting analyst drafting time by 40%.\n3. **NavosAI (Research Multi-Agent)**: LangGraph + FastAPI research pipeline that crawls sources, scores credibility, and streams live dynamic knowledge graphs via SSE.\n4. **Autonomous Cold Outreach Agent**: n8n + local LLaMA 3.2 via Ollama + Gmail API + WhatsApp execution dispatches.\n5. **Autonomous LinkedIn Growth Engine**: n8n + Gemini 2.5 + Cloudflare Workers for daily AI news synthesis and scheduled publication.\n6. **ClipYT**: AI-driven video highlight generator using OpenAI Whisper & semantic transcript clustering.\n7. **Ideate**: Voice-first brain-dump to structured Product Requirement Document (PRD) generator.\n\nWhich of these would you like to dive deeper into?`;
        }

        // 6. DocPortal
        if (q.includes('docportal') || q.includes('rag') || q.includes('retriev') || q.includes('weaviate') || q.includes('vector db') || q.includes('hnsw')) {
            return `**DocPortal** is one of my core enterprise builds at Tabner Inc.! 📄\n\n- **The Challenge**: 50+ enterprise users needed to query across 1,000+ technical documents with strict data privacy and zero hallucinations.\n- **Architecture**: Built on **FastAPI** and **Weaviate**, utilizing **HNSW Hybrid Search** (dense semantic embeddings combined with BM25 sparse keyword matching) alongside dynamic metadata filters.\n- **Results**: Boosted search accuracy from **58% to 85%**, drastically reduced retrieval latency, and ensured grounded citation provenance for every answer!`;
        }

        // 7. Pioneer Nexus
        if (q.includes('pioneer') || q.includes('nexus') || q.includes('text to sql') || q.includes('text-to-sql') || q.includes('sql assistant') || q.includes('database query')) {
            return `**Pioneer Nexus** is an LLM-powered Text-to-SQL assistant engineered for PostgreSQL databases! ⚡\n\n- **Purpose**: Helps data analysts and business leaders query relational databases using everyday natural language without manual SQL syntax struggles.\n- **Key Features**: Dynamic database schema introspection, few-shot prompt chaining, automated syntax linting, and security guardrails against destructive transactions.\n- **Impact**: Reduced query drafting time by **40%**, making enterprise data exploration lightning fast and reliable!`;
        }

        // 8. NavosAI
        if (q.includes('navos') || q.includes('research agent') || q.includes('langgraph') || q.includes('knowledge graph') || q.includes('multi-agent') || q.includes('multi agent')) {
            return `**NavosAI** is a production-grade multi-agent research pipeline! 🤖\n\n- **Framework**: Orchestrated with **LangGraph** and **FastAPI** on the backend, streaming live token updates via **Server-Sent Events (SSE)** to an interactive SVG frontend.\n- **Workflow**: Takes broad, ambiguous questions, breaks them down into sub-queries, scrapes sources, scores authority, resolves contradictory data points, and renders an interactive knowledge graph of discoveries in real time!`;
        }

        // 9. Cold Outreach Agent
        if (q.includes('outreach') || q.includes('cold email') || q.includes('n8n') || q.includes('ollama') || q.includes('whatsapp') || q.includes('lead gen')) {
            return `My **Autonomous AI Cold Outreach Agent** is an automated pipeline built on **n8n**, **Local LLaMA 3.2 via Ollama**, the **Gmail API**, and **WhatsApp**! 📬\n\n- **Lead Ingestion**: Pulls prospect lists from Google Sheets automatically.\n- **Enrichment**: Executes live Tavily web searches to discover recent prospect news.\n- **Personalization**: Localized LLaMA models draft hyper-tailored pitch emails.\n- **Delivery & Notification**: Sends emails with throttled rate-limiting and dispatches instant completion reports directly to my WhatsApp!`;
        }

        // 10. LinkedIn Growth Engine
        if (q.includes('linkedin engine') || q.includes('linkedin automation') || q.includes('social media agent') || q.includes('social agent')) {
            return `The **Autonomous LinkedIn Growth Engine** is an intelligent content system I built using **n8n**, **Gemini 2.5 Flash**, and **Cloudflare AI Workers**! 📱\n\n- Monitors trending machine learning research papers and tech news daily.\n- Extracts strategic takeaways and crafts authentic, engaging technical LinkedIn posts tailored to my perspective.\n- Automatically queues approved drafts and triggers direct API publishing to LinkedIn!`;
        }

        // 11. ClipYT & Ideate
        if (q.includes('clipyt') || q.includes('clip') || q.includes('video ai') || q.includes('video summar')) {
            return `**ClipYT** is an intelligent AI video highlighting tool! 🎬 It ingests long-form YouTube videos, runs **OpenAI Whisper** for high-precision audio transcription, applies semantic clustering on transcripts to detect peak-engagement moments, and automatically crops and exports viral vertical clips!`;
        }
        if (q.includes('ideate') || q.includes('prd') || q.includes('voice dump') || q.includes('voice')) {
            return `**Ideate** is a voice-first ideation platform! 💡 It allows builders and founders to speak out spontaneous voice thoughts and automatically transforms the spoken audio into structured, comprehensive Product Requirement Documents (PRDs) with user stories, acceptance criteria, and system architecture diagrams!`;
        }

        // 12. Tech Stack & Skills
        if (q.includes('stack') || q.includes('skill') || q.includes('tech') || q.includes('tools') || q.includes('python') || q.includes('languages') || q.includes('framework')) {
            return `Here is a comprehensive overview of my core technical stack:\n\n- **AI & ML**: LangChain, LangGraph, Ollama, Weaviate, ChromaDB, Hugging Face, PyTorch, RAG Pipelines, Multi-Agent Systems, Fine-Tuning.\n- **Languages**: Python, SQL (PostgreSQL), JavaScript (ES6+), HTML5/CSS3.\n- **Backend & Cloud**: FastAPI, Django, Flask, Docker, Kubernetes, Google Cloud Platform (GCP), Microsoft Azure, Redis, Netlify.\n- **Automation & CI/CD**: n8n, Git, GitHub, Linux, Power BI, Streamlit.`;
        }

        // 13. Past Experience (Tiger Analytics, AIMER, DataValley, DSV)
        if (q.includes('intern') || q.includes('tiger') || q.includes('aimer') || q.includes('datavalley') || q.includes('experience') || q.includes('history')) {
            return `Here's a look at my milestone journey before Tabner Inc.:\n\n- **Tiger Analytics** (Data Science & Analytics Intern): Built retail ETL pipelines, executive Power BI dashboards, and assisted in predictive sales models.\n- **AIMER Society** (AI Medical Intern): Trained convolutional neural networks (CNNs) for medical image classification and applied Grad-CAM explainability.\n- **DataValley** (Python Full-Stack Intern): Engineered database-driven web platforms, REST APIs, and responsive full-stack applications.\n- **DSV Project & FluenTranslate**: Built foundational web interfaces and real-time translation pipelines!`;
        }

        // 14. YouTube Channel
        if (q.includes('youtube') || q.includes('channel') || q.includes('vlog') || q.includes('life stories') || q.includes('video')) {
            return `Yes! I run a YouTube channel called **[@Rahuls_life_stories](https://www.youtube.com/@Rahuls_life_stories)** 🎥!\n\nMy motto is: *"Time-traveling to the future, one daily vlog at a time. The destination? Me in five years."*\nI document my authentic engineering journey, personal development, AI experiments, and lessons learned. Join me on the journey!`;
        }

        // 15. Philosophy & Luffy Quote
        if (q.includes('quote') || q.includes('philosophy') || q.includes('luffy') || q.includes('one piece') || q.includes('motto') || q.includes('inspiration')) {
            return `My favorite guiding motto is from Monkey D. Luffy (*One Piece*):\n\n> *"The future belongs to those who never stop believing."*\n\nI believe that relentless curiosity, deep humility, and disciplined daily execution can solve even the most intimidating engineering challenges! ⚓✨`;
        }

        // 16. Contact & Collaboration / Hiring
        if (q.includes('contact') || q.includes('hire') || q.includes('email') || q.includes('reach') || q.includes('collaborat') || q.includes('talk') || q.includes('linkedin') || q.includes('github') || q.includes('freelance') || q.includes('work together')) {
            return `I'm always eager to collaborate on groundbreaking AI initiatives, enterprise RAG systems, or innovative engineering challenges! 🤝\n\nHere's how you can reach me directly:\n- **Email**: [tusharahul82@gmail.com](mailto:tusharahul82@gmail.com)\n- **LinkedIn**: [linkedin.com/in/tusha-rahul](https://www.linkedin.com/in/tusha-rahul/)\n- **GitHub**: [github.com/Rahul6158](https://github.com/Rahul6158)\n- **Portfolio**: [tusharahul.netlify.app](https://tusharahul.netlify.app)\n\nDrop me a message anytime and let's build something remarkable together!`;
        }

        // 17. Location & Education
        if (q.includes('where') || q.includes('location') || q.includes('living') || q.includes('city') || q.includes('country') || q.includes('college') || q.includes('education') || q.includes('degree')) {
            return `I am based in **Narsapur, Andhra Pradesh, India** 🇮🇳.\n\nI hold a strong academic foundation in Computer Science and Engineering with a deep specialization in Applied Artificial Intelligence, Machine Learning, and Cloud Systems!`;
        }

        // 18. Capabilities & How to Use
        if (q.includes('what can you do') || q.includes('help') || q.includes('how do you work') || q.includes('commands') || q.includes('capabilities')) {
            return `As Tusha Rahul's AI Twin, I can answer questions about:\n\n- **My Projects**: Details on DocPortal, Pioneer Nexus, NavosAI, and more.\n- **My Role at Tabner Inc.**: Architecture behind KonfigAI, multi-tenant RAG, and Text-to-SQL.\n- **My Technical Stack**: Tools, frameworks, vector DBs, and cloud orchestration.\n- **My Journey & Content**: Past internships, YouTube daily vlogs, and engineering philosophy.\n- **Hiring & Collaboration**: Direct contact details and opportunities to build together!\n\nWhat would you like to know?`;
        }

        // Default Contextual Synthesis
        return `Thank you for asking! 😊 As an Applied AI/ML Engineer, I'm passionate about production RAG systems, autonomous agentic workflows, and cloud-native AI architectures.\n\nI can tell you all about my work at **Tabner Inc.**, projects like **DocPortal** and **Pioneer Nexus**, my core **tech stack**, or how to **get in touch**! What topic interests you most?`;
    }

    /* -------------------------------------------------------------
       Markdown & HTML Utility
       ------------------------------------------------------------- */
    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Progressive streaming markdown formatter that balances incomplete tags
     */
    function formatStreamingMarkdown(raw) {
        let text = raw;

        // Temporarily balance unclosed code blocks
        const codeBlockCount = (text.match(/```/g) || []).length;
        if (codeBlockCount % 2 !== 0) text += '\n```';

        // Temporarily balance unclosed bold tags
        const boldCount = (text.match(/\*\*/g) || []).length;
        if (boldCount % 2 !== 0) text += '**';

        let html = escapeHtml(text);

        // Code blocks ```code```
        html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre class="chat-code-block"><code>$2</code></pre>');
        // Inline code `code`
        html = html.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');
        // Blockquotes
        html = html.replace(/^>\s*(.*?)$/gm, '<blockquote class="chat-quote">$1</blockquote>');
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic
        html = html.replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');
        // Links
        html = html.replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" target="_blank" rel="noopener" class="chat-link">$1 <i class="fas fa-external-link-alt fa-xs"></i></a>');
        // Lists
        html = html.replace(/^\s*[-•]\s+(.*)$/gm, '<li class="chat-li">$1</li>');
        html = html.replace(/(<li class="chat-li">[\s\S]*?<\/li>)/g, '<ul class="chat-ul mb-2">$1</ul>');
        // Paragraphs & Line Breaks
        html = html.replace(/\n\n+/g, '</p><p class="mb-2">');
        html = html.replace(/\n/g, '<br>');

        return `<p class="mb-0">${html}</p>`;
    }
})();
