const STOPS = [
    { at: 0, rgb: [110, 191, 101] },
    { at: 15, rgb: [155, 200, 78] },
    { at: 30, rgb: [212, 208, 74] },
    { at: 50, rgb: [243, 156, 18] },
    { at: 70, rgb: [231, 76, 60] },
    { at: 85, rgb: [199, 58, 46] },
    { at: 100, rgb: [176, 42, 32] },
];

function clampScore(score) {
    return Math.min(100, Math.max(0, Number(score)));
}

function mix(a, b, t) {
    return [
        Math.round(a[0] + (b[0] - a[0]) * t),
        Math.round(a[1] + (b[1] - a[1]) * t),
        Math.round(a[2] + (b[2] - a[2]) * t),
    ];
}

function scoreFromLevel(level) {
    if (level === 'HIGH') return 60;
    if (level === 'MEDIUM') return 30;
    if (level === 'LOW') return 0;

    return null;
}

export function resolveRiskScore(score, level) {
    if (score != null && !Number.isNaN(Number(score))) return clampScore(score);

    return scoreFromLevel(level);
}

export function riskColorRgb(score, level) {
    const n = resolveRiskScore(score, level);

    if (n == null) return null;

    for (let i = 1; i < STOPS.length; i++) {
        if (n <= STOPS[i].at) {
            const span = STOPS[i].at - STOPS[i - 1].at;
            const t = span === 0 ? 0 : (n - STOPS[i - 1].at) / span;

            return mix(STOPS[i - 1].rgb, STOPS[i].rgb, t);
        }
    }

    return STOPS[STOPS.length - 1].rgb;
}

export function riskColor(score, level) {
    const rgb = riskColorRgb(score, level);

    if (!rgb) return null;

    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

export function riskBadgeTextColor(score, level) {
    const rgb = riskColorRgb(score, level);

    if (!rgb) return '#fff';

    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;

    return luminance > 0.55 ? '#222' : '#fff';
}
