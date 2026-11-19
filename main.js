// ПОРТФОЛИО — карусель из девяти «экранов» в 3D, живое превью каждой работы и конструктор брифа.
import * as THREE from 'three';

/* ================================================================== */
/* ВАШИ ДАННЫЕ — поменяйте здесь, и они обновятся по всей странице     */
/* ================================================================== */
const ME = {
  name: 'Калыгулов Нуртилек',  // как подписан сайт
  phone: '+996 220 709 230',    // показывается в подвале
  whatsapp: '996220709230',     // номер для WhatsApp: только цифры, с кодом страны
  telegram: '',                 // ник без @ — появится кнопка «Написать в Telegram»
  github: 'kalygulovdonat-ctrl',
};
const BASE = `https://${ME.github}.github.io/`;

const WORKS = [
  { id: 'autoschool', name: 'Полоса', genre: 'Автошкола', color: '#ffb400', tech: 'Поездка от первого лица: скролл работает как газ, ночь сменяется рассветом.', try: 'Доедьте до светофора — он переключится на зелёный.' },
  { id: 'shop', name: 'Обжиг', genre: 'Магазин', color: '#c8922f', tech: 'Товар на гончарном круге: одна ваза перелепливается в другую.', try: 'Смените глазурь и положите вазу в корзину.' },
  { id: 'dom', name: 'Южный 17', genre: 'Недвижимость', color: '#ff6a3d', tech: 'Макет дома с выбором квартиры и движением солнца по часам.', try: 'Передвиньте время на ночь и откройте любой этаж.' },
  { id: 'fest', name: 'Частота', genre: 'Событие', color: '#c6ff3d', tech: '64 000 частиц перетекают из фигуры в фигуру и пульсируют под музыку.', try: 'Включите звук слева внизу.' },
  { id: 'trek', name: 'Хребет', genre: 'Туризм', color: '#ff5a1f', tech: 'Рельеф-карта с горизонталями и полётом камеры по маршруту.', try: 'Листайте — внизу заполняется высотный профиль.' },
  { id: 'drop', name: 'Капля', genre: 'Косметика', color: '#d9a3f0', tech: '«Жидкость», целиком нарисованная шейдером, без единой модели.', try: 'Пройдите подбор сыворотки за три вопроса.' },
  { id: 'watch', name: 'Механика', genre: 'Часы', color: '#c9a45c', tech: 'Модель часов из деталей: стрелки идут по вашему времени.', try: 'Соберите свою версию в конфигураторе.' },
  { id: 'coffee', name: 'Зерно', genre: 'Подписка', color: '#e2452b', tech: '1500 зёрен перестраиваются по скроллу: вихрь, барабан, струя.', try: 'Покрутите ползунок обжарки — зёрна потемнеют.' },
  { id: 'gallery', name: 'Зал 3', genre: 'Выставка', color: '#5c6cff', tech: 'Прогулка по галерее: каждая картина рисует себя сама.', try: 'Дойдите до кассы и купите билет.' },
  { id: 'kegl', name: 'Кегль', genre: 'Фестиваль шрифтов', color: '#ff3b1f', tech: 'Кинетическая типографика на React: буквы прорезаются, шрифт меняет толщину под курсором, теги падают с физикой.', try: 'Поводите курсором по словам «Подвиньте курсор».', url: `${BASE}kegl/`, repo: `https://github.com/${ME.github}/kegl` },
].map((w, i) => ({ ...w, i, url: w.url || `${BASE}${w.id}-3d/`, repo: w.repo || `https://github.com/${ME.github}/${w.id}-3d`, img: `img/${w.id}.jpg` }));
const N = WORKS.length;

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = matchMedia('(max-width: 760px)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const $ = (id) => document.getElementById(id);

/* ---------- подстановка личных данных ---------- */
document.querySelectorAll('[data-me="name"]').forEach((el) => { el.textContent = ME.name; });
const WA = `https://wa.me/${ME.whatsapp}`;
document.querySelectorAll('[data-me="wa"]').forEach((el) => { el.href = WA; });
document.querySelectorAll('[data-me="phone"]').forEach((el) => { el.textContent = ME.phone; el.href = WA; });
document.querySelectorAll('[data-me="gh"]').forEach((el) => { el.href = `https://github.com/${ME.github}`; });
document.title = `${ME.name} — 3D-сайты`;

/* ---------- сетка всех работ ---------- */
$('grid').innerHTML = WORKS.map((w) => `
  <li class="card">
    <button class="card__img" type="button" data-live="${w.i}" aria-label="Открыть «${w.name}» вживую"><img src="${w.img}" alt="Главный экран сайта «${w.name}»" loading="lazy" width="800" height="500"></button>
    <div class="card__row"><h3>${w.name}</h3><span class="mono">${w.genre}</span></div>
    <p>${w.tech}</p>
    <div class="card__links"><button class="link" type="button" data-live="${w.i}">Вживую</button><a class="link" href="${w.url}" target="_blank" rel="noopener">Сайт ↗</a><a class="link" href="${w.repo}" target="_blank" rel="noopener">Код ↗</a></div>
  </li>`).join('');

/* ---------- карусель: текст об активной работе ---------- */
const state = { active: 0, shown: -1 };
$('rail').innerHTML = WORKS.map((w) => `<li><button type="button" data-go="${w.i}">${String(w.i + 1).padStart(2, '0')} ${w.name}</button></li>`).join('');
let swapT = 0;
function showWork(i) {
  if (i === state.shown) return;
  const first = state.shown < 0; state.shown = i;
  const w = WORKS[i], info = $('info');
  const fill = () => {
    $('iNum').textContent = String(i + 1).padStart(2, '0'); $('iGenre').textContent = w.genre; $('iName').textContent = w.name;
    $('iTech').textContent = w.tech; $('iTry').textContent = w.try; $('iLink').href = w.url;
    info.classList.remove('is-out');
  };
  document.documentElement.style.setProperty('--acc', w.color);
  document.querySelectorAll('#rail button').forEach((b) => b.setAttribute('aria-current', String(+b.dataset.go === i)));
  clearTimeout(swapT);
  if (first || reduceMotion) fill(); else { info.classList.add('is-out'); swapT = setTimeout(fill, 220); }
}
const worksEl = $('works');
const worksRange = () => { const r = worksEl.getBoundingClientRect(); return { top: r.top + scrollY, span: r.height - innerHeight }; };
const goTo = (i) => { const { top, span } = worksRange(); scrollTo({ top: top + (i / (N - 1)) * span, behavior: reduceMotion ? 'auto' : 'smooth' }); };
$('rail').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) goTo(+b.dataset.go); });
function readScroll() {
  const { top, span } = worksRange();
  state.active = clamp((scrollY - top) / span, 0, 1) * (N - 1);
  showWork(Math.round(state.active));
}
addEventListener('scroll', readScroll, { passive: true }); addEventListener('resize', readScroll);
readScroll();

