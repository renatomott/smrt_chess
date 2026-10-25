import * as THREE from 'three';
import { THEMES, type KitPalette, type TeamPattern } from './themes';
import type { PieceMaterials } from '../three/materials';

const textureCache = new Map<string, THREE.CanvasTexture>();
const materialCache = new Map<string, PieceMaterials>();

function createPatternTexture(
  primaryColor: string,
  secondaryColor: string,
  accentColor: string,
  pattern: TeamPattern
): THREE.CanvasTexture {
  const key = `${primaryColor}_${secondaryColor}_${accentColor}_${pattern}`;
  if (textureCache.has(key)) {
    return textureCache.get(key)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, 512, 512);

    if (pattern === 'stripes_h') {
      // Horizontal hoops
      const numStripes = 8;
      const stripeHeight = 512 / numStripes;
      ctx.fillStyle = secondaryColor;
      for (let i = 1; i < numStripes; i += 2) {
        ctx.fillRect(0, i * stripeHeight, 512, stripeHeight);
      }
      // Thin accent pin-stripes
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < numStripes; i++) {
        ctx.fillRect(0, i * stripeHeight - 2, 512, 4);
      }
      ctx.globalAlpha = 1.0;
    } else if (pattern === 'stripes_v') {
      // Vertical stripes
      const numStripes = 8;
      const stripeWidth = 512 / numStripes;
      ctx.fillStyle = secondaryColor;
      for (let i = 1; i < numStripes; i += 2) {
        ctx.fillRect(i * stripeWidth, 0, stripeWidth, 512);
      }
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < numStripes; i++) {
        ctx.fillRect(i * stripeWidth - 2, 0, 4, 512);
      }
      ctx.globalAlpha = 1.0;
    } else if (pattern === 'diagonal') {
      // Diagonal sash band
      ctx.save();
      ctx.translate(256, 256);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(-110, -512, 220, 1024);

      // Gold or red accent borders
      ctx.fillStyle = accentColor;
      ctx.fillRect(-116, -512, 6, 1024);
      ctx.fillRect(110, -512, 6, 1024);
      ctx.restore();
    } else if (pattern === 'tricolor') {
      // Tricolor bands (e.g. São Paulo, Fluminense, Bahia)
      const bandW = 512 / 6;
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(bandW * 1, 0, bandW * 2, 512);
      ctx.fillStyle = accentColor;
      ctx.fillRect(bandW * 3, 0, bandW * 2, 512);
    } else {
      // Solid with high-end micro-shading / texture
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.08;
      for (let i = 0; i < 40; i++) {
        const y = Math.random() * 512;
        ctx.fillRect(0, y, 512, Math.random() * 8);
      }
      ctx.globalAlpha = 1.0;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

export function getPieceMaterialsForTheme(
  themeId: string,
  isAwayKit: boolean
): PieceMaterials {
  const theme = THEMES[themeId] || THEMES.classic;
  const kit: KitPalette = isAwayKit ? theme.awayKit : theme.homeKit;
  const cacheKey = `${theme.id}_${isAwayKit ? 'away' : 'home'}`;

  if (materialCache.has(cacheKey)) {
    return materialCache.get(cacheKey)!;
  }

  const patternTex = createPatternTexture(
    kit.primaryColor,
    kit.secondaryColor,
    kit.accentColor,
    kit.pattern
  );

  const materials: PieceMaterials = {
    main: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(kit.primaryColor),
      map: patternTex,
      roughness: 0.22,
      metalness: 0.12,
      clearcoat: 0.45,
      clearcoatRoughness: 0.18,
      reflectivity: 0.6,
    }),
    accent: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(kit.accentColor),
      roughness: 0.28,
      metalness: 0.85,
      clearcoat: 0.35,
    }),
    highlight: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#38bdf8'),
      roughness: 0.2,
      metalness: 0.5,
      emissive: new THREE.Color('#0284c7'),
      emissiveIntensity: 0.4,
    }),
  };

  materialCache.set(cacheKey, materials);
  return materials;
}
