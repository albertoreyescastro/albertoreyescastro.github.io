// Portfolio V3 progressive enhancement: navigation state, scroll progress and engineering-loop motion.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One white signal travels through the loop. Each node reacts in its own colour.
  // The VERIFY -> HUMAN GATE handoff is positioned from live layout geometry so the
  // signal remains physically continuous across desktop and responsive layouts.
  const loopMotionStyle = document.createElement('style');
  loopMotionStyle.textContent = `
    .flow-node[data-flow-step="1"] { --node-rgb: 111 212 229; }
    .flow-node[data-flow-step="2"] { --node-rgb: 143 174 247; }
    .flow-node[data-flow-step="3"] { --node-rgb: 185 170 248; }
    .gate[data-flow-step="4"] { --node-rgb: 167 243 208; }

    .flow-node::after,
    .gate::after {
      background: radial-gradient(circle at 50% 50%, rgb(var(--node-rgb) / .18), transparent 72%);
      box-shadow:
        inset 0 0 0 1px rgb(var(--node-rgb) / .96),
        inset 0 0 22px rgb(var(--node-rgb) / .12),
        0 0 28px rgb(var(--node-rgb) / .42);
    }

    .flow-node::before {
      content: "";
      position: absolute;
      z-index: 4;
      left: -8px;
      top: 50%;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      opacity: 0;
      pointer-events: none;
      background: #fff;
      box-shadow: 0 0 5px #fff, 0 0 13px rgba(255,255,255,.96), 0 0 24px rgba(255,255,255,.55);
      transform: translateY(-50%) scale(.82);
    }

    .flow-link i {
      background: #fff;
      box-shadow: 0 0 5px #fff, 0 0 13px rgba(255,255,255,.96), 0 0 24px rgba(255,255,255,.55);
    }

    /* Supersede the old centred gate-entry signal: the real handoff now starts at VERIFY. */
    .gate::before {
      animation: none !important;
      opacity: 0 !important;
    }

    /* One continuous, two-leg right-angle path: VERIFY bottom → gate right side. */
    .verify-handoff {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
      z-index: 3;
      pointer-events: none;
    }

    .verify-handoff path {
      fill: none;
      stroke: rgba(143,174,247,.34);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }

    .verify-handoff-dot {
      position: absolute;
      z-index: 4;
      left: 0;
      top: 0;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      opacity: 0;
      offset-rotate: 0deg;
      pointer-events: none;
      background: #fff;
      box-shadow: 0 0 5px #fff, 0 0 13px rgba(255,255,255,.96), 0 0 24px rgba(255,255,255,.55);
    }

    .engineering-card.is-active [data-flow-step="1"]::before { animation: nodeSignal  .62s .02s ease-in-out both; }
    .engineering-card.is-active [data-flow-step="1"]::after  { animation: flowNodePulse .56s .10s ease both; }
    .engineering-card.is-active .flow-link:nth-of-type(1) i  { animation: flowTravel .58s .56s ease-in-out both; }

    .engineering-card.is-active [data-flow-step="2"]::before { animation: nodeSignal  .62s 1.02s ease-in-out both; }
    .engineering-card.is-active [data-flow-step="2"]::after  { animation: flowNodePulse .56s 1.10s ease both; }
    .engineering-card.is-active .flow-link:nth-of-type(2) i  { animation: flowTravel .58s 1.56s ease-in-out both; }

    .engineering-card.is-active [data-flow-step="3"]::before { animation: nodeSignal  .62s 2.02s ease-in-out both; }
    .engineering-card.is-active [data-flow-step="3"]::after  { animation: flowNodePulse .56s 2.10s ease both; }
    .engineering-card.is-active .verify-handoff-dot { animation: handoffPathTravel .66s 2.60s linear both; }
    .engineering-card.is-active [data-flow-step="4"]::after  { animation: flowGatePulse .78s 3.24s ease both; }

    @keyframes nodeSignal {
      0%   { left: -8px; opacity: 0; transform: translateY(-50%) scale(.72); }
      12%  { opacity: 1; }
      48%  { opacity: 1; transform: translateY(-50%) scale(1.12); }
      88%  { opacity: 1; }
      100% { left: calc(100% + 2px); opacity: 0; transform: translateY(-50%) scale(.86); }
    }

    @keyframes handoffPathTravel {
      0%   { offset-distance: 0%; opacity: 0; transform: scale(.78); }
      10%  { opacity: 1; }
      48%  { transform: scale(1.12); }
      90%  { opacity: 1; }
      100% { offset-distance: 100%; opacity: 0; transform: scale(.88); }
    }

    @keyframes flowGatePulse {
      0%,100% { opacity: 0; }
      25%,70% {
        opacity: 1;
        box-shadow:
          inset 0 0 0 1px rgb(var(--node-rgb) / .98),
          inset 0 0 24px rgb(var(--node-rgb) / .14),
          0 0 30px rgb(var(--node-rgb) / .46);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .engineering-card.is-active .flow-node::before,
      .engineering-card.is-active .verify-handoff-dot {
        animation: none !important;
        opacity: 0 !important;
      }
      .verify-handoff, .verify-handoff-dot { display: none; }
    }
  `;
  document.head.appendChild(loopMotionStyle);

  const navLinks = [...document.querySelectorAll('.page-rail a[href^="#"], .section-jump a[href^="#"]')];
  const sectionIds = [...new Set(navLinks.map((a) => a.getAttribute('href').slice(1)))];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  const progress = document.querySelector('.rail-progress span');

  const setActive = (id) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'true');
        const jump = link.closest('.section-jump');
        if (jump) {
          link.scrollIntoView({
            behavior: reduceMotion ? 'auto' : 'smooth',
            inline: 'center',
            block: 'nearest'
          });
        }
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  if ('IntersectionObserver' in window) {
    const ratios = new Map();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => ratios.set(entry.target.id, entry.intersectionRatio));
      const visible = [...ratios.entries()]
        .filter(([, ratio]) => ratio > 0)
        .sort((a, b) => b[1] - a[1]);
      if (visible.length) setActive(visible[0][0]);
    }, {
      rootMargin: '-18% 0px -62% 0px',
      threshold: [0, .08, .2, .4, .65]
    });
    sections.forEach((section) => observer.observe(section));
  }

  const updateProgress = () => {
    if (!progress) return;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
    progress.style.height = `${pct}%`;
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, {passive: true});
  window.addEventListener('resize', updateProgress, {passive: true});

  const card = document.querySelector('.engineering-card');
  if (card && !reduceMotion) {
    const verify = card.querySelector('[data-flow-step="3"]');
    const gate = card.querySelector('[data-flow-step="4"]');
    const svgNS = 'http://www.w3.org/2000/svg';
    const handoff = document.createElementNS(svgNS, 'svg');
    const path = document.createElementNS(svgNS, 'path');
    const dot = document.createElement('span');
    handoff.classList.add('verify-handoff');
    handoff.setAttribute('aria-hidden', 'true');
    dot.className = 'verify-handoff-dot';
    dot.setAttribute('aria-hidden', 'true');
    handoff.appendChild(path);
    card.append(handoff, dot);

    const positionHandoff = () => {
      if (!verify || !gate) return;
      const cardRect = card.getBoundingClientRect();
      const verifyRect = verify.getBoundingClientRect();
      const gateRect = gate.getBoundingClientRect();

      const svgRect = handoff.getBoundingClientRect();
      // Match the user-marked route: start near 58% along VERIFY's lower edge,
      // descend vertically, then enter the RIGHT SIDE of HUMAN GATE at 70% height.
      const startX = verifyRect.left + verifyRect.width * .58 - svgRect.left;
      const startY = verifyRect.bottom - svgRect.top;
      const endX = gateRect.right - svgRect.left;
      const endY = gateRect.top + gateRect.height * .70 - svgRect.top;

      if (endY <= startY || endX >= startX) {
        // No diagonal fallback: hide the path if a future layout cannot fit this route.
        path.setAttribute('d', '');
        dot.style.offsetPath = 'none';
        return;
      }

      const d = `M ${startX} ${startY} V ${endY} H ${endX}`;
      path.setAttribute('d', d);
      // CSS motion path follows the exact same vertical-then-left geometry.
      dot.style.offsetPath = `path("${d}")`;
    };

    const cycleMs = 5000;
    let cycleTimer = null;
    let cardVisible = false;

    const runFlow = () => {
      positionHandoff();
      card.classList.remove('is-active');
      void card.offsetWidth;
      card.classList.add('is-active');
    };

    const stopLoop = () => {
      if (cycleTimer !== null) {
        window.clearInterval(cycleTimer);
        cycleTimer = null;
      }
    };

    const startLoop = () => {
      stopLoop();
      if (!cardVisible || document.hidden) return;
      runFlow();
      cycleTimer = window.setInterval(() => {
        if (cardVisible && !document.hidden) runFlow();
      }, cycleMs);
    };

    if ('IntersectionObserver' in window) {
      const flowObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];
        const nowVisible = Boolean(entry?.isIntersecting && entry.intersectionRatio > .35);
        if (nowVisible === cardVisible) return;
        cardVisible = nowVisible;
        if (cardVisible) startLoop();
        else stopLoop();
      }, {threshold: [.35]});
      flowObserver.observe(card);
    } else {
      cardVisible = true;
      startLoop();
    }

    const replayNow = () => {
      if (!cardVisible || document.hidden) return;
      runFlow();
    };

    card.addEventListener('mouseenter', replayNow);
    card.addEventListener('focusin', replayNow);
    window.addEventListener('resize', positionHandoff, {passive: true});
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopLoop();
      else if (cardVisible) startLoop();
    });

    positionHandoff();
  }
})();
