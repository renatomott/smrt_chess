import * as THREE from 'three';
import type { Square } from 'chess.js';
import { boardMaterials } from './materials';

// Mapping chess coordinates (e.g. 'e4') to 3D positions (X, Z)
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export function squareToCoords(square: Square): { x: number; z: number } {
  const fileIndex = FILES.indexOf(square[0] as any);
  const rankIndex = RANKS.indexOf(square[1] as any);
  // a -> x = -3.5, h -> x = 3.5
  const x = fileIndex - 3.5;
  // 1 -> z = 3.5 (white side), 8 -> z = -3.5 (black side)
  const z = 3.5 - rankIndex;
  return { x, z };
}

export function coordsToSquare(x: number, z: number): Square | null {
  const fileIndex = Math.round(x + 3.5);
  const rankIndex = Math.round(3.5 - z);
  if (fileIndex < 0 || fileIndex > 7 || rankIndex < 0 || rankIndex > 7) return null;
  return `${FILES[fileIndex]}${RANKS[rankIndex]}` as Square;
}

// Procedural text texture for coordinates
function createCoordinateTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);
    ctx.font = 'bold 72px "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#d4af37'; // gold
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;
    ctx.fillText(text, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildChessboard(): {
  boardGroup: THREE.Group;
  squareMeshes: Map<Square, THREE.Mesh>;
} {
  const boardGroup = new THREE.Group();
  const squareMeshes = new Map<Square, THREE.Mesh>();

  // 1. Main outer table / frame with beveled edge
  const frameGeo = new THREE.BoxGeometry(9.6, 0.4, 9.6);
  const frameMesh = new THREE.Mesh(frameGeo, boardMaterials.frame);
  frameMesh.position.y = -0.2;
  frameMesh.receiveShadow = true;
  boardGroup.add(frameMesh);

  // 2. Brass inlay rim between outer frame and tiles
  const inlayOuterGeo = new THREE.BoxGeometry(8.22, 0.405, 8.22);
  const inlayInnerGeo = new THREE.BoxGeometry(8.06, 0.41, 8.06);
  // Just a thin decorative accent frame around the playing surface
  const rimGeo = new THREE.BoxGeometry(8.16, 0.402, 8.16);
  const rimMesh = new THREE.Mesh(rimGeo, boardMaterials.frameInlay);
  rimMesh.position.y = -0.198;
  boardGroup.add(rimMesh);

  // 3. Tile substrate box
  const subGeo = new THREE.BoxGeometry(8.04, 0.404, 8.04);
  const subMesh = new THREE.Mesh(subGeo, boardMaterials.darkSquare);
  subMesh.position.y = -0.197;
  boardGroup.add(subMesh);

  // 4. Individual 64 tiles
  const tileGeo = new THREE.BoxGeometry(0.98, 0.06, 0.98);
  for (let f = 0; f < 8; f++) {
    for (let r = 0; r < 8; r++) {
      const square = `${FILES[f]}${RANKS[r]}` as Square;
      const isLight = (f + r) % 2 !== 0;
      const material = isLight ? boardMaterials.lightSquare : boardMaterials.darkSquare;

      const tileMesh = new THREE.Mesh(tileGeo, material);
      const { x, z } = squareToCoords(square);
      tileMesh.position.set(x, 0.03, z);
      tileMesh.receiveShadow = true;
      tileMesh.userData = { square, isSquare: true };

      boardGroup.add(tileMesh);
      squareMeshes.set(square, tileMesh);
    }
  }

  // 5. Procedural coordinate notations along the frame
  const coordMat = (char: string) =>
    new THREE.MeshBasicMaterial({
      map: createCoordinateTexture(char),
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

  const labelPlaneGeo = new THREE.PlaneGeometry(0.4, 0.4);
  labelPlaneGeo.rotateX(-Math.PI / 2);

  // Files a-h (both white and black side)
  for (let f = 0; f < 8; f++) {
    const char = FILES[f].toUpperCase();
    const x = f - 3.5;

    // White side (Z = 4.35)
    const labelW = new THREE.Mesh(labelPlaneGeo, coordMat(char));
    labelW.position.set(x, 0.01, 4.35);
    boardGroup.add(labelW);

    // Black side (Z = -4.35, flipped)
    const labelB = new THREE.Mesh(labelPlaneGeo, coordMat(char));
    labelB.position.set(x, 0.01, -4.35);
    labelB.rotation.y = Math.PI;
    boardGroup.add(labelB);
  }

  // Ranks 1-8 (both left and right sides)
  for (let r = 0; r < 8; r++) {
    const char = RANKS[r];
    const z = 3.5 - r;

    // Left side (X = -4.35)
    const labelL = new THREE.Mesh(labelPlaneGeo, coordMat(char));
    labelL.position.set(-4.35, 0.01, z);
    boardGroup.add(labelL);

    // Right side (X = 4.35)
    const labelR = new THREE.Mesh(labelPlaneGeo, coordMat(char));
    labelR.position.set(4.35, 0.01, z);
    labelR.rotation.y = Math.PI;
    boardGroup.add(labelR);
  }

  // 6. Ground contact shadow plane beneath the table
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const shadowCtx = shadowCanvas.getContext('2d');
  if (shadowCtx) {
    const grad = shadowCtx.createRadialGradient(64, 64, 20, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    shadowCtx.fillStyle = grad;
    shadowCtx.fillRect(0, 0, 128, 128);
  }
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const contactShadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    })
  );
  contactShadowPlane.rotation.x = -Math.PI / 2;
  contactShadowPlane.position.y = -0.405;
  boardGroup.add(contactShadowPlane);

  return { boardGroup, squareMeshes };
}

export function updateBoardTheme(
  themePalette: { boardLight: string; boardDark: string; boardFrame: string; boardInlay: string }
) {
  boardMaterials.lightSquare.color.set(themePalette.boardLight);
  boardMaterials.darkSquare.color.set(themePalette.boardDark);
  boardMaterials.frame.color.set(themePalette.boardFrame);
  boardMaterials.frameInlay.color.set(themePalette.boardInlay);
}

// Visual indicators for selection, legal moves, and checks
export class BoardHighlights {
  private group: THREE.Group;
  private moveDots: THREE.Mesh[] = [];
  private selectedMarker: THREE.Mesh;
  private lastMoveMarkers: [THREE.Mesh, THREE.Mesh];
  private checkMarker: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();

    // Selected square outline/pad
    const selGeo = new THREE.PlaneGeometry(0.96, 0.96);
    selGeo.rotateX(-Math.PI / 2);
    this.selectedMarker = new THREE.Mesh(selGeo, boardMaterials.tileHighlightSelected);
    this.selectedMarker.position.y = 0.065;
    this.selectedMarker.visible = false;
    this.group.add(this.selectedMarker);

    // Last move from/to markers
    const lastFrom = new THREE.Mesh(selGeo, boardMaterials.tileHighlightLastMove);
    lastFrom.position.y = 0.062;
    lastFrom.visible = false;
    this.group.add(lastFrom);

    const lastTo = new THREE.Mesh(selGeo, boardMaterials.tileHighlightLastMove);
    lastTo.position.y = 0.062;
    lastTo.visible = false;
    this.group.add(lastTo);
    this.lastMoveMarkers = [lastFrom, lastTo];

    // Check indicator
    this.checkMarker = new THREE.Mesh(selGeo, boardMaterials.tileHighlightCheck);
    this.checkMarker.position.y = 0.063;
    this.checkMarker.visible = false;
    this.group.add(this.checkMarker);

    // Hint markers (from & to)
    const hintMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#10b981'), // Emerald green
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const hintFrom = new THREE.Mesh(selGeo, hintMat);
    hintFrom.position.y = 0.066;
    hintFrom.visible = false;
    this.group.add(hintFrom);

    const hintTo = new THREE.Mesh(selGeo, hintMat);
    hintTo.position.y = 0.066;
    hintTo.visible = false;
    this.group.add(hintTo);
    this.hintMarkers = [hintFrom, hintTo];
  }

  private hintMarkers: [THREE.Mesh, THREE.Mesh];

  public getGroup(): THREE.Group {
    return this.group;
  }

  public update(
    selectedSquare: Square | null,
    legalMoves: Square[],
    lastMove: { from: Square; to: Square } | null,
    checkSquare: Square | null,
    isCaptureOnSquare: (sq: Square) => boolean,
    hintMove?: { from: Square; to: Square } | null
  ) {
    // 1. Selection
    if (selectedSquare) {
      const { x, z } = squareToCoords(selectedSquare);
      this.selectedMarker.position.set(x, 0.065, z);
      this.selectedMarker.visible = true;
    } else {
      this.selectedMarker.visible = false;
    }

    // 2. Last move
    if (lastMove) {
      const pFrom = squareToCoords(lastMove.from);
      this.lastMoveMarkers[0].position.set(pFrom.x, 0.062, pFrom.z);
      this.lastMoveMarkers[0].visible = true;

      const pTo = squareToCoords(lastMove.to);
      this.lastMoveMarkers[1].position.set(pTo.x, 0.062, pTo.z);
      this.lastMoveMarkers[1].visible = true;
    } else {
      this.lastMoveMarkers[0].visible = false;
      this.lastMoveMarkers[1].visible = false;
    }

    // 3. Check indicator
    if (checkSquare) {
      const pCheck = squareToCoords(checkSquare);
      this.checkMarker.position.set(pCheck.x, 0.063, pCheck.z);
      this.checkMarker.visible = true;
    } else {
      this.checkMarker.visible = false;
    }

    // 4. Hint markers
    if (hintMove) {
      const pFrom = squareToCoords(hintMove.from);
      this.hintMarkers[0].position.set(pFrom.x, 0.066, pFrom.z);
      this.hintMarkers[0].visible = true;

      const pTo = squareToCoords(hintMove.to);
      this.hintMarkers[1].position.set(pTo.x, 0.066, pTo.z);
      this.hintMarkers[1].visible = true;
    } else {
      this.hintMarkers[0].visible = false;
      this.hintMarkers[1].visible = false;
    }

    // 5. Legal moves
    for (const dot of this.moveDots) {
      this.group.remove(dot);
      dot.geometry.dispose();
    }
    this.moveDots = [];

    for (const targetSq of legalMoves) {
      const isCapture = isCaptureOnSquare(targetSq);
      const { x, z } = squareToCoords(targetSq);

      let marker: THREE.Mesh;
      if (isCapture) {
        const ringGeo = new THREE.RingGeometry(0.32, 0.44, 24);
        ringGeo.rotateX(-Math.PI / 2);
        marker = new THREE.Mesh(ringGeo, boardMaterials.tileHighlightCapture);
      } else {
        const circleGeo = new THREE.CircleGeometry(0.18, 20);
        circleGeo.rotateX(-Math.PI / 2);
        marker = new THREE.Mesh(circleGeo, boardMaterials.tileHighlightMove);
      }

      marker.position.set(x, 0.064, z);
      this.group.add(marker);
      this.moveDots.push(marker);
    }
  }

  public dispose() {
    this.moveDots.forEach((d) => d.geometry.dispose());
  }
}
