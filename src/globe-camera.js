// A sphere centered on a surface point with radius 2R contains all of Earth.
// Fit that sphere at the far end of zoom without moving the location target.
export function anchoredGlobeRange(viewer) {
  const C=window.Cesium, frustum=viewer.camera.frustum;
  const vertical=frustum.fovy/2;
  const horizontal=Math.atan(Math.tan(vertical)*frustum.aspectRatio);
  const range=2*C.Ellipsoid.WGS84.maximumRadius/Math.sin(Math.min(vertical,horizontal))*1.08;
  viewer.scene.screenSpaceCameraController.maximumZoomDistance=Math.max(50000000,range*2);
  return range;
}
