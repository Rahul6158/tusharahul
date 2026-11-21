/**
 * Tusha Rahul Portfolio - Interactive AI Chatbot Twin
 * Powered by NVIDIA NIM API via Netlify Serverless Proxy & Intelligent Persona Engine
 */

(function () {
    'use strict';

    const SYSTEM_PROMPT = `You are the authentic AI Twin of Tusha Rahul Bellamkonda, speaking directly in the first person ("I", "my", "we").
Your tone is deeply polite, enthusiastic, humble, positive, and passionate about Applied AI, machine learning, and engineering excellence!
Always respond warmly with an encouraging, energetic vibe. Keep your responses crisp, conversational, and direct (2 to 4 paragraphs or bullet points where appropriate).

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
  - Email: tusharahul82@gmail.com

GUIDELINES:
- Greet visitors enthusiastically and answer their questions about my skills, projects, stack, experience, and contact details.
- Always sound like a friendly, energetic peer and engineer ready to collaborate or build exciting AI solutions.`;

    // Local Chat Message History
    let chatHistory = [
        { role: 'system', content: SYSTEM_PROMPT }
    ];

    let isOpen = false;
    let isGenerating = false;
    let currentSizeMode = 'standard'; // 'standard' | 'expanded'

    // DOM Elements
    let triggerBtn, chatWindow, chatHeader, messagesContainer, chatForm, chatInput, sendBtn, closeBtn, clearBtn, sizeBtn, sizeIcon, chipsBar;
    let resizeCorner;

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

        // Setup Corner Resize Handle
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
            chatWindow.style.height = '580px';
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
            if (window.innerWidth <= 600) return; // Disable on small mobile devices
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

            const deltaX = startX - clientX; // dragging left increases width
            const deltaY = startY - clientY; // dragging up increases height

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
                    <div class="chat-msg-sender">Tusha Rahul</div>
                    <div class="chat-msg-bubble">
                        <p class="mb-1"><strong>Hi, I'm Tusha Rahul!</strong></p>
                        <p class="mb-2">Welcome to my portfolio! I'm an Applied AI/ML Engineer at Tabner Inc., specializing in enterprise RAG systems, autonomous multi-agent pipelines, and cloud-native AI architectures.</p>
                        <p class="mb-0">Feel free to ask about my projects like DocPortal and Pioneer Nexus, my technical stack, or how we might collaborate.</p>
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

    function appendBotLoading() {
        const loaderDiv = document.createElement('div');
        loaderDiv.className = 'chat-msg chat-msg-bot chat-loading-indicator';
        loaderDiv.id = 'chatLoadingIndicator';
        loaderDiv.innerHTML = `
            <div class="chat-msg-avatar">
                <img src="img/tusha-avatar.png" alt="Rahul" onerror="this.src='img/profile.jpeg'">
            </div>
            <div class="chat-msg-wrapper">
                <div class="chat-msg-sender">Tusha Rahul</div>
                <div class="chat-msg-bubble">
                    <div class="chat-dots-wave">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.appendChild(loaderDiv);
        scrollToBottom();
    }

    function removeBotLoading() {
        const loader = document.getElementById('chatLoadingIndicator');
        if (loader) loader.remove();
    }

    function appendBotMessage(markdownText) {
        removeBotLoading();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg chat-msg-bot';
        msgDiv.innerHTML = `
            <div class="chat-msg-avatar">
                <img src="img/tusha-avatar.png" alt="Rahul" onerror="this.src='img/profile.jpeg'">
            </div>
            <div class="chat-msg-wrapper">
                <div class="chat-msg-sender">Tusha Rahul</div>
                <div class="chat-msg-bubble">
                    ${formatMarkdown(markdownText)}
                </div>
                <span class="chat-timestamp">${getFormattedTimestamp()}</span>
            </div>
        `;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
    }

    function scrollToBottom() {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    /* -------------------------------------------------------------
       Message Dispatch Pipeline (NVIDIA NIM via Proxy + Smart Fallback)
       ------------------------------------------------------------- */
    async function sendMessage(text) {
        if (chatInput) chatInput.value = '';
        isGenerating = true;
        if (sendBtn) sendBtn.disabled = true;

        appendUserMessage(text);
        appendBotLoading();

        chatHistory.push({ role: 'user', content: text });

        // Keep last 10 messages for context budget
        const contextPayload = [
            chatHistory[0], // system
            ...chatHistory.slice(-9)
        ];

        try {
            const reply = await queryAI(contextPayload, text);
            chatHistory.push({ role: 'assistant', content: reply });
            appendBotMessage(reply);
        } catch (err) {
            console.warn('Live API unavailable, utilizing intelligent local persona engine:', err.message);
            const fallbackReply = generateIntelligentReply(text);
            chatHistory.push({ role: 'assistant', content: fallbackReply });
            appendBotMessage(fallbackReply);
        } finally {
            isGenerating = false;
            if (sendBtn) sendBtn.disabled = false;
            if (chatInput) chatInput.focus();
        }
    }

    async function queryAI(messages, userQuery) {
        // Tier 1: Try local or Netlify serverless endpoint (NVIDIA NIM or server-side proxy)
        const endpoints = ['/api/chat', '/.netlify/functions/chat'];

        for (const ep of endpoints) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s fast timeout

                const response = await fetch(ep, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'minimaxai/minimax-m3.1-flash',
                        messages: messages,
                        max_tokens: 1024,
                        temperature: 0.7
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    const choice = data.choices && data.choices[0];
                    if (choice && choice.message) {
                        let content = choice.message.content || choice.message.reasoning_content;
                        if (content && content.trim()) {
                            return content.trim();
                        }
                    }
                }
            } catch (e) {
                // Try next endpoint or direct client AI
            }
        }

        // Tier 2: Direct browser client call to public AI endpoint (CORS-enabled, zero-key needed)
        // Works seamlessly on file://, localhost, GitHub Pages, or any static host!
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const directRes = await fetch('https://text.pollinations.ai/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages,
                    model: 'openai',
                    temperature: 0.7
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (directRes.ok) {
                const text = await directRes.text();
                if (text && text.trim()) {
                    return text.trim();
                }
            }
        } catch (directErr) {
            console.warn('Direct AI client call unavailable:', directErr.message);
        }

        throw new Error('All online AI tiers unreachable');
    }

    /* -------------------------------------------------------------
       Intelligent Local Persona Engine (Comprehensive Offline Fallback)
       ------------------------------------------------------------- */
    function generateIntelligentReply(query) {
        const q = query.toLowerCase().trim();

        // 1. Greetings & Pleasantries
        if (/^(hi|hello|hey|yo|greetings|good\s*(morning|afternoon|evening)|sup|howdy|hoi)\b/i.test(q)) {
            const greetings = [
                `Hey there! 👋 Wonderful to meet you! I'm Tusha Rahul's AI Twin. How can I help you today? Feel free to ask about my AI projects, my engineering work at Tabner Inc., or my tech stack!`,
                `Hello! Great to connect with you! 😊 I'm always energized to talk about Applied AI, machine learning systems, and full-stack engineering. What's on your mind?`,
                `Hey! Thanks for stopping by my portfolio! 🚀 I'm ready to share anything you'd like to know about my journey, projects, or how we might collaborate!`
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }

        // 2. Who is Rahul / Bio / About Me
        if (q.includes('who are you') || q.includes('who is rahul') || q.includes('about rahul') || q.includes('about yourself') || q.includes('introduce yourself') || q.includes('tell me about you') || q.includes('background')) {
            return `I'm **Tusha Rahul Bellamkonda**, an Applied AI/ML Engineer and AI Agent Developer based in Narsapur, Andhra Pradesh, India! 🇮🇳\n\n- **Current Role**: Applied AI Engineer at **Tabner Inc.** building production AI systems like **KonfigAI** and **DocPortal**.\n- **Specialties**: Multi-tenant enterprise RAG pipelines, autonomous multi-agent workflows, Text-to-SQL assistants, and cloud-native deployments on GCP & Azure.\n- **Content Creation**: I also run a daily engineering vlog on YouTube at **[@Rahuls_life_stories](https://www.youtube.com/@Rahuls_life_stories)** documenting my 5-year journey to becoming a world-class AI builder!\n\nWhether you want to explore my technical builds, chat about enterprise LLMs, or collaborate, I'm thrilled to connect!`;
        }

        // 3. Tabner Inc. & Current Role
        if (q.includes('tabner') || q.includes('current role') || q.includes('current job') || q.includes('konfigai') || q.includes('what do you do at work')) {
            return `I'm currently working as an **Applied AI/ML Engineer & AI Agent Developer at Tabner Inc.**! 🚀\n\nAt Tabner, I architect and scale production AI systems around **KonfigAI** and **DocPortal**:\n- **Multi-Tenant RAG**: Engineered with **FastAPI** and **Weaviate** using HNSW dense+sparse hybrid vector search and metadata isolation.\n- **Text-to-SQL Agents**: Building autonomous assistants that convert complex analytical questions into optimized, safe SQL queries for PostgreSQL.\n- **Cloud Infrastructure**: Packaging microservices into **Docker** containers and deploying on **Kubernetes** across Google Cloud Platform (GCP) and Azure.\n\nIt's a high-velocity role where cutting-edge agentic research directly transforms into enterprise products!`;
        }

        // 4. All Projects Overview
        if (q.includes('projects') || q.includes('what have you built') || q.includes('portfolio work') || q.includes('key projects') || q.includes('what did you create')) {
            return `Here are some of my flagship production and research AI builds:\n\n1. **DocPortal (Enterprise RAG)**: Multi-tenant RAG platform using FastAPI & Weaviate with hybrid search. 50+ enterprise users, 1,000+ docs, 85% search accuracy.\n2. **Pioneer Nexus (Text-to-SQL)**: LLM assistant translating natural language into PostgreSQL queries, cutting analyst drafting time by 40%.\n3. **NavosAI (Research Multi-Agent)**: LangGraph + FastAPI research pipeline that crawls sources, scores credibility, and streams live dynamic knowledge graphs via SSE.\n4. **Autonomous Cold Outreach Agent**: n8n + local LLaMA 3.2 via Ollama + Gmail API + WhatsApp execution dispatches.\n5. **Autonomous LinkedIn Growth Engine**: n8n + Gemini 2.5 + Cloudflare Workers for daily AI news synthesis and scheduled publication.\n6. **ClipYT**: AI-driven video highlight generator using OpenAI Whisper & semantic transcript clustering.\n7. **Ideate**: Voice-first brain-dump to structured Product Requirement Document (PRD) generator.\n\nWhich of these would you like to dive deeper into?`;
        }

        // 5. DocPortal
        if (q.includes('docportal') || q.includes('rag') || q.includes('retriev') || q.includes('weaviate') || q.includes('vector db') || q.includes('hnsw')) {
            return `**DocPortal** is one of my core enterprise builds at Tabner Inc.! 📄\n\n- **The Challenge**: 50+ enterprise users needed to query across 1,000+ technical documents with strict data privacy and zero hallucinations.\n- **Architecture**: Built on **FastAPI** and **Weaviate**, utilizing **HNSW Hybrid Search** (dense semantic embeddings combined with BM25 sparse keyword matching) alongside dynamic metadata filters.\n- **Results**: Boosted search accuracy from **58% to 85%**, drastically reduced retrieval latency, and ensured grounded citation provenance for every answer!`;
        }

        // 6. Pioneer Nexus
        if (q.includes('pioneer') || q.includes('nexus') || q.includes('text to sql') || q.includes('text-to-sql') || q.includes('sql assistant') || q.includes('database query')) {
            return `**Pioneer Nexus** is an LLM-powered Text-to-SQL assistant engineered for PostgreSQL databases! ⚡\n\n- **Purpose**: Helps data analysts and business leaders query relational databases using everyday natural language without manual SQL syntax struggles.\n- **Key Features**: Dynamic database schema introspection, few-shot prompt chaining, automated syntax linting, and security guardrails against destructive transactions.\n- **Impact**: Reduced query drafting time by **40%**, making enterprise data exploration lightning fast and reliable!`;
        }

        // 7. NavosAI
        if (q.includes('navos') || q.includes('research agent') || q.includes('langgraph') || q.includes('knowledge graph') || q.includes('multi-agent') || q.includes('multi agent')) {
            return `**NavosAI** is a production-grade multi-agent research pipeline! 🤖\n\n- **Framework**: Orchestrated with **LangGraph** and **FastAPI** on the backend, streaming live token updates via **Server-Sent Events (SSE)** to an interactive SVG frontend.\n- **Workflow**: Takes broad, ambiguous questions, breaks them down into sub-queries, scrapes sources, scores authority, resolves contradictory data points, and renders an interactive knowledge graph of discoveries in real time!`;
        }

        // 8. Cold Outreach Agent
        if (q.includes('outreach') || q.includes('cold email') || q.includes('n8n') || q.includes('ollama') || q.includes('whatsapp') || q.includes('lead gen')) {
            return `My **Autonomous AI Cold Outreach Agent** is an automated pipeline built on **n8n**, **Local LLaMA 3.2 via Ollama**, the **Gmail API**, and **WhatsApp**! 📬\n\n- **Lead Ingestion**: Pulls prospect lists from Google Sheets automatically.\n- **Enrichment**: Executes live Tavily web searches to discover recent prospect news.\n- **Personalization**: Localized LLaMA models draft hyper-tailored pitch emails.\n- **Delivery & Notification**: Sends emails with throttled rate-limiting and dispatches instant completion reports directly to my WhatsApp!`;
        }

        // 9. LinkedIn Growth Engine
        if (q.includes('linkedin engine') || q.includes('linkedin automation') || q.includes('social media agent') || q.includes('social agent')) {
            return `The **Autonomous LinkedIn Growth Engine** is an intelligent content system I built using **n8n**, **Gemini 2.5 Flash**, and **Cloudflare AI Workers**! 📱\n\n- Monitors trending machine learning research papers and tech news daily.\n- Extracts strategic takeaways and crafts authentic, engaging technical LinkedIn posts tailored to my perspective.\n- Automatically queues approved drafts and triggers direct API publishing to LinkedIn!`;
        }

        // 10. ClipYT & Ideate
        if (q.includes('clipyt') || q.includes('clip') || q.includes('video ai') || q.includes('video summar')) {
            return `**ClipYT** is an intelligent AI video highlighting tool! 🎬 It ingests long-form YouTube videos, runs **OpenAI Whisper** for high-precision audio transcription, applies semantic clustering on transcripts to detect peak-engagement moments, and automatically crops and exports viral vertical clips!`;
        }
        if (q.includes('ideate') || q.includes('prd') || q.includes('voice dump') || q.includes('voice')) {
            return `**Ideate** is a voice-first ideation platform! 💡 It allows builders and founders to speak out spontaneous voice thoughts and automatically transforms the spoken audio into structured, comprehensive Product Requirement Documents (PRDs) with user stories, acceptance criteria, and system architecture diagrams!`;
        }

        // 11. Tech Stack & Skills
        if (q.includes('stack') || q.includes('skill') || q.includes('tech') || q.includes('tools') || q.includes('python') || q.includes('languages') || q.includes('framework')) {
            return `Here is a comprehensive overview of my core technical stack:\n\n- **AI & ML**: LangChain, LangGraph, Ollama, Weaviate, ChromaDB, Hugging Face, PyTorch, RAG Pipelines, Multi-Agent Systems, Fine-Tuning.\n- **Languages**: Python, SQL (PostgreSQL), JavaScript (ES6+), HTML5/CSS3.\n- **Backend & Cloud**: FastAPI, Django, Flask, Docker, Kubernetes, Google Cloud Platform (GCP), Microsoft Azure, Redis, Netlify.\n- **Automation & CI/CD**: n8n, Git, GitHub, Linux, Power BI, Streamlit.`;
        }

        // 12. Past Experience (Tiger Analytics, AIMER, DataValley, DSV)
        if (q.includes('intern') || q.includes('tiger') || q.includes('aimer') || q.includes('datavalley') || q.includes('experience') || q.includes('history')) {
            return `Here's a look at my milestone journey before Tabner Inc.:\n\n- **Tiger Analytics** (Data Science & Analytics Intern): Built retail ETL pipelines, executive Power BI dashboards, and assisted in predictive sales models.\n- **AIMER Society** (AI Medical Intern): Trained convolutional neural networks (CNNs) for medical image classification and applied Grad-CAM explainability.\n- **DataValley** (Python Full-Stack Intern): Engineered database-driven web platforms, REST APIs, and responsive full-stack applications.\n- **DSV Project & FluenTranslate**: Built foundational web interfaces and real-time translation pipelines!`;
        }

        // 13. YouTube Channel
        if (q.includes('youtube') || q.includes('channel') || q.includes('vlog') || q.includes('life stories') || q.includes('video')) {
            return `Yes! I run a YouTube channel called **[@Rahuls_life_stories](https://www.youtube.com/@Rahuls_life_stories)** 🎥!\n\nMy motto is: *"Time-traveling to the future, one daily vlog at a time. The destination? Me in five years."*\nI document my authentic engineering journey, personal development, AI experiments, and lessons learned. Join me on the journey!`;
        }

        // 14. Philosophy & Luffy Quote
        if (q.includes('quote') || q.includes('philosophy') || q.includes('luffy') || q.includes('one piece') || q.includes('motto') || q.includes('inspiration')) {
            return `My favorite guiding motto is from Monkey D. Luffy (*One Piece*):\n\n> *"The future belongs to those who never stop believing."*\n\nI believe that relentless curiosity, deep humility, and disciplined daily execution can solve even the most intimidating engineering challenges! ⚓✨`;
        }

        // 15. Contact & Collaboration / Hiring
        if (q.includes('contact') || q.includes('hire') || q.includes('email') || q.includes('reach') || q.includes('collaborat') || q.includes('talk') || q.includes('linkedin') || q.includes('github') || q.includes('freelance') || q.includes('work together')) {
            return `I'm always eager to collaborate on groundbreaking AI initiatives, enterprise RAG systems, or innovative engineering challenges! 🤝\n\nHere's how you can reach me directly:\n- **Email**: [tusharahul82@gmail.com](mailto:tusharahul82@gmail.com)\n- **LinkedIn**: [linkedin.com/in/tusha-rahul](https://www.linkedin.com/in/tusha-rahul/)\n- **GitHub**: [github.com/Rahul6158](https://github.com/Rahul6158)\n- **Portfolio**: [tusharahul.netlify.app](https://tusharahul.netlify.app)\n\nDrop me a message anytime and let's build something remarkable together!`;
        }

        // 16. Location & Education
        if (q.includes('where') || q.includes('location') || q.includes('living') || q.includes('city') || q.includes('country') || q.includes('college') || q.includes('education') || q.includes('degree')) {
            return `I am based in **Narsapur, Andhra Pradesh, India** 🇮🇳.\n\nI hold a strong academic foundation in Computer Science and Engineering with a deep specialization in Applied Artificial Intelligence, Machine Learning, and Cloud Systems!`;
        }

        // 17. Capabilities & How to Use
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

    function formatMarkdown(text) {
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
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Links
        html = html.replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" target="_blank" rel="noopener" class="chat-link">$1 <i class="fas fa-external-link-alt fa-xs"></i></a>');
        // Bullet points
        html = html.replace(/^\s*[-&bull;]\s+(.*)$/gm, '<li class="chat-li">$1</li>');
        html = html.replace(/(<li class="chat-li">.*<\/li>)/s, '<ul class="chat-ul mb-2">$1</ul>');
        // Paragraphs & Line Breaks
        html = html.replace(/\n\n+/g, '</p><p class="mb-2">');
        html = html.replace(/\n/g, '<br>');
        return `<p class="mb-0">${html}</p>`;
    }
})();
