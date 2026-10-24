import { HelioVector, RotateVector, Rotation_EQJ_GAL, Observer, ObserverVector } from 'astronomy-engine';
export const AU_KM = 149597870.7;
export const PC_AU = 206264.806247;
// Volumetric mean radii (km): NASA/JPL physical parameters and NASA Sun fact sheet.
export const BODY_RADIUS_KM = Object.freeze({
  Sun:695700, Mercury:2439.4, Venus:6051.8, Earth:6371.0084,
  Mars:3389.5, Jupiter:69911, Saturn:58232, Uranus:25362, Neptune:24622,
});
export function bodyRadiusPixels(body, pixelsPerAU) {
  return BODY_RADIUS_KM[body] / AU_KM * pixelsPerAU;
}
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

export function locationRay(latitude, longitude, date = new Date()) {
  const rotation = Rotation_EQJ_GAL();
  const ground = RotateVector(rotation, ObserverVector(date, new Observer(latitude, longitude, 0), false));
  const above = RotateVector(rotation, ObserverVector(date, new Observer(latitude, longitude, 1000), false));
  const delta = [above.x-ground.x, above.y-ground.y, above.z-ground.z];
  const length = Math.hypot(...delta);
  const earth = position('Earth',date);
  return {
    origin: [earth[0]+ground.x, earth[1]+ground.y, earth[2]+ground.z],
    direction: delta.map(value=>value/length),
  };
}
