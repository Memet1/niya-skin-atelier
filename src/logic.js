export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export function sectionMotion(top, height, viewport) {
  return {
    arrival: 1 - clamp((viewport * .92 - top) / Math.max(1, viewport * .65)),
    drift: clamp((viewport / 2 - top - height / 2) / Math.max(1, viewport + height), -.5, .5),
  };
}
export function ritualState(progress) {
  const p = clamp(progress);
  return { progress: p, step: Math.min(2, Math.floor(p * 3)), rotation: p * Math.PI * 2, spread: Math.sin(p * Math.PI) };
}
export function validateBooking(data, allowedServices) {
  const name = data.name?.trim() || '';
  const phone = data.phone?.trim() || '';
  const digits = phone.replace(/\D/g, '');
  if (name.length < 2 || name.length > 80) return 'invalidName';
  if (!/^[+\d\s()-]+$/.test(phone) || digits.length < 9 || digits.length > 15) return 'invalidPhone';
  if (!allowedServices.includes(data.service)) return 'invalidService';
  if ((data.message || '').length > 500) return 'invalidMessage';
  if (!data.consent) return 'invalidConsent';
  return '';
}
// Deterministic positions make the sculpture retrace the same path when scrolling back.
export function particlePosition(index, count, progress) {
  const p = clamp(progress), t = index / count;
  const angle = index * 2.399963229728653;
  const y = 1 - t * 2;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const sphere = [Math.cos(angle) * radius * 1.8, y * 1.8, Math.sin(angle) * radius * 1.8];
  const spiralAngle = t * Math.PI * 14 + p * Math.PI * 2;
  const spiral = [Math.cos(spiralAngle) * (1.1 + t * .9), (t - .5) * 4.5, Math.sin(spiralAngle) * (1.1 + t * .9)];
  const morph = Math.sin(p * Math.PI);
  return sphere.map((value, axis) => (value * (1 - morph) + spiral[axis] * morph) * (1 + p * p * .7));
}
