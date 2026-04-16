export function renderSunOverlay() {
    return `
        <div class="sun-compass fade-in" style="width: 120px; height: 120px; position: relative;">
            <svg viewBox="-50 -50 100 100" style="width:100%; height:100%; overflow: visible;">
                <!-- Backdrop circle -->
                <circle cx="0" cy="0" r="45" fill="rgba(10, 15, 28, 0.6)" stroke="rgba(255,255,255,0.2)" stroke-width="1"></circle>
                
                <!-- Compass Rose (rotated directly) -->
                <g id="compass-rose" style="transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                    <text x="0" y="-32" fill="rgba(255,255,255,0.6)" font-size="10" font-weight="800" text-anchor="middle" dominant-baseline="middle">N</text>
                    <text x="0" y="32" fill="rgba(255,255,255,0.3)" font-size="8" font-weight="600" text-anchor="middle" dominant-baseline="middle">S</text>
                    <text x="32" y="0" fill="rgba(255,255,255,0.3)" font-size="8" font-weight="600" text-anchor="middle" dominant-baseline="middle">E</text>
                    <text x="-32" y="0" fill="rgba(255,255,255,0.3)" font-size="8" font-weight="600" text-anchor="middle" dominant-baseline="middle">W</text>
                    <line x1="0" y1="-25" x2="0" y2="-40" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"></line>
                </g>

                <!-- Sun shadow/direction arrow (incoming light) -->
                <g id="sun-arrow" style="transition: transform 0.3s ease-out;">
                    <!-- Light beam wedge -->
                    <path d="M 0 0 L -12 -45 A 45 45 0 0 1 12 -45 Z" id="sun-beam" fill="rgba(255, 200, 0, 0.4)"></path>
                    <!-- Sun icon at back -->
                    <circle cx="0" cy="-45" r="5" id="sun-dot" fill="#fbbf24" stroke="#fff" stroke-width="1"></circle>
                </g>
                
                <!-- Center pinpoint -->
                <circle cx="0" cy="0" r="2" fill="#fff"></circle>
            </svg>
        </div>
    `;
}

