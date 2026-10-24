# Location Visualizer

Explore from a Milky Way context view to satellite imagery above your location.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the printed localhost URL. The app starts above the **Stanford Dish** (37.4083° N, 122.1790° W) at approximately 1,915 km camera altitude in the tilted view for a California-scale overview. Click **Find my location**, grant browser permission, or add latitude/longitude coordinates. Each location becomes a named beacon. Open **Customize location beacons** to rename it, pick a color, toggle its beam, switch between beacons, or remove one. Beacons remain in memory for this session. Use the logarithmic zoom slider to move between scales. On the globe, drag to rotate, scroll to zoom, and right-drag to tilt. As you zoom out, the camera gradually translates sideways to center the whole Earth while preserving the starting viewing direction and roll. It does not switch to a different tilt at an orbital-distance threshold. Full-globe framing adjusts to portrait/landscape changes, and the canvas follows Safari’s dynamic viewport height.

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

## Location beams

The default Stanford Dish marker has a glowing beam pointing along the local geodetic surface normal. The Earth camera is tilted so the beam is visible rather than viewed end-on. Globe rays are straight lines extending 20,000 km above the WGS84 ellipsoid, occluded by the globe rather than drawn through it.

In space views, Astronomy Engine computes the observer position and local vertical in J2000 equatorial coordinates at the current epoch, including Earth's rotation. Both are transformed to Galactic coordinates. The projected ray retains that calculated direction, while its on-screen length, thickness, and glow are illustrative. It does not model a physical laser, light travel time, scattering, or a historical trail emitted as Earth rotates. Multiple surface sites are visually coincident at astronomical scale; their directions and staggered name labels distinguish them.

## Scientific model and limits

- Planet centers are calculated for the current system clock using [Astronomy Engine](https://github.com/cosinekitty/astronomy/tree/master/source/js), refreshed every minute. Heliocentric J2000 equatorial vectors are rotated into Galactic coordinates with the library's EQJ → GAL rotation.
- The Galactic reference origin is the Galactic center. The adopted Sun position is `(-8178 pc, 0, +20.8 pc)`. The Galactic X axis points toward the Galactic center from the Sun; Y follows increasing Galactic longitude; Z points north. This is an adopted Galactic alignment, not a fitted dynamical model. The small solar-height tilt is omitted. Solar Galactic motion over time is not integrated.
- The adopted distance follows [GRAVITY Collaboration (2019)](https://www.aanda.org/articles/aa/abs/2019/05/aa35656-19/aa35656-19.html): 8178 ±13 statistical ±22 systematic pc. This is a documented reference estimate, not an exact or uniquely established distance. The solar height follows Bennett & Bovy (2019), as used in [subsequent Galactic modeling](https://doi.org/10.1093/mnras/stae034).
- The space view is an orthographic projection along Galactic north, with real physical coordinate separations and a scale bar. Projected distances omit line-of-sight separation. Planet surfaces, the Sun’s glow, Saturn’s rings, and the barred spiral galaxy are procedurally rendered illustrations. Sun and planet disks use volumetric mean radii at the same physical scale as orbital distances, without a minimum pixel size. Radii come from [NASA/JPL physical parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html) and the [NASA Sun fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html). Bodies are modeled as mean-radius spheres rather than oblate spheroids. At the 80 AU overview, planets are subpixel; readable labels and location beacons are independent overlays rather than physical body outlines. Surface shading, glow, and ring orientation remain illustrative. The spiral arms and luminous samples are illustrative, not measured star positions or a fitted model of spiral structure. Disk brightness and particle opacity taper gradually into faint outer haze, avoiding an artificial hard rim. The real Milky Way has extended stellar and dark-matter halos beyond its bright disk; this rendering is not a calibrated model of either halo. See [NASA’s Milky Way anatomy](https://svs.gsfc.nasa.gov/14935/). Planet centers still follow the calculated coordinates. Orbit paths sample the ephemeris over one approximate orbital period; they are not decorative circles. Use the slider to zoom into the inner solar system.
- The slider interpolates logarithmic field width. Near Earth it switches from the Galactic projection to the Cesium Earth-fixed globe, centered above the selected latitude/longitude. This changes the camera frame; it is not one continuous inertial 3D flight or an astronomical attitude simulation.
- The Earth globe uses Cesium's WGS84 ellipsoid and [Esri World Imagery](https://cesium.com/learn/cesiumjs/ref-doc/ArcGisMapServerImageryProvider.html). There is no elevation terrain model in V1. Satellite imagery is a mosaic collected on different dates, not live imagery. Globe credits retain provider attribution.
- Geolocation is a device estimate. Its reported accuracy is shown numerically and as a shaded surface area. The app does not store or upload coordinates; imagery requests necessarily reveal the viewed area to the imagery provider. No IP-derived or fabricated position is substituted.

This version provides calculated astronomical positions within an explicitly bounded model. It does not claim precision ephemeris/navigation accuracy, a measured full-galaxy reconstruction, or a continuous scientifically oriented surface-to-galaxy camera.
