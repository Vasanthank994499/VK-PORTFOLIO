document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.menu a');
    const sections = document.querySelectorAll('.page-section');
    const workItems = document.querySelectorAll('.work-grid .work-item');
    const workVideos = document.querySelectorAll('.work-video');
    const workThumbs = document.querySelectorAll('.work-thumb');
    let isWorkVisible = false;

    // --- MOBILE HAMBURGER TOGGLE ---
    const hamburger = document.querySelector('.hamburger');
    const menu = document.querySelector('.menu');

    if (hamburger && menu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            menu.classList.toggle('active');
        });
    }

    // --- SMOOTH NAV SCROLL ---
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            // Close mobile menu on link click
            if (hamburger && menu) {
                hamburger.classList.remove('active');
                menu.classList.remove('active');
            }

            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetEl = document.querySelector(targetId);

                if (targetId === '#home') {
                    // Manual animation restart for Home link click
                    const animatedElements = document.querySelectorAll('#home .me-image, #home .hello, #home .subtitle, #home .role');
                    animatedElements.forEach(el => {
                        el.style.animation = 'none';
                        void el.offsetWidth; // Trigger reflow
                        el.style.animation = null;
                    });
                }

                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // --- SCROLL OBSERVER (Active Link & Animations) ---
    const footer = document.querySelector('.footer-container');
    const footerRight = document.querySelector('.footer-right');

    const observerOptions = {
        threshold: 0.2 // Trigger more easily
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = entry.target.getAttribute('id');
            const navLink = document.querySelector(`.menu a[href="#${id}"]`);

            // Handle Navigation Active State
            if (entry.isIntersecting) {
                navLinks.forEach(l => l.classList.remove('active'));
                if (navLink) navLink.classList.add('active');

                // Do NOT globally remove active-section to prevent sections disappearing while still on screen.
                entry.target.classList.add('active-section');

                // Restart animations
                if (id === 'skills') {
                    document.querySelectorAll('#skills .skills-heading, #skills .software-heading, #skills .skills-list li, #skills .software-list li')
                        .forEach(el => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = null; });
                } else if (id === 'about') {
                    document.querySelectorAll('#about .about-image, #about .about-text')
                        .forEach(el => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = null; });
                } else if (id === 'work' && !isWorkVisible) {
                    const workItemsFull = document.querySelectorAll('.work-item');
                    const workHeading = document.querySelector('#work h2');
                    [...workItemsFull, workHeading].forEach(el => { if (el) { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = null; } });
                    startWorkPreview();
                }
            }

            // SPECIFIC LOGIC FOR HIRE SECTION (Footer & FAB)
            if (id === 'hire') {
                if (entry.isIntersecting) {
                    if (footer) footer.style.display = 'grid';
                    if (footerRight) footerRight.classList.add('show-fab');
                } else {
                    if (footer) footer.style.display = 'none';
                    if (footerRight) footerRight.classList.remove('show-fab');
                }
            }

            // Reset Work state
            if (id === 'work' && !entry.isIntersecting) {
                isWorkVisible = false;
                workVideos.forEach(v => v.pause());
                workThumbs.forEach(t => t.classList.add('show-thumb'));
                if (window.workPreviewTimeout) { clearTimeout(window.workPreviewTimeout); window.workPreviewTimeout = null; }
                window.workInitialPhase = false;
            }
        });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));

    // --- WORK SECTION LOGIC ---
    function startWorkPreview() {
        isWorkVisible = true;
        window.workInitialPhase = true;

        workVideos.forEach(v => {
            v.play().catch(e => console.log("Play prevented:", e));
        });
        workThumbs.forEach(t => t.classList.remove('show-thumb'));

        // After 6 seconds, switch to thumbnail mode
        window.workPreviewTimeout = setTimeout(() => {
            window.workInitialPhase = false;
            workItems.forEach(item => {
                const v = item.querySelector('.work-video');
                const t = item.querySelector('.work-thumb');
                if (!item.matches(':hover')) {
                    if (t) t.classList.add('show-thumb');
                    if (v) v.pause();
                }
            });
        }, 6000);
    }

    // Video Shuffling & Hover (Existing Logic)
    let shuffleInterval;

    function shuffleVideos() {
        if (!workItems.length) return;

        // Generate an array of positions
        const orders = Array.from({ length: workItems.length }, (_, i) => i + 1);

        // Shuffle the array elements
        for (let i = orders.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [orders[i], orders[j]] = [orders[j], orders[i]];
        }

        // Apply shuffled order to items dynamically
        workItems.forEach((item, index) => {
            // Trigger wipe animation
            item.style.animation = 'none';
            void item.offsetWidth; // Trigger reflow
            item.style.animation = 'shuffleWipe 0.5s ease';

            item.style.order = orders[index];
        });
    }

    function startVideoShuffle() {
        if (!shuffleInterval) {
            shuffleInterval = setInterval(shuffleVideos, 3000); // Shuffles every 3 seconds
        }
    }

    function stopVideoShuffle() {
        clearInterval(shuffleInterval);
        shuffleInterval = null;
    }

    const workGrid = document.querySelector('.work-grid');
    if (workGrid && workItems.length > 0) {
        // Start shuffling initially
        startVideoShuffle();

        // Pause shuffling when hovering over the overall grid
        workGrid.addEventListener('mouseenter', stopVideoShuffle);

        // Resume shuffling when mouse leaves the grid
        workGrid.addEventListener('mouseleave', startVideoShuffle);

        // INDIVIDUAL ITEM LOGIC (play hovered video only, pause the rest)
        workItems.forEach(item => {
            const video = item.querySelector('.work-video');
            const thumb = item.querySelector('.work-thumb');

            item.addEventListener('mouseenter', () => {
                // Always hide thumbnail on hover
                if (thumb) thumb.classList.remove('show-thumb');

                // Pause all other videos
                document.querySelectorAll('.work-video').forEach(v => {
                    if (v !== video) v.pause();
                });

                // Play just the hovered one
                if (video) video.play().catch(e => console.log("Play prevented:", e));
            });

            item.addEventListener('mouseleave', () => {
                // If the 10s preview phase is over, show thumbnail and pause
                if (!window.workInitialPhase) {
                    if (thumb) thumb.classList.add('show-thumb');
                    if (video) video.pause();
                }

                // If still in initial phase, make sure all others are playing
                if (window.workInitialPhase) {
                    document.querySelectorAll('.work-video').forEach(v => {
                        v.play().catch(e => console.log("Play prevented:", e));
                    });
                }
            });
        });
    }

    // CONTACT FORM EMAIL LOGIC
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function (e) {
            e.preventDefault();

            // Get all input values
            const name = document.getElementById('name').value;
            const whatsapp = document.getElementById('contact').value;
            const email = document.getElementById('email').value;
            const projectType = document.getElementById('project').value;
            const message = document.getElementById('message').value;

            // Construct the email body
            const emailBody = `Name: ${name}\nWhatsApp: ${whatsapp}\nEmail: ${email}\nProject Type: ${projectType}\n\nMessage:\n${message}`;

            // Create a mailto link which triggers the default mail app (e.g. Gmail App)
            const mailtoLink = `mailto:vasanthankasvk@gmail.com?subject=Portfolio Inquiry from ${encodeURIComponent(name)}&body=${encodeURIComponent(emailBody)}`;

            // Trigger the mail app
        });
    }

    // ==========================================
    // MAX GRAPHICAL ELEMENTS JAVASCRIPT LOGIC
    // ==========================================

    // 1. Scroll Progress Bar
    const progressBar = document.querySelector('.scroll-progress-bar');
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        if (progressBar) {
            progressBar.style.width = scrollPercent + '%';
        }
    });

});
