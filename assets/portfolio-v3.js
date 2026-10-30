(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    let activated = false;
    const runFlow = () => {
      card.classList.remove('is-active');
      void card.offsetWidth;
      card.classList.add('is-active');
    };

    if ('IntersectionObserver' in window) {
      const flowObserver = new IntersectionObserver((entries, observer) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > .35) && !activated) {
          activated = true;
          runFlow();
          observer.disconnect();
        }
      }, {threshold: [.35]});
      flowObserver.observe(card);
    } else {
      runFlow();
    }

    card.addEventListener('mouseenter', runFlow);
    card.addEventListener('focusin', runFlow);
  }
})();
