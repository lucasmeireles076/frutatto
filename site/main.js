/* Frutatt — motion language (shared by every page)
 *
 * HERO      macro → zoom out → produto → frutas → tipografia
 * PRODUTOS  entrada → separação → floating → parallax → interação
 *
 * One easing family everywhere (expo.out ≈ --ease-out in CSS), one float rhythm (sine),
 * one depth scale (DEPTH) shared by scroll parallax and mouse offset.
 * Each flavor keeps the same grammar but its own accent (PROFILES): where the bottle
 * enters from and how heavy its float feels.
 *
 * Transform ownership — never two systems on the same property:
 *   intro/entrance → outer element `transform`      scroll parallax → layer `transform` (y)
 *   mouse          → layer `translate` via --mx/--my float          → inner wrapper `transform`
 *   hover          → CSS `transform` on the image
 */
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const flavor = document.body.dataset.flavor || 'caju';

  /* ── contacts (config.js) → every [data-contact] link on the page ── */
  const C = window.FRUTATT_CONTACT || {};
  const ig = (C.instagram || '').replace(/^@/, '').trim();
  const wa = (C.whatsapp || '').replace(/\D/g, '');
  const waLink = (C.whatsappLink || '').trim(); // Business short link wins; it can't carry a prefilled text
  $$('[data-contact]').forEach((a) => {
    const kind = a.dataset.contact;
    if (kind === 'instagram' && ig) a.href = `https://instagram.com/${ig}`;
    else if (kind === 'whatsapp' && waLink) a.href = waLink;
    else if (kind === 'whatsapp' && wa) {
      a.href = `https://wa.me/${wa}` + (a.dataset.msg ? `?text=${encodeURIComponent(a.dataset.msg)}` : '');
    } else return;
    a.target = '_blank';
    a.rel = 'noopener';
    a.hidden = false;
  });
  $$('[data-contact-label="instagram"]').forEach((s) => (s.textContent = ig ? `@${ig}` : ''));
  $$('[data-contact-label="whatsapp"]').forEach((s) => (s.textContent = wa ? `+${wa}` : waLink ? 'Chamar agora' : ''));
  $$('[data-contact-empty]').forEach((p) => (p.hidden = Boolean(ig || wa || waLink)));

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  /* ── product carousel: native scroll-snap + arrows, dots and mouse drag ── */
  $$('[data-carousel]').forEach((car) => {
    const track = $('.carousel__track', car);
    const items = [...track.children];
    const dots = $('.carousel__dots', car);
    const [prev, next] = $$('.carousel__btn', car);
    const step = () => items[1].offsetLeft - items[0].offsetLeft;
    const goTo = (i) => track.scrollTo({ left: items[Math.max(0, Math.min(items.length - 1, i))].offsetLeft - items[0].offsetLeft, behavior: 'smooth' });

    const dotBtns = items.map((item, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Ir para ${$('h3', item).textContent}`);
      b.addEventListener('click', () => goTo(i));
      dots.append(b);
      return b;
    });
    let current = -1;
    const sync = () => {
      const max = track.scrollWidth - track.clientWidth;
      const i = track.scrollLeft >= max - 4 ? items.length - 1 : Math.round(track.scrollLeft / step());
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft >= max - 4;
      if (i === current) return;
      current = i;
      dotBtns.forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
    };
    let raf = 0;
    track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(sync); }, { passive: true });
    window.addEventListener('resize', sync);
    prev.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));
    sync();

    // desktop: click-and-drag like a phone swipe (touch already scrolls natively)
    let startX = 0, startLeft = 0, moved = false;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      startX = e.clientX; startLeft = track.scrollLeft; moved = false;
      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        if (!moved && Math.abs(dx) > 6) { moved = true; track.classList.add('is-dragging'); }
        if (moved) track.scrollLeft = startLeft - dx;
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        if (moved) { track.classList.remove('is-dragging'); goTo(Math.round(track.scrollLeft / step())); }
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp, { once: true });
    });
    track.addEventListener('dragstart', (e) => e.preventDefault());
    track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  });

  /* ── "Onde encontrar": city tabs + map pins share one selection ── */
  const where = $('.where');
  if (where) {
    const PONTOS = window.FRUTATT_PONTOS || {};
    const NAMES = { recife: 'Recife', 'joao-pessoa': 'João Pessoa', natal: 'Natal' };
    const list = $('.where__list', where);
    const tabs = $$('.where__tab', where);
    const PIN_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>';

    const select = (city, focusTab) => {
      tabs.forEach((t) => {
        const on = t.dataset.city === city;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on) { list.setAttribute('aria-labelledby', t.id); if (focusTab) t.focus(); }
      });
      $$('.pin', where).forEach((p) => p.classList.toggle('is-active', p.dataset.city === city));
      $$('.map__state[data-state]', where).forEach((s) => s.classList.toggle('is-active', s.dataset.state === city));
      const spots = PONTOS[city] || [];
      list.innerHTML = spots.length
        ? `<ul class="where__spots">${spots.map((s, i) => `
            <li class="spot" style="--i:${i}">
              <span class="spot__icon">${PIN_ICON}</span>
              <span><strong>${esc(s.nome)}</strong><span>${esc(s.bairro)} · ${NAMES[city]}</span></span>
              ${s.tipo ? `<span class="spot__type">${esc(s.tipo)}</span>` : ''}
            </li>`).join('')}</ul>`
        : `<p class="where__empty">Já estamos em ${NAMES[city]}! Chame no WhatsApp e a gente indica o ponto mais perto de você.</p>`;
    };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t.dataset.city));
      t.addEventListener('keydown', (e) => {
        const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (d) select(tabs[(i + d + tabs.length) % tabs.length].dataset.city, true);
      });
    });
    $$('.pin', where).forEach((p) => {
      p.addEventListener('click', () => select(p.dataset.city));
      p.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(p.dataset.city); }
      });
    });
    select('recife');

    // pins drop in the first time the map is on screen
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { where.classList.add('is-in'); io.disconnect(); }
      }, { threshold: 0.3 });
      io.observe($('.where__map', where));
    } else where.classList.add('is-in');
  }

  /* ── testimonials from config.js (real customers only) ── */
  const quotes = $('[data-quotes]');
  const DEP = window.FRUTATT_DEPOIMENTOS || [];
  if (quotes && DEP.length) {
    quotes.innerHTML = DEP.map((d) => `
      <li><blockquote class="quote" data-reveal>
        <p>“${esc(d.texto)}”</p>
        <footer><strong>${esc(d.nome)}</strong>${d.cidade ? ` · ${esc(d.cidade)}` : ''}${d.usuario ? ` · ${esc(d.usuario)}` : ''}</footer>
      </blockquote></li>`).join('');
    quotes.hidden = false;
  }

  /* ── layers cut from the original art by build_assets.py ── */
  const LAYERS = window.FRUTATT_LAYERS || { leaves: [] };

  function leafEl(l, scale = 1) {
    const span = document.createElement('span');
    span.className = 'leaf';
    Object.assign(span.style, {
      left: `${l.x}%`, top: `${l.y}%`,
      width: `${l.w * scale}%`, height: `${l.h * scale}%`,
    });
    const w = l.widths[0];
    span.innerHTML =
      `<picture><source type="image/avif" srcset="img/${l.name}-${w}.avif">` +
      `<img src="img/${l.name}-${w}.webp" alt="" decoding="async"></picture>`;
    return span;
  }

  const heroFar = $('[data-leaves="far"]');
  const heroNear = $('[data-leaves="near"]');
  if (heroFar && heroNear) LAYERS.leaves.forEach((l) => (l.near ? heroNear : heroFar).append(leafEl(l)));

  // near-camera leaves reused at the products section edges, bigger and softer
  const prodNear = $('[data-leaves="near-products"]');
  const blurred = LAYERS.leaves.filter((l) => l.near);
  if (prodNear && blurred[0]) prodNear.append(leafEl({ ...blurred[0], x: -3, y: 58 }, 1.25));
  if (prodNear && blurred[1]) prodNear.append(leafEl({ ...blurred[1], x: 90, y: 10 }, 1.1));

  /* ── products without art yet → placeholder ── */
  $$('[data-product], .prod').forEach((box) => {
    const img = $('img', box);
    if (!img) return;
    const miss = () => box.classList.add('is-missing');
    if (img.complete && img.naturalWidth === 0) miss();
    else img.addEventListener('error', miss, { once: true });
  });

  /* ── home mobile carousel opens on the center flavor, not the first ── */
  const row = $('.products__row');
  const centerProd = $('.prod[data-from="center"]');
  if (row && centerProd) {
    const centerRow = () => {
      if (row.scrollWidth > row.clientWidth + 1) {
        row.scrollLeft = centerProd.offsetLeft - (row.clientWidth - centerProd.offsetWidth) / 2;
      }
    };
    centerRow();
    window.addEventListener('load', centerRow, { once: true });
  }

  /* ── catalog card → flavor page: remember it so the bottle morph isn't re-animated ── */
  $$('a.card__link').forEach((a) =>
    a.addEventListener('click', () => {
      try { sessionStorage.setItem('frutatt-vt', a.closest('[data-flavor]').dataset.flavor); } catch {}
    }));
  let arrivedByMorph = false;
  try {
    arrivedByMorph = sessionStorage.getItem('frutatt-vt') === flavor && 'onpagereveal' in window;
    sessionStorage.removeItem('frutatt-vt');
  } catch {}

  /* ── no GSAP (CDN blocked/offline) → show everything, no motion ── */
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove('js');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const EASE = 'expo.out';
  const FLOAT = 'sine.inOut';
  // px of mouse offset per layer; scroll parallax uses the same ordering
  const DEPTH = { bg: 6, band: 4, far: 12, product: 18, near: 30, 'near-products': 30 };

  // same grammar, different accent per fruit
  const PROFILES = {
    caju: { from: { y: 90, x: 0, rotation: 0 },   float: 2.6, lift: 8,  sway: 1,   leavesFrom: 0 },  // rises, light
    uva:  { from: { y: -110, x: 0, rotation: -4 }, float: 3.3, lift: 6,  sway: 0.7, leavesFrom: 1 },  // drops in, heavier
    caja: { from: { y: 30, x: 140, rotation: 5 },  float: 2.1, lift: 10, sway: 1.4, leavesFrom: -1 }, // slides in, lively
  };
  const P = PROFILES[flavor] || PROFILES.caju;

  const hero = $('.hero');
  const stage = $('.hero__stage');
  const heroProduct = $('.hero__product');
  const heroPic = $('.hero__product picture');
  const heroFloat = $('.hero__float');
  const heroShadow = $('.hero__product .shadow');
  const products = $('.products');
  const prods = $$('.products .prod');
  const cards = $$('[data-reveal-card]');

  gsap.set(['.hero__title', '.products__title', '.catalog__title'], { opacity: 1 });

  const mm = gsap.matchMedia();

  mm.add(
    {
      reduce: '(prefers-reduced-motion: reduce)',
      motion: '(prefers-reduced-motion: no-preference)',
      wide: '(min-width: 768px)',
      finePointer: '(hover: hover) and (pointer: fine)',
    },
    (ctx) => {
      const { reduce, wide, finePointer } = ctx.conditions;

      /* ═════════ Reduced motion: fades only, nothing travels ═════════ */
      if (reduce) {
        gsap.to(['[data-intro]', '.hero__product picture', '.hero .leaf'], { opacity: 1, duration: 0.4, ease: 'none' });
        ScrollTrigger.batch(['.prod', '[data-reveal]', '[data-reveal-card]'], {
          start: 'top 92%', once: true,
          onEnter: (els) => gsap.to(els, { opacity: 1, duration: 0.4, ease: 'none' }),
        });
        return;
      }

      /* ═════════ Title words — the kinetic type every page opens with ═════════ */
      const pageTitle = $('.catalog__title');
      if (pageTitle) gsap.from($$('.word', pageTitle), { yPercent: 115, duration: 1.1, stagger: 0.07, ease: EASE, delay: 0.1 });

      /* ═════════ HERO (home + flavor pages) ═════════ */
      let loops = [];
      if (hero && stage) {
        const farLeaves = $$('.leaf', heroFar);
        const nearLeaves = $$('.leaf', heroNear);
        const centerX = window.innerWidth / 2;
        const tl = gsap.timeline({ defaults: { ease: EASE } });
        tl.fromTo(stage, { scale: 1.16 }, { scale: 1, duration: 2 }, 0);
        if (arrivedByMorph) {
          gsap.set(heroPic, { opacity: 1 }); // the view transition already flew the bottle in
        } else {
          tl.fromTo(heroPic,
            { opacity: 0, scale: 0.94, ...P.from },
            { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0, duration: 1.5 }, 0.3);
        }
        tl.fromTo(heroShadow, { opacity: 0 }, { opacity: 1, duration: 1.2 }, 0.6)
          .fromTo([...farLeaves, ...nearLeaves],
            {
              opacity: 0, scale: 0.85,
              // leaves arrive from outside the frame — or all sweep one way, per flavor
              x: (i, el) => (P.leavesFrom || (el.getBoundingClientRect().left < centerX ? -1 : 1)) * gsap.utils.random(40, 90),
              rotation: () => gsap.utils.random(-25, 25),
            },
            { opacity: 1, scale: 1, x: 0, rotation: 0, duration: 1.6, stagger: 0.05 }, 0.45)
          .from($$('.hero__title .word'), { yPercent: 115, duration: 1.1, stagger: 0.06 }, 0.75)
          .fromTo('[data-intro="eyebrow"], [data-intro="lead"], [data-intro="cta"]',
            { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0.95)
          .fromTo('[data-intro="fact"]',
            { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.9, stagger: 0.07 }, 1.05);

        const heroLoop = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: FLOAT, duration: P.float } });
        heroLoop
          .fromTo(heroFloat,
            { y: P.lift * 0.75, rotation: -P.sway, scale: 1 },
            { y: -P.lift, rotation: P.sway, scale: 1.015 }, 0)
          // shadow tightens as the bottle lifts — sells the suspension
          .fromTo(heroShadow, { scaleX: 1.04, scaleY: 1.04 }, { scaleX: 0.9, scaleY: 0.88 }, 0);

        const leafLoops = [...farLeaves, ...nearLeaves].map((el) =>
          gsap.to($('img', el), {
            y: gsap.utils.random(-14, 14), x: gsap.utils.random(-6, 6), rotation: gsap.utils.random(-7, 7),
            duration: gsap.utils.random(3.2, 5.4), ease: FLOAT, repeat: -1, yoyo: true,
            delay: gsap.utils.random(0, 1.5),
          }));
        loops = [heroLoop, ...leafLoops];
        ScrollTrigger.create({
          trigger: hero, start: 'top bottom', end: 'bottom top',
          onToggle: ({ isActive }) => loops.forEach((t) => (isActive ? t.play() : t.pause())),
        });
      }

      /* ═════════ PRODUTOS (home) — entrada → separação → floating ═════════ */
      if (products && prods.length) {
        gsap.from('.products__title .word', {
          yPercent: 115, duration: 1.1, stagger: 0.06, ease: EASE,
          scrollTrigger: { trigger: '.products__head', start: 'top 82%', once: true },
        });

        const from = wide
          ? {
              left:   { x: () => -window.innerWidth * 0.22, y: 40, rotation: -6, scale: 0.94 },
              center: { x: 0, y: () => window.innerHeight * 0.16, rotation: 0, scale: 0.9 },
              right:  { x: () => window.innerWidth * 0.22, y: 40, rotation: 6, scale: 0.94 },
            }
          : { left: { y: 50, scale: 0.94 }, center: { y: 50, scale: 0.94 }, right: { y: 50, scale: 0.94 } };

        const entrance = gsap.timeline({
          scrollTrigger: { trigger: '.products__row', start: wide ? 'top 78%' : 'top 88%', once: true },
          defaults: { ease: EASE, duration: wide ? 1.5 : 1.1 },
        });
        prods.forEach((p, i) => {
          entrance.fromTo(p,
            { opacity: 0, ...from[p.dataset.from] },
            { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1 }, i * 0.1);
        });

        const FLOATS = {
          granola: { y: [6, -10], x: [-3, 3], rotation: [-1.6, 1.4], scale: [1, 1], duration: 2.3 },
          caju:    { y: [-8, 8],  x: [0, 0],  rotation: [1.2, -1],   scale: [1, 1.018], duration: 2.6 }, // opposite phase
          acai:    { y: [7, -9],  x: [2, -2], rotation: [1.8, -1.2], scale: [1, 1], duration: 2.45 },
        };
        const prodLoops = prods.map((p) => floatLoop(p, FLOATS[p.dataset.prod] || FLOATS.caju, 1.2));
        ScrollTrigger.create({
          trigger: products, start: 'top bottom', end: 'bottom top',
          onToggle: ({ isActive }) => prodLoops.forEach((t) => (isActive ? t.play() : t.pause())),
        });
      }

      /* ═════════ CATALOG — cards rise in, each bottle keeps its own rhythm ═════════ */
      if (cards.length) {
        ScrollTrigger.batch(cards, {
          start: 'top 92%', once: true,
          onEnter: (els) => gsap.fromTo(els,
            { opacity: 0, y: 60, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 1.2, stagger: 0.08, ease: EASE }),
        });
        cards.forEach((c, i) => {
          const dir = i % 2 ? -1 : 1;
          floatLoop(c, { y: [6 * dir, -8 * dir], x: [0, 0], rotation: [-1 * dir, 1 * dir], scale: [1, 1], duration: 2.3 + (i % 3) * 0.25 }, 0.6);
        });
      }

      /* ═════════ quiet stagger reveal (label facts, contact) ═════════ */
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 92%', once: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.06, ease: EASE }),
      });

      /* mobile stops here: reveal + floating + scale, no parallax, no mouse */
      if (!wide) return;

      /* ═════════ Parallax — bg minimal → fruit medium → product main → near fastest ═════════ */
      if (hero && stage) {
        const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 };
        [
          [stage, () => hero.offsetHeight * 0.22],
          [heroFar, () => hero.offsetHeight * 0.06],
          [heroProduct, () => -hero.offsetHeight * 0.06],
          [heroNear, () => -hero.offsetHeight * 0.38],
        ].forEach(([el, y]) => el && gsap.to(el, { y, ease: 'none', scrollTrigger: st }));
      }
      if (products && prods.length) {
        const span = { trigger: products, start: 'top bottom', end: 'bottom top', scrub: 0.6 };
        gsap.fromTo('.products__bgword', { y: -30 }, { y: 30, ease: 'none', scrollTrigger: span });
        gsap.fromTo('.products__band', { y: 20 }, { y: -20, ease: 'none', scrollTrigger: span });
        prods.forEach((p, i) => {
          const amp = [60, 80, 66][i] || 60;
          gsap.fromTo($('.prod__depth', p), { y: amp }, { y: -amp, ease: 'none', scrollTrigger: span });
        });
        if (prodNear) gsap.fromTo(prodNear, { y: 180 }, { y: -180, ease: 'none', scrollTrigger: span });
      }

      /* ═════════ Mouse — a few px, opposite to the cursor, eased ═════════ */
      if (!finePointer) return;
      const layers = $$('[data-depth], [data-leaves]').map((el) => {
        gsap.set(el, { '--mx': 0, '--my': 0 });
        const d = DEPTH[el.dataset.depth || el.dataset.leaves] || 8;
        return {
          d,
          x: gsap.quickTo(el, '--mx', { duration: 1, ease: 'power3.out' }),
          y: gsap.quickTo(el, '--my', { duration: 1, ease: 'power3.out' }),
        };
      });
      if (!layers.length) return;
      const onMove = (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        layers.forEach((l) => { l.x(-nx * 2 * l.d); l.y(-ny * 1.2 * l.d); });
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      return () => window.removeEventListener('pointermove', onMove);
    },
  );

  // product float + its contact shadow breathing in counter-phase
  function floatLoop(scope, f, delay) {
    const loop = gsap.timeline({ repeat: -1, yoyo: true, delay, defaults: { ease: FLOAT, duration: f.duration } });
    loop
      .fromTo($('.prod__float', scope),
        { y: f.y[0], x: f.x[0], rotation: f.rotation[0], scale: f.scale[0] },
        { y: f.y[1], x: f.x[1], rotation: f.rotation[1], scale: f.scale[1] }, 0)
      .fromTo($('.shadow', scope),
        { scaleX: f.y[0] > f.y[1] ? 1.04 : 0.9 },
        { scaleX: f.y[0] > f.y[1] ? 0.9 : 1.04 }, 0);
    return loop;
  }
})();
