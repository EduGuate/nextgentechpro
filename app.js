(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const PRICE = 499;

  document.getElementById('year').textContent = new Date().getFullYear();

  const nav = document.querySelector('.site-nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const menu = document.getElementById('menu');
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a') && menu.classList.contains('show') && window.bootstrap) {
      bootstrap.Collapse.getOrCreateInstance(menu).hide();
    }
  });

  // Countdown: pre-sale closes at the end of the day 21 days after first visit
  let deadline;
  try { deadline = Number(localStorage.getItem('ngx-deadline')); } catch (e) { deadline = 0; }
  if (!deadline || deadline < Date.now()) {
    const d = new Date(); d.setDate(d.getDate() + 21); d.setHours(23, 59, 59, 0);
    deadline = d.getTime();
    try { localStorage.setItem('ngx-deadline', String(deadline)); } catch (e) { /* storage unavailable */ }
  }
  const units = Object.fromEntries([...document.querySelectorAll('[data-unit]')].map((el) => [el.dataset.unit, el]));
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    const ms = Math.max(0, deadline - Date.now());
    units.d.textContent = pad(Math.floor(ms / 864e5));
    units.h.textContent = pad(Math.floor(ms / 36e5) % 24);
    units.m.textContent = pad(Math.floor(ms / 6e4) % 60);
    units.s.textContent = pad(Math.floor(ms / 1e3) % 60);
  };
  tick();
  setInterval(tick, 1000);

  // Device clock
  const uiTime = document.getElementById('ui-time');
  const setTime = () => { uiTime.textContent = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }); };
  setTime();
  setInterval(setTime, 30000);

  // Reveal + count-up
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    if (reduce) { el.textContent = target; return; }
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / 1500, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        entry.target.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    reveals.forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 80}ms`; io.observe(el); });
  } else {
    reveals.forEach((el) => { el.classList.add('visible'); el.querySelectorAll('[data-count]').forEach(countUp); });
  }

  // Color picker: recolors the hero device and the order summary
  const chosen = document.getElementById('chosen-color');
  const swatches = document.querySelectorAll('.swatch');
  swatches.forEach((sw) => sw.addEventListener('click', () => {
    swatches.forEach((s) => { s.classList.toggle('active', s === sw); s.setAttribute('aria-checked', String(s === sw)); });
    const c1 = sw.style.getPropertyValue('--c1');
    const c2 = sw.style.getPropertyValue('--c2');
    document.documentElement.style.setProperty('--c1', c1);
    document.documentElement.style.setProperty('--c2', c2);
    chosen.textContent = sw.textContent.trim();
  }));

  // Quantity stepper + total
  const qty = document.getElementById('qty');
  const total = document.getElementById('order-total');
  let q = 1;
  const render = () => { qty.textContent = q; total.textContent = (q * PRICE).toLocaleString('en-US'); };
  document.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    q = Math.min(3, Math.max(1, q + Number(b.dataset.step)));
    render();
  }));
  render();

  // Pre-order form (demo: inline confirmation, nothing is sent)
  const form = document.getElementById('preOrderForm');
  const status = document.getElementById('form-status');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = [...form.querySelectorAll('input[required]')];
    fields.forEach((f) => f.classList.toggle('is-invalid', !f.checkValidity()));
    const bad = fields.find((f) => !f.checkValidity());
    if (bad) { status.textContent = 'Revisa tu nombre y correo.'; status.classList.add('error'); bad.focus(); return; }
    const name = form.querySelector('#name').value.trim().split(' ')[0];
    status.classList.remove('error');
    status.textContent = `¡Reserva confirmada, ${name}! ${q} × NextGen X1 (${chosen.textContent}). Te escribiremos pronto.`;
    form.reset();
    fields.forEach((f) => f.classList.remove('is-invalid'));
  });

  // Pointer FX: cursor glow, device tilt, feature spotlight
  if (finePointer && !reduce) {
    const glow = document.querySelector('.cursor-glow');
    window.addEventListener('pointermove', (e) => {
      glow.style.setProperty('--x', `${e.clientX}px`);
      glow.style.setProperty('--y', `${e.clientY}px`);
    }, { passive: true });

    const stage = document.getElementById('stage');
    const device = document.getElementById('device');
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      device.style.transform = `rotateY(${-18 + x * 36}deg) rotateX(${8 - y * 20}deg) rotateZ(2deg)`;
    });
    stage.addEventListener('pointerleave', () => { device.style.transform = ''; });

    document.querySelectorAll('.spot').forEach((el) => el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    }));
  }
})();
