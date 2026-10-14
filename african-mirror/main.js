(() => {
  'use strict';

  /* ---------- Config ---------- */
  // Where registrations are POSTed (JSON). Empty = preview mode: nothing is sent.
  const FORM_ENDPOINT = '';
  // Membership tiers. Only "free" is live today. To add a paid tier later, append an
  // object here (price, perks, card finish) and wire the payment step in submit().
  const TIERS = [
    { id: 'free', label: 'FRONT ROW', price: 0, perks: ['perk.card', 'perk.news', 'perk.early'] }
  ];
  const ACTIVE_TIER = 'free';
  // Instagram posts shown in the stage gallery (official embeds only; nothing is downloaded).
  // Captions were checked: posts naming individuals or framed as donation appeals are left out.
  // Before going public, every code here must be cleared with the crew/guardians.
  const IG_PROFILE = 'https://www.instagram.com/african_mirror.1/';
  const REELS = [
    'DeV90AsNF30', 'DcRyv79Nh87', 'Dcy8IEkNO8G', 'DcO2SE2NMiz', 'Db2i1qWtqI_',
    'DcZKHL_tRkU', 'Dcz_JMFtxNe', 'DZpwIulNP5M', 'DeXdgRntCYq', 'DeZrwQNtHyu',
    'Db8-2dTN7z-', 'DdD0kT1NU3b', 'Db8CftbNJWr', 'Dc3yq5eNoOJ', 'DeUwaU5NMwm'
  ];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- i18n ---------- */
  const dict = window.I18N || { en: {} };
  let lang = 'en';
  const t = (k) => (dict[lang] && dict[lang][k]) ?? dict.en[k] ?? k;

  function applyLang(next) {
    lang = dict[next] ? next : 'en';
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    renderPerks();
    updateCardName();
    renderSince();
    labelReels();
    try { localStorage.setItem('am-lang', lang); } catch (_) {}
    requestAnimationFrame(layoutRoad);
  }
  const urlLang = new URLSearchParams(location.search).get('lang');
  let savedLang = null;
  try { savedLang = localStorage.getItem('am-lang'); } catch (_) {}
  const initialLang = urlLang || savedLang || 'en';
  $$('.lang button').forEach(b => b.addEventListener('click', () => {
    applyLang(b.dataset.lang);
    const u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u);
  }));

  /* ---------- Header ---------- */
  const hdr = $('.hdr');
  const onScrollHdr = () => hdr.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', onScrollHdr, { passive: true }); onScrollHdr();

  /* ---------- Reveal ---------- */
  const revealTargets = $$('.crew__statement, .crew__facts > div, .mentor, .road__head > *, .engine__title, .engine__step, .watch__inner > *, .join__form-wrap > *, .partners__title, .partners__lead, .lane, .seat, .care__list li, .final__title');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach((el, i) => {
      el.classList.add('rv');
      const sib = el.parentElement ? Array.from(el.parentElement.children).indexOf(el) : 0;
      el.style.transitionDelay = `${Math.min(sib, 4) * 70}ms`;
      io.observe(el);
    });
  }

  /* ---------- Hero beams ---------- */
  const cv = $('.hero__beams');
  if (cv) {
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, running = true, raf = 0;
    const beams = [
      { x: .12, hue: 'rgba(245,184,61,', sp: .00035, ph: 0, wd: .16 },
      { x: .32, hue: 'rgba(63,182,232,', sp: .00028, ph: 1.7, wd: .12 },
      { x: .5, hue: 'rgba(255,215,122,', sp: .00022, ph: 3.1, wd: .2 },
      { x: .68, hue: 'rgba(255,107,44,', sp: .0003, ph: 4.4, wd: .12 },
      { x: .88, hue: 'rgba(245,184,61,', sp: .00033, ph: 2.4, wd: .16 }
    ];
    const dust = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + .3, v: Math.random() * .00012 + .00004, a: Math.random() * .6 + .2 }));
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function frame(time) {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      const baseY = h * 1.02;
      beams.forEach(b => {
        const ang = Math.sin(time * b.sp + b.ph) * .5; // sweep
        const len = h * 1.25;
        const ox = b.x * w, tx = ox + Math.sin(ang) * len, ty = baseY - Math.cos(ang) * len;
        const half = b.wd * w * .5;
        const nx = Math.cos(ang), ny = Math.sin(ang);
        const g = ctx.createLinearGradient(ox, baseY, tx, ty);
        g.addColorStop(0, b.hue + '.32)'); g.addColorStop(.55, b.hue + '.07)'); g.addColorStop(1, b.hue + '0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(ox - 6, baseY); ctx.lineTo(ox + 6, baseY);
        ctx.lineTo(tx + nx * half, ty + ny * half); ctx.lineTo(tx - nx * half, ty - ny * half);
        ctx.closePath(); ctx.fill();
      });
      dust.forEach(p => {
        p.y -= p.v * 16; if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); }
        ctx.fillStyle = `rgba(255,224,160,${p.a * (0.4 + 0.6 * p.y)})`;
        ctx.beginPath(); ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
      if (running && !reduceMotion) raf = requestAnimationFrame(frame);
    }
    size(); addEventListener('resize', size);
    if (reduceMotion) frame(4000);
    else {
      raf = requestAnimationFrame(frame);
      if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => {
        running = e.isIntersecting;
        if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
      }).observe(cv);
    }
  }

  /* ---------- Road ---------- */
  const track = $('.road__track');
  const baseP = $('.road__base'), litP = $('.road__lit');
  const stops = $$('.stop');
  let roadLen = 0, nodeYs = [];

  function layoutRoad() {
    if (!track) return;
    const tr = track.getBoundingClientRect();
    const svg = $('.road__line');
    svg.setAttribute('viewBox', `0 0 ${tr.width} ${tr.height}`);
    svg.setAttribute('width', tr.width); svg.setAttribute('height', tr.height);
    const pts = stops.map(s => {
      const r = $('.stop__node', s).getBoundingClientRect();
      return [r.left + r.width / 2 - tr.left, r.top + r.height / 2 - tr.top];
    });
    nodeYs = pts.map(p => p[1]);
    const narrow = innerWidth <= 640;
    let d = `M ${pts[0][0]} ${Math.max(0, pts[0][1] - 60)} L ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const dy = (y1 - y0) / 2;
      if (narrow) d += ` L ${x1} ${y1}`;
      else {
        const sway = (i % 2 ? 1 : -1) * Math.min(tr.width * .12, 120);
        d += ` C ${x0 + sway} ${y0 + dy}, ${x1 + sway} ${y1 - dy}, ${x1} ${y1}`;
      }
    }
    baseP.setAttribute('d', d); litP.setAttribute('d', d);
    roadLen = litP.getTotalLength();
    litP.style.strokeDasharray = `${roadLen} ${roadLen}`;
    updateRoad();
  }
  function lengthAtY(y) { // path is monotonic in y
    let lo = 0, hi = roadLen;
    for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (litP.getPointAtLength(m).y < y) lo = m; else hi = m; }
    return lo;
  }
  function updateRoad() {
    if (!track || !roadLen) return;
    const tr = track.getBoundingClientRect();
    const y = reduceMotion ? Infinity : innerHeight * .62 - tr.top;
    const L = y >= nodeYs[nodeYs.length - 1] ? roadLen : y <= 0 ? 0 : lengthAtY(y);
    litP.style.strokeDashoffset = String(roadLen - L);
    stops.forEach((s, i) => s.classList.toggle('is-lit', y >= nodeYs[i] - 2));
  }
  let roadTick = false;
  addEventListener('scroll', () => { if (!roadTick) { roadTick = true; requestAnimationFrame(() => { roadTick = false; updateRoad(); }); } }, { passive: true });
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(layoutRoad, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutRoad);
  addEventListener('load', layoutRoad);

  /* ---------- Membership card ---------- */
  const card = $('.card3d');
  const nameIn = $('#f-name');
  const tier = TIERS.find(x => x.id === ACTIVE_TIER) || TIERS[0];
  if (card) { card.dataset.tier = tier.id; $('[data-tier-label]', card).textContent = tier.label; }

  function renderPerks() {
    const ul = $('[data-perks]'); if (!ul) return;
    ul.innerHTML = '';
    tier.perks.forEach(k => { const li = document.createElement('li'); li.textContent = t(k); ul.appendChild(li); });
  }
  let joinedAt = null;
  function renderSince() {
    if (!card || !joinedAt) return;
    $('[data-card-since]', card).textContent = `${t('card.since')} ${joinedAt.getFullYear()}.${String(joinedAt.getMonth() + 1).padStart(2, '0')}`;
  }
  function updateCardName() {
    if (!card) return;
    const v = (nameIn.value || '').trim();
    $$('[data-card-name]', card).forEach(el => {
      el.textContent = v ? v.toUpperCase() : t('card.placeholder');
      el.classList.toggle('is-empty', !v);
    });
  }
  nameIn && nameIn.addEventListener('input', () => {
    updateCardName();
    if (card.dataset.state === 'idle') card.dataset.state = 'typing';
  });

  // Tilt: follows the pointer on desktop, sways gently otherwise.
  if (card && !reduceMotion) {
    let hovering = false;
    const setTilt = (rx, ry, mx, my) => {
      card.style.setProperty('--rx', rx + 'deg'); card.style.setProperty('--ry', ry + 'deg');
      card.style.setProperty('--mx', mx + '%'); card.style.setProperty('--my', my + '%');
    };
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      hovering = true; card.classList.add('is-tilting');
      setTilt((.5 - py) * 18, (px - .5) * 24, px * 100, py * 100);
    });
    card.addEventListener('pointerleave', () => { hovering = false; card.classList.remove('is-tilting'); });
    let visible = !('IntersectionObserver' in window), swayRaf = 0;
    const sway = (time) => {
      swayRaf = 0;
      if (!visible) return;
      if (!hovering) {
        const a = time / 1000;
        card.classList.add('is-tilting');
        setTilt(Math.sin(a * .9) * 6, Math.sin(a * .6) * 12, 50 + Math.sin(a * .6) * 40, 50 + Math.cos(a * .9) * 30);
      }
      swayRaf = requestAnimationFrame(sway);
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !swayRaf) swayRaf = requestAnimationFrame(sway);
    }).observe(card);
    else swayRaf = requestAnimationFrame(sway);
  }

  function flip(state) {
    card.classList.add('is-flipping');
    card.dataset.state = state;
    clearTimeout(flip.t); flip.t = setTimeout(() => card.classList.remove('is-flipping'), 950);
  }

  /* ---------- Form ---------- */
  const form = $('.form');
  const errEl = $('.form__error'), statusEl = $('.form__status'), editBtn = $('.form__edit');
  const orgField = $('.field--company'), orgIn = $('#f-org');

  function syncRole() {
    const role = form.role.value;
    orgField.hidden = role !== 'company';
    orgIn.required = role === 'company';
  }
  $$('input[name="role"]', form).forEach(r => r.addEventListener('change', syncRole));
  $$('[data-preset-role]').forEach(a => a.addEventListener('click', () => {
    const r = $(`input[name="role"][value="${a.dataset.presetRole}"]`, form);
    if (r) { r.checked = true; syncRole(); }
    setTimeout(() => nameIn.focus({ preventScroll: true }), 700);
  }));

  function fail(input, key) {
    errEl.textContent = t(key);
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    return false;
  }
  function validate() {
    $$('[aria-invalid]', form).forEach(el => el.removeAttribute('aria-invalid'));
    errEl.textContent = '';
    if (!nameIn.value.trim()) return fail(nameIn, 'form.err.name');
    const email = $('#f-email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) return fail(email, 'form.err.email');
    if (form.role.value === 'company' && !orgIn.value.trim()) return fail(orgIn, 'form.err.org');
    if (!form.consent.checked) return fail(form.consent, 'form.err.consent');
    return true;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const submitBtn = $('button[type="submit"]', form);
    const payload = {
      tier: tier.id,
      display_name: nameIn.value.trim(),
      email: $('#f-email').value.trim(),
      country: $('#f-country').value.trim(),
      role: form.role.value,
      organisation: form.role.value === 'company' ? orgIn.value.trim() : '',
      consent: true,
      lang,
      joined_at: new Date().toISOString()
    };
    let preview = !FORM_ENDPOINT;
    if (!preview) {
      submitBtn.disabled = true; statusEl.textContent = t('form.sending');
      try {
        const res = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(String(res.status));
      } catch (_) {
        submitBtn.disabled = false; statusEl.textContent = ''; errEl.textContent = t('form.err.send');
        return;
      }
      submitBtn.disabled = false;
    }
    joinedAt = new Date();
    renderSince();
    flip('registered');
    form.classList.add('is-done');
    statusEl.textContent = preview ? t('form.okPreview') : t('form.ok');
    editBtn.hidden = false;
    $('.after-join').hidden = false;
    if (innerWidth <= 900) card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });

  editBtn.addEventListener('click', () => {
    flip('typing');
    form.classList.remove('is-done');
    statusEl.textContent = '';
    editBtn.hidden = true;
    $('.after-join').hidden = true;
    nameIn.focus();
  });

  /* ---------- Stage: Instagram reels (official embeds) ---------- */
  const rail = $('[data-reels]');
  const setlist = $('[data-setlist]');
  const pad = (n) => String(n).padStart(2, '0');

  // Each reel is a saved thumbnail that links to the post on Instagram (works everywhere,
  // including iOS Safari with tracking protection). "Play here" adds the official embed
  // on top, only if Instagram actually answers; otherwise the thumbnail stays.
  const EMBED_TIMEOUT = 8000;
  addEventListener('message', (e) => {
    if (e.origin !== 'https://www.instagram.com') return;
    let d = e.data;
    try { if (typeof d === 'string') d = JSON.parse(d); } catch (_) { return; }
    if (!d || d.type !== 'MEASURE' || !d.details) return;
    const f = $$('.reel iframe', rail).find(x => x.contentWindow === e.source);
    if (!f) return;
    f.style.height = `${Math.ceil(d.details.height)}px`;
    f.closest('.reel').classList.add('is-live');
  });
  function closeEmbed(item) {
    item.classList.remove('is-playing', 'is-live');
    const box = $('.reel__embed', item); box.innerHTML = '';
  }
  function playHere(item) {
    if (item.classList.contains('is-playing')) return;
    item.classList.add('is-playing');
    const box = $('.reel__embed', item);
    const f = document.createElement('iframe');
    f.src = `https://www.instagram.com/reel/${item.dataset.code}/embed/`;
    f.title = `Instagram reel ${item.dataset.no} — @african_mirror.1`;
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.setAttribute('allowfullscreen', ''); f.setAttribute('scrolling', 'no');
    const back = document.createElement('button');
    back.type = 'button'; back.className = 'reel__back'; back.dataset.i18n = 'stage.back'; back.textContent = t('stage.back');
    back.addEventListener('click', () => closeEmbed(item));
    box.append(f, back);
    setTimeout(() => {
      if (item.classList.contains('is-playing') && !item.classList.contains('is-live')) {
        closeEmbed(item);
        item.classList.add('is-blocked');
      }
    }, EMBED_TIMEOUT);
  }
  if (rail) {
    REELS.forEach((code, i) => {
      const item = document.createElement('figure');
      item.className = 'reel'; item.setAttribute('role', 'listitem');
      item.dataset.code = code; item.dataset.no = pad(i + 1); item.id = `reel-${i + 1}`;
      const url = `https://www.instagram.com/reel/${code}/`;
      item.innerHTML =
        `<a class="reel__link" href="${url}" target="_blank" rel="noopener">` +
          `<img src="assets/ig/${code}.jpg" alt="" loading="${i < 3 ? 'eager' : 'lazy'}" decoding="async" width="540" height="960">` +
          `<span class="reel__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z"/></svg></span>` +
          `<span class="reel__no" aria-hidden="true">${pad(i + 1)}</span>` +
          `<span class="reel__cta"><svg class="ig" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle class="ig__dot" cx="17.4" cy="6.6" r="1.1"/></svg><span data-i18n="stage.watch">${t('stage.watch')}</span></span>` +
        `</a>` +
        `<button type="button" class="reel__here"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z"/></svg><span data-i18n="stage.here">${t('stage.here')}</span></button>` +
        `<div class="reel__embed"></div>`;
      $('.reel__here', item).addEventListener('click', () => playHere(item));
      rail.appendChild(item);
      if (setlist) {
        const li = document.createElement('li');
        li.innerHTML = `<button type="button" data-jump="${i}"><span>${pad(i + 1)}</span></button>`;
        setlist.appendChild(li);
      }
    });
    const items = $$('.reel', rail);
    const active = () => {
      const r = rail.getBoundingClientRect();
      let best = 0, bd = Infinity;
      items.forEach((it, i) => { const d = Math.abs(it.getBoundingClientRect().left - r.left - (parseFloat(getComputedStyle(rail).paddingLeft) || 0)); if (d < bd) { bd = d; best = i; } });
      return best;
    };
    const goTo = (i) => {
      const it = items[Math.max(0, Math.min(items.length - 1, i))];
      rail.scrollTo({ left: it.offsetLeft - (parseFloat(getComputedStyle(rail).paddingLeft) || 0), behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    const markSet = () => {
      const a = active();
      $$('button', setlist).forEach((b, i) => b.setAttribute('aria-current', i === a ? 'true' : 'false'));
    };
    let st; rail.addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(markSet, 80); }, { passive: true });
    markSet();
    $$('[data-rail]').forEach(btn => btn.addEventListener('click', () => goTo(active() + Number(btn.dataset.rail))));
    setlist && setlist.addEventListener('click', (e) => { const b = e.target.closest('[data-jump]'); if (b) goTo(Number(b.dataset.jump)); });
  }
  function labelReels() {
    $$('.reel', rail).forEach((it) => $('.reel__link', it).setAttribute('aria-label', `${t('stage.watch')} ${it.dataset.no}`));
    if (!setlist) return;
    setlist.setAttribute('aria-label', t('stage.setlist'));
    $$('button', setlist).forEach((b, i) => b.setAttribute('aria-label', `${t('stage.jump')} ${pad(i + 1)}`));
  }

  /* ---------- Init ---------- */
  if (!FORM_ENDPOINT) $('[data-preview-note]').hidden = false;
  syncRole();
  applyLang(initialLang);
})();
