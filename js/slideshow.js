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
    const MIN_SLIDE_INTERVAL = 380; // Snappy, responsive interval between slide changes
    const WHEEL_DELTA_THRESHOLD = 26; // Deliberate gesture threshold to ignore decaying inertia
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
            if (typeof ScrollToPlugin !== 'undefined') {
                gsap.registerPlugin(ScrollToPlugin);
            }
        }

        // Cache slide DOM elements
        slideElements = SLIDE_IDS.map(id => document.getElementById(id)).filter(Boolean);

        // Detect mobile screen or mobile device user agent
        const isMobile = window.innerWidth <= 991 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Check user's saved mode preference (versioned key to avoid legacy stale value)
        const savedMode = localStorage.getItem('tusha_portfolio_mode_v2');
        if (savedMode === 'normal') {
            isSlideshowMode = false;
        } else if (savedMode === 'slideshow') {
            isSlideshowMode = true;
        } else {
            // Default: Standard mode for mobile devices, Slideshow mode for desktop
            isSlideshowMode = !isMobile;
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

        // Apply initial mode without overwriting storage default
        if (isSlideshowMode) {
            enableSlideshowMode(initialSlide, false);
        } else {
            enableNormalMode(false);
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
        // Projects Carousel (First card DocPortal AI) — smooth auto-cycle when visible
        setupStacked3DCarousel({
            stageId: 'projectCarouselStage',
            prevBtnId: 'projectPrevBtn',
            nextBtnId: 'projectNextBtn',
            dotsId: 'projectDots',
            cardClass: '.project-stacked-card',
            autoPlayInterval: 4500,
            startIndex: 0,
            namespace: 'project'
        });

        // Articles Carousel (First card ALWAYS "Browse All Articles") — smooth auto-cycle when visible
        setupStacked3DCarousel({
            stageId: 'articlesCarouselStage',
            prevBtnId: 'articlesPrevBtn',
            nextBtnId: 'articlesNextBtn',
            dotsId: 'articlesDots',
            cardClass: '.article-stacked-card',
            autoPlayInterval: 5200,
            startIndex: 0,
            namespace: 'articles'
        });
    }

    /**
     * Reusable Centered Stacked 3D Card Carousel with Infinite Loop & Throttled Scroll
     */
    function setupStacked3DCarousel({ stageId, prevBtnId, nextBtnId, dotsId, cardClass, autoPlayInterval = 0, startIndex = 'middle', namespace = '' }) {
        const stage = document.getElementById(stageId);
        if (!stage) return;

        const cards = Array.from(stage.querySelectorAll(cardClass));
        if (!cards.length) return;

        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        const dotsContainer = document.getElementById(dotsId);

        const total = cards.length;
        // Start in middle for projects, or at 0 for articles (Browse All Articles)
        let activeIndex = startIndex === 'middle' ? Math.floor(total / 2) : (typeof startIndex === 'number' ? startIndex : 0);

        // Expose global controller for arrow keys and external controls
        if (namespace) {
            window[namespace + 'CarouselNext'] = () => { goTo(activeIndex + 1); resetAutoPlay(); };
            window[namespace + 'CarouselPrev'] = () => { goTo(activeIndex - 1); resetAutoPlay(); };
        }

        // Auto-Play Engine
        let autoPlayTimer = null;
        let isHovered = false;
        let isUserInteracting = false;
        let isVisibleInViewport = true;

        function startAutoPlay() {
            if (!autoPlayInterval || autoPlayInterval <= 0) return;
            stopAutoPlay();
            if (isHovered || isUserInteracting) return;
            if (document.body.classList.contains('slideshow-active')) {
                const parentSlide = stage.closest('.slideshow-slide');
                if (parentSlide && !parentSlide.classList.contains('slide-active')) return;
            } else if (!isVisibleInViewport) {
                return;
            }
            autoPlayTimer = setInterval(() => {
                if (document.body.classList.contains('slideshow-active')) {
                    const parentSlide = stage.closest('.slideshow-slide');
                    if (parentSlide && !parentSlide.classList.contains('slide-active')) return;
                }
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
            const isMobile = stageWidth <= 768;

            // Dynamically scale card spread so cards stretch across the full width of their section
            const baseSpread = isMobile
                ? Math.min(150, Math.max(90, stageWidth * 0.26))
                : Math.min(270, Math.max(180, stageWidth * 0.22));
            const extraSpread = isMobile
                ? Math.min(70, Math.max(35, stageWidth * 0.10))
                : Math.min(130, Math.max(85, stageWidth * 0.10));

            const maxVisibleOffset = isMobile ? 1 : 2;

            cards.forEach((card, i) => {
                // Circular offset wrapping for seamless infinite looping
                let offset = i - activeIndex;
                const half = total / 2;
                while (offset > half) offset -= total;
                while (offset < -half) offset += total;

                const absOffset = Math.abs(offset);
                const sign = Math.sign(offset);

                // PERFORMANCE CULLING: Completely hide cards that are far off-screen to save GPU fillrate
                if (absOffset > maxVisibleOffset) {
                    card.style.visibility = 'hidden';
                    card.style.opacity = '0';
                    card.style.pointerEvents = 'none';
                    card.classList.remove('is-active');
                    return;
                }

                card.style.visibility = 'visible';

                if (offset === 0) {
                    card.style.transform = isMobile
                        ? 'translate3d(0, 0, 0) scale(1.02) rotateY(0deg)'
                        : 'translate3d(0, 0, 0) scale(1.04) rotateY(0deg)';
                    card.style.zIndex = 30;
                    card.style.opacity = '1';
                    card.style.pointerEvents = 'auto';
                    card.classList.add('is-active');
                } else {
                    const x = sign * (baseSpread + (absOffset - 1) * extraSpread);
                    const y = absOffset * (isMobile ? 6 : 10);
                    const scale = Math.max(0.68, 1 - absOffset * 0.08);
                    const rotY = isMobile
                        ? -sign * Math.min(12, absOffset * 5)
                        : -sign * Math.min(22, absOffset * 6.5);
                    const op = Math.max(0.18, 1 - absOffset * 0.25);

                    card.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotateY(${rotY}deg)`;
                    card.style.zIndex = 30 - absOffset;
                    card.style.opacity = op;
                    // Allow interaction on center and immediately adjacent cards
                    card.style.pointerEvents = absOffset <= 1 ? 'auto' : 'none';
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

        const onMouseMove = (e) => {
            if (!isDragging) return;
            if (Math.abs(e.clientX - startX) > 6) {
                hasMoved = true;
            }
        };

        const onMouseUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            isUserInteracting = false;
            document.body.style.cursor = '';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            const diff = e.clientX - startX;
            if (Math.abs(diff) > 40) {
                if (diff < 0) goTo(activeIndex + 1);
                else goTo(activeIndex - 1);
            }
            resetAutoPlay();
        };

        stage.addEventListener('mousedown', (e) => {
            if (e.target.closest('.project-card-btn, a, button')) return;
            isDragging = true;
            isUserInteracting = true;
            stopAutoPlay();
            hasMoved = false;
            startX = e.clientX;
            document.body.style.cursor = 'grabbing';
            window.addEventListener('mousemove', onMouseMove, { passive: true });
            window.addEventListener('mouseup', onMouseUp);
        });

        let touchStartY = 0;
        stage.addEventListener('touchstart', (e) => {
            isUserInteracting = true;
            stopAutoPlay();
            startX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        stage.addEventListener('touchend', (e) => {
            isUserInteracting = false;
            const diffX = e.changedTouches[0].clientX - startX;
            const diffY = e.changedTouches[0].clientY - touchStartY;
            // Only trigger card change if horizontal swipe dominates over vertical movement
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
                if (diffX < 0) goTo(activeIndex + 1);
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
            } else if (!isHovered && !isUserInteracting) {
                startAutoPlay();
            }
        });

        window.addEventListener('slideshow:slideChanged', () => {
            const parentSlide = stage.closest('.slideshow-slide');
            if (parentSlide && parentSlide.classList.contains('slide-active')) {
                startAutoPlay();
            } else {
                stopAutoPlay();
            }
        });

        // Initial render & kick-off
        update();
        startAutoPlay();

        // Responsive spread adjustment on window resize (debounced with rAF)
        let resizeRaf = null;
        window.addEventListener('resize', () => {
            if (resizeRaf) cancelAnimationFrame(resizeRaf);
            resizeRaf = requestAnimationFrame(update);
        }, { passive: true });
    }

    /**
     * Complete 6-Milestone Grand Line Voyage & Deck View Engine
     */
    function initGrandLineVoyage() {
        const grid = document.getElementById('expTimelineGrid');
        if (!grid) return;

        const MILESTONES = [
            {
                id: 'datavalley',
                num: '01',
                themeClass: 'is-sky',
                company: 'DataValley',
                logoUrl: 'https://s3.eu-west-1.wasabisys.com/datavalley-certificates/new%20lms%20images/logo_black_font.png',
                division: 'Full-Stack Web Engineering',
                productLogoUrl: null,
                shortRole: 'Internship in Python Web Development',
                fullRole: 'Internship in Python Web Development',
                period: '2024 – 2025',
                duration: '6 Months • Internship',
                isCurrent: false,
                summary: 'Built dynamic, database-driven web applications using Python, Flask, and Django—integrating clean RESTful backends with responsive HTML, CSS, and JavaScript interfaces.',
                metrics: [
                    { value: 'Flask & Django', label: 'Backend Stack' },
                    { value: 'Full-Stack', label: 'REST API + UI' },
                    { value: '6 Months', label: 'Engineering' }
                ],
                skills: ['Python', 'Flask', 'Django', 'HTML5', 'CSS3', 'JavaScript', 'REST APIs'],
                highlights: [
                    {
                        title: 'Dynamic Python Web Applications',
                        desc: 'Developed full-stack web applications using Python, Flask, and Django with clean MVC architecture, authentication flows, and structured relational persistence.'
                    },
                    {
                        title: 'Responsive Frontend & API Integration',
                        desc: 'Integrated HTML, CSS, and JavaScript interfaces with backend REST endpoints to create responsive, accessible, and user-friendly web experiences.'
                    }
                ],
                projectsAndArticles: [
                    {
                        name: 'Verified Internship Credential',
                        subtitle: 'Python Full-Stack Web Development • 2024 – 2025',
                        primaryLabel: 'View Certificate PDF',
                        primaryUrl: 'img/DV-1c02cd48-Tusha Rahul Bellamkonda_InternshipCertificate.pdf',
                        primaryExternal: true,
                        secondaryUrl: null
                    }
                ]
            },
            {
                id: 'tiger-analytics',
                num: '02',
                themeClass: 'is-amber',
                company: 'Tiger Analytics',
                logoUrl: 'https://media.instahyre.com/images/profile/base/employer/14091/8765b29f06/Tiger_logo.webp',
                division: 'Enterprise Data Science & Business Intelligence',
                productLogoUrl: null,
                shortRole: 'Data Science and Analytics Intern',
                fullRole: 'Data Science and Analytics Intern',
                period: 'April 2025 – June 2025',
                duration: '3 Months • Internship',
                isCurrent: false,
                summary: 'Engineered predictive features and exploratory data pipelines across 5GB+ enterprise retail datasets using Python and SQL, paired with automated Power BI executive dashboards.',
                metrics: [
                    { value: '5GB+', label: 'Retail Datasets' },
                    { value: '30% Faster', label: 'Exec Reporting' },
                    { value: 'Python + SQL', label: 'Feature Pipelines' }
                ],
                skills: ['Python', 'SQL', 'Feature Engineering', 'Exploratory Data Analysis', 'Power BI', 'Retail Analytics'],
                highlights: [
                    {
                        title: 'Large-Scale Retail Data Engineering',
                        desc: 'Performed feature engineering and exploratory data analysis (EDA) on 5GB+ retail datasets using Python and SQL to uncover seasonal demand and inventory patterns.'
                    },
                    {
                        title: 'Executive Power BI Dashboarding',
                        desc: 'Designed interactive Power BI dashboards that reduced executive report generation time by 30% and significantly improved cross-team decision visibility.'
                    }
                ],
                projectsAndArticles: [
                    {
                        name: 'Verified Internship Certificate',
                        subtitle: 'Data Science & Analytics • April 2025 – June 2025 (3 Months)',
                        primaryLabel: 'View Certificate',
                        primaryIcon: 'fa-award',
                        primaryUrl: 'img/Tiger-Analytics.png',
                        primaryExternal: true,
                        secondaryLabel: 'LinkedIn Post',
                        secondaryIcon: 'fab fa-linkedin',
                        secondaryUrl: 'https://www.linkedin.com/feed/update/urn:li:ugcPost:7358874089404469248/'
                    }
                ]
            },
            {
                id: 'tabner-konfigai',
                num: '03',
                themeClass: 'is-orange',
                company: 'Tabner Inc.',
                logoUrl: 'https://tabnerglobal.com/images/logo8.png',
                division: 'KonfigAI (AI Wing & Flagship Product)',
                productLogoUrl: 'https://www.konfigai.com/assets/images/logo.svg',
                shortRole: 'Applied AI Engineer & AI Agent Developer',
                fullRole: 'Applied AI Engineer & AI Agent Developer',
                period: 'June 2025 – Present',
                duration: 'Present • Full-Time',
                isCurrent: true,
                summary: 'Working as part of Tabner Inc. on its AI wing KonfigAI—architecting multi-tenant RAG document intelligence platforms (DocPortal), Text-to-SQL analytics agents (Pioneer Nexus), and high-availability cloud AI pipelines.',
                metrics: [
                    { value: '58% → 85%', label: 'RAG Accuracy' },
                    { value: '40% Faster', label: 'SQL Query Gen' },
                    { value: '99.9%', label: 'GCP / K8s Uptime' }
                ],
                skills: ['KonfigAI', 'FastAPI', 'Weaviate', 'HNSW Hybrid RAG', 'Text-to-SQL', 'PostgreSQL', 'Azure', 'GCP & Kubernetes'],
                highlights: [
                    {
                        title: 'Multi-Tenant RAG Platform (DocPortal)',
                        desc: 'Architected a multi-tenant RAG platform (DocPortal) using FastAPI, Weaviate, and hybrid retrieval, enabling 50+ enterprise users to query 1,000+ documents with strict tenant isolation.'
                    },
                    {
                        title: 'Hybrid Search & Evaluation Optimization',
                        desc: 'Improved retrieval accuracy from 58% to 85% by implementing HNSW Hybrid Search, metadata filtering, and automated retrieval evaluation pipelines.'
                    },
                    {
                        title: 'Text-to-SQL Analytics Agent (Pioneer Nexus)',
                        desc: 'Developed an LLM-powered Text-to-SQL assistant for PostgreSQL analytics, reducing analyst query creation time by 40%.'
                    },
                    {
                        title: 'Azure HR Automation & GCP Kubernetes Production',
                        desc: 'Orchestrated Azure cloud pipelines for AI resume optimization (cutting candidate screening time by 50%) and managed Kubernetes production deployments on GCP with CI/CD automation at 99.9% availability.'
                    },
                    {
                        title: 'Open Source Multi-Agent Architecture',
                        desc: 'Maintained an active open-source footprint of multi-agent templates, reducing team-wide project setup time by 30%.'
                    }
                ],
                projectsAndArticles: [
                    {
                        name: 'DocPortal AI',
                        subtitle: 'Multi-Tenant Enterprise RAG Platform • FastAPI & Weaviate',
                        primaryLabel: 'Read Deep-Dive Article',
                        primaryUrl: 'articles/docportal-article.html',
                        primaryExternal: false,
                        secondaryLabel: 'GitHub',
                        secondaryUrl: 'https://github.com/Rahul6158/DocPortalAI'
                    },
                    {
                        name: 'Pioneer Nexus',
                        subtitle: 'Text-to-SQL & Predictive Analytics Agent • PostgreSQL',
                        primaryLabel: 'Read Deep-Dive Article',
                        primaryUrl: 'articles/pioneer-nexus-article.html',
                        primaryExternal: false,
                        secondaryLabel: 'GitHub',
                        secondaryUrl: 'https://github.com/Rahul6158/Pioneer-Nexus'
                    }
                ]
            }
        ];

        let activeModalIdx = 2;

        function renderLogoStrip(m, large = false) {
            const lgCls = large ? 'is-lg' : 'is-sm';
            return `
                <div class="exp-logo-strip">
                    <span class="exp-logo-pill ${lgCls}" title="${m.company}">
                        <img src="${m.logoUrl}" alt="${m.company} logo" loading="lazy" decoding="async" referrerpolicy="no-referrer"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                        <span style="display:none; font-size:0.7rem; font-weight:800; color:#0f172a;">${m.company}</span>
                    </span>
                    ${m.productLogoUrl ? `
                        <span class="exp-logo-x" aria-hidden="true">&times;</span>
                        <span class="exp-logo-pill ${lgCls} is-konfig" title="KonfigAI — AI Wing">
                            <img src="${m.productLogoUrl}" alt="KonfigAI logo" loading="lazy" decoding="async" referrerpolicy="no-referrer"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                            <span style="display:none; font-size:0.7rem; font-weight:800; color:#c2410c;">KonfigAI</span>
                        </span>
                    ` : ''}
                </div>
            `;
        }

        function renderHorizontalTimeline() {
            // Build vertical wiggly SVG spine dynamically
            // Each milestone gets a row: card on alternating sides, dot on spine
            const CARD_H = 160;   // approx height per row in SVG coords
            const SPINE_X = 300;  // SVG x of the vertical spine (for viewBox="0 0 600 N")
            const totalH = MILESTONES.length * CARD_H + 80;

            // Build SVG path: gently wiggly vertical line
            let pathD = `M ${SPINE_X} 40`;
            MILESTONES.forEach((_, i) => {
                const y0 = 40 + i * CARD_H;
                const y1 = y0 + CARD_H;
                const wobble = (i % 2 === 0) ? 18 : -18;
                pathD += ` C ${SPINE_X + wobble} ${y0 + 50}, ${SPINE_X - wobble} ${y1 - 50}, ${SPINE_X} ${y1}`;
            });

            // Dot Y positions
            const dotYs = MILESTONES.map((_, i) => 40 + i * CARD_H);

            // Inject SVG spine into shell (sibling of grid)
            const shell = grid.parentElement;
            let svgEl = shell.querySelector('.exp-vtl-svg');
            if (!svgEl) {
                svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svgEl.setAttribute('class', 'exp-vtl-svg');
                svgEl.setAttribute('aria-hidden', 'true');
                svgEl.setAttribute('preserveAspectRatio', 'none');
                shell.insertBefore(svgEl, grid);
            }
            svgEl.setAttribute('viewBox', `0 0 600 ${totalH}`);
            svgEl.style.height = `${totalH}px`;
            svgEl.innerHTML = `
                <defs>
                    <linearGradient id="expVGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#d99b43" stop-opacity="0.5"/>
                        <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.9"/>
                        <stop offset="100%" stop-color="#f97316" stop-opacity="0.6"/>
                    </linearGradient>
                </defs>
                <!-- Solid path up to last node, then dashed extension -->
                <path d="${pathD}" fill="none" stroke="url(#expVGrad)" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
                ${MILESTONES[MILESTONES.length - 1].isCurrent ? `
                <path d="M ${SPINE_X} ${40 + (MILESTONES.length - 1) * CARD_H} L ${SPINE_X} ${totalH - 10}"
                    fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6 6"
                    class="exp-wiggle-dash" vector-effect="non-scaling-stroke"/>
                ` : ''}
                ${dotYs.map((y, i) => {
                    const m = MILESTONES[i];
                    return `
                    <circle cx="${SPINE_X}" cy="${y}" r="7" fill="#0b0e15" stroke="${m.isCurrent ? '#f97316' : '#f59e0b'}"
                        stroke-width="2.5" vector-effect="non-scaling-stroke"/>
                    <circle cx="${SPINE_X}" cy="${y}" r="3.2" fill="${m.isCurrent ? '#f97316' : '#fbbf24'}"/>
                    ${m.isCurrent ? `<circle cx="${SPINE_X}" cy="${y}" r="10" fill="none" stroke="rgba(249,115,22,0.4)" stroke-width="1.5" vector-effect="non-scaling-stroke" class="exp-wiggle-dash"/>` : ''}
                    `;
                }).join('')}
            `;

            // Build card rows
            grid.innerHTML = MILESTONES.map((m, idx) => {
                const side = idx % 2 === 0 ? 'is-left' : 'is-right';
                return `
                <div class="exp-vtl-row ${side}">
                    <article class="exp-mini-card ${m.isCurrent ? 'is-current' : ''}" data-exp-idx="${idx}" tabindex="0" role="button" aria-label="Open experience dossier for ${m.company} — ${m.shortRole}">
                        <div class="exp-mini-top">
                            <span class="exp-mini-period">${m.period}</span>
                            ${renderLogoStrip(m, false)}
                        </div>
                        <h3 class="exp-mini-role">${m.shortRole}</h3>
                        <div class="exp-mini-company">
                            ${m.company}${m.productLogoUrl ? ' <span class="exp-mini-wing">&bull; KonfigAI</span>' : ''}
                        </div>
                        <p class="exp-mini-desc">${m.summary}</p>
                        <div class="exp-mini-footer">
                            <span class="exp-mini-hint">View details <i class="fas fa-arrow-right"></i></span>
                        </div>
                    </article>
                    <div class="exp-vtl-spacer" aria-hidden="true"></div>
                </div>
                `;
            }).join('');

            grid.querySelectorAll('.exp-mini-card').forEach(card => {
                const openFn = () => {
                    const idx = parseInt(card.getAttribute('data-exp-idx'), 10);
                    window.openExpTimelineModal(idx);
                };
                card.addEventListener('click', openFn);
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openFn();
                    }
                });
            });
        }

        function populateExpModal(idx) {
            const m = MILESTONES[idx];
            if (!m) return;

            const bodyEl = document.getElementById('expModalBody');
            const counterEl = document.getElementById('expModalCounter');

            if (counterEl) {
                counterEl.textContent = `STAGE ${m.num} / 0${MILESTONES.length}`;
            }

            if (!bodyEl) return;

            const metricsHtml = (m.metrics && m.metrics.length) ? `
                <div class="exp-modal-metrics-inline">
                    ${m.metrics.map(mt => `
                        <div class="exp-modal-metric-tile">
                            <div class="exp-modal-metric-val">${mt.value}</div>
                            <div class="exp-modal-metric-lbl">${mt.label}</div>
                        </div>
                    `).join('')}
                </div>
            ` : '';

            const skillsHtml = m.skills.map(s => `<span class="exp-modal-skill-chip">${s}</span>`).join('');
            const useTwoColDeliverables = m.highlights.length >= 4;

            const highlightsHtml = m.highlights.map((h, hIdx) => `
                <div class="exp-modal-highlight-item">
                    <span class="exp-deliverable-num">0${hIdx + 1}</span>
                    <p><strong>${h.title}:</strong> ${h.desc}</p>
                </div>
            `).join('');

            const projectsHtml = (m.projectsAndArticles && m.projectsAndArticles.length) ? `
                <div class="exp-modal-panel">
                    <h4 class="exp-modal-section-heading"><i class="fas fa-rocket"></i> Projects, Articles &amp; Credentials</h4>
                    <div class="exp-modal-projects-list">
                        ${m.projectsAndArticles.map(p => {
                            const pIcon = p.primaryIcon || (p.primaryExternal ? 'fa-file-pdf' : 'fa-book-open');
                            const sIcon = p.secondaryIcon || 'fab fa-github';
                            return `
                            <div class="exp-modal-project-card">
                                <div>
                                    <div class="exp-modal-project-title">${p.name}</div>
                                    <div class="exp-modal-project-sub">${p.subtitle}</div>
                                </div>
                                <div class="exp-modal-project-links">
                                    <a href="${p.primaryUrl}" ${p.primaryExternal ? 'target="_blank" rel="noopener"' : ''} class="exp-modal-link-btn is-primary">
                                        <i class="fas ${pIcon}"></i> ${p.primaryLabel}
                                    </a>
                                    ${p.secondaryUrl ? `
                                        <a href="${p.secondaryUrl}" target="_blank" rel="noopener" class="exp-modal-link-btn is-secondary">
                                            <i class="${sIcon}"></i> ${p.secondaryLabel || 'GitHub'}
                                        </a>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                        }).join('')}
                    </div>
                </div>
            ` : '';

            bodyEl.innerHTML = `
                <div class="exp-modal-hero-row">
                    <div class="exp-modal-hero-left">
                        ${renderLogoStrip(m, true)}
                        <div>
                            <div class="exp-modal-title-line">
                                <h3 id="modalRoleTitle" class="exp-tl-modal-company">${m.company}</h3>
                                ${m.isCurrent ? '<span class="exp-active-role-pill">Active Role</span>' : ''}
                            </div>
                            <p class="exp-tl-modal-role">${m.fullRole}</p>
                            <div class="exp-tl-modal-division">${m.division}</div>
                        </div>
                    </div>

                    <div class="exp-modal-hero-right">
                        <div class="exp-modal-hero-dates">
                            <span class="exp-period-badge ${m.themeClass}">${m.period}</span>
                            <span class="exp-tl-modal-duration">${m.duration}</span>
                        </div>
                        ${metricsHtml}
                    </div>
                </div>

                <div class="exp-modal-two-col">
                    <div class="exp-modal-col-left">
                        <div class="exp-modal-summary-box ${m.themeClass}">${m.summary}</div>

                        ${projectsHtml}

                        <div class="exp-modal-panel">
                            <h4 class="exp-modal-section-heading"><i class="fas fa-layer-group"></i> Full Technology Stack</h4>
                            <div class="exp-modal-skills-wrap">${skillsHtml}</div>
                        </div>
                    </div>

                    <div class="exp-modal-col-right">
                        <div class="exp-modal-panel">
                            <h4 class="exp-modal-section-heading"><i class="fas fa-bolt"></i> Engineering Deliverables &amp; Impact (${m.highlights.length})</h4>
                            <div class="exp-modal-highlights-list ${useTwoColDeliverables ? 'is-two-col' : ''}">${highlightsHtml}</div>
                        </div>
                    </div>
                </div>
            `;
            bodyEl.scrollTop = 0;
        }

        window.openExpTimelineModal = function (idx) {
            activeModalIdx = ((idx % MILESTONES.length) + MILESTONES.length) % MILESTONES.length;
            populateExpModal(activeModalIdx);
            const modal = document.getElementById('expTimelineModal');
            if (modal) modal.classList.add('is-open');
        };

        window.closeExpTimelineModal = function () {
            const modal = document.getElementById('expTimelineModal');
            if (modal) modal.classList.remove('is-open');
        };

        window.stepExpTimelineModal = function (delta) {
            window.openExpTimelineModal(activeModalIdx + delta);
        };

        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('expTimelineModal');
            if (!modal || !modal.classList.contains('is-open')) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                window.closeExpTimelineModal();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                window.stepExpTimelineModal(1);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                window.stepExpTimelineModal(-1);
            }
        });

        renderHorizontalTimeline();
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

        // Pause WebGL ripples on hero when moving away to save CPU/GPU cycles
        if (typeof window.jQuery !== 'undefined') {
            const $hero = window.jQuery('#home');
            if ($hero.length && typeof $hero.ripples === 'function') {
                try {
                    if (targetIndex === 0) {
                        $hero.ripples('play');
                    } else {
                        $hero.ripples('pause');
                    }
                } catch (e) { }
            }
        }

        const currentSlide = slideElements[currentIndex];
        const nextSlide = slideElements[targetIndex];

        // Failsafe: never let isAnimating/isLocked stay stuck even if a tab switch or frame drop occurs
        const failsafeTimer = setTimeout(() => {
            isAnimating = false;
            isLocked = false;
        }, 680);

        const resumeActiveTracks = () => {
            clearTimeout(failsafeTimer);
            const activeId = slideElements[targetIndex] ? slideElements[targetIndex].id : '';
            window.dispatchEvent(new CustomEvent('slideshow:slideChanged', { detail: { id: activeId } }));
        };

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
                    opacity: 1
                });

                gsap.set(nextSlide, {
                    visibility: 'visible',
                    yPercent: 100,
                    scale: 1,
                    opacity: 1,
                    zIndex: 25,
                    boxShadow: '0 -24px 60px rgba(0, 0, 0, 0.9), 0 -2px 15px rgba(255, 107, 53, 0.12)'
                });

                const tl = gsap.timeline({
                    onComplete: () => {
                        currentSlide.classList.remove('slide-active');
                        gsap.set(currentSlide, { visibility: 'hidden', opacity: 0 });
                        gsap.set(nextSlide, { boxShadow: 'none' });
                        currentIndex = targetIndex;
                        isAnimating = false;
                        nextSlide.scrollTop = 0;
                        updateSlideUI();
                        resumeActiveTracks();
                    }
                });

                // Smooth GPU-composited fade out of previous slide instead of expensive full-screen filter
                tl.to(currentSlide, {
                    opacity: 0.3,
                    duration: 0.46,
                    ease: 'power3.out',
                    force3D: true
                }, 0);

                // Incoming slate slides UP smoothly over the previous slide, stacking physically on top
                tl.to(nextSlide, {
                    yPercent: 0,
                    duration: 0.46,
                    ease: 'power3.out',
                    force3D: true
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
                    opacity: 0.35,
                    zIndex: 10
                });

                gsap.set(currentSlide, {
                    zIndex: 25,
                    opacity: 1,
                    scale: 1,
                    yPercent: 0,
                    boxShadow: '0 -24px 60px rgba(0, 0, 0, 0.9)'
                });

                const tl = gsap.timeline({
                    onComplete: () => {
                        currentSlide.classList.remove('slide-active');
                        gsap.set(currentSlide, { visibility: 'hidden', yPercent: 0, opacity: 0, boxShadow: 'none' });
                        currentIndex = targetIndex;
                        isAnimating = false;
                        nextSlide.scrollTop = 0;
                        updateSlideUI();
                        resumeActiveTracks();
                    }
                });

                // Base slate restores full opacity as top slate slides away
                tl.to(nextSlide, {
                    opacity: 1,
                    duration: 0.46,
                    ease: 'power3.out',
                    force3D: true
                }, 0);

                // Top slate slides DOWN off the viewport, smoothly revealing the previous slide underneath
                tl.to(currentSlide, {
                    yPercent: 100,
                    duration: 0.46,
                    ease: 'power3.out',
                    force3D: true
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
            resumeActiveTracks();
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
                        $hero.ripples('play');
                        $hero.ripples('updateSize');
                    } catch (e) { }
                }, 80);
            }
        }
    }

    /**
     * Enable Slideshow Mode
     */
    function enableSlideshowMode(targetIndex = 0, savePreference = true) {
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
        const activeId = slideElements[targetIndex] ? slideElements[targetIndex].id : '';
        window.dispatchEvent(new CustomEvent('slideshow:slideChanged', { detail: { id: activeId } }));

        // Move mode toggle button to document.body so it floats when navbar disappears
        const btn = document.getElementById('portfolioModeToggle');
        if (btn && btn.parentElement && btn.parentElement.id === 'portfolioModeToggleLi') {
            document.body.appendChild(btn);
        }

        updateToggleButtonUI();
        if (savePreference) {
            localStorage.setItem('tusha_portfolio_mode_v2', 'slideshow');
        }
    }

    /**
     * Enable Normal Browsing Mode
     */
    function enableNormalMode(savePreference = true) {
        isSlideshowMode = false;
        document.documentElement.classList.remove('slideshow-active');
        document.body.classList.remove('slideshow-active');

        slideElements.forEach(el => {
            el.classList.remove('slideshow-slide', 'slide-active');
            if (typeof gsap !== 'undefined') {
                gsap.set(el, { clearProps: 'all' });
            }
        });

        // Ensure hero water ripples are active and properly sized in normal mode
        if (typeof window.jQuery !== 'undefined') {
            const $hero = window.jQuery('#home');
            if ($hero.length && typeof $hero.ripples === 'function') {
                try {
                    $hero.ripples('play');
                    $hero.ripples('updateSize');
                } catch (e) { }
            }
        }

        // Move mode toggle button back into the navbar menu item
        const btn = document.getElementById('portfolioModeToggle');
        const navLi = document.getElementById('portfolioModeToggleLi');
        if (btn && navLi) {
            navLi.appendChild(btn);
        }

        // Only scroll to the current section when explicitly toggled from slideshow mode
        if (savePreference && slideElements[currentIndex]) {
            setTimeout(() => {
                const targetOffset = $(slideElements[currentIndex]).offset().top - 70;
                $('html, body').animate({ scrollTop: targetOffset }, 600);
            }, 50);
        }

        updateToggleButtonUI();
        if (savePreference) {
            localStorage.setItem('tusha_portfolio_mode_v2', 'normal');
        }
    }

    /**
     * Toggle between Slideshow Mode and Normal Mode
     */
    function togglePortfolioMode() {
        if (isSlideshowMode) {
            enableNormalMode(true);
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

            enableSlideshowMode(closestIdx, true);
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
            // If clue modal or experience modal or chatbot is active, let them scroll
            const expModal = document.getElementById('expTimelineModal');
            if (expModal && expModal.classList.contains('is-open')) return;
            if (document.querySelector('.treasure-clue-modal.active')) return;
            if (e.target.closest('#chatbotWindow')) return;

            if (!isSlideshowMode) return;

            // If user is inside an internally scrollable element (like modal body)
            const scrollableParent = e.target.closest('.exp-tl-modal-body');
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
                }, 140); // 140ms quiet window for snappy responsiveness
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
            }, 140);

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
            const expModal = document.getElementById('expTimelineModal');
            if (expModal && expModal.classList.contains('is-open')) return;

            if (e.key === 'Escape') {
                closeJourneyClue();
                return;
            }

            if (!isSlideshowMode) return;

            const currentSlideElem = slideElements[currentIndex];

            // If user is currently viewing Projects slide, ArrowLeft and ArrowRight step through project cards
            if (currentSlideElem && currentSlideElem.id === 'projects' && !e.target.matches('input, textarea')) {
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (window.projectCarouselNext) window.projectCarouselNext();
                    return;
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    if (window.projectCarouselPrev) window.projectCarouselPrev();
                    return;
                }
            }

            // If user is currently viewing Articles slide, ArrowLeft and ArrowRight step through article cards
            if (currentSlideElem && currentSlideElem.id === 'articles' && !e.target.matches('input, textarea')) {
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (window.articlesCarouselNext) window.articlesCarouselNext();
                    return;
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    if (window.articlesCarouselPrev) window.articlesCarouselPrev();
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

        // 5. Mobile Navbar Auto-Collapse Helper (Works in both Slideshow and Standard Mode)
        function closeMobileNavbar() {
            const navbarCollapse = document.getElementById('navbarNav');
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
                    const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse) || new bootstrap.Collapse(navbarCollapse, { toggle: false });
                    bsCollapse.hide();
                } else {
                    navbarCollapse.classList.remove('show');
                }
            }
        }

        // Close mobile navbar on any link or brand click in standard mode
        document.querySelectorAll('.navbar-nav .nav-link, .navbar-brand').forEach(el => {
            el.addEventListener('click', closeMobileNavbar);
        });

        // 6. Intercept Navbar Click in Slideshow Mode
        document.querySelectorAll('.navbar-nav a[href^="#"]').forEach(link => {
            link.addEventListener('click', function (e) {
                if (!isSlideshowMode) return;

                const targetId = this.getAttribute('href').replace('#', '');
                const targetIdx = SLIDE_IDS.indexOf(targetId);

                if (targetIdx !== -1) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    closeMobileNavbar();
                    goToSlide(targetIdx);
                }
            });
        });

        // 7. Standard Mode Arrow Key Support when hovering or focusing project/article carousels
        window.addEventListener('keydown', function (e) {
            if (isSlideshowMode) return;
            if (e.target.matches('input, textarea')) return;

            const hoveredStage = document.querySelector('#projectCarouselStage:hover, #articlesCarouselStage:hover');
            if (hoveredStage) {
                const isProject = hoveredStage.id === 'projectCarouselStage';
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (isProject && window.projectCarouselNext) window.projectCarouselNext();
                    else if (!isProject && window.articlesCarouselNext) window.articlesCarouselNext();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    if (isProject && window.projectCarouselPrev) window.projectCarouselPrev();
                    else if (!isProject && window.articlesCarouselPrev) window.articlesCarouselPrev();
                }
            }
        });

        // 8. Click to Advance Slide in Slideshow Mode (excluding interactive elements, widgets, and modals)
        let clickStartX = 0;
        let clickStartY = 0;
        let clickStartTime = 0;

        document.addEventListener('mousedown', function (e) {
            clickStartX = e.clientX;
            clickStartY = e.clientY;
            clickStartTime = Date.now();
        }, { passive: true });

        document.addEventListener('click', function (e) {
            if (!isSlideshowMode || isAnimating) return;

            // If user dragged (distance > 10px) or held down for > 400ms, ignore
            const dist = Math.hypot(e.clientX - clickStartX, e.clientY - clickStartY);
            if (dist > 10 || (Date.now() - clickStartTime > 400)) return;

            // Ignore if text is selected
            if (window.getSelection && window.getSelection().toString().trim().length > 0) return;

            // Ignore if any modal is currently open
            if (document.querySelector('.treasure-clue-modal.active, #portfolioModal[style*="flex"], #expTimelineModal.is-open')) return;

            // Ignore if clicking on interactive elements or interactive widgets
            const interactiveSelector = [
                'a',
                'button',
                'input',
                'textarea',
                'select',
                'label',
                '.mode-toggle-btn',
                '.slideshow-dots-nav',
                '.slideshow-bottom-bar',
                '#portfolioModeToggle',
                '#chatbotWindow',
                '#chatbotToggleBtn',
                '.chatbot-container',
                '.project-stacked-card',
                '.article-stacked-card',
                '.carousel-stage',
                '.project-carousel-controls',
                '.exp-timeline-shell',
                '.exp-wiggly-stage',
                '.exp-vtl-shell',
                '.exp-vtl-row',
                '.exp-mini-card',
                '.exp-wiggly-dot',
                '#expTimelineModal',
                '.exp-tl-modal-topbar',
                '.exp-tl-modal-card',
                '.skills-belt-container',
                '.skills-belt-track',
                '.skill-rect-card',
                '.timeline-item',
                '.cert-marquee-card',
                '.navbar',
                '.modal',
                '.modal-content'
            ].join(', ');

            if (e.target.closest(interactiveSelector)) {
                return;
            }

            // Only trigger if click occurred inside the current active slide
            const currentSlide = slideElements[currentIndex];
            if (currentSlide && (currentSlide.contains(e.target) || e.target === currentSlide)) {
                if (currentIndex < slideElements.length - 1) {
                    goToSlide(currentIndex + 1, 1);
                } else {
                    goToSlide(0, 1);
                }
            }
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
