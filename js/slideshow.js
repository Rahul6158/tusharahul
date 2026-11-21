/**
 * Tusha Rahul Portfolio - Slideshow & Horizontal Gallery Engine
 * Built with GSAP & ScrollTrigger
 */

(function () {
    'use strict';

    // Slide section IDs in chronological order
    const SLIDE_IDS = [
        'home',
        'about',
        'experience',
        'projects',
        'skills',
        'articles',
        'certificates',
        'contact'
    ];

    const SLIDE_NAMES = [
        'Home',
        'About Me',
        'Experience',
        'Projects',
        'Skills',
        'Articles',
        'Certificates',
        'Contact'
    ];

    let currentIndex = 0;
    let isAnimating = false;
    let isLocked = false;
    let lastSlideChangeTime = 0;
    let wheelQuietTimer = null;
    const MIN_SLIDE_INTERVAL = 900; // Minimum ms between slide changes to prevent momentum runaway
    const WHEEL_DELTA_THRESHOLD = 32; // Strict gesture threshold to ignore decaying inertia
    let isSlideshowMode = true; // Default
    let slideElements = [];
    let touchStartX = 0;
    let touchStartY = 0;

    /**
     * Initialize on DOM Ready
     */
    document.addEventListener('DOMContentLoaded', function () {
        // Register GSAP plugins if available
        if (typeof gsap !== 'undefined') {
            if (typeof ScrollTrigger !== 'undefined') {
                gsap.registerPlugin(ScrollTrigger);
            }
            if (typeof ScrollToPlugin !== 'undefined') {
                gsap.registerPlugin(ScrollToPlugin);
            }
        }

        // Cache slide DOM elements
        slideElements = SLIDE_IDS.map(id => document.getElementById(id)).filter(Boolean);

        // Check user's saved mode preference
        const savedMode = localStorage.getItem('tusha_portfolio_mode');
        if (savedMode === 'normal') {
            isSlideshowMode = false;
        } else {
            isSlideshowMode = true;
        }

        // Setup DOM components
        createModeToggleButton();
        createSlideshowDots();
        createSlideshowBottomBar();
        integrateFooterWithContact();

        // Setup Horizontal Galleries for sections with heavy content
        setupHorizontalGalleries();

        // Setup Centered Stacked 3D Card Carousels (Projects & Articles)
        init3DStackedCarousels();

        // Setup Grand Line Voyage & Deck View for Experience
        initGrandLineVoyage();

        // Check initial hash
        let initialSlide = 0;
        if (window.location.hash) {
            const hash = window.location.hash.replace('#', '');
            const idx = SLIDE_IDS.indexOf(hash);
            if (idx !== -1) {
                initialSlide = idx;
            }
        }

        // Apply initial mode
        if (isSlideshowMode) {
            enableSlideshowMode(initialSlide);
        } else {
            enableNormalMode();
        }

        // Attach global event listeners
        attachEventListeners();
    });

    /**
     * Create Navbar Mode Toggle Button
     */
    function createModeToggleButton() {
        const navList = document.querySelector('.navbar-nav');
        if (!navList) return;

        // Create nav item
        const li = document.createElement('li');
        li.id = 'portfolioModeToggleLi';
        li.className = 'nav-item ms-lg-3 my-2 my-lg-0 d-flex align-items-center';

        const button = document.createElement('button');
        button.id = 'portfolioModeToggle';
        button.className = 'mode-toggle-btn' + (!isSlideshowMode ? ' mode-normal' : '');
        button.setAttribute('aria-label', 'Toggle Slideshow Mode');
        button.setAttribute('title', 'Switch between Slideshow & Standard browsing');

        button.innerHTML = `
            <span class="mode-badge"></span>
            <i class="fas ${isSlideshowMode ? 'fa-scroll' : 'fa-film'}"></i>
            <span class="mode-label-text">${isSlideshowMode ? 'Standard View' : 'Slideshow Mode'}</span>
        `;

        button.addEventListener('click', function () {
            togglePortfolioMode();
        });

        li.appendChild(button);
        navList.appendChild(li);

        // If starting in slideshow mode, attach button to body so it floats when navbar disappears
        if (isSlideshowMode) {
            document.body.appendChild(button);
        }
    }

    /**
     * Create Floating Vertical Dot Indicators (Right Edge)
     */
    function createSlideshowDots() {
        const dotsNav = document.createElement('ul');
        dotsNav.className = 'slideshow-dots-nav';
        dotsNav.id = 'slideshowDotsNav';
        dotsNav.setAttribute('aria-label', 'Slide navigation');

        SLIDE_IDS.forEach((id, idx) => {
            const li = document.createElement('li');
            li.className = 'slideshow-dot-item' + (idx === 0 ? ' active' : '');
            li.setAttribute('data-slide-index', idx);

            const tooltip = document.createElement('span');
            tooltip.className = 'slideshow-dot-tooltip';
            tooltip.textContent = SLIDE_NAMES[idx];

            const btn = document.createElement('button');
            btn.className = 'slideshow-dot-btn';
            btn.setAttribute('aria-label', `Go to ${SLIDE_NAMES[idx]}`);
            btn.addEventListener('click', () => {
                goToSlide(idx);
            });

            li.appendChild(tooltip);
            li.appendChild(btn);
            dotsNav.appendChild(li);
        });

        document.body.appendChild(dotsNav);
    }

    /**
     * Create Bottom Slideshow Controller
     */
    function createSlideshowBottomBar() {
        const bottomBar = document.createElement('div');
        bottomBar.className = 'slideshow-bottom-bar';
        bottomBar.id = 'slideshowBottomBar';

        bottomBar.innerHTML = `
            <button class="slideshow-bar-arrow" id="slidePrevBtn" aria-label="Previous Slide">
                <i class="fas fa-chevron-up"></i>
            </button>
            <div class="slideshow-bar-counter">
                <span class="current-slide-num">01</span> / <span class="total-slides-num">0${slideElements.length}</span>
            </div>
            <button class="slideshow-bar-arrow" id="slideNextBtn" aria-label="Next Slide">
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="slideshow-bar-name" id="slideCurrentName">${SLIDE_NAMES[0]}</div>
        `;

        document.body.appendChild(bottomBar);

        document.getElementById('slidePrevBtn').addEventListener('click', () => {
            goToSlide(currentIndex - 1, -1);
        });

        document.getElementById('slideNextBtn').addEventListener('click', () => {
            goToSlide(currentIndex + 1, 1);
        });
    }

    /**
     * Integrate Footer into Contact Slide for Seamless Finale
     */
    function integrateFooterWithContact() {
        const contactSection = document.getElementById('contact');
        if (!contactSection) return;

        if (contactSection.querySelector('.slideshow-footer-bar')) return;

        const footerBar = document.createElement('div');
        footerBar.className = 'slideshow-footer-bar';
        footerBar.innerHTML = `
            <p class="mb-1">&copy; ${new Date().getFullYear()} Tusha Rahul Bellamkonda &bull; Applied AI/ML Engineer &bull; Narsapur, AP, India</p>
            <p class="mb-0 text-white-50 small">&ldquo;The future belongs to those who never stop believing.&rdquo; &mdash; Monkey D. Luffy</p>
        `;

        const contactContainer = contactSection.querySelector('.container');
        if (contactContainer) {
            contactContainer.appendChild(footerBar);
        }
    }

    /**
     * Setup Horizontal Galleries for Multi-Card Sections
     */
    function setupHorizontalGalleries() {
        // Experience and Skills now use dedicated high-performance engines:
        // - Experience: Grand Line Voyage Split Map + Deck 3D Fan View
        // - Skills: Dual-Direction Continuous Ticker Belts
    }

    /**
     * Initialize 3D Stacked Card Carousels for Projects and Articles
     */
    function init3DStackedCarousels() {
        // Projects Carousel (9 items - starts in middle, user-driven smooth scroll)
        setupStacked3DCarousel({
            stageId: 'projectCarouselStage',
            prevBtnId: 'projectPrevBtn',
            nextBtnId: 'projectNextBtn',
            dotsId: 'projectDots',
            cardClass: '.project-stacked-card',
            autoPlayInterval: 0
        });

        // Articles Carousel (5 items - starts in middle)
        setupStacked3DCarousel({
            stageId: 'articlesCarouselStage',
            prevBtnId: 'articlesPrevBtn',
            nextBtnId: 'articlesNextBtn',
            dotsId: 'articlesDots',
            cardClass: '.article-stacked-card',
            autoPlayInterval: 0
        });
    }

    /**
     * Reusable Centered Stacked 3D Card Carousel with Infinite Loop & Throttled Scroll
     */
    function setupStacked3DCarousel({ stageId, prevBtnId, nextBtnId, dotsId, cardClass, autoPlayInterval = 0 }) {
        const stage = document.getElementById(stageId);
        if (!stage) return;

        const cards = Array.from(stage.querySelectorAll(cardClass));
        if (!cards.length) return;

        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        const dotsContainer = document.getElementById(dotsId);

        const total = cards.length;
        // ALWAYS START IN THE MIDDLE as requested!
        let activeIndex = Math.floor(total / 2);

        // Auto-Play Engine
        let autoPlayTimer = null;
        let isHovered = false;
        let isUserInteracting = false;
        let isVisibleInViewport = true;

        function startAutoPlay() {
            if (!autoPlayInterval || autoPlayInterval <= 0) return;
            stopAutoPlay();
            if (isHovered || isUserInteracting || !isVisibleInViewport) return;
            autoPlayTimer = setInterval(() => {
                goTo(activeIndex + 1);
            }, autoPlayInterval);
        }

        function stopAutoPlay() {
            if (autoPlayTimer) {
                clearInterval(autoPlayTimer);
                autoPlayTimer = null;
            }
        }

        function resetAutoPlay() {
            stopAutoPlay();
            startAutoPlay();
        }

        // Build pagination dots
        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            cards.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.className = `project-dot ${i === activeIndex ? 'active' : ''}`;
                dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                dot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    goTo(i);
                    resetAutoPlay();
                });
                dotsContainer.appendChild(dot);
            });
        }

        const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('.project-dot')) : [];

        function update() {
            const stageWidth = stage.offsetWidth || 1100;
            // Dynamically scale card spread so cards stretch across the full width of their section
            const baseSpread = Math.min(270, Math.max(180, stageWidth * 0.22));
            const extraSpread = Math.min(130, Math.max(85, stageWidth * 0.10));

            cards.forEach((card, i) => {
                // Circular offset wrapping for seamless infinite looping
                let offset = i - activeIndex;
                const half = total / 2;
                while (offset > half) offset -= total;
                while (offset < -half) offset += total;

                const absOffset = Math.abs(offset);
                const sign = Math.sign(offset);

                if (offset === 0) {
                    card.style.transform = 'translateX(0) translateY(0) scale(1.04) rotateY(0deg)';
                    card.style.zIndex = 30;
                    card.style.opacity = '1';
                    card.style.pointerEvents = 'auto';
                    card.classList.add('is-active');
                } else {
                    const x = sign * (baseSpread + (absOffset - 1) * extraSpread);
                    const y = absOffset * 10;
                    const scale = Math.max(0.65, 1 - absOffset * 0.08);
                    const rotY = -sign * Math.min(22, absOffset * 6.5);
                    const op = Math.max(0.12, 1 - absOffset * 0.22);

                    card.style.transform = `translateX(${x}px) translateY(${y}px) scale(${scale}) rotateY(${rotY}deg)`;
                    card.style.zIndex = 30 - absOffset;
                    card.style.opacity = op;
                    // Allow interaction on center and immediately adjacent cards
                    card.style.pointerEvents = absOffset <= 2 ? 'auto' : 'none';
                    card.classList.remove('is-active');
                }
            });

            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === activeIndex);
            });

            // Infinite loop: buttons are always active
            if (prevBtn) prevBtn.disabled = false;
            if (nextBtn) nextBtn.disabled = false;
        }

        // Loop navigation with modulo arithmetic
        function goTo(index) {
            activeIndex = (index % total + total) % total;
            update();
        }

        cards.forEach((card, i) => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.project-card-btn, a, button')) return;
                if (i !== activeIndex) {
                    e.preventDefault();
                    e.stopPropagation();
                    goTo(i);
                    resetAutoPlay();
                }
            });
        });

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                goTo(activeIndex - 1);
                resetAutoPlay();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                goTo(activeIndex + 1);
                resetAutoPlay();
            });
        }

        // Pause autoplay on mouse enter / resume on mouse leave
        const wrapper = stage.closest('.projects-carousel-wrapper') || stage;
        wrapper.addEventListener('mouseenter', () => {
            isHovered = true;
            stopAutoPlay();
        });
        wrapper.addEventListener('mouseleave', () => {
            isHovered = false;
            startAutoPlay();
        });

        // Drag / Swipe Gestures on Carousel Stage
        let startX = 0;
        let isDragging = false;
        let hasMoved = false;

        stage.addEventListener('mousedown', (e) => {
            if (e.target.closest('.project-card-btn, a, button')) return;
            isDragging = true;
            isUserInteracting = true;
            stopAutoPlay();
            hasMoved = false;
            startX = e.clientX;
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            if (Math.abs(e.clientX - startX) > 6) {
                hasMoved = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            isUserInteracting = false;
            const diff = e.clientX - startX;
            if (Math.abs(diff) > 40) {
                if (diff < 0) goTo(activeIndex + 1);
                else goTo(activeIndex - 1);
            }
            resetAutoPlay();
        });

        stage.addEventListener('touchstart', (e) => {
            isUserInteracting = true;
            stopAutoPlay();
            startX = e.touches[0].clientX;
        }, { passive: true });

        stage.addEventListener('touchend', (e) => {
            isUserInteracting = false;
            const diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) > 40) {
                if (diff < 0) goTo(activeIndex + 1);
                else goTo(activeIndex - 1);
            }
            resetAutoPlay();
        });

        // Smooth mouse wheel inside carousel: horizontal scrolls cycle cards, vertical wheel bubbles to slideshow
        let wheelLock = false;
        let wheelTimer = null;
        let accumulatedDelta = 0;
        const WHEEL_THRESHOLD = 30;
        const WHEEL_COOLDOWN = 500;

        stage.addEventListener('wheel', (e) => {
            // ONLY intercept horizontal gestures (two-finger horizontal swipe on trackpad, or Shift + Wheel)
            const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
            if (!isHorizontal) {
                // Allow vertical mouse wheel to bubble up to window so the page slides advance!
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (Math.abs(delta) < 4) return;

            accumulatedDelta += delta;

            if (wheelLock) {
                // Absorb trackpad trailing momentum
                clearTimeout(wheelTimer);
                wheelTimer = setTimeout(() => {
                    wheelLock = false;
                    accumulatedDelta = 0;
                }, 140);
                return;
            }

            if (Math.abs(accumulatedDelta) >= WHEEL_THRESHOLD) {
                wheelLock = true;
                const dir = accumulatedDelta > 0 ? 1 : -1;
                accumulatedDelta = 0;

                goTo(activeIndex + dir);

                clearTimeout(wheelTimer);
                wheelTimer = setTimeout(() => {
                    wheelLock = false;
                    accumulatedDelta = 0;
                }, WHEEL_COOLDOWN);
            }
        }, { passive: false });

        // Pause auto-play when tab is inactive or carousel is out of view
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    isVisibleInViewport = entry.isIntersecting && entry.intersectionRatio > 0.2;
                    if (isVisibleInViewport) {
                        startAutoPlay();
                    } else {
                        stopAutoPlay();
                    }
                });
            }, { threshold: [0, 0.25, 0.5] });
            observer.observe(stage);
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAutoPlay();
            } else if (isVisibleInViewport && !isHovered && !isUserInteracting) {
                startAutoPlay();
            }
        });

        // Initial render & kick-off
        update();
        startAutoPlay();

        // Responsive spread adjustment on window resize
        window.addEventListener('resize', update);
    }

    /**
     * Complete 6-Milestone Grand Line Voyage & Deck View Engine
     */
    function initGrandLineVoyage() {
        const expSection = document.getElementById('experience');
        if (!expSection) return;

        const MILESTONES = [
            {
                id: 'dsv-project',
                stopCode: '01',
                shortLabel: '01',
                islandName: 'Port Origin',
                period: '2023 — 2024',
                shortPeriod: '2023 – 2024',
                title: 'DSV Project',
                product: null,
                role: 'Web Developer',
                category: 'Foundation Build',
                isCurrent: false,
                coordinates: { x: 11, y: 76 },
                labelPosition: 'top',
                accentColor: '#22d3ee',
                summary: 'Engineered responsive full-stack web modules and clean user interfaces for community-driven digital platforms.',
                highlights: [
                    {
                        title: 'Responsive Web Architecture',
                        description: 'Built modular frontend views and interactive user flows with semantic HTML5, modern CSS3, and vanilla JavaScript.'
                    },
                    {
                        title: 'Performance & Accessibility',
                        description: 'Optimized asset loading and cross-device layout responsiveness, ensuring smooth mobile and desktop usability.'
                    }
                ],
                tags: ['HTML5', 'CSS3', 'JavaScript', 'UI/UX', 'Git'],
                hasCertificate: false,
                architectureNote: 'Client-rendered multi-page web architecture with modular component styling, form validation pipelines, and responsive grid breakpoints.'
            },
            {
                id: 'fluentranslate',
                stopCode: '02',
                shortLabel: '02',
                islandName: 'Polyglot Reef',
                period: '2024',
                shortPeriod: '2024',
                title: 'FluenTranslate',
                product: null,
                role: 'Project Lead',
                category: 'AI Product Lead',
                isCurrent: false,
                coordinates: { x: 27, y: 36 },
                labelPosition: 'bottom',
                accentColor: '#22d3ee',
                summary: 'Led end-to-end development of a real-time multilingual translation application bridging regional and global communication.',
                highlights: [
                    {
                        title: 'End-to-End Technical Leadership',
                        description: 'Architected the core translation pipeline and led feature prioritization, sprint execution, and API integration.'
                    },
                    {
                        title: 'Low-Latency NLP Inference',
                        description: 'Integrated neural translation models with clean caching layers for rapid multi-language text and speech conversion.'
                    }
                ],
                tags: ['Python', 'NLP', 'REST APIs', 'React', 'System Design'],
                hasCertificate: false,
                architectureNote: 'Asynchronous Python backend orchestrating neural machine translation endpoints with client-side language auto-detection and instant fallback caching.'
            },
            {
                id: 'aimer-society',
                stopCode: '03',
                shortLabel: '03',
                islandName: 'BioMed Atoll',
                period: '2024',
                shortPeriod: '2024',
                title: 'AIMER Society',
                product: null,
                role: 'AI Medical Intern',
                category: 'Healthcare AI',
                isCurrent: false,
                coordinates: { x: 44, y: 73 },
                labelPosition: 'top',
                accentColor: '#22d3ee',
                summary: 'Applied computer vision and deep learning workflows to medical imaging diagnostics and healthcare data analytics.',
                highlights: [
                    {
                        title: 'Medical Image Classification',
                        description: 'Trained and evaluated convolutional neural network models for diagnostic screening on structured clinical datasets.'
                    },
                    {
                        title: 'Model Evaluation & Explainability',
                        description: 'Implemented precision-recall benchmarking and visual saliency checks to improve clinical prediction reliability.'
                    }
                ],
                tags: ['Deep Learning', 'Computer Vision', 'Python', 'TensorFlow', 'Healthcare AI'],
                hasCertificate: true,
                certificateDetails: {
                    title: 'Certificate of AI Medical Internship',
                    issuer: 'AIMER Society (Artificial Intelligence Medical & Engineering Researchers)',
                    recipient: 'Tusha Rahul',
                    domain: 'Applied AI & Medical Imaging Systems',
                    duration: '2024',
                    credentialId: 'AIMER-MED-2024-419',
                    fileUrl: 'img/aimers.jpeg'
                },
                architectureNote: 'Preprocessing pipeline with DICOM/image normalization feeding transfer-learned CNN classifiers with Grad-CAM visual interpretability.'
            },
            {
                id: 'datavalley',
                stopCode: '04',
                shortLabel: '04',
                islandName: 'Serpent Bay',
                period: 'Duration - 6 Months (2024 — 2025)',
                shortPeriod: '2024 – 2025',
                title: 'DataValley',
                product: null,
                role: 'Python Web Intern',
                category: 'Full-Stack Internship',
                isCurrent: false,
                coordinates: { x: 61, y: 31 },
                labelPosition: 'bottom',
                accentColor: '#22d3ee',
                summary: 'Developed full-stack Python web applications with dynamic backend routing and responsive frontend interfaces.',
                highlights: [
                    {
                        title: 'Python Full-Stack Engineering',
                        description: 'Completed comprehensive web development projects using Python, HTML, CSS, and JavaScript to create responsive, user-friendly interfaces.'
                    },
                    {
                        title: 'Dynamic Web Applications',
                        description: 'Built server-backed CRUD workflows, REST endpoints, and interactive client dashboards with clean state handling.'
                    }
                ],
                tags: ['Python', 'HTML5', 'CSS3', 'JavaScript', 'Full-Stack Web'],
                hasCertificate: true,
                certificateDetails: {
                    title: 'Certificate of Internship Completion',
                    issuer: 'DataValley IT Solutions',
                    recipient: 'Tusha Rahul',
                    domain: 'Python Full-Stack Web Development',
                    duration: '6 Months (2024 – 2025)',
                    credentialId: 'DV-PY-2025-8841',
                    fileUrl: 'img/DV-1c02cd48-Tusha Rahul Bellamkonda_InternshipCertificate.pdf'
                },
                architectureNote: 'Python web server handling structured routes and templating paired with responsive JavaScript DOM controllers.'
            },
            {
                id: 'tiger-analytics',
                stopCode: '05',
                shortLabel: '05',
                islandName: 'Analytics Cape',
                period: 'April 2025 — July 2025',
                shortPeriod: 'Apr – Jul 2025',
                title: 'Tiger Analytics',
                product: null,
                role: 'Data Science & Analytics Intern',
                category: 'Enterprise Analytics',
                isCurrent: false,
                coordinates: { x: 76, y: 69 },
                labelPosition: 'top',
                accentColor: '#22d3ee',
                summary: 'Engineered large-scale retail data pipelines and executive BI dashboards driving measurable reporting speedups.',
                highlights: [
                    {
                        title: 'Data Engineering',
                        description: 'Performed feature engineering and exploratory analysis on 5GB+ retail datasets using Python and SQL.'
                    },
                    {
                        title: 'Executive Dashboarding',
                        description: 'Designed Power BI dashboards reducing executive report generation time by 30% and improving decision visibility.'
                    }
                ],
                tags: ['Python', 'SQL', 'Power BI', 'Feature Engineering', '5GB+ Retail EDA'],
                hasCertificate: false,
                architectureNote: 'SQL + Pandas ETL transformation layer feeding optimized star-schema data models into interactive Power BI executive KPI views.'
            },
            {
                id: 'tabner-inc',
                stopCode: 'X',
                shortLabel: 'X',
                islandName: 'Laugh Tale • AI Summit',
                period: 'June 2025 — Present',
                shortPeriod: 'Jun 2025 – Present',
                title: 'Tabner Inc.',
                product: 'KonfigAI',
                role: 'Applied AI Engineer & AI Agent Developer',
                category: 'Current Role • Production AI',
                isCurrent: true,
                coordinates: { x: 84, y: 34 },
                labelPosition: 'bottom',
                accentColor: '#facc15',
                summary: 'Architecting multi-tenant RAG systems, Text-to-SQL agents, and cloud-native AI pipelines in production.',
                highlights: [
                    {
                        title: 'Multi-Tenant RAG (DocPortal)',
                        description: 'Architected a multi-tenant RAG platform (DocPortal) using FastAPI, Weaviate, and hybrid retrieval, enabling 50+ enterprise users to query 1,000+ documents.',
                        tokens: ['DocPortal', 'FastAPI', 'Weaviate']
                    },
                    {
                        title: 'Search Optimization (58% → 85%)',
                        description: 'Improved retrieval accuracy from 58% to 85% using HNSW Hybrid Search, metadata filtering, and retrieval evaluation pipelines.',
                        tokens: ['HNSW Hybrid Search']
                    },
                    {
                        title: 'SQL Agent (Pioneer Nexus)',
                        description: 'Developed an LLM-powered Text-to-SQL assistant (Pioneer Nexus) for PostgreSQL analytics, reducing analyst query creation time by 40%.',
                        tokens: ['Pioneer Nexus', 'PostgreSQL']
                    },
                    {
                        title: 'HR Automation & Cloud Ops',
                        description: 'Orchestrated Azure data pipelines reducing candidate screening time by 50%, and managed GCP Kubernetes deployments with 99.9% availability.',
                        tokens: ['Azure', 'GCP', 'Kubernetes']
                    }
                ],
                tags: ['KonfigAI', 'FastAPI', 'Weaviate', 'RAG', 'Text-to-SQL', 'GCP & K8s'],
                hasCertificate: false,
                architectureNote: 'Multi-tenant FastAPI + Weaviate HNSW hybrid vector retrieval engine paired with guardrailed Text-to-SQL agents deployed on GCP Kubernetes.'
            }
        ];

        // Active state defaults to Tabner Inc. (Stop X)
        let activeIndex = 5;
        let viewMode = 'voyage';
        let isAutoTour = false;
        let autoTourTimer = null;

        // Elements cache
        const beacon = document.getElementById('expShipBeacon');
        const nodes = Array.from(document.querySelectorAll('.exp-milestone-node'));
        const pillsContainer = document.getElementById('expStepperPills');
        const counterNum = document.querySelector('#expStepperCounter .counter-num');
        const stepperIsland = document.getElementById('expStepperIsland');
        const stepperCategory = document.getElementById('expStepperCategory');

        const logbookHeader = document.getElementById('logbookHeader');
        const logbookStopBadge = document.getElementById('logbookStopBadge');
        const logbookPeriod = document.getElementById('logbookPeriod');
        const logbookTitle = document.getElementById('logbookTitle');
        const logbookRole = document.getElementById('logbookRole');
        const logbookTags = document.getElementById('logbookTags');
        const logbookSummary = document.getElementById('logbookSummary');
        const logbookHighlights = document.getElementById('logbookHighlights');
        const logbookMainActionText = document.getElementById('logbookMainActionText');
        const logbookMainActionIcon = document.getElementById('logbookMainActionIcon');

        const deckStage = document.getElementById('expDeckStage');
        const deckDots = document.getElementById('expDeckDots');

        function highlightTokens(text, tokens) {
            if (!tokens || !tokens.length) return text;
            const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            const regex = new RegExp(`(${escaped.join('|')})`, 'g');
            return text.replace(regex, '<span class="highlight-token">$1</span>');
        }

        // Render Deck Selector Cards (Master-Detail List)
        function renderDeckSelectorCards() {
            if (!deckStage) return;
            deckStage.innerHTML = '';
            MILESTONES.forEach((m, i) => {
                const card = document.createElement('div');
                card.className = `exp-deck-item-card ${i === activeIndex ? 'is-active' : ''} ${m.isCurrent ? 'is-gold-card' : ''}`;
                card.innerHTML = `
                    <div class="d-flex align-items-center justify-content-between mb-1">
                        <span class="deck-item-badge ${m.isCurrent ? 'is-gold' : ''}">
                            ${m.isCurrent ? '<i class="fas fa-star me-1 text-warning"></i>NOW &bull; Stop X' : `<i class="fas fa-anchor me-1"></i>Stop ${m.stopCode}`}
                        </span>
                        <span class="deck-item-period">${m.shortPeriod}</span>
                    </div>
                    <div class="deck-item-title">${m.title} ${m.product ? `<span class="text-info font-weight-normal" style="font-size:0.8rem;">(${m.product})</span>` : ''}</div>
                    <div class="deck-item-role">${m.role}</div>
                    <div class="deck-item-tags">
                        ${m.tags.slice(0, 3).map(t => `<span class="deck-mini-tag">${t}</span>`).join('')}
                    </div>
                `;
                card.addEventListener('click', () => {
                    goToExpMilestone(i);
                });
                deckStage.appendChild(card);
            });
        }
        renderDeckSelectorCards();

        // Render Stepper Pills & Deck Dots
        function buildNavDots() {
            if (pillsContainer) {
                pillsContainer.innerHTML = '';
                MILESTONES.forEach((m, i) => {
                    const dot = document.createElement('button');
                    dot.type = 'button';
                    dot.className = `stepper-dot ${i === activeIndex ? 'active' : ''} ${m.isCurrent ? 'is-gold' : ''}`;
                    dot.setAttribute('aria-label', `Select milestone ${m.title}`);
                    dot.addEventListener('click', () => goToExpMilestone(i));
                    pillsContainer.appendChild(dot);
                });
            }

            if (deckDots) {
                deckDots.innerHTML = '';
                MILESTONES.forEach((m, i) => {
                    const dot = document.createElement('button');
                    dot.type = 'button';
                    dot.className = `deck-dot ${i === activeIndex ? 'active' : ''} ${m.isCurrent ? 'is-gold' : ''}`;
                    dot.setAttribute('aria-label', `Jump to ${m.title}`);
                    dot.addEventListener('click', () => goToExpMilestone(i));
                    deckDots.appendChild(dot);
                });
            }
        }

        buildNavDots();

        function updateVoyageUI() {
            const m = MILESTONES[activeIndex];
            if (!m) return;

            // 1. Move sailing beacon
            if (beacon) {
                beacon.style.left = `${m.coordinates.x}%`;
                beacon.style.top = `${m.coordinates.y}%`;
                const ping = beacon.querySelector('.beacon-ping');
                if (ping) {
                    ping.className = `beacon-ping ${m.isCurrent ? 'is-gold' : ''}`;
                }
            }

            // 2. Highlight map node
            nodes.forEach((node, i) => {
                node.classList.toggle('is-selected', i === activeIndex);
            });

            // 3. Update stepper bar
            if (counterNum) {
                counterNum.textContent = m.stopCode === 'X' ? '06' : `0${activeIndex + 1}`;
                counterNum.className = `counter-num ${m.isCurrent ? 'text-warning' : 'text-accent'}`;
            }
            if (stepperIsland) {
                stepperIsland.textContent = m.islandName;
            }
            if (stepperCategory) {
                stepperCategory.innerHTML = `<i class="fas fa-ship text-info me-1"></i><span>${m.category}</span>`;
            }

            const dots = pillsContainer ? Array.from(pillsContainer.querySelectorAll('.stepper-dot')) : [];
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === activeIndex);
            });

            // 4. Update Captain's Logbook Card
            if (logbookHeader) {
                logbookHeader.classList.toggle('is-gold-header', m.isCurrent);
            }
            const captainBanner = document.getElementById('logbookCurrentCaptainBanner');
            if (captainBanner) {
                captainBanner.style.display = m.isCurrent ? 'flex' : 'none';
            }
            if (logbookStopBadge) {
                logbookStopBadge.className = `logbook-stop-badge ${m.isCurrent ? 'is-gold' : ''}`;
                logbookStopBadge.innerHTML = m.isCurrent
                    ? '<img src="img/tusha-avatar.png" alt="Tusha Rahul" class="logbook-mini-avatar me-1"> Current Station &bull; Stop X'
                    : `<i class="fas fa-anchor me-1"></i> Logbook Stop ${m.stopCode}`;
            }
            if (logbookPeriod) {
                logbookPeriod.textContent = m.period;
            }
            if (logbookTitle) {
                logbookTitle.innerHTML = `${m.title} ${m.product ? `<span class="logbook-product text-info">(Product: ${m.product})</span>` : ''}`;
            }
            if (logbookRole) {
                logbookRole.className = `logbook-role ${m.isCurrent ? 'is-gold' : ''}`;
                logbookRole.textContent = m.role;
            }
            if (logbookTags) {
                logbookTags.innerHTML = m.tags.map(tag => `<span class="logbook-tag-pill">${tag}</span>`).join('');
            }
            if (logbookSummary) {
                logbookSummary.textContent = m.summary;
            }
            if (logbookHighlights) {
                logbookHighlights.innerHTML = m.highlights.map(h => `
                    <div class="highlight-bullet-card">
                        <span class="highlight-dot ${m.isCurrent ? 'is-gold' : ''}"></span>
                        <p class="highlight-text">
                            <strong class="text-white">${h.title}:</strong>
                            ${highlightTokens(h.description, h.tokens)}
                        </p>
                    </div>
                `).join('');
            }
            if (logbookMainActionText && logbookMainActionIcon) {
                if (m.hasCertificate) {
                    logbookMainActionIcon.className = 'fas fa-award me-1.5';
                    logbookMainActionText.textContent = 'View Certificate';
                } else {
                    logbookMainActionIcon.className = 'fas fa-microchip me-1.5';
                    logbookMainActionText.textContent = 'Inspect Architecture';
                }
            }
        }

        const expDeckDetailCard = document.getElementById('expDeckDetailCard');

        function updateDeckUI() {
            const m = MILESTONES[activeIndex];
            if (!m) return;

            // 1. Update Left Detail Card with complete content nicely
            if (expDeckDetailCard) {
                expDeckDetailCard.innerHTML = `
                    <div class="exp-deck-detail-header ${m.isCurrent ? 'is-gold-header' : ''}">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <span class="logbook-stop-badge ${m.isCurrent ? 'is-gold' : ''}">
                                ${m.isCurrent ? '<img src="img/tusha-avatar.png" alt="Tusha Rahul" class="logbook-mini-avatar me-1"> Current Station &bull; Stop X' : `<i class="fas fa-anchor me-1"></i> Stop ${m.stopCode} &bull; ${m.islandName}`}
                            </span>
                            <span class="logbook-period-text">${m.period}</span>
                        </div>

                        ${m.isCurrent ? `
                            <div class="exp-deck-captain-banner">
                                <img src="img/tusha-avatar.png" alt="Tusha Rahul" class="captain-banner-avatar">
                                <div class="captain-banner-info">
                                    <span class="captain-banner-tag"><i class="fas fa-map-marker-alt text-warning me-1"></i>CURRENT STATION</span>
                                    <span class="captain-banner-status">Tusha Rahul &bull; Applied AI Engineer</span>
                                </div>
                            </div>
                        ` : ''}

                        <h3 class="exp-deck-title">
                            ${m.title} ${m.product ? `<span class="logbook-product text-info" style="font-size: 0.95rem; font-weight: normal;">(Product: ${m.product})</span>` : ''}
                        </h3>
                        <p class="exp-deck-role ${m.isCurrent ? 'is-gold' : ''}">${m.role}</p>

                        <div class="exp-deck-tags">
                            ${m.tags.map(t => `<span class="logbook-tag-pill">${t}</span>`).join('')}
                        </div>
                    </div>

                    <div class="exp-deck-detail-body log-scrollbar">
                        <p class="exp-deck-summary">${m.summary}</p>
                        <div class="exp-deck-highlights">
                            ${m.highlights.map(h => `
                                <div class="highlight-bullet-card">
                                    <span class="highlight-dot ${m.isCurrent ? 'is-gold' : ''}"></span>
                                    <p class="highlight-text mb-0">
                                        <strong class="text-white">${h.title}:</strong>
                                        ${highlightTokens(h.description, h.tokens)}
                                    </p>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="exp-deck-detail-footer">
                        <button type="button" class="btn-logbook-action" onclick="window.openExpModal('${m.hasCertificate ? 'certificate' : 'architecture'}', ${activeIndex})">
                            <i class="fas ${m.hasCertificate ? 'fa-award' : 'fa-microchip'} me-1.5"></i>
                            <span>${m.hasCertificate ? 'View Certificate' : 'Inspect Architecture'}</span>
                        </button>

                        <button type="button" class="btn-logbook-nav" onclick="window.setExpViewMode('voyage')">
                            <i class="fas fa-map-marked-alt text-warning me-1"></i> Switch to Sea Chart
                        </button>
                    </div>
                `;
            }

            // 2. Update Right Milestone Selector Cards
            if (deckStage) {
                const cards = Array.from(deckStage.querySelectorAll('.exp-deck-item-card'));
                cards.forEach((card, i) => {
                    const isActive = i === activeIndex;
                    card.classList.toggle('is-active', isActive);
                    if (isActive) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                });
            }

            // 3. Update Deck Dots
            if (deckDots) {
                const dDots = Array.from(deckDots.querySelectorAll('.deck-dot'));
                dDots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === activeIndex);
                });
            }
        }

        function updateAllViews() {
            updateVoyageUI();
            updateDeckUI();
        }

        // Global methods
        window.goToExpMilestone = function (idx) {
            activeIndex = ((idx % 6) + 6) % 6;
            updateAllViews();
        };

        window.nextExpMilestone = function () {
            window.goToExpMilestone(activeIndex + 1);
        };

        window.prevExpMilestone = function () {
            window.goToExpMilestone(activeIndex - 1);
        };

        window.setExpViewMode = function (mode) {
            viewMode = mode;
            const btnVoyage = document.getElementById('btnExpVoyage');
            const btnDeck = document.getElementById('btnExpDeck');
            const voyageView = document.getElementById('expVoyageView');
            const deckView = document.getElementById('expDeckView');

            if (mode === 'voyage') {
                if (btnVoyage) btnVoyage.classList.add('active');
                if (btnDeck) btnDeck.classList.remove('active');
                if (voyageView) voyageView.style.display = 'flex';
                if (deckView) deckView.style.display = 'none';
                updateVoyageUI();
            } else {
                if (btnVoyage) btnVoyage.classList.remove('active');
                if (btnDeck) btnDeck.classList.add('active');
                if (voyageView) voyageView.style.display = 'none';
                if (deckView) deckView.style.display = 'flex';
                updateDeckUI();
            }
        };

        window.toggleExpAutoTour = function () {
            isAutoTour = !isAutoTour;
            const tourBtn = document.getElementById('btnExpAutoTour');
            const tourIcon = document.getElementById('expAutoTourIcon');

            if (isAutoTour) {
                if (tourBtn) tourBtn.classList.add('is-active');
                if (tourIcon) tourIcon.className = 'fas fa-pause';
                autoTourTimer = setInterval(() => {
                    window.nextExpMilestone();
                }, 4200);
            } else {
                if (tourBtn) tourBtn.classList.remove('is-active');
                if (tourIcon) tourIcon.className = 'fas fa-play';
                if (autoTourTimer) {
                    clearInterval(autoTourTimer);
                    autoTourTimer = null;
                }
            }
        };

        window.handleLogbookMainAction = function () {
            const m = MILESTONES[activeIndex];
            if (!m) return;
            window.openExpModal(m.hasCertificate ? 'certificate' : 'architecture', activeIndex);
        };

        window.openExpModal = function (type, milestoneIndex) {
            const m = MILESTONES[milestoneIndex !== undefined ? milestoneIndex : activeIndex];
            if (!m) return;

            const modal = document.getElementById('expDetailModal');
            const content = document.getElementById('expModalContent');
            if (!modal || !content) return;

            if (type === 'certificate' && m.certificateDetails) {
                const cert = m.certificateDetails;
                content.innerHTML = `
                    <div style="border: 2px dashed rgba(250, 204, 21, 0.45); border-radius: 14px; padding: 22px; background: linear-gradient(135deg, #1b1812, #101216); text-align: center;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(249, 115, 22, 0.16); border: 1px solid rgba(249, 115, 22, 0.4); display: grid; place-items: center; margin: 0 auto 12px auto;">
                            <i class="fas fa-award text-warning" style="font-size: 1.4rem;"></i>
                        </div>
                        <p style="font-size: 0.68rem; text-transform: uppercase; letter-spacing: 2px; color: #22d3ee; font-weight: 700; margin-bottom: 4px;">
                            ${cert.issuer}
                        </p>
                        <h3 style="font-size: 1.25rem; font-weight: 800; color: #ffffff; margin-bottom: 8px;">
                            ${cert.title}
                        </h3>
                        <p style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 2px;">Awarded to</p>
                        <p style="font-size: 1.15rem; font-weight: 800; color: #f97316; letter-spacing: 0.5px; margin-bottom: 8px;">
                            ${cert.recipient}
                        </p>
                        <p style="font-size: 0.8rem; line-height: 1.5; color: #cbd5e1; margin-bottom: 14px;">
                            Successfully completed <strong>${cert.domain}</strong> (${cert.duration}).
                        </p>
                        <div class="d-flex align-items-center justify-content-between pt-3" style="border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.72rem; color: #94a3b8;">
                            <span class="text-success font-weight-bold"><i class="fas fa-check-circle me-1"></i> Verified Credential</span>
                            <span style="font-family: 'JetBrains Mono', monospace;">ID: ${cert.credentialId}</span>
                        </div>
                        <div class="mt-3">
                            <a href="${cert.fileUrl}" target="_blank" rel="noopener" class="btn-logbook-action" style="text-decoration:none; display:inline-flex;">
                                <i class="fas fa-external-link-alt me-1.5"></i> Open Original Credential
                            </a>
                        </div>
                    </div>
                `;
            } else {
                content.innerHTML = `
                    <div>
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <div class="d-flex align-items-center gap-2" style="font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; color: #22d3ee; text-transform: uppercase; letter-spacing: 1px;">
                                <i class="fas fa-terminal"></i>
                                <span>System &amp; Impact Breakdown &bull; Stop ${m.stopCode}</span>
                            </div>
                            ${m.isCurrent ? '<img src="img/tusha-avatar.png" alt="Tusha Rahul" class="deck-avatar-thumb" title="Current Active Station">' : ''}
                        </div>
                        <h3 style="font-size: 1.25rem; font-weight: 800; color: #ffffff; margin-bottom: 3px;">
                            ${m.title} ${m.product ? `<span class="text-info">(${m.product})</span>` : ''}
                        </h3>
                        <p style="font-size: 0.78rem; font-weight: 600; color: ${m.isCurrent ? '#facc15' : '#f97316'}; margin-bottom: 14px;">
                            ${m.role} &bull; ${m.period}
                        </p>
                        <div style="padding: 12px 14px; border-radius: 12px; background: #0c0f14; border: 1px solid rgba(34, 211, 238, 0.25); margin-bottom: 14px;">
                            <div style="font-size: 0.68rem; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; color: #22d3ee; font-weight: 700; margin-bottom: 4px;">
                                <i class="fas fa-microchip me-1"></i> Architecture Blueprint
                            </div>
                            <p style="font-size: 0.78rem; line-height: 1.5; color: #cbd5e1; margin: 0;">
                                ${m.architectureNote}
                            </p>
                        </div>
                        <div class="log-scrollbar" style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
                            ${m.highlights.map(h => `
                                <div style="padding: 8px 10px; border-radius: 8px; background: #171b22; border: 1px solid rgba(255,255,255,0.08); font-size: 0.74rem; line-height: 1.45; color: #d1d5db;">
                                    <strong class="text-white">${h.title}:</strong>
                                    ${highlightTokens(h.description, h.tokens)}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            modal.style.display = 'flex';
        };

        window.closeExpModal = function () {
            const modal = document.getElementById('expDetailModal');
            if (modal) modal.style.display = 'none';
        };

        // Horizontal drag / wheel for experience chart
        let chartStartX = null;
        const chartElem = document.getElementById('expVoyageChart');
        if (chartElem) {
            chartElem.addEventListener('mousedown', (e) => {
                if (e.target.closest('button, a')) return;
                chartStartX = e.clientX;
            });
            window.addEventListener('mouseup', (e) => {
                if (chartStartX === null) return;
                const diff = e.clientX - chartStartX;
                chartStartX = null;
                if (Math.abs(diff) > 40) {
                    if (diff < 0) window.nextExpMilestone();
                    else window.prevExpMilestone();
                }
            });
            chartElem.addEventListener('wheel', (e) => {
                const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
                if (!isHorizontal) return; // Allow vertical wheel to bubble to slideshow!
                const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                if (Math.abs(delta) > 12) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (delta > 0) window.nextExpMilestone();
                    else window.prevExpMilestone();
                }
            }, { passive: false });
        }

        // Initial render
        updateAllViews();
    }

    /**
     * Setup a Horizontal Gallery around a Track
     */
    function setupGallery(sectionId, track) {
        if (!track) return;

        track.classList.add('gallery-track');

        // Wrap in gallery-wrapper if not already wrapped
        let wrapper = track.parentElement;
        if (!wrapper.classList.contains('gallery-wrapper')) {
            wrapper = document.createElement('div');
            wrapper.className = 'gallery-wrapper';
            track.parentNode.insertBefore(wrapper, track);
            wrapper.appendChild(track);
        }

        // Create Left Arrow
        if (!wrapper.querySelector('.gallery-nav-arrow.prev')) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'gallery-nav-arrow prev';
            prevBtn.setAttribute('aria-label', `Previous ${sectionId}`);
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = track.querySelector('[class*="col-"], .timeline-item');
                const step = card ? card.offsetWidth + 24 : 400;
                track.scrollBy({ left: -step, behavior: 'smooth' });
            });
            wrapper.appendChild(prevBtn);
        }

        // Create Right Arrow
        if (!wrapper.querySelector('.gallery-nav-arrow.next')) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'gallery-nav-arrow next';
            nextBtn.setAttribute('aria-label', `Next ${sectionId}`);
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = track.querySelector('[class*="col-"], .timeline-item');
                const step = card ? card.offsetWidth + 24 : 400;
                track.scrollBy({ left: step, behavior: 'smooth' });
            });
            wrapper.appendChild(nextBtn);
        }

        // Attach Mouse Drag-To-Scroll
        initDragToScroll(track);
    }

    /**
     * Mouse Drag-To-Scroll Helper
     */
    function initDragToScroll(track) {
        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;
        let hasMoved = false;

        track.addEventListener('mousedown', (e) => {
            // Ignore if clicking a button or link
            if (e.target.closest('a, button')) return;

            isDown = true;
            hasMoved = false;
            track.classList.add('grabbing');
            startX = e.pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft;
        });

        track.addEventListener('mouseleave', () => {
            isDown = false;
            track.classList.remove('grabbing');
        });

        track.addEventListener('mouseup', () => {
            isDown = false;
            track.classList.remove('grabbing');
        });

        track.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - track.offsetLeft;
            const walk = (x - startX) * 1.5;
            if (Math.abs(walk) > 5) {
                hasMoved = true;
            }
            track.scrollLeft = scrollLeft - walk;
        });

        track.addEventListener('click', (e) => {
            if (hasMoved) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
    }

    /**
     * Switch Slides (GSAP Transitions)
     */
    function goToSlide(targetIndex, direction = null) {
        if (!isSlideshowMode) return;
        if (targetIndex < 0 || targetIndex >= slideElements.length) return;
        if (targetIndex === currentIndex || isAnimating) return;

        if (direction === null) {
            direction = targetIndex > currentIndex ? 1 : -1;
        }

        isAnimating = true;
        isLocked = true;
        lastSlideChangeTime = Date.now();
        clearTimeout(wheelQuietTimer);
        wheelQuietTimer = setTimeout(() => {
            isLocked = false;
        }, MIN_SLIDE_INTERVAL);

        const currentSlide = slideElements[currentIndex];
        const nextSlide = slideElements[targetIndex];

        // Slate Moving Up Animation (Tactile Physical Slate Glide)
        if (typeof gsap !== 'undefined') {
            gsap.killTweensOf([currentSlide, nextSlide]);

            // Position incoming slide above or below viewport
            nextSlide.classList.add('slide-active');
            
            if (direction > 0) {
                // NEXT SLIDE (STACKING UP):
                // currentSlide stays firmly in place as the base slate underneath (zIndex 10)
                // nextSlide glides UP from below (yPercent: 100 -> 0) with a tactile edge shadow, stacking on top (zIndex 25)
                nextSlide.classList.add('slide-active');

                gsap.set(currentSlide, {
                    zIndex: 10,
                    yPercent: 0,
                    scale: 1,
                    opacity: 1,
                    filter: 'brightness(1)'
                });

                gsap.set(nextSlide, {
                    visibility: 'visible',
                    yPercent: 100,
                    scale: 1,
                    opacity: 1,
                    zIndex: 25,
                    boxShadow: '0 -28px 75px rgba(0, 0, 0, 0.95), 0 -4px 25px rgba(255, 107, 53, 0.15)'
                });

                const tl = gsap.timeline({
                    onComplete: () => {
                        currentSlide.classList.remove('slide-active');
                        gsap.set(currentSlide, { visibility: 'hidden', opacity: 0, filter: 'none' });
                        gsap.set(nextSlide, { boxShadow: 'none' });
                        currentIndex = targetIndex;
                        isAnimating = false;
                        nextSlide.scrollTop = 0;
                        updateSlideUI();
                    }
                });

                // Base slate subtly deepens in tone as the new slate covers it, but stays completely stationary
                tl.to(currentSlide, {
                    filter: 'brightness(0.72)',
                    duration: 0.65,
                    ease: 'power2.out'
                }, 0);

                // Incoming slate slides UP smoothly over the previous slide, stacking physically on top
                tl.to(nextSlide, {
                    yPercent: 0,
                    duration: 0.65,
                    ease: 'power3.out'
                }, 0);

            } else {
                // PREVIOUS SLIDE (UNSTACKING / REVEALING BASE SLATE):
                // nextSlide is the slate that was already underneath (zIndex 10, yPercent 0)
                // currentSlide is the top slate (zIndex 25) which slides DOWN (yPercent: 0 -> 100), revealing nextSlide!
                nextSlide.classList.add('slide-active');

                gsap.set(nextSlide, {
                    visibility: 'visible',
                    yPercent: 0,
                    scale: 1,
                    opacity: 1,
                    zIndex: 10,
                    filter: 'brightness(0.72)'
                });

                gsap.set(currentSlide, {
                    zIndex: 25,
                    opacity: 1,
                    scale: 1,
                    yPercent: 0,
                    boxShadow: '0 -28px 75px rgba(0, 0, 0, 0.95)'
                });

                const tl = gsap.timeline({
                    onComplete: () => {
                        currentSlide.classList.remove('slide-active');
                        gsap.set(currentSlide, { visibility: 'hidden', yPercent: 0, opacity: 0, boxShadow: 'none', filter: 'none' });
                        gsap.set(nextSlide, { filter: 'none' });
                        currentIndex = targetIndex;
                        isAnimating = false;
                        nextSlide.scrollTop = 0;
                        updateSlideUI();
                    }
                });

                // Base slate restores full brightness as top slate slides away
                tl.to(nextSlide, {
                    filter: 'brightness(1)',
                    duration: 0.65,
                    ease: 'power2.out'
                }, 0);

                // Top slate slides DOWN off the viewport, smoothly revealing the previous slide underneath
                tl.to(currentSlide, {
                    yPercent: 100,
                    duration: 0.65,
                    ease: 'power3.inOut'
                }, 0);
            }
        } else {
            // Fallback without GSAP
            currentSlide.classList.remove('slide-active');
            nextSlide.classList.add('slide-active');
            currentIndex = targetIndex;
            isAnimating = false;
            nextSlide.scrollTop = 0;
            updateSlideUI();
        }
    }

    /**
     * Update Slideshow UI Elements (Dots, Bottom Bar, Navbar)
     */
    function updateSlideUI() {
        // 1. Update Dots
        const dotItems = document.querySelectorAll('.slideshow-dot-item');
        dotItems.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === currentIndex);
        });

        // 2. Update Bottom Bar
        const currentNumEl = document.querySelector('.current-slide-num');
        const nameEl = document.getElementById('slideCurrentName');
        const prevBtn = document.getElementById('slidePrevBtn');
        const nextBtn = document.getElementById('slideNextBtn');

        if (currentNumEl) {
            currentNumEl.textContent = currentIndex + 1 < 10 ? `0${currentIndex + 1}` : currentIndex + 1;
        }
        if (nameEl) {
            nameEl.textContent = SLIDE_NAMES[currentIndex];
        }
        if (prevBtn) {
            prevBtn.disabled = currentIndex === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = currentIndex === slideElements.length - 1;
        }

        // 3. Update Navbar Active Link
        const activeHash = `#${SLIDE_IDS[currentIndex]}`;
        const navLinks = document.querySelectorAll('.navbar-nav a.nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === activeHash);
        });

        // 4. Update URL Hash silently
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, null, activeHash);
        }

        // 5. Update WebGL Ripples canvas if returning to hero slide
        if (currentIndex === 0 && typeof window.jQuery !== 'undefined') {
            const $hero = window.jQuery('#home');
            if ($hero.length && typeof $hero.ripples === 'function') {
                setTimeout(() => {
                    try {
                        $hero.ripples('updateSize');
                    } catch (e) {}
                }, 150);
            }
        }
    }

    /**
     * Enable Slideshow Mode
     */
    function enableSlideshowMode(targetIndex = 0) {
        isSlideshowMode = true;
        document.documentElement.classList.add('slideshow-active');
        document.body.classList.add('slideshow-active');

        slideElements.forEach((el, idx) => {
            el.classList.add('slideshow-slide');
            if (idx === targetIndex) {
                el.classList.add('slide-active');
                if (typeof gsap !== 'undefined') {
                    gsap.set(el, { visibility: 'visible', opacity: 1, yPercent: 0, zIndex: 10, filter: 'none' });
                }
            } else {
                el.classList.remove('slide-active');
                if (typeof gsap !== 'undefined') {
                    gsap.set(el, { visibility: 'hidden', opacity: 0, yPercent: 0, zIndex: 1, filter: 'none' });
                }
            }
        });

        currentIndex = targetIndex;
        updateSlideUI();

        // Move mode toggle button to document.body so it floats when navbar disappears
        const btn = document.getElementById('portfolioModeToggle');
        if (btn && btn.parentElement && btn.parentElement.id === 'portfolioModeToggleLi') {
            document.body.appendChild(btn);
        }

        updateToggleButtonUI();
        localStorage.setItem('tusha_portfolio_mode', 'slideshow');
    }

    /**
     * Enable Normal Browsing Mode
     */
    function enableNormalMode() {
        isSlideshowMode = false;
        document.documentElement.classList.remove('slideshow-active');
        document.body.classList.remove('slideshow-active');

        slideElements.forEach(el => {
            el.classList.remove('slideshow-slide', 'slide-active');
            if (typeof gsap !== 'undefined') {
                gsap.set(el, { clearProps: 'all' });
            }
        });

        // Move mode toggle button back into the navbar menu item
        const btn = document.getElementById('portfolioModeToggle');
        const navLi = document.getElementById('portfolioModeToggleLi');
        if (btn && navLi) {
            navLi.appendChild(btn);
        }

        // Scroll to the current section in normal mode
        if (slideElements[currentIndex]) {
            setTimeout(() => {
                const targetOffset = $(slideElements[currentIndex]).offset().top - 70;
                $('html, body').animate({ scrollTop: targetOffset }, 600);
            }, 50);
        }

        updateToggleButtonUI();
        localStorage.setItem('tusha_portfolio_mode', 'normal');
    }

    /**
     * Toggle between Slideshow Mode and Normal Mode
     */
    function togglePortfolioMode() {
        if (isSlideshowMode) {
            enableNormalMode();
        } else {
            // Find which section is currently closest to the viewport top
            const scrollPos = window.scrollY + 120;
            let closestIdx = 0;
            let minDiff = Infinity;

            slideElements.forEach((el, idx) => {
                const diff = Math.abs(el.offsetTop - scrollPos);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestIdx = idx;
                }
            });

            enableSlideshowMode(closestIdx);
        }
    }

    /**
     * Update Toggle Button Visuals
     */
    function updateToggleButtonUI() {
        const btn = document.getElementById('portfolioModeToggle');
        if (!btn) return;

        btn.className = 'mode-toggle-btn' + (!isSlideshowMode ? ' mode-normal' : '');
        btn.querySelector('i').className = `fas ${isSlideshowMode ? 'fa-scroll' : 'fa-film'}`;
        btn.querySelector('.mode-label-text').textContent = isSlideshowMode ? 'Standard View' : 'Slideshow Mode';
    }

    /**
     * Event Listeners (One Scroll = One Slide, Gestures, Navbar)
     */
    function attachEventListeners() {
        // 1. Strict Mouse Wheel Control (1 Scroll = Exactly 1 Slide with Real-Time Momentum Absorption)
        window.addEventListener('wheel', function (e) {
            // If clue modal or experience detail modal or chatbot is active, let them scroll
            const expModal = document.getElementById('expDetailModal');
            if (expModal && expModal.style.display === 'flex') return;
            if (document.querySelector('.treasure-clue-modal.active')) return;
            if (e.target.closest('#chatbotWindow')) return;

            if (!isSlideshowMode) return;

            // If user is inside an internally scrollable element (like experience logbook detail body)
            const scrollableParent = e.target.closest('.exp-deck-detail-body, .exp-deck-scroll-track');
            if (scrollableParent) {
                const canScrollDown = scrollableParent.scrollHeight > scrollableParent.clientHeight && (scrollableParent.scrollTop + scrollableParent.clientHeight < scrollableParent.scrollHeight - 5);
                const canScrollUp = scrollableParent.scrollHeight > scrollableParent.clientHeight && (scrollableParent.scrollTop > 5);
                if (e.deltaY > 0 && canScrollDown) return;
                if (e.deltaY < 0 && canScrollUp) return;
            }

            // If horizontal gesture is dominant, let horizontal widgets handle it
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
                return;
            }

            // Always prevent vertical default page scroll in slideshow mode
            e.preventDefault();

            const now = Date.now();
            const timeSinceLastChange = now - lastSlideChangeTime;

            // MOMENTUM ABSORPTION SHIELD:
            // If we are currently animating, cooling down, or already locked:
            // We ABSORB all incoming wheel events and EXTEND the quiet timer.
            // This guarantees that trackpad inertia or fast continuous mouse wheel rolling
            // can NEVER leak past a transition and trigger subsequent slides!
            if (isAnimating || isLocked || timeSinceLastChange < MIN_SLIDE_INTERVAL) {
                clearTimeout(wheelQuietTimer);
                wheelQuietTimer = setTimeout(() => {
                    isLocked = false;
                }, 260); // Must observe at least 260ms of absolute silence before unlocking
                return;
            }

            // Threshold: require a deliberate, intentional scroll gesture (filters micro-jitters & small residual movements)
            if (Math.abs(e.deltaY) < WHEEL_DELTA_THRESHOLD) {
                return;
            }

            // Deliberate gesture confirmed: lock immediately and record timestamp
            isLocked = true;
            lastSlideChangeTime = now;

            // Keep resetting the quiet timer while this gesture's events continue to fire
            clearTimeout(wheelQuietTimer);
            wheelQuietTimer = setTimeout(() => {
                isLocked = false;
            }, 260);

            // One Deliberate Scroll = Exactly One Slide!
            if (e.deltaY > 0) {
                goToSlide(currentIndex + 1, 1);
            } else {
                goToSlide(currentIndex - 1, -1);
            }
        }, { passive: false });

        // 2. Touch Events (Swipe on mobile & tablet)
        window.addEventListener('touchstart', function (e) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        window.addEventListener('touchend', function (e) {
            if (!isSlideshowMode) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // If horizontal swipe is dominant, let horizontal widgets handle it
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                return;
            }

            const now = Date.now();
            const timeSinceLastChange = now - lastSlideChangeTime;

            // Vertical swipe triggers slide advancement
            if (Math.abs(deltaY) > 48) {
                if (isLocked || isAnimating || timeSinceLastChange < MIN_SLIDE_INTERVAL) return;

                isLocked = true;
                lastSlideChangeTime = now;

                clearTimeout(wheelQuietTimer);
                wheelQuietTimer = setTimeout(() => {
                    isLocked = false;
                }, 300);

                if (deltaY < 0) {
                    // Swiped UP -> Go to Next Slide
                    goToSlide(currentIndex + 1, 1);
                } else {
                    // Swiped DOWN -> Go to Previous Slide
                    goToSlide(currentIndex - 1, -1);
                }
            }
        }, { passive: true });

        // 3. Keyboard Navigation
        window.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                if (window.closeExpModal) window.closeExpModal();
                closeJourneyClue();
                return;
            }

            if (!isSlideshowMode) return;

            // If user is currently viewing Experience slide, ArrowLeft and ArrowRight step through milestones
            const currentSlideElem = slideElements[currentIndex];
            if (currentSlideElem && currentSlideElem.id === 'experience' && !e.target.matches('input, textarea')) {
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (window.nextExpMilestone) window.nextExpMilestone();
                    return;
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    if (window.prevExpMilestone) window.prevExpMilestone();
                    return;
                }
            }

            const now = Date.now();
            if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.target.matches('input, textarea, button'))) {
                e.preventDefault();
                if (isAnimating || isLocked || (now - lastSlideChangeTime < 700)) return;
                lastSlideChangeTime = now;
                isLocked = true;
                clearTimeout(wheelQuietTimer);
                wheelQuietTimer = setTimeout(() => { isLocked = false; }, 700);
                goToSlide(currentIndex + 1, 1);
            } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                e.preventDefault();
                if (isAnimating || isLocked || (now - lastSlideChangeTime < 700)) return;
                lastSlideChangeTime = now;
                isLocked = true;
                clearTimeout(wheelQuietTimer);
                wheelQuietTimer = setTimeout(() => { isLocked = false; }, 700);
                goToSlide(currentIndex - 1, -1);
            }
        });

        // 4. Click backdrop to close clue modal
        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('treasure-clue-modal')) {
                closeJourneyClue();
            }
        });

        // 5. Intercept Navbar Click in Slideshow Mode
        document.querySelectorAll('.navbar-nav a[href^="#"]').forEach(link => {
            link.addEventListener('click', function (e) {
                if (!isSlideshowMode) return;

                const targetId = this.getAttribute('href').replace('#', '');
                const targetIdx = SLIDE_IDS.indexOf(targetId);

                if (targetIdx !== -1) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    // Close mobile navbar collapse if open
                    const navbarCollapse = document.getElementById('navbarNav');
                    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                        if (bsCollapse) bsCollapse.hide();
                    }

                    goToSlide(targetIdx);
                }
            });
        });
    }

    // Expose API globally
    window.TushaSlideshow = {
        goToSlide,
        toggleMode: togglePortfolioMode
    };

    // Voyage / Treasure Map Global Helpers
    window.openJourneyClue = function (clueId) {
        document.querySelectorAll('.treasure-clue-modal').forEach(m => m.classList.remove('active'));
        const modal = document.getElementById(clueId);
        if (modal) {
            modal.classList.add('active');
        }
    };

    window.closeJourneyClue = function () {
        document.querySelectorAll('.treasure-clue-modal').forEach(m => m.classList.remove('active'));
    };

    window.switchExpView = function (view) {
        const map = document.getElementById('treasureMapContainer');
        const timeline = document.getElementById('experienceTimelineContainer');
        const btnMap = document.getElementById('btnShowMap');
        const btnTimeline = document.getElementById('btnShowTimeline');

        if (view === 'map') {
            if (map) map.style.display = 'block';
            if (timeline) timeline.style.display = 'none';
            if (btnMap) btnMap.classList.add('active');
            if (btnTimeline) btnTimeline.classList.remove('active');
        } else {
            if (map) map.style.display = 'none';
            if (timeline) timeline.style.display = 'block';
            if (btnMap) btnMap.classList.remove('active');
            if (btnTimeline) btnTimeline.classList.add('active');
        }
    };

})();
