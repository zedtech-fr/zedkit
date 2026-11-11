const HEX = /^#([\da-f]{3}|[\da-f]{6})$/i;
const HSL = /^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/;
const REM = /^(\d+(?:\.\d+)?)rem$/i;
const PX = /^(\d+(?:\.\d+)?)px$/i;

const SPACING_MIN = 0.15;
const SPACING_MAX = 0.5;
const RADIUS_MIN = 0;
const RADIUS_MAX = 2;

function compactNumber(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded);
}

function parseHex(hex: string): [number, number, number] | undefined {
  const match = hex.trim().match(HEX);
  if (!match) return undefined;
  let digits = match[1] ?? "";
  if (digits.length === 3) digits = [...digits].map((char) => char + char).join("");
  const n = Number.parseInt(digits, 16);
  if (!Number.isFinite(n)) return undefined;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHslTriplet(r8: number, g8: number, b8: number): string {
  const r = r8 / 255;
  const g = g8 / 255;
  const b = b8 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const light = (max + min) / 2;
  let hue = 0;
  let sat = 0;
  if (max !== min) {
    const delta = max - min;
    sat = light > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
  }
  if (hue >= 360) hue = 0;
  return `${compactNumber(hue)} ${compactNumber(sat * 100)}% ${compactNumber(light * 100)}%`;
}

function hexToHslTriplet(hex: string): string | undefined {
  const rgb = parseHex(hex);
  if (!rgb) return undefined;
  return rgbToHslTriplet(rgb[0], rgb[1], rgb[2]);
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number): number => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number): number => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

function channelHex(channel: number): string {
  const n = Math.max(0, Math.min(255, Math.round(channel * 255)));
  return n.toString(16).padStart(2, "0");
}

function hslTripletToHex(value: string): string | undefined {
  const match = value.trim().match(HSL);
  if (!match) return undefined;
  const h = Number(match[1]);
  const s = Number(match[2]);
  const l = Number(match[3]);
  if (![h, s, l].every(Number.isFinite)) return undefined;
  const [r, g, b] = hslToRgb(h, s, l);
  return `#${channelHex(r)}${channelHex(g)}${channelHex(b)}`;
}

function parseCssLengthRem(value: string): number | undefined {
  const trimmed = value.trim();
  const rem = trimmed.match(REM);
  if (rem) {
    const n = Number(rem[1]);
    return Number.isFinite(n) ? n : undefined;
  }
  const px = trimmed.match(PX);
  if (!px) return undefined;
  const n = Number(px[1]);
  if (!Number.isFinite(n)) return undefined;
  if (n === 0) return 0;
  return n / 16;
}

function formatCssLengthRem(value: number, options: { zeroAsPx?: boolean } = {}): string {
  if (options.zeroAsPx && value === 0) return "0px";
  return `${compactNumber(value)}rem`;
}

export {
  RADIUS_MAX,
  RADIUS_MIN,
  SPACING_MAX,
  SPACING_MIN,
  formatCssLengthRem,
  hexToHslTriplet,
  hslTripletToHex,
  parseCssLengthRem,
};
