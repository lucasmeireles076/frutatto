/* Frutatt — motion language
 *
 * HERO      macro → zoom out → produto → frutas → tipografia
 * PRODUTOS  entrada → separação → floating → parallax → interação
 *
 * One easing family everywhere (expo.out ≈ --ease-out in CSS), one float rhythm (sine 4–5s),
 * one depth scale (DEPTH) shared by scroll parallax and mouse offset.
 * Transform ownership — never two systems on the same property:
 *   intro/entrance → outer element `transform`      scroll parallax → layer `transform` (y)
 *   mouse          → layer `translate` via --mx/--my float          → inner wrapper `transform`
 *   hover          → CSS `transform` on the image
 */
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ── layers cut from the original art by build_assets.py ── */
  const LAYERS = window.FRUTATT_LAYERS || { leaves: [] };

  function leafEl(l, scale = 1) {
    const span = document.createElement('span');
    span.className = 'leaf';
    span.dataset.near = l.near ? '1' : '0';
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
  LAYERS.leaves.forEach((l) => (l.near ? heroNear : heroFar).append(leafEl(l)));

  // near-camera leaves reused at the products section edges, bigger and softer
  const prodNear = $('[data-leaves="near-products"]');
  const blurred = LAYERS.leaves.filter((l) => l.near);
  if (blurred[0]) prodNear.append(Object.assign(leafEl({ ...blurred[0], x: -3, y: 58 }, 1.25), { className: 'leaf leaf--edge' }));
  if (blurred[1]) prodNear.append(Object.assign(leafEl({ ...blurred[1], x: 90, y: 10 }, 1.1), { className: 'leaf leaf--edge' }));

  /* ── products without art yet → placeholder ── */
  $$('.prod').forEach((prod) => {
    const img = $('img', prod);
    const miss = () => prod.classList.add('is-missing');
    if (img.complete && img.naturalWidth === 0) miss();
    else img.addEventListener('error', miss, { once: true });
  });

  /* ── mobile carousel opens on the hero flavor (center item), not the first ── */
  const row = $('.products__row');
  const centerProd = $('.prod[data-from="center"]');
  const centerRow = () => {
    if (row.scrollWidth > row.clientWidth + 1) {
      row.scrollLeft = centerProd.offsetLeft - (row.clientWidth - centerProd.offsetWidth) / 2;
    }
  };
  centerRow();
  window.addEventListener('load', centerRow, { once: true });

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

  const hero = $('.hero');
  const stage = $('.hero__stage');
  const heroProduct = $('.hero__product');
  const heroPic = $('.hero__product picture');
  const heroFloat = $('.hero__float');
  const heroShadow = $('.hero__product .shadow');
  const heroWords = $$('.hero__title .word');
  const farLeaves = $$('.leaf', heroFar);
  const nearLeaves = $$('.leaf', heroNear);

  const products = $('.products');
  const prods = $$('.prod');

  // the CSS pre-motion opacity:0 is only a flash guard; GSAP owns those values from here
  gsap.set(['.hero__title', '.products__title'], { opacity: 1 });

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
        gsap.set(['.hero__title .word', '.products__title .word'], { clearProps: 'transform' });
        ScrollTrigger.batch(['.prod', '[data-reveal]'], {
          start: 'top 88%', once: true,
          onEnter: (els) => gsap.to(els, { opacity: 1, duration: 0.4, ease: 'none' }),
        });
        return;
      }

      /* ═════════ HERO intro — macro → zoom out → produto → frutas → tipografia ═════════ */
      const centerX = window.innerWidth / 2;
      const tl = gsap.timeline({ defaults: { ease: EASE } });
      tl.fromTo(stage, { scale: 1.16 }, { scale: 1, duration: 2 }, 0)
        .fromTo(heroPic,
          { opacity: 0, y: 90, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: 1.5 }, 0.3)
        .fromTo(heroShadow, { opacity: 0 }, { opacity: 1, duration: 1.2 }, 0.6)
        .fromTo([...farLeaves, ...nearLeaves],
          {
            opacity: 0, scale: 0.85,
            // leaves arrive from outside the frame, away from the product
            x: (i, el) => (el.getBoundingClientRect().left < centerX ? -1 : 1) * gsap.utils.random(40, 90),
            rotation: () => gsap.utils.random(-25, 25),
          },
          { opacity: 1, scale: 1, x: 0, rotation: 0, duration: 1.6, stagger: 0.05 }, 0.45)
        .from(heroWords, { yPercent: 115, duration: 1.1, stagger: 0.06 }, 0.75)
        .fromTo('[data-intro="eyebrow"], [data-intro="lead"], [data-intro="cta"]',
          { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0.95)
        .fromTo('[data-intro="fact"]',
          { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.9, stagger: 0.07 }, 1.05);

      /* ═════════ Floating — the product breathes, the leaves drift ═════════ */
      const heroLoop = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: FLOAT, duration: 2.6 } });
      heroLoop
        .fromTo(heroFloat, { y: 6, rotation: -1, scale: 1 }, { y: -8, rotation: 1, scale: 1.015 }, 0)
        // shadow tightens as the bottle lifts — sells the suspension
        .fromTo(heroShadow, { scaleX: 1.04, scaleY: 1.04 }, { scaleX: 0.9, scaleY: 0.88 }, 0);

      const leafLoops = [...farLeaves, ...nearLeaves].map((el) =>
        gsap.to($('img', el), {
          y: gsap.utils.random(-14, 14), x: gsap.utils.random(-6, 6), rotation: gsap.utils.random(-7, 7),
          duration: gsap.utils.random(3.2, 5.4), ease: FLOAT, repeat: -1, yoyo: true,
          delay: gsap.utils.random(0, 1.5),
        }));

      // idle loops only run while the hero is on screen
      ScrollTrigger.create({
        trigger: hero, start: 'top bottom', end: 'bottom top',
        onToggle: ({ isActive }) => [heroLoop, ...leafLoops].forEach((t) => (isActive ? t.play() : t.pause())),
      });

      /* ═════════ PRODUTOS — entrada → separação ═════════ */
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

      /* ═════════ Floating — independent rhythm per product ═════════ */
      const FLOATS = {
        granola: { y: [6, -10], x: [-3, 3], rotation: [-1.6, 1.4], scale: [1, 1], duration: 2.3 },
        caju:    { y: [-8, 8],  x: [0, 0],  rotation: [1.2, -1],   scale: [1, 1.018], duration: 2.6 }, // opposite phase
        acai:    { y: [7, -9],  x: [2, -2], rotation: [1.8, -1.2], scale: [1, 1], duration: 2.45 },
      };
      const prodLoops = prods.map((p) => {
        const f = FLOATS[p.dataset.prod];
        const loop = gsap.timeline({ repeat: -1, yoyo: true, delay: 1.2, defaults: { ease: FLOAT, duration: f.duration } });
        loop
          .fromTo($('.prod__float', p),
            { y: f.y[0], x: f.x[0], rotation: f.rotation[0], scale: f.scale[0] },
            { y: f.y[1], x: f.x[1], rotation: f.rotation[1], scale: f.scale[1] }, 0)
          .fromTo($('.shadow', p),
            { scaleX: f.y[0] > f.y[1] ? 1.04 : 0.9 },
            { scaleX: f.y[0] > f.y[1] ? 0.9 : 1.04 }, 0);
        return loop;
      });
      ScrollTrigger.create({
        trigger: products, start: 'top bottom', end: 'bottom top',
        onToggle: ({ isActive }) => prodLoops.forEach((t) => (isActive ? t.play() : t.pause())),
      });

      /* ═════════ Why — quiet stagger reveal ═════════ */
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 88%', once: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.06, ease: EASE }),
      });

      /* mobile stops here: reveal + floating + scale, no parallax, no mouse */
      if (!wide) return;

      /* ═════════ Parallax — bg minimal → fruit medium → product main → near fastest ═════════ */
      const scrub = (trigger, targets) => {
        const st = { trigger, start: 'top top', end: 'bottom top', scrub: 0.6 };
        targets.forEach(([el, y]) => el && gsap.to(el, { y, ease: 'none', scrollTrigger: st }));
      };
      scrub(hero, [
        [stage, () => hero.offsetHeight * 0.22],          // background: lags behind the scroll
        [heroFar, () => hero.offsetHeight * 0.06],        // fruit/leaves: medium
        [heroProduct, () => -hero.offsetHeight * 0.06],   // product: main
        [heroNear, () => -hero.offsetHeight * 0.38],      // near camera: fastest
      ]);

      const span = { trigger: products, start: 'top bottom', end: 'bottom top', scrub: 0.6 };
      gsap.fromTo('.products__bgword', { y: -30 }, { y: 30, ease: 'none', scrollTrigger: span });
      gsap.fromTo('.products__band', { y: 20 }, { y: -20, ease: 'none', scrollTrigger: span });
      prods.forEach((p, i) => {
        const amp = [60, 80, 66][i];
        gsap.fromTo($('.prod__depth', p), { y: amp }, { y: -amp, ease: 'none', scrollTrigger: span });
      });
      gsap.fromTo(prodNear, { y: 180 }, { y: -180, ease: 'none', scrollTrigger: span });

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
      const onMove = (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        layers.forEach((l) => { l.x(-nx * 2 * l.d); l.y(-ny * 1.2 * l.d); });
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      return () => window.removeEventListener('pointermove', onMove);
    },
  );
})();
