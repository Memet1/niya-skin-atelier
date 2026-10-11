import './style.css';
import { translate, formatPrice } from './i18n.js';
import { studio, services } from './config.js';
import { clamp, matchesService, ritualState, sectionMotion, validateBooking } from './logic.js';
import { initSculpture, initRitualScene } from './sculpture.js';

const $ = (selector) => document.querySelector(selector);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let language = 'ru';
try { language = localStorage.getItem('niya-language') === 'tr' ? 'tr' : 'ru'; } catch {}
const t = (key) => translate(language, key);
let currentFilter = 'all';
let serviceQuery = '';
function showStatus(element, key) { element.dataset.statusKey = key; element.textContent = key ? t(key) : ''; }
const dialog = $('#booking-dialog');
const privacy = $('#privacy-dialog');
const form = $('#booking-form');
let lastFocus;
$('#year').textContent = new Date().getFullYear();

document.querySelectorAll('.wordmark').forEach((el) => { el.firstChild.textContent = studio.name.toLowerCase(); el.setAttribute('aria-label', t('homeLabel')); });


const serviceSelect = $('#booking-service');

function renderServices(filter = 'all') {
  const list = $('#service-list');
  list.replaceChildren();
  services.forEach((service, index) => {
    if (filter !== 'all' && service.category !== filter) return;
    if (!matchesService(service, serviceQuery, language)) return;
    const row = document.createElement('article');
    row.className = 'service-row';
    // Content comes from the local, developer-controlled price list.
    row.innerHTML = `<span class="service-index">${String(index + 1).padStart(2, '0')}</span><div><h3 class="service-title">${service.name[language]}${service.tag ? `<small>${service.tag[language]}</small>` : ''}</h3><p class="service-description">${service.description[language]}</p></div><span class="service-duration">${service.duration} ${t('minute')}</span><span class="service-price">${formatPrice(service.price, language)}</span><button class="service-book" data-book="${service.id}" aria-label="${t('serviceBook')} ${service.name[language]}">↗</button>`;
    list.append(row);
  });
}

document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
  currentFilter = button.dataset.filter;
  renderServices(currentFilter);
  updateScroll();
}));
$('#service-search').addEventListener('input', (event) => { serviceQuery = event.target.value; renderServices(currentFilter); updateScroll(); });
document.addEventListener('click', (event) => {
  const book = event.target.closest('[data-book]');
  if (book) {
    lastFocus = book;
    serviceSelect.value = book.dataset.book || services[0].id;
    showStatus($('#form-status'), '');
    dialog.showModal();
  }
  const close = event.target.closest('[data-close]');
  if (close) close.closest('dialog').close();
  if (event.target.closest('#privacy-open, .inline-privacy')) privacy.showModal();
});
for (const modal of [dialog, privacy]) modal.addEventListener('click', (event) => {
  if (event.target !== modal) return;
  const rect = modal.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close();
});
dialog.addEventListener('close', () => { if (lastFocus?.isConnected) lastFocus.focus(); });
$('#booking-demo').hidden = Boolean(studio.bookingEndpoint);
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const status = $('#form-status');
  const validation = validateBooking(data, services.map((s) => s.id));
  if (validation) { showStatus(status, validation); return; }
  if (!studio.bookingEndpoint) { showStatus(status, 'bookingUnavailable'); return; }
  const submit = form.querySelector('[type=submit]');
  submit.disabled = true;
  showStatus(status, 'bookingSending');
  try {
    const response = await fetch(studio.bookingEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: data.name.trim(), phone: data.phone.trim(), service: data.service, message: data.message?.trim() || '', consent: true }) });
    if (!response.ok) throw new Error('Delivery failed');
    showStatus(status, 'bookingSuccess');
    form.reset();
  } catch { showStatus(status, 'bookingFailed'); }
  finally { submit.disabled = false; }
});

