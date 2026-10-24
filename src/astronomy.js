import { HelioVector, RotateVector, Rotation_EQJ_GAL } from 'astronomy-engine';
export const AU_KM = 149597870.7;
export const PC_AU = 206264.806247;
export const SUN = [-8178 * PC_AU, 0, 20.8 * PC_AU];
export function position(body, date = new Date()) {
  const v = RotateVector(Rotation_EQJ_GAL(), HelioVector(body, date));
  return [SUN[0] + v.x, v.y, SUN[2] + v.z];
}
export function fieldWidth(level) {
  // Physical field widths in AU; interpolation is logarithmic.
  const stops = [1.2e10, 80, 0.0005];
  const i = Math.min(1, Math.floor(Math.max(0, level)));
  return Math.exp(Math.log(stops[i]) + (Math.log(stops[i+1])-Math.log(stops[i])) * (level-i));
}