export function updateSunOverlayStyles(altDeg, aziDeg, intensity, bearing, project) {
    const compassRose = document.getElementById('compass-rose');
    const sunArrow = document.getElementById('sun-arrow');
    const sunBeam = document.getElementById('sun-beam');
    const sunDot = document.getElementById('sun-dot');

    if (!compassRose || !sunArrow) return;

    // The compass N usually points UP.
    // If the image top is bearing (e.g. 90=East), N should be drawn at -bearing (-90).
    compassRose.style.transform = `rotate(${-bearing}deg)`;

    // The sun comes FROM azimuth. We want the sun-dot to sit at that angle.
    // Our SVG has the sun-dot drawn at Top (-Y direction), which is 0 degrees rotation.
    // So if Azimuth is 90 (East), rotating by 90 puts the sun on the right (East relative to screen).
    // Now we must offset by the bearing so it maps to the image correctly.
    // If bearing is 90 (Image top is East), and sun is at 90 (East), the sun is at the Top.
    // So angle = aziDeg - bearing
    const rotation = aziDeg - bearing;
    sunArrow.style.transform = `rotate(${rotation}deg)`;

    // Change color based on altitude (sunset vs noon)
    let color = '#fbbf24'; // yellow
    let beamColor = 'rgba(255, 200, 0, 0.4)';
    
    if (altDeg < 0) {
        // Below horizon
        color = '#334155'; // dark grey
        beamColor = 'rgba(0,0,0,0)'; // no beam
    } else if (altDeg < 15) {
        // Sunset/sunrise
        color = '#ef4444'; // red
        beamColor = 'rgba(239, 68, 68, 0.5)';
    } else if (altDeg < 30) {
        // Golden hour
        color = '#f97316'; // orange
        beamColor = 'rgba(249, 115, 22, 0.45)';
    }

    if (sunDot) sunDot.setAttribute('fill', color);
    if (sunBeam) {
        sunBeam.setAttribute('fill', beamColor);
        sunBeam.style.opacity = intensity > 0 ? (1 - Math.sin(altDeg * Math.PI/180) * 0.5) : 0;
    }

    // --- Building Shadows & Sunlight ---
    const shadowPolygonsG = document.getElementById('shadow-polygons');
    const sunWashRect = document.getElementById('sun-wash-rect');
    
    if (shadowPolygonsG && project && project.buildings) {
        shadowPolygonsG.innerHTML = ''; // clear old shadows
        shadowPolygonsG.setAttribute('opacity', '0.6'); // Apply opacity to the group so overlapping shadows don't stack
        
        // If sun is below horizon, no sunny wash, just dark.
        if (altDeg < 0) {
            if (sunWashRect) sunWashRect.setAttribute('fill', 'rgba(10, 15, 30, 0.4)'); // Night time
            return;
        }

        // Apply faint sunny yellow wash
        // At max intensity, very subtle yellow. At sunset, maybe slightly orange wash.
        let washColor = `rgba(255, 240, 100, ${0.1 * (intensity/100)})`;
        if (altDeg < 15) washColor = `rgba(255, 100, 50, 0.1)`; // dusk wash
        if (sunWashRect) sunWashRect.setAttribute('fill', washColor);

        // Calculate shadow projection
        // Shadow angle: The sun is AT aziDeg. Light travels towards aziDeg + 180.
        // We must map this to the image, which is rotated by -bearing.
        const shadowAngleDeg = (aziDeg + 180 - bearing);
        const shadowAngleRad = shadowAngleDeg * Math.PI / 180;

        // How long the shadow is
        // Math.tan(altDeg). If alt=90 (zenith), shadow=0. If alt=0, shadow=infinity.
        let altRad = altDeg * Math.PI / 180;
        if (altRad < 0.05) altRad = 0.05; // clamp to prevent infinite shadows exactly at sunset
        
        let shadowScale = 1.0 / Math.tan(altRad);

        const imgWidthPx = 1000; // For percentage math, we just assume 1000px virtual space
        // scale Factor allows converting zHeight to percent length
        const ppu = project.pixelsPerUnit || 10;
        
        const imgEl = document.getElementById('main-image');
        const imgAspect = (imgEl && imgEl.naturalWidth) ? (imgEl.naturalHeight / imgEl.naturalWidth) : 1;

        project.buildings.forEach(b => {
             const hPercent = (b.zHeight * ppu) / imgWidthPx * 100;
             const shadowLenPercent = hPercent * shadowScale;

             const dx = shadowLenPercent * Math.sin(shadowAngleRad);
             const dy = (-shadowLenPercent * Math.cos(shadowAngleRad)) / imgAspect; // Correct for non-square pixel aspect mapping

             const cx = b.x + b.width / 2;
             const cy = b.y + b.height / 2;
             const angRad = (b.angle || 0) * Math.PI / 180;
             const cosA = Math.cos(angRad);
             const sinA = Math.sin(angRad);

             // Rotate points accurately regardless of screen aspect ratio
             const rotatePt = (px, py) => {
                 let ox = px - cx;
                 let oy = (py - cy) * imgAspect;
                 let rx = ox * cosA - oy * sinA;
                 let ry = ox * sinA + oy * cosA;
                 return [cx + rx, cy + (ry / imgAspect)];
             };

             // The base rectangle corners in %
             const [x1, y1] = rotatePt(b.x, b.y);
             const [x2, y2] = rotatePt(b.x + b.width, b.y);
             const [x3, y3] = rotatePt(b.x + b.width, b.y + b.height);
             const [x4, y4] = rotatePt(b.x, b.y + b.height);

             // Projected roof corners
             const px1 = x1 + dx, py1 = y1 + dy;
             const px2 = x2 + dx, py2 = y2 + dy;
             const px3 = x3 + dx, py3 = y3 + dy;
             const px4 = x4 + dx, py4 = y4 + dy;

             // Calculate a 2D convex hull to wrap all 8 points in a single, unified polygon outline
             // This removes all intersecting lines and overlaps
             const getConvexHull = (pts) => {
                 pts.sort((a,b) => a[0] == b[0] ? a[1] - b[1] : a[0] - b[0]);
                 const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
                 const lower = [];
                 for (let i = 0; i < pts.length; i++) {
                     while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pts[i]) <= 0) lower.pop();
                     lower.push(pts[i]);
                 }
                 const upper = [];
                 for (let i = pts.length - 1; i >= 0; i--) {
                     while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pts[i]) <= 0) upper.pop();
                     upper.push(pts[i]);
                 }
                 upper.pop();
                 lower.pop();
                 return lower.concat(upper);
             };

             const points = [
                 [x1,y1], [x2,y2], [x3,y3], [x4,y4],
                 [px1,py1], [px2,py2], [px3,py3], [px4,py4]
             ];
             const hull = getConvexHull(points);

             let pathD = `M ${hull[0][0]} ${hull[0][1]} `;
             for(let i=1; i<hull.length; i++) pathD += `L ${hull[i][0]} ${hull[i][1]} `;
             pathD += 'Z';

             const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
             path.setAttribute('d', pathD);
             path.setAttribute('fill', 'rgb(30,30,40)'); // Solid grey (opacity handled by group)
             path.setAttribute('stroke', 'none'); // No ugly internal borders

             shadowPolygonsG.appendChild(path);
        });
    }

    // --- Tree Shadows (from Markers) ---
    const treeShadowPolygonsG = document.getElementById('tree-shadow-polygons');
    if (treeShadowPolygonsG && project && project.markers) {
        treeShadowPolygonsG.innerHTML = '';
        treeShadowPolygonsG.setAttribute('opacity', '0.5');

        if (altDeg < 0) return;

        const ppu = project.pixelsPerUnit || 10;
        const imgWidthPx = 1000;
        const imgEl = document.getElementById('main-image');
        const imgAspect = (imgEl && imgEl.naturalWidth) ? (imgEl.naturalHeight / imgEl.naturalWidth) : 1;

        const shadowAngleDeg = (aziDeg + 180 - bearing);
        const shadowAngleRad = shadowAngleDeg * Math.PI / 180;
        let altRad = altDeg * Math.PI / 180;
        if (altRad < 0.05) altRad = 0.05;
        let shadowScale = 1.0 / Math.tan(altRad);

        const getConvexHull = (pts) => {
            pts.sort((a,b) => a[0] == b[0] ? a[1] - b[1] : a[0] - b[0]);
            const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
            const lower = [];
            for (let i = 0; i < pts.length; i++) {
                while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pts[i]) <= 0) lower.pop();
                lower.push(pts[i]);
            }
            const upper = [];
            for (let i = pts.length - 1; i >= 0; i--) {
                while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pts[i]) <= 0) upper.pop();
                upper.push(pts[i]);
            }
            upper.pop(); lower.pop();
            return lower.concat(upper);
        };

        project.markers.forEach(m => {
            if (!m.isTree) return;

            const hPercent = ((m.treeHeight || 15) * ppu) / imgWidthPx * 100;
            const shadowLenPercent = hPercent * shadowScale;
            const dx = shadowLenPercent * Math.sin(shadowAngleRad);
            const dy = (-shadowLenPercent * Math.cos(shadowAngleRad)) / imgAspect;

            const cx = m.x;
            const cy = m.y;
            
            // Canopy diameter to radius (percentage of image width)
            const diamUnits = m.treeCanopy || 8;
            const rPx = (diamUnits/2 * ppu);
            const rPctX = (rPx / imgWidthPx) * 100;
            const rPctY = rPctX / imgAspect;

            // Sample points from the circle to create the shadow hull
            const points = [];
            const numSegments = 10;
            for (let i = 0; i < numSegments; i++) {
                const ang = (i / numSegments) * Math.PI * 2;
                const px = cx + rPctX * Math.cos(ang);
                const py = cy + rPctY * Math.sin(ang);
                points.push([px, py]); // Base point
                points.push([px + dx, py + dy]); // Projected point
            }

            const hull = getConvexHull(points);
            let pathD = `M ${hull[0][0]} ${hull[0][1]} `;
            for(let i=1; i<hull.length; i++) pathD += `L ${hull[i][0]} ${hull[i][1]} `;
            pathD += 'Z';

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute('d', pathD);
            path.setAttribute('fill', 'rgb(40, 100, 50)'); // Natural tree-shade green
            treeShadowPolygonsG.appendChild(path);
        });
    }
}