$('.menu-toggle').addEventListener('click', () => {
  const isOpen = $('.header nav').classList.toggle('open');
  $('.menu-toggle').setAttribute('aria-expanded', String(isOpen));
  $('.menu-toggle').setAttribute('aria-label', t(isOpen ? 'menuClose' : 'menuOpen'));
});
document.querySelectorAll('.header nav a').forEach((link) => link.addEventListener('click', () => {
  $('.header nav').classList.remove('open'); $('.menu-toggle').setAttribute('aria-expanded', 'false'); $('.menu-toggle').setAttribute('aria-label', t('menuOpen'));
}));
const safeUrl = (value, hosts) => {
  try { const url = new URL(value); return url.protocol === 'https:' && hosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`)) ? url.href : ''; } catch { return ''; }
};
const instagram = safeUrl(studio.instagramUrl, ['instagram.com']);
if (instagram) { $('#instagram-link').href = instagram; $('#instagram-link').firstChild.textContent = '@niya_cosmetolog '; $('#instagram-link').hidden = false; $('#instagram-placeholder').hidden = true; }
if (studio.address) $('#address').textContent = studio.address;
const maps = safeUrl(studio.googleMapsUrl, ['google.com', 'google.com.ua', 'maps.app.goo.gl', 'goo.gl']);
if (maps) for (const id of ['map-link', 'google-reviews-link']) { $(`#${id}`).href = maps; $(`#${id}`).hidden = false; }
const embed = safeUrl(studio.googleMapsEmbedUrl, ['google.com']);
if (embed) { $('#map-frame').src = embed; $('#map-frame').hidden = false; $('.map-art').hidden = true; $('#map-label').textContent = studio.address || 'NIYA — SKIN ATELIER'; }
if (studio.reviews.length) {
  const list = $('#review-list'); list.replaceChildren();
  studio.reviews.forEach((review) => {
    const card = document.createElement('article'); card.className = 'review-card';
    const stars = document.createElement('span'); stars.className = 'review-stars'; stars.textContent = '★'.repeat(Math.round(clamp(Number(review.rating) || 0, 0, 5))); stars.setAttribute('aria-label', `${review.rating} ${t('rating')}`);
    const quote = document.createElement('p'); quote.textContent = review.text;
    const name = document.createElement('h3'); name.textContent = review.name;
    const date = document.createElement('span'); date.className = 'review-date'; date.textContent = review.date || '';
    card.append(stars, quote, name, date); list.append(card);
  });
}

const film = $('#care-film');
const filmButton = $('#film-toggle');
function updateFilmButton() {
  filmButton.innerHTML = `${t(film.paused ? 'filmPlay' : 'filmPause')} <span>${film.paused ? '▷' : 'Ⅱ'}</span>`;
  filmButton.setAttribute('aria-label', t(film.paused ? 'filmPlayLabel' : 'filmPauseLabel'));
}
filmButton.addEventListener('click', async () => {
  if (!film.paused) film.pause();
  else try { film.preload = 'auto'; await film.play(); showStatus($('#film-status'), ''); } catch { showStatus($('#film-status'), 'filmUnavailable'); }
  updateFilmButton();
});
const filmObserver = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) { film.pause(); updateFilmButton(); } }, { threshold: .05 });
filmObserver.observe(film);
$('#portrait-image').addEventListener('error', (event) => { event.target.src = '/assets/niya-portrait.jpg'; event.target.classList.add('portrait-original'); }, { once: true });

