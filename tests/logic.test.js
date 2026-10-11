import test from 'node:test';
import assert from 'node:assert/strict';
import { ritualState, sectionMotion, validateBooking } from '../src/logic.js';
import { services } from '../src/config.js';
test('lower sections retrace scroll motion with bounded values on any viewport', () => {
  for (const viewport of [390, 844, 900]) {
    const tops = [viewport, viewport / 2, -200, viewport / 2, viewport];
    const journey = tops.map((top) => sectionMotion(top, 400, viewport));
    assert.deepEqual(journey[0], journey[4]);
    assert.deepEqual(journey[1], journey[3]);
    assert.notDeepEqual(journey[0], journey[2]);
    for (const top of [-10000, ...tops, 10000]) {
      const { arrival, drift } = sectionMotion(top, 400, viewport);
      assert.ok(arrival >= 0 && arrival <= 1);
      assert.ok(drift >= -.5 && drift <= .5);
    }
  }
  assert.ok(Object.values(sectionMotion(0, 0, 0)).every(Number.isFinite));
});
test('scroll timeline reverses and stays within its three steps', () => {
  const journey = [0, .5, 1, .5, 0].map(ritualState);
  assert.deepEqual(journey.map((s) => s.step), [0, 1, 2, 1, 0]);
  assert.deepEqual(journey[0], journey[4]); assert.deepEqual(journey[1], journey[3]);
  assert.equal(ritualState(-10).progress, 0); assert.equal(ritualState(10).step, 2);
});
test('booking validates contact, service and consent', () => {
  const ids = services.map((s) => s.id);
  const valid = { name: 'Олена', phone: '+380 (67) 123-45-67', service: ids[0], message: '', consent: 'on' };
  assert.equal(validateBooking(valid, ids), '');
  for (const patch of [{ name: ' ' }, { phone: 'abcdef123456789' }, { phone: '123' }, { service: 'unknown' }, { consent: '' }, { message: 'x'.repeat(501) }]) assert.notEqual(validateBooking({ ...valid, ...patch }, ids), '');
});
import { particlePosition } from '../src/logic.js';
test('particle morph is finite and deterministic at both scroll directions', () => {
  for (const p of [0, .2, .5, .8, 1]) for (const i of [0, 1, 849]) {
    const point = particlePosition(i, 850, p);
    assert.equal(point.length, 3); assert.ok(point.every(Number.isFinite));
    assert.deepEqual(point, particlePosition(i, 850, p));
  }
  assert.notDeepEqual(particlePosition(1, 850, 0), particlePosition(1, 850, .5));
});
import { readFileSync } from 'node:fs';
import { translations, translate, formatPrice } from '../src/i18n.js';
test('RU and TR cover every translation marker and validation message', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const keys = [...html.matchAll(/data-i18n(?:-(?:aria-label|alt|title|placeholder))?="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(Object.keys(translations.ru).sort(), Object.keys(translations.tr).sort());
  for (const language of ['ru', 'tr']) {
    for (const key of keys) assert.ok(translations[language][key], `${language}: ${key}`);
    for (const service of services) { assert.ok(service.name[language]); assert.ok(service.description[language]); }
    assert.match(formatPrice(1400, language), /₺/);
    assert.notEqual(translate(language, 'invalidPhone'), 'invalidPhone');
    for (let step = 0; step < 3; step++) for (const part of ['Kicker', 'Title', 'Desc']) {
      const suffixes = part === 'Title' ? ['a', 'b'] : [''];
      for (const suffix of suffixes) assert.ok(translations[language][`ritual${part}${step}${suffix}`]);
    }
  }
});

import { PerspectiveCamera, Vector3 } from 'three';
import { frameRitualCamera } from '../src/sculpture.js';
test('full-section ritual camera preserves composition across desktop and mobile resizing', () => {
  const camera = new PerspectiveCamera(48, 1, .1, 60);
  camera.position.z = 7;
  camera.updateMatrixWorld();
  for (const [width, height] of [[1280, 900], [390, 844], [700, 844], [701, 900], [1280, 900]]) {
    frameRitualCamera(camera, width, height);
    const origin = new Vector3().project(camera);
    const mobile = width <= 700;
    assert.ok(Math.abs((origin.x + 1) / 2 - (mobile ? .5 : .295)) < .00001);
    assert.ok(Math.abs((1 - origin.y) / 2 - (mobile ? .275 : .5)) < .00001);
    assert.equal(camera.view.width, width);
    assert.equal(camera.view.height, height);
    assert.equal(camera.zoom, mobile ? .55 : 1);
  }
});

import { frameHeroCamera } from '../src/sculpture.js';
test('hero canvas expands without shifting or enlarging its existing artwork', () => {
  for (const [width, height, art] of [
    [1280, 900, { left: 537.6, top: 144, width: 768, height: 684 }],
    [900, 900, { left: 378, top: 144, width: 630, height: 684 }],
    [390, 950, { left: -15.6, top: 450, width: 436.8, height: 450 }],
  ]) {
    const camera = new PerspectiveCamera(36, 1, .1, 50);
    camera.position.z = 7.5; camera.updateMatrixWorld();
    frameHeroCamera(camera, width, height, art);
    const origin = new Vector3().project(camera);
    assert.ok(Math.abs((origin.x + 1) / 2 * width - art.left - art.width / 2) < .00001);
    assert.ok(Math.abs((1 - origin.y) / 2 * height - art.top - art.height / 2) < .00001);
    const oldCamera = new PerspectiveCamera(36, art.width / art.height, .1, 50);
    oldCamera.position.z = 7.5; oldCamera.updateMatrixWorld();
    const point = new Vector3(0, 1, 0);
    assert.ok(Math.abs((point.clone().project(camera).y - origin.y) * height - point.project(oldCamera).y * art.height) < .00001);
  }
});
