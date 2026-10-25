import * as THREE from 'three';

export interface PieceMaterials {
  main: THREE.MeshPhysicalMaterial;
  accent: THREE.MeshPhysicalMaterial;
  highlight: THREE.MeshPhysicalMaterial;
}

// Procedural marble/grain texture generated once on canvas
function createMarbleNoiseTexture(baseColor: string, veinColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle procedural veining
  ctx.strokeStyle = veinColor;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.12;

  for (let i = 0; i < 35; i++) {
    ctx.beginPath();
    let x = Math.random() * 512;
    let y = Math.random() * 512;
    ctx.moveTo(x, y);
    for (let j = 0; j < 6; j++) {
      x += (Math.random() - 0.5) * 120;
      y += Math.random() * 90;
      ctx.bezierCurveTo(
        x + (Math.random() - 0.5) * 50,
        y + (Math.random() - 0.5) * 50,
        x,
        y,
        x,
        y
      );
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Cache textures
const whiteMarbleMap = createMarbleNoiseTexture('#f5f2eb', '#d1c7b7');
const blackObsidianMap = createMarbleNoiseTexture('#1c1a17', '#3a342c');

// Material caches
export const whitePieceMaterials: PieceMaterials = {
  main: new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#f0ece1'),
    map: whiteMarbleMap,
    roughness: 0.2,
    metalness: 0.08,
    clearcoat: 0.45,
    clearcoatRoughness: 0.2,
    reflectivity: 0.6,
  }),
  accent: new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#d4af37'), // Brushed gold trim
    roughness: 0.28,
    metalness: 0.88,
    clearcoat: 0.3,
  }),
  highlight: new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#60a5fa'),
    roughness: 0.2,
    metalness: 0.5,
    emissive: new THREE.Color('#2563eb'),
    emissiveIntensity: 0.4,
  }),
};

export const blackPieceMaterials: PieceMaterials = {
  main: new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#1e1b18'),
    map: blackObsidianMap,
    roughness: 0.25,
    metalness: 0.25,
    clearcoat: 0.4,
    clearcoatRoughness: 0.25,
    reflectivity: 0.5,
  }),
  accent: new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#c59b27'), // Antiqued gold trim
    roughness: 0.32,
    metalness: 0.82,
    clearcoat: 0.2,
  }),
  highlight: new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#f87171'),
    roughness: 0.2,
    metalness: 0.5,
    emissive: new THREE.Color('#dc2626'),
    emissiveIntensity: 0.4,
  }),
};

// Board materials
const lightTileMap = createMarbleNoiseTexture('#eadecb', '#cab79f');
const darkTileMap = createMarbleNoiseTexture('#3b2d24', '#261b14');

export const boardMaterials = {
  lightSquare: new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#eadecb'),
    map: lightTileMap,
    roughness: 0.28,
    metalness: 0.05,
    clearcoat: 0.3,
  }),
  darkSquare: new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#38281f'),
    map: darkTileMap,
    roughness: 0.32,
    metalness: 0.05,
    clearcoat: 0.25,
  }),
  frame: new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#1f1510'), // Deep mahogany bevel
    roughness: 0.35,
    metalness: 0.15,
    clearcoat: 0.5,
  }),
  frameInlay: new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#d4af37'), // Brass inlay wire
    roughness: 0.3,
    metalness: 0.9,
  }),
  tileHighlightMove: new THREE.MeshBasicMaterial({
    color: new THREE.Color('#38bdf8'),
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  }),
  tileHighlightCapture: new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ef4444'),
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  }),
  tileHighlightSelected: new THREE.MeshBasicMaterial({
    color: new THREE.Color('#facc15'),
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  }),
  tileHighlightLastMove: new THREE.MeshBasicMaterial({
    color: new THREE.Color('#a855f7'),
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  }),
  tileHighlightCheck: new THREE.MeshBasicMaterial({
    color: new THREE.Color('#dc2626'),
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  }),
};