/* ---------- живое превью ---------- */
const live = $('live'), frame = $('liveFrame'); let lastFocus = null;
function openLive(i) {
  const w = WORKS[i]; lastFocus = document.activeElement;
  $('liveTitle').textContent = `${w.name} · ${w.genre} · работает прямо здесь`;
  $('liveOpen').href = w.url; frame.src = w.url;
  live.hidden = false; document.body.classList.add('is-locked'); $('liveClose').focus();
}
function closeLive() { live.hidden = true; frame.src = 'about:blank'; document.body.classList.remove('is-locked'); if (lastFocus) lastFocus.focus(); }
document.addEventListener('click', (e) => { const b = e.target.closest('[data-live]'); if (b) openLive(+b.dataset.live); });
$('iLive').addEventListener('click', () => openLive(Math.round(state.active)));
$('liveClose').addEventListener('click', closeLive);
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !live.hidden) closeLive(); });
live.querySelector('.live__dev').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  live.classList.toggle('is-phone', b.dataset.dev === 'phone');
  live.querySelectorAll('.live__dev button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
});

/* ---------- конструктор брифа ---------- */
const BRIEF = {
  bType: ['radio', ['Лендинг', 'Интернет-магазин', 'Сайт для недвижимости', 'Сайт события', 'Личное портфолио', 'Другое']],
  bFeat: ['checkbox', ['3D-модель товара', 'Анимация по скроллу', 'Конфигуратор', 'Калькулятор цены', 'Форма заявки', 'Версия на двух языках']],
  bTime: ['radio', ['2 недели', 'Месяц', 'Не спешу']],
};
for (const k in BRIEF) $(k).innerHTML = BRIEF[k][1].map((v, i) => `<label><input type="${BRIEF[k][0]}" name="${k}" value="${v}" ${BRIEF[k][0] === 'radio' && i === 0 ? 'checked' : ''}><span>${v}</span></label>`).join('');
function briefText() {
  const val = (k) => [...document.querySelectorAll(`#${k} input:checked`)].map((i) => i.value);
  const feats = val('bFeat'), about = $('bText').value.trim(), name = $('bName').value.trim();
  return [
    'Здравствуйте!', '',
    `Нужен сайт: ${val('bType')[0].toLowerCase()}.`,
    feats.length ? `Важно: ${feats.map((f) => f[0].toLowerCase() + f.slice(1)).join(', ')}.` : null,
    `Срок: ${val('bTime')[0].toLowerCase()}.`,
    about ? `О проекте: ${about}` : null,
    '', name ? `С уважением, ${name}` : null,
  ].filter((l) => l !== null).join('\n').trim();
}
function drawBrief() {
  const t = briefText(); $('bOut').textContent = t; $('bNote').textContent = '';
  $('bWa').href = `${WA}?text=${encodeURIComponent(t)}`;
  if (ME.telegram) { $('bTg').hidden = false; $('bTg').href = `https://t.me/${ME.telegram}`; }
}
$('briefForm').addEventListener('input', drawBrief); drawBrief();
$('bCopy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(briefText()); $('bNote').textContent = 'Скопировано. Вставьте текст в WhatsApp.'; }
  catch (e) { const r = document.createRange(); r.selectNodeContents($('bOut')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); $('bNote').textContent = 'Текст выделен — нажмите Ctrl+C.'; }
});
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const t = document.querySelector(a.getAttribute('href')); if (!t) return;
  e.preventDefault(); t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
}));

