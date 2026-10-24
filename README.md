# Location Visualizer

Explore from a Milky Way context view to satellite imagery above your location.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the printed localhost URL. The app starts above the **Stanford Dish** (37.4083° N, 122.1790° W) at a California-scale zoom. The interface contains one header field for `latitude, longitude` and a transparent zoom slider. Press Enter or leave the field to apply coordinates; this moves the active laser while preserving zoom. Invalid coordinates show a validation message. There is no location dialog, automatic geolocation, marker-management panel, heading, scene label, or explanatory overlay. Map-provider attribution remains visible.

The laser’s base stays at screen center in the Earth, solar-system, and galaxy views. Dragging rotates around that fixed target. Zoom changes distance without automatic sideways translation or retargeting to Earth’s center. The far zoom range leaves room for the whole planet, and the canvas follows Safari’s visible viewport. Coordinates stay in memory for the session.

```sh
npm run build
npm run preview
```

Deploy `dist/` to any HTTPS static host. No backend, location storage, API key, or account is required by this implementation. Internet access is required for the pinned CesiumJS CDN, fonts, and Esri satellite tiles. Provider availability and applicable service terms still apply.

## Checks

```sh
node --test tests/astronomy.test.mjs
npx playwright install chromium
# With npm run dev running in another terminal:
npx playwright test
```

Browser checks cover satellite tile loading, header coordinate entry and validation, text editing in WebKit, true-scale body rendering, and centered zoom across all views.

## Location beams

The default Stanford Dish marker has a glowing beam pointing along the local geodetic surface normal. The Earth camera is tilted so the beam is visible rather than viewed end-on. Globe rays are straight lines extending 20,000 km above the WGS84 ellipsoid, occluded by the globe rather than drawn through it.

In space views, Astronomy Engine computes the observer position and local vertical in J2000 equatorial coordinates at the current epoch, including Earth's rotation. Both are transformed to Galactic coordinates. The projected ray retains that calculated direction, while its on-screen length, thickness, and glow are illustrative. It does not model a physical laser, light travel time, scattering, or a historical trail emitted as Earth rotates. The current coordinates define a single active beam at every scale.

## Scientific model and limits

- Planet centers are calculated for the current system clock using [Astronomy Engine](https://github.com/cosinekitty/astronomy/tree/master/source/js), refreshed every minute. Heliocentric J2000 equatorial vectors are rotated into Galactic coordinates with the library's EQJ → GAL rotation.
- The Galactic reference origin is the Galactic center. The adopted Sun position is `(-8178 pc, 0, +20.8 pc)`. The Galactic X axis points toward the Galactic center from the Sun; Y follows increasing Galactic longitude; Z points north. This is an adopted Galactic alignment, not a fitted dynamical model. The small solar-height tilt is omitted. Solar Galactic motion over time is not integrated.
- The adopted distance follows [GRAVITY Collaboration (2019)](https://www.aanda.org/articles/aa/abs/2019/05/aa35656-19/aa35656-19.html): 8178 ±13 statistical ±22 systematic pc. This is a documented reference estimate, not an exact or uniquely established distance. The solar height follows Bennett & Bovy (2019), as used in [subsequent Galactic modeling](https://doi.org/10.1093/mnras/stae034).
- The space view is an orthographic projection along Galactic north, with real physical coordinate separations and a scale bar. Projected distances omit line-of-sight separation. Planet surfaces, the Sun’s glow, Saturn’s rings, and the barred spiral galaxy are procedurally rendered illustrations. Sun and planet disks use volumetric mean radii at the same physical scale as orbital distances, without a minimum pixel size. Radii come from [NASA/JPL physical parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html) and the [NASA Sun fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html). Bodies are modeled as mean-radius spheres rather than oblate spheroids. At the 80 AU overview, planets are subpixel; the visible location beam is an independent overlay rather than a physical body outline. Surface shading, glow, and ring orientation remain illustrative. The spiral arms and luminous samples are illustrative, not measured star positions or a fitted model of spiral structure. Disk brightness and particle opacity taper gradually into faint outer haze, avoiding an artificial hard rim. The real Milky Way has extended stellar and dark-matter halos beyond its bright disk; this rendering is not a calibrated model of either halo. See [NASA’s Milky Way anatomy](https://svs.gsfc.nasa.gov/14935/). Planet centers still follow the calculated coordinates. Orbit paths sample the ephemeris over one approximate orbital period; they are not decorative circles. Use the slider to zoom into the inner solar system.
- The slider interpolates logarithmic field width. Near Earth it switches from the Galactic projection to the Cesium Earth-fixed globe, centered above the selected latitude/longitude. This changes the camera frame; it is not one continuous inertial 3D flight or an astronomical attitude simulation.
- The Earth globe uses Cesium's WGS84 ellipsoid and [Esri World Imagery](https://cesium.com/learn/cesiumjs/ref-doc/ArcGisMapServerImageryProvider.html). There is no elevation terrain model in V1. Satellite imagery is a mosaic collected on different dates, not live imagery. Globe credits retain provider attribution.

This version provides calculated astronomical positions within an explicitly bounded model. It does not claim precision ephemeris/navigation accuracy, a measured full-galaxy reconstruction, or a continuous scientifically oriented surface-to-galaxy camera.
