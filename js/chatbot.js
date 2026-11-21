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

    document.addEventListener('DOMContentLoaded', initChatbot);

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
        // First try the Netlify / local serverless endpoint
        const endpoints = ['/api/chat', '/.netlify/functions/chat'];

        for (const ep of endpoints) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

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
                // Try next endpoint or fallback
            }
        }

        throw new Error('Endpoint unreachable');
    }

    /* -------------------------------------------------------------
       Intelligent Local Persona Engine
       ------------------------------------------------------------- */
    function generateIntelligentReply(query) {
        const q = query.toLowerCase().trim();

        // 1. Greetings & Pleasantries
        if (/^(hi|hello|hey|yo|greetings|good\s*(morning|afternoon|evening)|sup|howdy)\b/i.test(q)) {
            const greetings = [
                `Hey there! 👋 It's wonderful to meet you! I'm Tusha Rahul's AI Twin. How can I help you today? Feel free to ask about my AI projects, my engineering work at Tabner Inc., or my tech stack!`,
                `Hello! Great to connect with you! 😊 I'm always energized to talk about Applied AI, machine learning systems, and full-stack engineering. What's on your mind?`,
                `Hey! Thanks for stopping by my portfolio! 🚀 I'm ready to share anything you'd like to know about my journey, projects, or how we might collaborate!`
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }

        // 2. Tabner Inc. & Current Role
        if (q.includes('tabner') || q.includes('current role') || q.includes('current job') || q.includes('konfigai')) {
            return `I'm currently working as an **Applied AI/ML Engineer & AI Agent Developer at Tabner Inc.**! 🚀\n\nAt Tabner, I build and scale enterprise AI systems like **KonfigAI** and **DocPortal**. My day-to-day focus includes:\n- Architecting multi-tenant RAG pipelines using **FastAPI** and **Weaviate** with dense + sparse hybrid vector search.\n- Developing LLM-driven agents and Text-to-SQL assistants that translate natural language queries into optimized PostgreSQL execution plans.\n- Containerizing and orchestrating services with **Docker** and **Kubernetes** on Google Cloud Platform and Microsoft Azure.\n\nIt's an intense, high-impact role where I get to turn cutting-edge LLM research into production systems!`;
        }

        // 3. DocPortal
        if (q.includes('docportal') || q.includes('rag') || q.includes('retriev') || q.includes('weaviate')) {
            return `**DocPortal** is one of my flagship enterprise builds at Tabner Inc.! 📄\n\nHere are the key technical highlights:\n- **Problem**: 50+ enterprise users needed to query across 1,000+ complex technical documents with zero hallucinations and fast sub-second latency.\n- **Architecture**: Powered by **FastAPI** and **Weaviate** utilizing **HNSW Hybrid Search** (merging dense semantic embeddings with BM25 keyword matching) and strict metadata filtering.\n- **Impact**: Improved search accuracy from **58% to 85%**, drastically reduced retrieval noise, and provided grounded citation provenance for every answer!`;
        }

        // 4. Pioneer Nexus
        if (q.includes('pioneer') || q.includes('nexus') || q.includes('text to sql') || q.includes('text-to-sql') || q.includes('sql assistant')) {
            return `**Pioneer Nexus** is an LLM-powered Text-to-SQL AI Assistant I engineered for PostgreSQL databases! ⚡\n\n- **Core Purpose**: Business analysts and engineers often spend hours drafting complex multi-table SQL queries. Pioneer Nexus lets them ask questions in plain English.\n- **Key Features**: Dynamic database schema introspection, few-shot prompt chaining, syntax validation, and SQL guardrails to prevent unsafe transactions.\n- **Result**: Cut analyst query drafting time by **40%**, making analytical workflows dramatically faster and more accessible!`;
        }

        // 5. NavosAI
        if (q.includes('navos') || q.includes('research agent') || q.includes('langgraph') || q.includes('knowledge graph')) {
            return `**NavosAI** is a production-grade multi-agent research pipeline I built! 🤖\n\n- **Framework**: Orchestrated with **LangGraph** and **FastAPI** on the backend, with a reactive SVG UI streaming live tokens over **Server-Sent Events (SSE)**.\n- **How It Works**: It decomposes open-ended questions into structured research intents, crawls and scores sources for credibility, resolves conflicting claims, and renders an interactive, dynamic knowledge graph of findings in real time!`;
        }

        // 6. Cold Outreach Agent (n8n + Ollama + Gmail)
        if (q.includes('outreach') || q.includes('cold email') || q.includes('n8n') || q.includes('ollama') || q.includes('whatsapp')) {
            return `My **Autonomous AI Cold Outreach Agent** is an end-to-end automated pipeline built on **n8n**, **Local LLaMA 3.2 via Ollama**, the **Gmail API**, and **WhatsApp**! 📬\n\n- Fetches targeted prospect leads directly from Google Sheets.\n- Conducts automated prospect enrichment via live Tavily web searches.\n- Dynamically drafts hyper-personalized emails with localized LLMs.\n- Sends emails with throttled batch delivery to maintain domain sender reputation.\n- Dispatches instant execution summaries directly to my WhatsApp upon completion!`;
        }

        // 7. LinkedIn Growth Engine
        if (q.includes('linkedin engine') || q.includes('linkedin automation') || q.includes('social media agent')) {
            return `The **Autonomous LinkedIn Growth Engine** is an intelligent content engine I built with **n8n**, **Gemini 2.5 Flash**, and **Cloudflare AI Workers**! 📱\n\n- Scrapes trending AI papers and tech news daily.\n- Synthesizes market insights and writes engaging technical LinkedIn posts tailored to my voice.\n- Manages approval workflows and schedules direct API publication to LinkedIn without manual overhead!`;
        }

        // 8. ClipYT & Ideate
        if (q.includes('clipyt') || q.includes('clip') || q.includes('video ai')) {
            return `**ClipYT** is an intelligent AI video highlighting tool! 🎬 It ingests long-form YouTube videos, runs OpenAI Whisper for speech-to-text transcription, applies semantic clustering on transcripts to find high-engagement segments, and automatically extracts viral-worthy vertical clips!`;
        }
        if (q.includes('ideate') || q.includes('prd') || q.includes('voice')) {
            return `**Ideate** is a voice-first ideation platform! 💡 It allows founders and engineers to record unstructured spoken voice brain-dumps, and automatically transforms that audio into clear, structured Product Requirement Documents (PRDs) with user stories, acceptance criteria, and system architectures!`;
        }

        // 9. Past Internships (Tiger Analytics, AIMER, DataValley)
        if (q.includes('intern') || q.includes('tiger') || q.includes('aimer') || q.includes('datavalley')) {
            return `Here is a quick snapshot of my prior milestone internships:\n- **Tiger Analytics** (Data Science & Analytics Intern): Built retail analytics ETL pipelines, executive Power BI dashboards, and assisted in predictive sales models.\n- **AIMER Society** (AI Medical Intern): Trained convolutional neural networks (CNNs) for medical image classification and applied Grad-CAM for model explainability.\n- **DataValley** (Python Full-Stack Intern): Built database-driven web platforms, REST APIs, and full-stack responsive web applications!`;
        }

        // 10. Tech Stack & Skills
        if (q.includes('stack') || q.includes('skill') || q.includes('tech') || q.includes('tools') || q.includes('python') || q.includes('languages')) {
            return `Here's a breakdown of my core technical stack:\n- **AI & ML**: LangChain, LangGraph, Ollama, Weaviate, ChromaDB, Hugging Face, PyTorch, RAG Pipelines, Multi-Agent Systems, Fine-Tuning.\n- **Languages**: Python, SQL, JavaScript, HTML5/CSS3.\n- **Backend & Cloud**: FastAPI, Django, Flask, Docker, Kubernetes, GCP, Azure, PostgreSQL, Redis, Netlify.\n- **Automation & Tools**: n8n, Git, GitHub, Power BI, Streamlit, Linux.`;
        }

        // 11. YouTube Channel
        if (q.includes('youtube') || q.includes('channel') || q.includes('vlog') || q.includes('life stories')) {
            return `Yes! I host a YouTube channel called **[@Rahuls_life_stories](https://www.youtube.com/@Rahuls_life_stories)** 🎥!\n\nMy personal tagline is: *"Time-traveling to the future, one daily vlog at a time. The destination? Me in five years."*\nI document my authentic engineering journey, personal development, AI experiments, and milestones. Be sure to check it out!`;
        }

        // 12. Philosophy & Quotes (Monkey D. Luffy / One Piece)
        if (q.includes('quote') || q.includes('philosophy') || q.includes('luffy') || q.includes('one piece') || q.includes('motto')) {
            return `My guiding motto is from Monkey D. Luffy (*One Piece*):\n\n> *"The future belongs to those who never stop believing."*\n\nI believe that relentless curiosity, humility, and disciplined daily execution can solve even the toughest engineering challenges! ⚓✨`;
        }

        // 13. Contact & Collaboration
        if (q.includes('contact') || q.includes('hire') || q.includes('email') || q.includes('reach') || q.includes('collaborat') || q.includes('talk')) {
            return `I'm always excited to collaborate on groundbreaking AI initiatives! 🤝 Here's how you can reach me directly:\n- **Email**: [tusharahul82@gmail.com](mailto:tusharahul82@gmail.com)\n- **LinkedIn**: [linkedin.com/in/tusha-rahul](https://www.linkedin.com/in/tusha-rahul/)\n- **GitHub**: [github.com/Rahul6158](https://github.com/Rahul6158)\n- **Portfolio**: [tusharahul.netlify.app](https://tusharahul.netlify.app)\n\nDrop me a message and let's build something extraordinary together!`;
        }

        // 14. Location & About
        if (q.includes('where') || q.includes('location') || q.includes('living') || q.includes('about you') || q.includes('who are you')) {
            return `I'm **Tusha Rahul Bellamkonda**, an Applied AI/ML Engineer based in Narsapur, Andhra Pradesh, India! 🇮🇳\n\nI specialize in bringing generative AI and autonomous agents out of Jupyter notebooks and directly into enterprise production. Whether it's high-precision RAG search systems, Text-to-SQL query agents, or multi-agent research tools, I thrive at the intersection of AI research and robust software engineering!`;
        }

        // Default Enthusiastic Response
        return `Thank you for asking! 😊 As an Applied AI/ML Engineer, I'm deeply passionate about production RAG systems, autonomous agentic workflows, and cloud-native AI architectures.\n\nCould I tell you more about one of my projects like **DocPortal** or **Pioneer Nexus**, my work at **Tabner Inc.**, or my core tech stack?`;
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