if (!reducedMotion.matches) document.body.classList.add('motion-enabled');
const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.classList.toggle('visible', entry.isIntersecting)), { threshold: .12 });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
const portraitScene = $('.portrait-scene');
portraitScene.addEventListener('pointermove', (event) => {
  if (reducedMotion.matches || event.pointerType !== 'mouse') return;
  const rect = portraitScene.getBoundingClientRect();
  portraitScene.style.setProperty('--portrait-x', String(clamp((event.clientX - rect.left) / rect.width, 0, 1) * 2 - 1));
  portraitScene.style.setProperty('--portrait-y', String(clamp((event.clientY - rect.top) / rect.height, 0, 1) * 2 - 1));
});
portraitScene.addEventListener('pointerleave', () => { portraitScene.style.setProperty('--portrait-x', '0'); portraitScene.style.setProperty('--portrait-y', '0'); });
const ritual = $('#ritual');
const motionAnchors = document.querySelectorAll('.services-intro, .film-wrap, .reviews-heading, .review-grid, .contact-layout, .last-note');
let currentStep = -1;
let ritualProgress = 0;
let scheduled = false;
function updateScroll() {
  scheduled = false;
  // Measure stable wrappers; transforms only affect their children.
  [...motionAnchors, ...document.querySelectorAll('.service-row')].forEach((anchor) => {
    const bounds = anchor.getBoundingClientRect();
    const motion = reducedMotion.matches ? { arrival: 0, drift: 0 } : sectionMotion(bounds.top, bounds.height, innerHeight);
    anchor.style.setProperty('--arrival', motion.arrival.toFixed(4));
    anchor.style.setProperty('--drift', motion.drift.toFixed(4));
  });
  const portraitRect = portraitScene.getBoundingClientRect();
  const portraitProgress = reducedMotion.matches ? 0 : clamp((innerHeight * .5 - portraitRect.top) / portraitRect.height, -1, 1);
  portraitScene.style.setProperty('--portrait-scroll', `${portraitProgress * 18}px`);
  const rect = ritual.getBoundingClientRect();
  const p = reducedMotion.matches ? 0 : clamp(-rect.top / Math.max(1, ritual.offsetHeight - innerHeight));
  const state = ritualState(p);
  ritualProgress = p;
  ritual.dataset.step = String(state.step);
  ritual.dataset.progress = p.toFixed(4);
  $('.glass-ring').style.transform = `rotateX(${28 + p * 95}deg) rotateY(${35 + p * 280}deg) rotateZ(${p * 100}deg) scale(${1 - state.spread * .17})`;
  document.querySelectorAll('.glass-drop').forEach((drop, i) => { drop.style.transform = `translate3d(${Math.sin(p * Math.PI * 2 + i) * state.spread * 75}px,${Math.cos(p * Math.PI * 2 + i) * state.spread * 85}px,${state.spread * (i + 1) * 35}px) rotate(${p * 180}deg)`; });
  $('.ritual-progress span').style.transform = `scaleX(${p})`;
  if (currentStep !== state.step) {
    currentStep = state.step;
    $('#ritual-kicker').textContent = t(`ritualKicker${currentStep}`);
    $('#ritual-title').innerHTML = `${t(`ritualTitle${currentStep}a`)}<br><em>${t(`ritualTitle${currentStep}b`)}</em>`;
    $('#ritual-description').textContent = t(`ritualDesc${currentStep}`);
    $('#ritual-count').textContent = `0${currentStep + 1} / 03`;
  }
}
addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); } }, { passive: true });
addEventListener('resize', updateScroll);
reducedMotion.addEventListener('change', () => { document.body.classList.toggle('motion-enabled', !reducedMotion.matches); updateScroll(); });
applyLanguage(language);
initSculpture($('#skin-canvas'), reducedMotion);

initRitualScene($('#ritual-canvas'), reducedMotion, () => ritualProgress);

function applyLanguage(nextLanguage) {
  language = nextLanguage === 'tr' ? 'tr' : 'ru';
  document.documentElement.lang = language;
  document.title = t('title');
  document.querySelector('meta[name=description]').content = t('description');
  document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = t(element.dataset.i18n); });
  for (const attribute of ['aria-label', 'placeholder', 'alt', 'title']) {
    document.querySelectorAll(`[data-i18n-${attribute}]`).forEach((element) => element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`))));
  }
  document.querySelectorAll('.wordmark').forEach((element) => element.setAttribute('aria-label', t('homeLabel')));
  document.querySelectorAll('[data-language]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
  const selected = serviceSelect.value;
  serviceSelect.replaceChildren();
  for (const service of services) serviceSelect.add(new Option(service.name[language], service.id));
  serviceSelect.value = selected || services[0].id;
  renderServices(currentFilter);
  document.querySelectorAll('[data-status-key]').forEach((element) => showStatus(element, element.dataset.statusKey));
  if (studio.address) $('#address').textContent = studio.address;
  if (embed) $('#map-label').textContent = studio.address || 'NIYA';
  $('.menu-toggle').setAttribute('aria-label', t($('.header nav').classList.contains('open') ? 'menuClose' : 'menuOpen'));
  currentStep = -1;
  updateScroll();
  updateFilmButton();
  try { localStorage.setItem('niya-language', language); } catch {}
}
document.querySelectorAll('[data-language]').forEach((button) => button.addEventListener('click', () => applyLanguage(button.dataset.language)));
