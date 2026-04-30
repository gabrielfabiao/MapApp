export function updateSunOverlayStyles(altDeg, aziDeg, intensity, bearing, project, state) {
    const compassRose = document.getElementById('compass-rose');
    const sunArrow = document.getElementById('sun-arrow');
    const sunBeam = document.getElementById('sun-beam');
    const sunDot = document.getElementById('sun-dot');

    if (compassRose && sunArrow) {
        compassRose.style.transform = `rotate(${-bearing}deg)`;
        sunArrow.style.transform = `rotate(${aziDeg - bearing}deg)`;
    }

    let color = '#fbbf24';
    let beamColor = 'rgba(255, 200, 0, 0.4)';
    if (altDeg < 0) { color = '#334155'; beamColor = 'rgba(0,0,0,0)'; }
    else if (altDeg < 15) { color = '#ef4444'; beamColor = 'rgba(239, 68, 68, 0.5)'; }
    else if (altDeg < 30) { color = '#f97316'; beamColor = 'rgba(249, 115, 22, 0.45)'; }

    if (sunDot) sunDot.setAttribute('fill', color);
    if (sunBeam) {
        sunBeam.setAttribute('fill', beamColor);
        sunBeam.style.opacity = intensity > 0 ? (1 - Math.sin(altDeg * Math.PI / 180) * 0.5) : 0;
    }

    const shadowPolygonsG = document.getElementById('shadow-polygons');
    const sunWashRect = document.getElementById('sun-wash-rect');
    const treeShadowPolygonsG = document.getElementById('tree-shadow-polygons');

    if (state && state.showShadows === false) {
        if (shadowPolygonsG) shadowPolygonsG.innerHTML = '';
        if (treeShadowPolygonsG) treeShadowPolygonsG.innerHTML = '';
        if (sunWashRect) sunWashRect.setAttribute('fill', 'transparent');
        return;
    }

    if (shadowPolygonsG) shadowPolygonsG.innerHTML = '';
    if (treeShadowPolygonsG) treeShadowPolygonsG.innerHTML = '';

    if (project && project.buildings) {
        shadowPolygonsG.setAttribute('opacity', '0.6');
        if (altDeg < 0) {
            if (sunWashRect) sunWashRect.setAttribute('fill', 'rgba(10, 15, 30, 0.4)');
            return;
        }

        let washColor = `rgba(255, 240, 100, ${0.1 * (intensity / 100)})`;
        if (altDeg < 15) washColor = `rgba(255, 100, 50, 0.1)`;
        if (sunWashRect) sunWashRect.setAttribute('fill', washColor);

        const shadowAngleDeg = aziDeg + 180 - bearing;
        const shadowAngleRad = shadowAngleDeg * Math.PI / 180;
        let altRad = altDeg * Math.PI / 180;
        if (altRad < 0.05) altRad = 0.05;
        const shadowScale = 1.0 / Math.tan(altRad);
        const imgWidthPx = 1000;
        const ppu = project.pixelsPerUnit || 10;
        const imgEl = document.getElementById('main-image');
        const imgAspect = (imgEl && imgEl.naturalWidth) ? (imgEl.naturalHeight / imgEl.naturalWidth) : 1;

        project.buildings.forEach(b => {
            const zH = parseFloat(b.zHeight);
            const validZH = isNaN(zH) ? 10 : zH;
            const hPercent = (validZH * ppu) / imgWidthPx * 100;
            const shadowLenPercent = hPercent * shadowScale;
            const dx = shadowLenPercent * Math.sin(shadowAngleRad);
            const dy = (-shadowLenPercent * Math.cos(shadowAngleRad)) / imgAspect;

            const bw = parseFloat(b.width) || 1;
            const bh = parseFloat(b.height) || 1;
            const bx = parseFloat(b.x) || 0;
            const by = parseFloat(b.y) || 0;
            const cx = bx + bw / 2;
            const cy = by + bh / 2;
            const angRad = (parseFloat(b.angle) || 0) * Math.PI / 180;
            const cosA = Math.cos(angRad);
            const sinA = Math.sin(angRad);

            const rotatePt = (px, py) => {
                const ox = px - cx;
                const oy = (py - cy) * imgAspect;
                const rx = ox * cosA - oy * sinA;
                const ry = ox * sinA + oy * cosA;
                return [cx + rx, cy + ry / imgAspect];
            };

            const [x1, y1] = rotatePt(bx, by);
            const [x2, y2] = rotatePt(bx + bw, by);
            const [x3, y3] = rotatePt(bx + bw, by + bh);
            const [x4, y4] = rotatePt(bx, by + bh);
            const px1 = x1 + dx, py1 = y1 + dy;
            const px2 = x2 + dx, py2 = y2 + dy;
            const px3 = x3 + dx, py3 = y3 + dy;
            const px4 = x4 + dx, py4 = y4 + dy;

            const hull = convexHull([[x1,y1],[x2,y2],[x3,y3],[x4,y4],[px1,py1],[px2,py2],[px3,py3],[px4,py4]]);
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', hull.map(p => `${p[0]},${p[1]}`).join(' '));
            polygon.setAttribute('fill', 'rgb(30,30,40)');
            polygon.setAttribute('stroke', 'none');
            shadowPolygonsG.appendChild(polygon);
        });
    }

    if (treeShadowPolygonsG && project && project.markers) {
        treeShadowPolygonsG.setAttribute('opacity', '0.5');
        if (altDeg < 0) return;

        const ppu = project.pixelsPerUnit || 10;
        const imgWidthPx = 1000;
        const imgEl = document.getElementById('main-image');
        const imgAspect = (imgEl && imgEl.naturalWidth) ? (imgEl.naturalHeight / imgEl.naturalWidth) : 1;
        const shadowAngleDeg = aziDeg + 180 - bearing;
        const shadowAngleRad = shadowAngleDeg * Math.PI / 180;
        let altRad = altDeg * Math.PI / 180;
        if (altRad < 0.05) altRad = 0.05;
        const shadowScale = 1.0 / Math.tan(altRad);

        project.markers.forEach(m => {
            if (!m.isTree) return;
            const hPercent = ((m.treeHeight || 15) * ppu) / imgWidthPx * 100;
            const shadowLenPercent = hPercent * shadowScale;
            const dx = shadowLenPercent * Math.sin(shadowAngleRad);
            const dy = (-shadowLenPercent * Math.cos(shadowAngleRad)) / imgAspect;
            const rPctX = ((m.treeCanopy || 8) / 2 * ppu / imgWidthPx) * 100;
            const rPctY = rPctX / imgAspect;

            const pts = [];
            for (let i = 0; i < 10; i++) {
                const ang = (i / 10) * Math.PI * 2;
                const px = m.x + rPctX * Math.cos(ang);
                const py = m.y + rPctY * Math.sin(ang);
                pts.push([px, py], [px + dx, py + dy]);
            }

            const hull = convexHull(pts);
            let pathD = `M ${hull[0][0]} ${hull[0][1]} `;
            for (let i = 1; i < hull.length; i++) pathD += `L ${hull[i][0]} ${hull[i][1]} `;
            pathD += 'Z';

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathD);
            path.setAttribute('fill', 'rgb(40, 100, 50)');
            treeShadowPolygonsG.appendChild(path);
        });
    }
}

function convexHull(pts) {
    pts.sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [];
    for (const p of pts) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
        lower.push(p);
    }
    const upper = [];
    for (let i = pts.length - 1; i >= 0; i--) {
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pts[i]) <= 0) upper.pop();
        upper.push(pts[i]);
    }
    upper.pop();
    lower.pop();
    return lower.concat(upper);
}
