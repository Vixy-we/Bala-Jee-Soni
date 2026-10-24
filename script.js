// Draw and animate the planetary gear set used in the reference portfolio.
        const gearSvg = document.getElementById('about-svg');
        const gearModule = 4;
        const sunTeeth = 12;
        const planetTeeth = 18;
        const ringTeeth = 48;
        const sunRadius = gearModule * sunTeeth / 2;
        const planetRadius = gearModule * planetTeeth / 2;
        const ringRadius = gearModule * ringTeeth / 2;
        const carrierRadius = sunRadius + planetRadius;

        function gearPath(teethCount, baseRadius, tipRadius, rotation) {
            const pitch = 2 * Math.PI / teethCount;
            let path = '';
            for (let tooth = 0; tooth < teethCount; tooth++) {
                const angle = rotation + tooth * pitch;
                const points = [
                    [angle - .3 * pitch, baseRadius],
                    [angle - .16 * pitch, tipRadius],
                    [angle + .16 * pitch, tipRadius],
                    [angle + .3 * pitch, baseRadius]
                ];
                points.forEach(([theta, radius], index) => {
                    const x = (radius * Math.cos(theta)).toFixed(2);
                    const y = (radius * Math.sin(theta)).toFixed(2);
                    path += `${tooth === 0 && index === 0 ? 'M' : 'L'}${x} ${y} `;
                });
            }
            return `${path}Z`;
        }

        const outerRadius = ringRadius + 3 * gearModule;
        let gearMarkup = `<g class="gear-guide"><circle r="${carrierRadius}"/><line x1="-120" x2="120" y1="0" y2="0"/><line x1="0" x2="0" y1="-120" y2="120"/></g>`;
        gearMarkup += `<path class="gear-ring" fill-rule="evenodd" d="M${outerRadius} 0 A${outerRadius} ${outerRadius} 0 1 0 -${outerRadius} 0 A${outerRadius} ${outerRadius} 0 1 0 ${outerRadius} 0 Z ${gearPath(ringTeeth, ringRadius + gearModule, ringRadius - .8 * gearModule, 0)}"/>`;
        gearMarkup += '<g id="gear-carrier">';
        const planetPositions = [];
        for (let index = 0; index < 3; index++) {
            const angle = Math.PI / 2 + index * 2 * Math.PI / 3;
            planetPositions.push(angle);
            gearMarkup += `<line class="gear-arm" x1="0" y1="0" x2="${(carrierRadius * Math.cos(angle)).toFixed(2)}" y2="${(carrierRadius * Math.sin(angle)).toFixed(2)}"/>`;
        }
        planetPositions.forEach((angle) => {
            const rotation = angle + Math.PI - Math.PI / planetTeeth;
            const x = (carrierRadius * Math.cos(angle)).toFixed(2);
            const y = (carrierRadius * Math.sin(angle)).toFixed(2);
            gearMarkup += `<g transform="translate(${x} ${y})"><g class="gear-planet-set"><path class="gear-planet" d="${gearPath(planetTeeth, planetRadius - gearModule, planetRadius + .8 * gearModule, rotation)}"/><circle class="gear-hub" r="2.4"/></g></g>`;
        });
        gearMarkup += '<circle class="gear-hub" r="3.5"/></g>';
        gearMarkup += `<g id="gear-sun"><path class="gear-sun" d="${gearPath(sunTeeth, sunRadius - gearModule, sunRadius + .8 * gearModule, 0)}"/><circle class="gear-hub" r="2.4"/></g>`;
        gearSvg.innerHTML = gearMarkup;

        const gearCarrier = document.getElementById('gear-carrier');
        const gearSun = document.getElementById('gear-sun');
        const planetGears = gearSvg.querySelectorAll('.gear-planet-set');
        function drawGears(angle) {
            gearCarrier.setAttribute('transform', `rotate(${angle.toFixed(3)})`);
            gearSun.setAttribute('transform', `rotate(${(5 * angle).toFixed(3)})`);
            planetGears.forEach((planet) => planet.setAttribute('transform', `rotate(${(-8 / 3 * angle).toFixed(3)})`));
        }
        drawGears(0);
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            let gearAngle = 0;
            let previousFrame = null;
            function animateGears(time) {
                if (previousFrame !== null) gearAngle = (gearAngle + Math.min(time - previousFrame, 60) / 1000 * 7) % 360;
                previousFrame = time;
                drawGears(gearAngle);
                requestAnimationFrame(animateGears);
            }
            requestAnimationFrame(animateGears);
        }



        // 1. Text Splitting Utility (Replaces need for SplitText plugin)
        function splitTextIntoWords(selector) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el.children.length > 0) return;
                const text = el.innerText.trim();
                const words = text.split(/\s+/);
                el.innerHTML = '';
                words.forEach((word, index) => {
                    const wordWrapper = document.createElement('span');
                    wordWrapper.className = 'word-wrapper';
                    const wordSpan = document.createElement('span');
                    wordSpan.className = 'word';
                    wordSpan.innerText = word;
                    wordWrapper.appendChild(wordSpan);
                    el.appendChild(wordWrapper);
                    if (index < words.length - 1) {
                        el.appendChild(document.createTextNode(' '));
                    }
                });
            });
        }

        // Apply splitting to paragraphs
        splitTextIntoWords('.text-block p');

        // 2. Core Setup (Lenis & GSAP)
        gsap.registerPlugin(ScrollTrigger);

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false, // Disable smooth scroll on touch for native feel
            touchMultiplier: 2,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Update ScrollTrigger on Lenis scroll
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => { lenis.raf(time * 1000) });
        gsap.ticker.lagSmoothing(0);

        // 3. Custom Cursor Logic
        const cursorDot = document.getElementById('cursor-dot');
        const cursorRing = document.getElementById('cursor-ring');
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let ringX = mouseX;
        let ringY = mouseY;
        let isTouch = window.matchMedia('(pointer: coarse)').matches;

        if (!isTouch) {
            window.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
                // Immediate update for dot
                cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
            });

            // Lerp loop for ring
            function renderCursor() {
                ringX += (mouseX - ringX) * 0.15; // Lerp factor
                ringY += (mouseY - ringY) * 0.15;
                cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
                requestAnimationFrame(renderCursor);
            }
            renderCursor();

            // Hover states
            const interactiveElements = document.querySelectorAll('a, button, .interactive-element, .tilt-card, .tech-item');
            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', () => document.body.classList.add('hovering-interactive'));
                el.addEventListener('mouseleave', () => document.body.classList.remove('hovering-interactive'));
            });

            const textElements = document.querySelectorAll('h1, h2, h3, p');
            textElements.forEach(el => {
                el.addEventListener('mouseenter', () => document.body.classList.add('hovering-text'));
                el.addEventListener('mouseleave', () => document.body.classList.remove('hovering-text'));
            });
        }

        // 4. Magnetic Buttons
        if (!isTouch) {
            const magnets = document.querySelectorAll('.magnetic');
            magnets.forEach(magnet => {
                magnet.addEventListener('mousemove', function (e) {
                    const position = magnet.getBoundingClientRect();
                    const x = e.clientX - position.left - position.width / 2;
                    const y = e.clientY - position.top - position.height / 2;

                    const strength = magnet.dataset.strength || 20;

                    gsap.to(magnet, {
                        x: x * (strength / 100),
                        y: y * (strength / 100),
                        duration: 0.5,
                        ease: "power3.out"
                    });
                });

                magnet.addEventListener('mouseleave', function () {
                    gsap.to(magnet, {
                        x: 0,
                        y: 0,
                        duration: 0.7,
                        ease: "elastic.out(1, 0.3)"
                    });
                });
            });
        }

        // 5. Particle System (Canvas)
        const canvas = document.getElementById('particle-canvas');
        const ctx = canvas.getContext('2d');
        let particlesArray = [];
        let numParticles = window.innerWidth > 768 ? 120 : 60;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            numParticles = window.innerWidth > 768 ? 120 : 60;
            initParticles();
        });

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 3 + 1;
                this.speedY = (Math.random() * -0.5) - 0.2; // Move up slowly
                this.speedX = (Math.random() * 0.4) - 0.2; // Drift sideways
                this.type = Math.random() > 0.8 ? 'cross' : 'circle';
                // Mostly muted text color, occasionally gold
                this.color = Math.random() > 0.9 ? 'rgba(201, 168, 76, 0.15)' : 'rgba(138, 158, 140, 0.3)';
                this.baseX = this.x;
                this.baseY = this.y;
            }
            update() {
                this.y += this.speedY;
                this.x += this.speedX;

                // Reset at bottom if they drift off top
                if (this.y < -10) {
                    this.y = canvas.height + 10;
                    this.x = Math.random() * canvas.width;
                }
                if (this.x < -10) this.x = canvas.width + 10;
                if (this.x > canvas.width + 10) this.x = -10;

                // Mouse repel logic (subtle)
                if (!isTouch) {
                    let dx = mouseX - this.x;
                    let dy = mouseY - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    let maxDist = 100;
                    if (distance < maxDist) {
                        let force = (maxDist - distance) / maxDist;
                        this.x -= (dx / distance) * force * 1;
                        this.y -= (dy / distance) * force * 1;
                    }
                }
            }
            draw() {
                ctx.beginPath();
                ctx.fillStyle = this.color;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 1;

                if (this.type === 'circle') {
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Draw tiny cross
                    ctx.moveTo(this.x - this.size, this.y);
                    ctx.lineTo(this.x + this.size, this.y);
                    ctx.moveTo(this.x, this.y - this.size);
                    ctx.lineTo(this.x, this.y + this.size);
                    ctx.stroke();
                }
            }
        }

        function initParticles() {
            particlesArray = [];
            for (let i = 0; i < numParticles; i++) {
                particlesArray.push(new Particle());
            }
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
                particlesArray[i].draw();
            }
            requestAnimationFrame(animateParticles);
        }

        // 6. Loading Sequence & Animations
        window.addEventListener('load', () => {
            initParticles();
            animateParticles();

            // Vanilla Tilt Init
            VanillaTilt.init(document.querySelectorAll(".tilt-card"), {
                max: 8, speed: 400, glare: true, "max-glare": 0.05
            });

            // Loading Timeline
            const tlLoader = gsap.timeline();

            const nameChars = document.querySelectorAll('.loader-name span');
            tlLoader.to(nameChars, {
                y: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: "power3.out"
            })
                .to('#loader-line', { width: '200px', duration: 0.6, ease: "power2.inOut" }, "-=0.2")
                .to('#loader-status', { opacity: 1, duration: 0.4 })
                .to('.loader', {
                    yPercent: -100,
                    duration: 1,
                    ease: "power4.inOut",
                    delay: 0.5,
                    onStart: () => {
                        // Fade in canvas
                        gsap.to('#particle-canvas', { opacity: 1, duration: 1 });
                    }
                })
                .from('.hero-label', { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.4")
                .from('.hero-name', { y: 40, opacity: 0, duration: 1, ease: "power3.out" }, "-=0.6")
                .from('.hero-desc', { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
                .from('.btn-row .btn', { y: 20, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }, "-=0.6")
                .from('.scroll-indicator', { opacity: 0, duration: 1 }, "-=0.2");

            // Global ScrollTriggers
            // Standard reveals (headings, labels)
            gsap.utils.toArray('.gs-reveal-up').forEach(elem => {
                gsap.from(elem, {
                    scrollTrigger: { trigger: elem, start: "top 85%" },
                    y: 60, opacity: 0, duration: 0.8, ease: "power3.out"
                });
            });

            // Paragraph word stagger
            gsap.utils.toArray('.text-block').forEach(block => {
                const words = block.querySelectorAll('.word');
                if (words.length > 0) {
                    gsap.to(words, {
                        scrollTrigger: { trigger: block, start: "top 80%" },
                        y: 0, duration: 0.8, stagger: 0.015, ease: "power3.out"
                    });
                }
            });

            // Projects Stagger
            gsap.from('.project-card', {
                scrollTrigger: { trigger: '.projects-grid', start: "top 80%" },
                y: 100, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out"
            });

            // SPC Background Color Shift
            ScrollTrigger.create({
                trigger: "#spc",
                start: "top 50%",
                end: "bottom 50%",
                onEnter: () => gsap.to("body", { backgroundColor: "var(--green-deep)", duration: 1 }),
                onLeaveBack: () => gsap.to("body", { backgroundColor: "var(--bg)", duration: 1 }),
                onEnterBack: () => gsap.to("body", { backgroundColor: "var(--green-deep)", duration: 1 }),
                onLeave: () => gsap.to("body", { backgroundColor: "var(--bg)", duration: 1 })
            });

            // Timeline Animation
            const tlLine = gsap.timeline({
                scrollTrigger: {
                    trigger: ".timeline-container",
                    start: "top 70%",
                    end: "bottom 80%",
                    scrub: 1
                }
            });
            tlLine.to("#timeline-progress", { height: "100%", ease: "none" });

            gsap.utils.toArray('.timeline-trigger').forEach((item, i) => {
                const isLeft = item.classList.contains('left');
                gsap.fromTo(item,
                    { x: isLeft ? -50 : 50, opacity: 0 },
                    {
                        scrollTrigger: { trigger: item, start: "top 80%" },
                        x: 0, opacity: 1, duration: 0.8, ease: "power3.out"
                    }
                );
            });

            // Parallax Hero Elements (animates hero-content as a unit to prevent text overlap)
            gsap.to('.hero-content', {
                scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
                y: 100,
                opacity: 0.2
            });
            gsap.to('#particle-canvas', {
                scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
                y: 50
            });
        });

(() => {
            const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const CATS = { lead: 'Leadership', tech: 'Technical learning', cre: 'Creative', ind: 'Industry' };
            const BASE = [2024, 9];
            const PADR = 90;
            const timelineRoot = document.querySelector('#experience .experience-simple');
            const chartRoot = document.getElementById('chart');
            const mi = (y, m) => (y - BASE[0]) * 12 + (m - BASE[1]);
            const lab = i => { const t = BASE[1] - 1 + i; return MON[((t % 12) + 12) % 12] + ' ' + (BASE[0] + Math.floor(t / 12)); };
            const short = i => MON[(((BASE[1] - 1 + i) % 12) + 12) % 12];
            const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
            const today = new Date();
            const NOW = mi(today.getFullYear(), today.getMonth() + 1);

            const ORGS = [
                { name: 'DevsOnLoop', sub: 'Web development', cat: 'tech', roles: [{ t: 'Learner', s: [2024, 9], e: [2024, 12], skills: ['HTML', 'CSS', 'JavaScript', 'Git', 'GitHub'], d: 'Learned web development with HTML, CSS and JavaScript, plus Git and GitHub through hands-on projects.' }] },
                { name: 'Kritti', sub: 'Design community · BIET Jhansi', cat: 'cre', roles: [{ t: 'Learner', s: [2024, 10], e: [2024, 10], skills: ['Adobe Photoshop', 'Image editing'], d: 'Learned the fundamentals of Adobe Photoshop and digital image editing, and gained hands-on experience creating and editing basic graphic and visual content.' }] },
                { name: 'Mercenary Motorsports Club', sub: 'Design & simulation', cat: 'tech', roles: [{ t: 'Member', s: [2024, 9], e: [2025, 8], skills: ['SolidWorks', 'ANSYS Mechanical', 'Vehicle design', 'Simulation'], d: 'Worked on design and simulation for the club\'s vehicle and learned SolidWorks modelling and ANSYS Mechanical basics in club workshops.' }] },
                { name: 'The Drone Learners Club', sub: 'RC aircraft systems', cat: 'tech', roles: [{ t: 'Member', s: [2024, 12], e: [2025, 1], skills: ['RC aircraft', 'BLDC motors', 'ESCs', 'Gyroscopes', 'Servos', 'Hands-on building'], d: 'Studied RC aircraft components and configurations, BLDC motors, ESCs, gyroscopes and servos, then built the Styrofoam RC aircraft.' }] },
                { name: 'Alumni Association', sub: 'BIET Jhansi', cat: 'lead', rank: 1, roles: [{ t: 'Content Development Team', cat: 'cre', s: [2025, 4], e: [2026, 7], skills: ['Content development'], d: 'Contributed to the association\'s content development team.' }, { t: 'Executive Board Member', s: [2025, 9], e: [2026, 7], skills: [], d: 'Served on the Executive Board before moving into the Advisory Board.' }, { t: 'Advisory Board Member', s: [2026, 8], e: null, skills: [], d: 'Links students with alumni and contributes to continuity between the student body and the association.' }, { t: 'AAGMAN', kind: 'event', s: [2025, 11], e: [2025, 11], day: [15, 15], when: 'Nov 15, 2025', meta: 'Alumni get-together', skills: ['Event management', 'Team coordination'], d: 'Alumni get-together for BIET Jhansi, organised by the Alumni Association. It was the first major alumni meet held in the college, and the batch of 2000 returned for its 25th anniversary. I was a key member of the organising team.' }] },
                { name: 'Railway Workshop', sub: 'Gorakhpur', cat: 'ind', roles: [{ t: 'Industrial Training', s: [2025, 6], e: [2025, 6], note: '4 weeks', skills: ['Material handling equipment'], d: 'Studied material handling equipment and its applications in a mechanical workshop.' }] },
                { name: 'BIS Student Chapter', sub: 'MED-BIET', cat: 'tech', rank: 2, roles: [{ t: 'Member', s: [2025, 8], e: null, skills: ['Robotics', 'Engineering standards'], d: 'Builds knowledge of robotics and engineering standards through chapter sessions.' }] },
                { name: 'Solarpunk Corps', sub: 'Robotics & sustainability', cat: 'lead', rank: 0, roles: [{ t: 'Founder', s: [2025, 12], e: null, skills: ['Robotics', 'Sustainable technology', 'Workshop planning', 'Organisational design', 'Teaching', 'Public speaking', 'Event management'], d: 'Established a student initiative for robotics, sustainable technology and engineering experimentation, and set its technical and organisational framework. Planned and ran the first three-day workshop from first plan to final execution.' }, { t: 'General Secretary', s: [2026, 3], e: null, skills: ['Team operations', 'Coordination', 'Teaching', 'Public speaking', 'Event management'], d: 'Heads and leads the club. Initiates its projects and activities, coordinates the team and keeps everything running from one term to the next.' }, { t: 'Horizon 1.0', kind: 'event', s: [2026, 3], e: [2026, 3], day: [27, 29], when: 'Mar 27–29, 2026', meta: '50+ participants', skills: ['Robotics', 'AI', 'Buildathon'], d: 'Launch event of the club, a robotics and AI workshop with a buildathon. Constituted a team of 25 members and organised the event for 50+ regular participants.' }, { t: 'Horizon 2.0', kind: 'event', s: [2026, 10], e: [2026, 10], day: [12, 15], when: 'Oct 12–15, 2026', meta: '250+ participants', skills: ['Robotics', 'AI', 'Sustainability', 'Buildathon', 'Robo Race'], d: 'Conducted a robotics, AI and sustainability workshop with a buildathon and a Robo Race. Expanded the team to 45 members, and participation grew to 250+.' }] }
            ];

            const LAST = Math.max(...ORGS.flatMap(o => o.roles.map(r => r.e ? mi(...r.e) : r.s ? mi(...r.s) : -1)));
            const N = Math.max(NOW, LAST) + 1;
            const ROLES = [];
            ORGS.forEach((o, oi) => o.roles.forEach((r, ri) => {
                const dated = !!r.s;
                const S = dated ? mi(...r.s) : -1;
                const E = dated ? (r.e ? mi(...r.e) + 1 : N) : -1;
                ROLES.push({ id: oi + '-' + ri, oi, org: o, ...r, S, E, undated: !dated, open: dated && !r.e, ev: r.kind === 'event', cat: r.cat || o.cat });
            }));
            const byId = Object.fromEntries(ROLES.map(r => [r.id, r]));
            const overlap = (a, b) => a !== b && !a.undated && !b.undated && a.S < b.E && b.S < a.E;
            const rangeText = r => r.ev ? (r.when || '') : lab(r.S) + ' – ' + (r.open ? 'Present' : lab(r.E - 1));
            const st = { cat: { lead: true, tech: true, cre: true, ind: true }, view: 'list', role: null, month: null };
            const $ = id => document.getElementById(id);
            let cw = 48;

            function lanes() {
                const L = ORGS.map((o, oi) => {
                    const roles = ROLES.filter(r => r.oi === oi && st.cat[r.cat]);
                    const rows = [];
                    roles.filter(r => !r.undated).sort((a, b) => a.S - b.S).forEach(r => {
                        let k = rows.findIndex(end => end <= r.S);
                        if (k < 0) { k = rows.length; rows.push(0); }
                        rows[k] = r.E; r.row = k;
                    });
                    const dated = ROLES.filter(r => r.oi === oi && !r.undated);
                    return { o, oi, roles, rowCount: Math.max(1, rows.length), end: Math.max(...dated.map(r => r.E)), began: Math.min(...dated.map(r => r.S)) };
                }).filter(l => l.roles.length);
                L.sort((a, b) => b.end - a.end || (a.o.rank ?? 99) - (b.o.rank ?? 99) || b.began - a.began);
                return L;
            }

            function highlight() {
                if (st.role) {
                    const base = byId[st.role];
                    return new Set(ROLES.filter(r => overlap(base, r)).map(r => r.id));
                }
                if (st.month !== null) return new Set(ROLES.filter(r => !r.undated && r.S <= st.month && st.month < r.E).map(r => r.id));
                return null;
            }

            function sizeCw() {
                const w = chartRoot.clientWidth;
                const label = parseInt(getComputedStyle(timelineRoot).getPropertyValue('--experience-label')) || 176;
                cw = Math.max(40, Math.min(64, Math.floor((w - label - PADR) / N)));
                timelineRoot.style.setProperty('--experience-cw', cw + 'px');
            }

            function renderChips() {
                $('chips').innerHTML = Object.entries(CATS).map(([k, v]) => 
                    `<button class="chip ${k}" type="button" data-cat="${k}" aria-pressed="${st.cat[k]}"><i></i>${v}</button>`).join('');
            }

            function renderGantt() {
                sizeCw();
                const L = lanes();
                const barH = 30;
                const gap = 6;
                const pad = 12;
                const W = N * cw + PADR;
                let hdr = '';
                for (let y = BASE[0]; y <= BASE[0] + Math.floor((BASE[1] - 1 + N - 1) / 12); y++) {
                    const a = Math.max(0, mi(y, 1));
                    const b = Math.min(N, mi(y + 1, 1));
                    if (b > a) hdr += `<div class="yr" style="left:${a * cw}px;width:${(b - a) * cw}px">${y}</div>`;
                }
                for (let i = 0; i < N; i++) hdr += `<div class="mo ${i === st.month ? 'sel' : ''}" data-m="${i}" role="button" tabindex="0" aria-pressed="${i === st.month}" style="left:${i * cw}px;width:${cw}px">${short(i)}</div>`;
                const hl = highlight();
                const body = L.map(l => {
                    const h = pad * 2 + l.rowCount * barH + (l.rowCount - 1) * gap;
                    const bars = l.roles.filter(r => !r.undated).map(r => {
                        const cls = ['bar', r.cat, r.ev ? 'ev' : '', r.open ? 'open' : '', r.id === st.role ? 'sel' : '', hl && hl.has(r.id) && r.id !== st.role ? 'rel' : ''].join(' ');
                        const tip = esc(r.t + ' · ' + r.org.name + ' · ' + rangeText(r) + ' — ' + r.d + (r.skills && r.skills.length ? ' Skills: ' + r.skills.join(', ') + '.' : ''));
                        const top = pad + r.row * (barH + gap);
                        let pos;
                        if (r.ev) {
                            const dim = new Date(r.s[0], r.s[1], 0).getDate();
                            pos = `left:${(r.S + ((r.day ? r.day[0] : 1) - 1) / dim) * cw - 6}px;top:${top}px`;
                        } else pos = `left:${r.S * cw + 2}px;width:${(r.E - r.S) * cw - 4}px;top:${top}px`;
                        return `<button type="button" class="${cls}" data-r="${r.id}" style="${pos}" title="${tip}"><span>${esc(r.t)}</span></button>`;
                    }).join('');
                    return `<div class="lane ${l.o.cat}"><div class="lane-label"><div class="lane-name">${l.o.name}</div><div class="lane-sub">${l.o.sub}</div></div><div class="track" data-track style="height:${h}px;width:${N * cw}px">${bars}</div></div>`;
                }).join('');
                $('chart').className = 'chart' + (hl ? ' dim' : '');
                $('chart').innerHTML = `<div class="inner" style="width:calc(var(--experience-label) + ${W}px)">
                    <div class="hdr"><div class="corner">Organization</div><div class="axis" style="width:${N * cw}px">${hdr}</div></div>
                    ${body}
                    <div class="overlay"><div class="nowcol" style="left:${NOW * cw}px"></div>${st.month !== null ? `<div class="guide" style="left:${st.month * cw}px"></div>` : ''}</div>
                </div>`;
            }

            function renderList() {
                const PIN = [
                    'Solarpunk Corps|Horizon 2.0', 'Solarpunk Corps|Horizon 1.0', 'Solarpunk Corps|General Secretary', 'Solarpunk Corps|Founder',
                    'Alumni Association|Advisory Board Member', 'Alumni Association|AAGMAN', 'Alumni Association|Executive Board Member', 'Alumni Association|Content Development Team',
                    'BIS Student Chapter|Member', 'Railway Workshop|Industrial Training'
                ];
                const pin = r => { const k = PIN.indexOf(r.org.name + '|' + r.t); return k < 0 ? PIN.length : k; };
                const items = ROLES.filter(r => !r.undated && st.cat[r.cat]).sort((a, b) => pin(a) - pin(b) || b.E - a.E || b.S - a.S);
                $('list').innerHTML = items.map((r, i) => `<div class="item ${i % 2 ? 'right' : 'left'} ${r.cat}"><span class="node"></span><div class="card"><span class="when">${esc(rangeText(r))}</span><h3>${esc(r.t)} · ${esc(r.org.name)}</h3><p>${esc(r.d)}</p></div></div>`).join('') + `<div class="rail" aria-hidden="true"><i></i></div>`;
            }

            function apply() {
                $('ganttView').hidden = st.view !== 'gantt';
                $('listView').hidden = st.view !== 'list';
                [...$('view').children].forEach(b => b.setAttribute('aria-pressed', b.dataset.v === st.view));
                renderChips();
                if (st.view === 'gantt') {
                    const first = !$('chart').firstChild;
                    const sl = $('chart').scrollLeft;
                    renderGantt();
                    $('chart').scrollLeft = first ? $('chart').scrollWidth : sl;
                } else {
                    renderList();
                    focusCards();
                }
            }

            let raf = false;
            function focusCards() {
                raf = false;
                if (st.view !== 'list') return;
                const items = [...document.querySelectorAll('.item')];
                const mid = innerHeight * 0.5;
                let best = Infinity;
                let hit = null;
                items.forEach(it => {
                    const c = it.querySelector('.card');
                    const r = it.getBoundingClientRect();
                    const d = Math.abs(r.top + r.height / 2 - mid);
                    const f = Math.max(0, 1 - d / (innerHeight * 0.75));
                    c.style.setProperty('--o', (0.5 + f * 0.5).toFixed(3));
                    it.classList.toggle('passed', r.top + 10 < mid);
                    if (d < best) { best = d; hit = it; }
                });
                items.forEach(it => it.classList.toggle('active', it === hit));
                const rail = document.querySelector('#experience .experience-simple .rail');
                if (rail) {
                    const rr = rail.getBoundingClientRect();
                    rail.firstChild.style.height = Math.max(0, Math.min(rr.height, mid - rr.top)) + 'px';
                }
            }
            const ask = () => { if (!raf) { raf = true; requestAnimationFrame(focusCards); } };
            addEventListener('scroll', ask, { passive: true });

            document.addEventListener('click', e => {
                const t = e.target;
                const r = t.closest('[data-r]');
                if (r) { if (st.view === 'list' || byId[r.dataset.r].undated) return; st.role = st.role === r.dataset.r ? null : r.dataset.r; st.month = null; apply(); return; }
                const c = t.closest('[data-cat]');
                if (c) { st.cat[c.dataset.cat] = !st.cat[c.dataset.cat]; if (st.role && !st.cat[byId[st.role].cat]) st.role = null; apply(); return; }
                const v = t.closest('#view button');
                if (v) { st.view = v.dataset.v; apply(); return; }
                const m = t.closest('.mo');
                const tr = t.closest('[data-track]');
                if (m || tr) {
                    const i = m ? +m.dataset.m : Math.floor((e.clientX - tr.getBoundingClientRect().left) / cw);
                    if (i < 0 || i >= N) return;
                    st.month = st.month === i ? null : i; st.role = null; apply();
                }
            });

            // Month cells are divs so they can sit on the axis; Enter and Space drive them like buttons.
            document.addEventListener('keydown', e => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const m = e.target.closest('.mo');
                if (!m) return;
                e.preventDefault();
                m.click();
            });

            let rz;
            addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (st.view === 'gantt') apply(); else focusCards(); }, 120); });

            apply();
        })();
