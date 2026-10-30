// Portfolio V3 progressive enhancement: navigation state, scroll progress and engineering-loop motion.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One white signal travels through the loop. Each node reacts in its own colour.
  // Keeping the signal colour constant makes the pipeline read as one continuous process.
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

    .gate::before {
      background:
        radial-gradient(circle, #fff 0 2px, rgba(255,255,255,.9) 2.4px, transparent 3.2px) 50% -6px / 7px 7px no-repeat,
        linear-gradient(to bottom, rgba(255,255,255,.10), rgba(255,255,255,.68), rgba(255,255,255,.10)) 50% 0 / 1px 100% no-repeat;
    }

    .engineering-card.is-active [data-flow-step="1"]::before { animation: nodeSignal  .62s .02s ease-in-out both; }
    .engineering-card.is-active [data-flow-step="1"]::after  { animation: flowNodePulse .56s .10s ease both; }
    .engineering-card.is-active .flow-link:nth-of-type(1) i  { animation: flowTravel .58s .56s ease-in-out both; }

    .engineering-card.is-active [data-flow-step="2"]::before { animation: nodeSignal  .62s 1.02s ease-in-out both; }
    .engineering-card.is-active [data-flow-step="2"]::after  { animation: flowNodePulse .56s 1.10s ease both; }
    .engineering-card.is-active .flow-link:nth-of-type(2) i  { animation: flowTravel .58s 1.56s ease-in-out both; }

    .engineering-card.is-active [data-flow-step="3"]::before { animation: nodeSignal  .62s 2.02s ease-in-out both; }
    .engineering-card.is-active [data-flow-step="3"]::after  { animation: flowNodePulse .56s 2.10s ease both; }
    .engineering-card.is-active .gate::before                { animation: gateSignalTravel .62s 2.58s ease-in-out both; }
    .engineering-card.is-active [data-flow-step="4"]::after  { animation: flowGatePulse .78s 2.98s ease both; }

    @keyframes nodeSignal {
      0%   { left: -8px; opacity: 0; transform: translateY(-50%) scale(.72); }
      12%  { opacity: 1; }
      48%  { opacity: 1; transform: translateY(-50%) scale(1.12); }
      88%  { opacity: 1; }
      100% { left: calc(100% + 2px); opacity: 0; transform: translateY(-50%) scale(.86); }
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
      .engineering-card.is-active .flow-node::before { animation: none !important; opacity: 0 !important; }
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
    const cycleMs = 5000;
    let cycleTimer = null;
    let cardVisible = false;

    const runFlow = () => {
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
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopLoop();
      else if (cardVisible) startLoop();
    });
  }
})();
