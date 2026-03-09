/**
 * Generates placeholder gem images (PNG) and sound effects (WAV) for development.
 * Run with: node generate-assets.js
 * These will be replaced with actual Puig product images later.
 */
import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const ASSET_DIR = path.join(process.cwd(), 'public', 'assets');
const IMG_DIR = path.join(ASSET_DIR, 'images');
const SND_DIR = path.join(ASSET_DIR, 'sounds');

const GEM_SIZE = 200; // High-res for crisp display

const GEM_COLORS = [
  { name: 'gem_0', fill: '#FF4136', stroke: '#B71C1C', label: '💎' },  // Red
  { name: 'gem_1', fill: '#FF851B', stroke: '#E65100', label: '🔶' },  // Orange
  { name: 'gem_2', fill: '#FFDC00', stroke: '#F9A825', label: '⭐' },  // Yellow
  { name: 'gem_3', fill: '#2ECC40', stroke: '#1B5E20', label: '🟢' },  // Green
  { name: 'gem_4', fill: '#0074D9', stroke: '#0D47A1', label: '🔵' },  // Blue
  { name: 'gem_5', fill: '#B10DC9', stroke: '#4A148C', label: '🟣' },  // Purple
];

// Shapes to differentiate gems visually
const SHAPES = ['circle', 'diamond', 'square', 'triangle', 'hexagon', 'star'];

function drawGem(ctx, shape, size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  ctx.beginPath();
  switch (shape) {
    case 'circle':
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      break;
    case 'diamond':
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      break;
    case 'square':
      const hr = r * 0.82;
      ctx.roundRect(cx - hr, cy - hr, hr * 2, hr * 2, hr * 0.2);
      break;
    case 'triangle':
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * 0.95, cy + r * 0.7);
      ctx.lineTo(cx - r * 0.95, cy + r * 0.7);
      ctx.closePath();
      break;
    case 'hexagon':
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    case 'star':
      for (let i = 0; i < 5; i++) {
        const outerAngle = (Math.PI * 2 / 5) * i - Math.PI / 2;
        const innerAngle = outerAngle + Math.PI / 5;
        ctx.lineTo(cx + r * Math.cos(outerAngle), cy + r * Math.sin(outerAngle));
        ctx.lineTo(cx + r * 0.45 * Math.cos(innerAngle), cy + r * 0.45 * Math.sin(innerAngle));
      }
      ctx.closePath();
      break;
  }
}

function generateGemImage(gem, shape, size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background (transparent)
  ctx.clearRect(0, 0, size, size);

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = size * 0.06;
  ctx.shadowOffsetY = size * 0.03;

  // Draw shape
  drawGem(ctx, shape, size);

  // Gradient fill
  const gradient = ctx.createRadialGradient(
    size * 0.4, size * 0.35, size * 0.05,
    size * 0.5, size * 0.5, size * 0.4
  );
  gradient.addColorStop(0, lighten(gem.fill, 40));
  gradient.addColorStop(0.6, gem.fill);
  gradient.addColorStop(1, gem.stroke);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Stroke
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = gem.stroke;
  ctx.lineWidth = size * 0.025;
  ctx.stroke();

  // Highlight
  ctx.beginPath();
  ctx.arc(size * 0.4, size * 0.36, size * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();

  return canvas.toBuffer('image/png');
}

function lighten(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + percent);
  const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
  const b = Math.min(255, (num & 0x0000FF) + percent);
  return `rgb(${r},${g},${b})`;
}

// Generate a simple WAV file with a sine wave tone
function generateTone(frequency, duration, volume = 0.3) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.max(0, 1 - t / duration); // fade out
    const sample = Math.sin(2 * Math.PI * frequency * t) * volume * envelope * 32767;
    buffer.writeInt16LE(Math.floor(sample), 44 + i * 2);
  }

  return buffer;
}

// Generate assets
console.log('Generating placeholder gem images...');
GEM_COLORS.forEach((gem, i) => {
  const png = generateGemImage(gem, SHAPES[i], GEM_SIZE);
  fs.writeFileSync(path.join(IMG_DIR, `${gem.name}.png`), png);
  console.log(`  Created ${gem.name}.png (${SHAPES[i]})`);
});

console.log('Generating placeholder sound effects...');
// Match sound - ascending cheerful tone
fs.writeFileSync(path.join(SND_DIR, 'match.wav'), generateTone(880, 0.15, 0.25));
// Swap sound - quick blip
fs.writeFileSync(path.join(SND_DIR, 'swap.wav'), generateTone(440, 0.08, 0.2));
// No match sound - low buzz
fs.writeFileSync(path.join(SND_DIR, 'no-match.wav'), generateTone(200, 0.2, 0.2));
// Game over sound - descending tone
fs.writeFileSync(path.join(SND_DIR, 'gameover.wav'), generateTone(330, 0.4, 0.3));
// Select sound
fs.writeFileSync(path.join(SND_DIR, 'select.wav'), generateTone(660, 0.06, 0.15));

console.log('Done! Assets generated in public/assets/');
