# Location Visualizer

Explore from a Milky Way context view to satellite imagery above your location.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the printed localhost URL. The app starts above the **Stanford Dish** (37.4083° N, 122.1790° W) at approximately 1,816 km camera altitude for a California-scale overview. Click **Find my location**, grant browser permission, or enter latitude and longitude. Use the perspective buttons or logarithmic slider to move between scales. On the globe, drag to rotate, scroll to zoom, and right-drag to tilt.

```sh
npm run build
npm run preview
```

Deploy `dist/` to any HTTPS static host. Browser geolocation requires HTTPS or localhost. No backend, location storage, API key, or account is required by this implementation. Internet access is required for the pinned CesiumJS CDN, fonts, and Esri satellite tiles. Provider availability and applicable service terms still apply.

## Checks

```sh
node --test tests/astronomy.test.mjs
npx playwright install chromium
# With npm run dev running in another terminal:
npx playwright test
```

Browser checks cover successful satellite tile responses, simulated geolocation and its accuracy radius, denied permission, manual coordinate entry, and scale controls.

## Scientific model and limits

- Planet centers are calculated for the current system clock using [Astronomy Engine](https://github.com/cosinekitty/astronomy/tree/master/source/js), refreshed every minute. Heliocentric J2000 equatorial vectors are rotated into Galactic coordinates with the library's EQJ → GAL rotation.
- The Galactic reference origin is the Galactic center. The adopted Sun position is `(-8178 pc, 0, +20.8 pc)`. The Galactic X axis points toward the Galactic center from the Sun; Y follows increasing Galactic longitude; Z points north. This is an adopted Galactic alignment, not a fitted dynamical model. The small solar-height tilt is omitted. Solar Galactic motion over time is not integrated.
- The adopted distance follows [GRAVITY Collaboration (2019)](https://www.aanda.org/articles/aa/abs/2019/05/aa35656-19/aa35656-19.html): 8178 ±13 statistical ±22 systematic pc. This is a documented reference estimate, not an exact or uniquely established distance. The solar height follows Bennett & Bovy (2019), as used in [subsequent Galactic modeling](https://doi.org/10.1093/mnras/stae034).
- The space view is an orthographic projection along Galactic north, with real physical coordinate separations and a scale bar. Projected distances omit line-of-sight separation. Planet surfaces, the Sun’s glow, Saturn’s rings, and the barred spiral galaxy are procedurally rendered illustrations. Planet radii are enlarged for visibility. The spiral arms and luminous samples are illustrative, not measured star positions or a fitted model of spiral structure. Planet centers still follow the calculated coordinates. Orbit paths sample the ephemeris over one approximate orbital period; they are not decorative circles. Use **Inner planets** to resolve the inner solar system.
- The slider interpolates logarithmic field width. Near Earth it switches from the Galactic projection to the Cesium Earth-fixed globe, centered above the selected latitude/longitude. This changes the camera frame; it is not one continuous inertial 3D flight or an astronomical attitude simulation.
- The Earth globe uses Cesium's WGS84 ellipsoid and [Esri World Imagery](https://cesium.com/learn/cesiumjs/ref-doc/ArcGisMapServerImageryProvider.html). There is no elevation terrain model in V1. Satellite imagery is a mosaic collected on different dates, not live imagery. Globe credits retain provider attribution.
- Geolocation is a device estimate. Its reported accuracy is shown numerically and as a shaded surface area. The app does not store or upload coordinates; imagery requests necessarily reveal the viewed area to the imagery provider. No IP-derived or fabricated position is substituted.

This version provides calculated astronomical positions within an explicitly bounded model. It does not claim precision ephemeris/navigation accuracy, a measured full-galaxy reconstruction, or a continuous scientifically oriented surface-to-galaxy camera.
