import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { clamp, particlePosition } from './logic.js';

export function frameHeroCamera(camera, width, height, art) {
  camera.aspect = width / height;
  camera.zoom = art.height / height;
  camera.setViewOffset(width, height, width / 2 - art.left - art.width / 2, height / 2 - art.top - art.height / 2, width, height);
  camera.updateProjectionMatrix();
}

export function initSculpture(canvas, reducedMotion) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); }
  catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 50);
  camera.position.set(0, 0, 7.5);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  room.dispose(); pmrem.dispose();
  const sculpture = new THREE.Group();
  const glass = new THREE.MeshPhysicalMaterial({ color: '#dfa37b', metalness: .08, roughness: .13, transmission: .82, thickness: 1.3, ior: 1.44, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.5, attenuationColor: new THREE.Color('#d69059'), attenuationDistance: 2.8 });
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.06, .29, 180, 32, 2, 3), glass);
  sculpture.add(knot);
  const droplets = [];
  for (let i = 0; i < 7; i++) {
    const angle = i / 7 * Math.PI * 2;
    const drop = new THREE.Mesh(new THREE.SphereGeometry(.075 + (i % 3) * .045, 24, 20), glass);
    drop.position.set(Math.cos(angle) * (1.85 + i % 2 * .2), Math.sin(angle) * 1.7, Math.sin(angle * 2) * .7);
    drop.scale.y = 1.3;
    drop.userData.origin = drop.position.clone();
    droplets.push(drop); sculpture.add(drop);
  }
  scene.add(sculpture);
  const key = new THREE.DirectionalLight('#fff3df', 4); key.position.set(-4, 4, 5); scene.add(key);
  const fill = new THREE.DirectionalLight('#ffccb0', 2); fill.position.set(3, -1, 2); scene.add(fill);
  scene.add(new THREE.AmbientLight('#fff8ef', .7));
  let width = 1, height = 1, visible = true, frame, dirty = true;
  const target = { x: 0, y: 0 }, pointer = { x: 0, y: 0 };
  const resize = new ResizeObserver(([entry]) => {
    width = entry.contentRect.width; height = entry.contentRect.height;
    if (!width || !height) return;
    const stage = canvas.parentElement.getBoundingClientRect();
    const art = canvas.parentElement.parentElement.querySelector('.hero-art').getBoundingClientRect();
    renderer.setSize(width, height, false);
    frameHeroCamera(camera, width, height, { left: art.left - stage.left, top: art.top - stage.top, width: art.width, height: art.height });
    dirty = true;
  });
  resize.observe(canvas.parentElement);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; dirty = true; }, { threshold: 0 }).observe(canvas);
  addEventListener('pointermove', (event) => { if (event.pointerType !== 'mouse' || reducedMotion.matches) return; target.x = (event.clientX / innerWidth - .5) * .25; target.y = (event.clientY / innerHeight - .5) * .18; dirty = true; }, { passive: true });
  addEventListener('scroll', () => { dirty = true; }, { passive: true });
  reducedMotion.addEventListener('change', () => { target.x = 0; target.y = 0; dirty = true; });
  function render(time) {
    frame = requestAnimationFrame(render);
    if (!visible || document.hidden || (!dirty && reducedMotion.matches)) return;
    const p = reducedMotion.matches ? 0 : clamp(scrollY / innerHeight);
    pointer.x += (target.x - pointer.x) * .045; pointer.y += (target.y - pointer.y) * .045;
    const idle = reducedMotion.matches ? 0 : Math.sin(time * .00025) * .06;
    sculpture.rotation.set(.34 + p * .9 + pointer.y, -.5 + p * 2.2 + pointer.x + idle, -.3 + p * .4);
    sculpture.position.y = -.08 + p * .22;
    for (const [i, drop] of droplets.entries()) {
      drop.position.copy(drop.userData.origin).multiplyScalar(1 + p * .42);
      if (!reducedMotion.matches) drop.position.y += Math.sin(time * .0006 + i) * .045;
    }
    renderer.render(scene, camera); dirty = false;
  }
  document.body.classList.add('webgl-ready');
  frame = requestAnimationFrame(render);
  canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); cancelAnimationFrame(frame); document.body.classList.remove('webgl-ready'); });
}

export function frameRitualCamera(camera, width, height) {
  const mobile = width <= 700;
  camera.aspect = width / height;
  camera.zoom = mobile ? .55 : 1;
  // Keep the sculpture's original center while rendering beyond the old column edges.
  camera.setViewOffset(width, height, mobile ? 0 : width * .205, mobile ? height * .225 : 0, width, height);
  camera.updateProjectionMatrix();
}

export function initRitualScene(canvas, reducedMotion, getProgress) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, .1, 60);
  camera.position.z = 7;
  const group = new THREE.Group(); scene.add(group);
  const count = innerWidth < 700 ? 850 : 1600;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const color = new THREE.Color(i % 5 ? '#e7bb7c' : '#fff4d1'); color.toArray(colors, i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const sprite = document.createElement('canvas'); sprite.width = sprite.height = 64;
  const context = sprite.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, '#fff'); gradient.addColorStop(.14, '#fffd'); gradient.addColorStop(.4, '#fff3'); gradient.addColorStop(1, '#fff0');
  context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(sprite);
  const particles = new THREE.Points(geometry, new THREE.PointsMaterial({ size: .065, map: texture, vertexColors: true, transparent: true, opacity: .95, depthWrite: false, blending: THREE.AdditiveBlending }));
  group.add(particles);
  const starPositions = new Float32Array(180 * 3);
  for (let i = 0; i < 180; i++) { starPositions[i * 3] = Math.sin(i * 14.73) * 10; starPositions[i * 3 + 1] = Math.cos(i * 7.12) * 7; starPositions[i * 3 + 2] = -2 - (i % 12); }
  const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: '#dec5a0', size: .08, map: texture, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(stars);
  let visible = false, dirty = true, lastProgress = -1, frame;
  new ResizeObserver(([entry]) => { const { width, height } = entry.contentRect; if (!width || !height) return; renderer.setSize(width, height, false); frameRitualCamera(camera, width, height); dirty = true; }).observe(canvas.parentElement);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; dirty = true; }).observe(canvas);
  reducedMotion.addEventListener('change', () => { dirty = true; });
  function render(time) {
    frame = requestAnimationFrame(render);
    if (!visible || document.hidden) return;
    const p = reducedMotion.matches ? 0 : getProgress();
    if (!dirty && reducedMotion.matches) return;
    if (p !== lastProgress) {
      for (let i = 0; i < count; i++) positions.set(particlePosition(i, count, p), i * 3);
      geometry.attributes.position.needsUpdate = true; lastProgress = p;
    }
    group.rotation.y = p * Math.PI * 1.7 + (reducedMotion.matches ? 0 : time * .00004);
    group.rotation.z = -.14 + Math.sin(p * Math.PI) * .2;
    stars.rotation.z = p * .12;
    camera.position.z = 7 - p * 1.7;
    renderer.render(scene, camera); dirty = false;
  }
  canvas.parentElement.classList.add('ritual-webgl');
  frame = requestAnimationFrame(render);
  canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); cancelAnimationFrame(frame); canvas.parentElement.classList.remove('ritual-webgl'); });
}