/* ================================================================== */
/* 3D: кольцо экранов                                                  */
/* ================================================================== */
const canvas = $('scene');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
catch (e) { document.documentElement.classList.add('no-webgl'); document.body.classList.remove('is-loading'); }
if (renderer) init();

function init() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.6 : 2));
  renderer.setSize(innerWidth, innerHeight, false);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0.5, 11.5); camera.lookAt(0, 0, 0);

  const R = 4.7, STEP = (Math.PI * 2) / N, W = 3.3, H = W / 1.6;
  const ring = new THREE.Group(), rig = new THREE.Group(); rig.add(ring); scene.add(rig);
  const loader = new THREE.TextureLoader(), screens = [], plane = new THREE.PlaneGeometry(W, H);
  const backMat = new THREE.MeshBasicMaterial({ color: '#1b1b20', side: THREE.DoubleSide });
  WORKS.forEach((w, i) => {
    const tex = loader.load(w.img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    const g = new THREE.Group(), a = i * STEP;
    const face = new THREE.Mesh(plane, mat); face.userData.i = i;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.1, H + 0.1), backMat); back.position.z = -0.02;
    // отражение под экраном
    const refl = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.13, depthWrite: false }));
    refl.scale.y = -1; refl.position.y = -H - 0.14;
    g.add(back, face, refl);
    g.position.set(Math.sin(a) * R, 0, Math.cos(a) * R); g.rotation.y = a;
    ring.add(g); screens.push({ g, face, mat, refl });
  });

  // перетаскивание листает работы, клик по переднему экрану открывает его вживую
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let drag = null;
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, last: e.clientX, moved: 0 }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.last; drag.last = e.clientX; drag.moved += Math.abs(dx);
    if (drag.moved > 6) scrollBy(0, -dx * (worksRange().span / (N - 1)) / (innerWidth * 0.32));
  });
  const up = (e) => {
    if (!drag) return; const click = drag.moved < 6 && Math.abs(e.clientY - drag.y) < 6; drag = null;
    if (!click) return;
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(screens.map((s) => s.face), false)[0]; if (!hit) return;
    const i = hit.object.userData.i;
    if (i === Math.round(state.active)) openLive(i); else goTo(i);
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', () => { drag = null; });
  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

  const clock = new THREE.Clock(); let started = false, rot = 0, px = small ? 0 : 2.6, py = 0, sc = 0.7, fade = 1;
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.1);
    if (document.hidden || !live.hidden) return;
    const time = clock.elapsedTime, k = (r) => (reduceMotion ? 1 : 1 - Math.exp(-dt * r));
    const r = worksEl.getBoundingClientRect(), vh = innerHeight;
    const inWorks = sstep(vh * 0.75, vh * 0.1, r.top);            // 0 на главном экране → 1 в карусели
    const out = sstep(vh * 0.9, vh * 0.25, r.bottom);              // карусель закончилась — сцена гаснет
    const portrait = camera.aspect < 0.85;
    const idle = reduceMotion ? 0 : Math.sin(time * 0.35) * 0.55 * (1 - inWorks);
    rot = lerp(rot, -(state.active + idle) * STEP, k(4.5));
    ring.rotation.y = rot;
    px = lerp(px, portrait ? 0 : lerp(3.5, -1.7, inWorks) * Math.min(1, camera.aspect / 1.7), k(3));
    py = lerp(py, portrait ? lerp(2.2, 1.7, inWorks) : 0.1, k(3));
    sc = lerp(sc, portrait ? 0.56 : lerp(0.68, 0.88, inWorks), k(3));
    rig.position.set(px, py, 0); rig.scale.setScalar(sc);
    rig.rotation.x = 0.07 + (reduceMotion ? 0 : Math.sin(time * 0.4) * 0.015);
    screens.forEach((s, i) => {
      let d = Math.abs(i - (state.active + idle)); d = Math.min(d, N - d);
      const near = 1 - sstep(0, 1.6, d);
      s.mat.color.setScalar(lerp(0.2, 1, near)); s.refl.material.opacity = 0.13 * near;
      s.g.scale.setScalar(lerp(0.92, 1.08, near));
    });
    fade = lerp(fade, 1 - out, k(6));
    canvas.style.opacity = fade.toFixed(3); canvas.style.pointerEvents = fade < 0.3 ? 'none' : '';
    renderer.render(scene, camera);
    if (!started) { started = true; document.body.classList.remove('is-loading'); }
  }
  frame();
}
