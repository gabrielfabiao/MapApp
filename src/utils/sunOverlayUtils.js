const IMG_REFERENCE_WIDTH_PX = 1000;
const MIN_ALT_RAD = 0.05;

// Shared geometry for casting a shadow of a given real-world height onto the
// image's percentage coordinate space.
function getShadowGeometry(aziDeg, bearing, altDeg, project) {
    const imgEl = document.getElementById('main-image');
    const imgAspect = (imgEl && imgEl.naturalWidth) ? (imgEl.naturalHeight / imgEl.naturalWidth) : 1;
    const shadowAngleRad = (aziDeg + 180 - bearing) * Math.PI / 180;
    const altRad = Math.max(MIN_ALT_RAD, altDeg * Math.PI / 180);

    return {
        imgAspect,
        ppu: project.pixelsPerUnit || 10,
        sinAngle: Math.sin(shadowAngleRad),
        cosAngle: Math.cos(shadowAngleRad),
        shadowScale: 1 / Math.tan(altRad),
    };
}

// Real-world metres -> shadow offset in image-percentage units.
function getShadowOffset(heightMetres, geo) {
    const hPercent = (heightMetres * geo.ppu) / IMG_REFERENCE_WIDTH_PX * 100;
    const lenPercent = hPercent * geo.shadowScale;
    return {
        dx: lenPercent * geo.sinAngle,
        dy: (-lenPercent * geo.cosAngle) / geo.imgAspect,
    };
}

export function updateSunOverlayStyles({ altDeg, aziDeg, intensity, bearing, project, showShadows }) {
    const shadowPolygonsG = document.getElementById('shadow-polygons');
    const sunWashRect = document.getElementById('sun-wash-rect');
    const treeShadowPolygonsG = document.getElementById('tree-shadow-polygons');

    if (shadowPolygonsG) shadowPolygonsG.innerHTML = '';
    if (treeShadowPolygonsG) treeShadowPolygonsG.innerHTML = '';

    if (showShadows === false) {
        if (sunWashRect) sunWashRect.setAttribute('fill', 'transparent');
        return;
    }

    if (!project) return;

    if (altDeg < 0) {
        if (sunWashRect) sunWashRect.setAttribute('fill', 'rgba(10, 15, 30, 0.4)');
        return;
    }

    if (sunWashRect) {
        const washColor = altDeg < 15
            ? 'rgba(255, 100, 50, 0.1)'
            : `rgba(255, 240, 100, ${0.1 * (intensity / 100)})`;
        sunWashRect.setAttribute('fill', washColor);
    }

    const geo = getShadowGeometry(aziDeg, bearing, altDeg, project);

    if (shadowPolygonsG && project.buildings) {
        shadowPolygonsG.setAttribute('opacity', '0.6');

        project.buildings.forEach(b => {
            const zH = parseFloat(b.zHeight);
            const { dx, dy } = getShadowOffset(isNaN(zH) ? 10 : zH, geo);

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
                const oy = (py - cy) * geo.imgAspect;
                const rx = ox * cosA - oy * sinA;
                const ry = ox * sinA + oy * cosA;
                return [cx + rx, cy + ry / geo.imgAspect];
            };

            const corners = [
                rotatePt(bx, by),
                rotatePt(bx + bw, by),
                rotatePt(bx + bw, by + bh),
                rotatePt(bx, by + bh),
            ];
            const hull = convexHull([
                ...corners,
                ...corners.map(([x, y]) => [x + dx, y + dy]),
            ]);

            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', hull.map(p => `${p[0]},${p[1]}`).join(' '));
            polygon.setAttribute('fill', 'rgb(30,30,40)');
            polygon.setAttribute('stroke', 'none');
            shadowPolygonsG.appendChild(polygon);
        });
    }

    if (treeShadowPolygonsG && project.markers) {
        treeShadowPolygonsG.setAttribute('opacity', '0.5');

        project.markers.forEach(m => {
            if (!m.isTree) return;
            const { dx, dy } = getShadowOffset(m.treeHeight || 15, geo);
            const rPctX = ((m.treeCanopy || 8) / 2 * geo.ppu / IMG_REFERENCE_WIDTH_PX) * 100;
            const rPctY = rPctX / geo.imgAspect;

            const pts = [];
            for (let i = 0; i < 10; i++) {
                const ang = (i / 10) * Math.PI * 2;
                const px = m.x + rPctX * Math.cos(ang);
                const py = m.y + rPctY * Math.sin(ang);
                pts.push([px, py], [px + dx, py + dy]);
            }

            const hull = convexHull(pts);
            const pathD = `M ${hull.map(p => `${p[0]} ${p[1]}`).join(' L ')} Z`;

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
