import * as THREE from 'three';
import type { PieceSymbol, Color } from 'chess.js';
import { whitePieceMaterials, blackPieceMaterials, type PieceMaterials } from './materials';

export interface PieceUserData {
  square: string;
  pieceType: PieceSymbol;
  color: Color;
  originalY: number;
}

// Reusable geometries to avoid creating dozens of identical buffer geometries
const basePlateGeo = new THREE.CylinderGeometry(0.42, 0.45, 0.08, 24);
const baseRingGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.05, 24);
const baseWaistGeo = new THREE.CylinderGeometry(0.30, 0.38, 0.12, 24);
const ringAccentGeo = new THREE.TorusGeometry(0.28, 0.025, 12, 24);
ringAccentGeo.rotateX(Math.PI / 2);

function createStandardBase(mat: PieceMaterials): THREE.Group {
  const baseGroup = new THREE.Group();

  const foot = new THREE.Mesh(basePlateGeo, mat.main);
  foot.position.y = 0.04;
  foot.castShadow = true;
  foot.receiveShadow = true;
  baseGroup.add(foot);

  const ring = new THREE.Mesh(baseRingGeo, mat.accent);
  ring.position.y = 0.105;
  ring.castShadow = true;
  ring.receiveShadow = true;
  baseGroup.add(ring);

  const waist = new THREE.Mesh(baseWaistGeo, mat.main);
  waist.position.y = 0.19;
  waist.castShadow = true;
  waist.receiveShadow = true;
  baseGroup.add(waist);

  return baseGroup;
}

function buildPawn(mat: PieceMaterials): THREE.Group {
  const group = new THREE.Group();
  group.add(createStandardBase(mat));

  // Torso / Soldier body
  const bodyGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.42, 20);
  const body = new THREE.Mesh(bodyGeo, mat.main);
  body.position.y = 0.46;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Belt / Armor ring
  const belt = new THREE.Mesh(ringAccentGeo, mat.accent);
  belt.position.y = 0.42;
  belt.scale.set(0.85, 0.85, 0.85);
  group.add(belt);

  // Neck ring
  const neckGeo = new THREE.CylinderGeometry(0.16, 0.19, 0.06, 20);
  const neck = new THREE.Mesh(neckGeo, mat.accent);
  neck.position.y = 0.70;
  neck.castShadow = true;
  group.add(neck);

  // Head sphere
  const headGeo = new THREE.SphereGeometry(0.20, 20, 16);
  const head = new THREE.Mesh(headGeo, mat.main);
  head.position.y = 0.88;
  head.castShadow = true;
  head.receiveShadow = true;
  group.add(head);

  // Crested soldier cap / finial button
  const capGeo = new THREE.CylinderGeometry(0.04, 0.10, 0.08, 16);
  const cap = new THREE.Mesh(capGeo, mat.accent);
  cap.position.y = 1.09;
  cap.castShadow = true;
  group.add(cap);

  return group;
}

function buildRook(mat: PieceMaterials): THREE.Group {
  const group = new THREE.Group();
  group.add(createStandardBase(mat));

  // Fortress Pillar / Body
  const pillarGeo = new THREE.CylinderGeometry(0.27, 0.31, 0.65, 20);
  const pillar = new THREE.Mesh(pillarGeo, mat.main);
  pillar.position.y = 0.575;
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  group.add(pillar);

  // Collar cornice ring
  const collarGeo = new THREE.CylinderGeometry(0.33, 0.28, 0.08, 20);
  const collar = new THREE.Mesh(collarGeo, mat.accent);
  collar.position.y = 0.94;
  collar.castShadow = true;
  group.add(collar);

  // Castle Turret Rampart
  const crownGeo = new THREE.CylinderGeometry(0.35, 0.33, 0.26, 20);
  const crown = new THREE.Mesh(crownGeo, mat.main);
  crown.position.y = 1.11;
  crown.castShadow = true;
  group.add(crown);

  // Inner embrasure / floor
  const floorGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.05, 16);
  const floor = new THREE.Mesh(floorGeo, mat.accent);
  floor.position.y = 1.20;
  group.add(floor);

  // 4 Battlements / Merlons
  const merlonGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  const merlonOffsets = [
    { x: 0.23, z: 0 },
    { x: -0.23, z: 0 },
    { x: 0, z: 0.23 },
    { x: 0, z: -0.23 },
  ];
  merlonOffsets.forEach((pos) => {
    const merlon = new THREE.Mesh(merlonGeo, mat.main);
    merlon.position.set(pos.x, 1.28, pos.z);
    merlon.castShadow = true;
    group.add(merlon);
  });

  return group;
}

function buildKnight(mat: PieceMaterials, color: Color): THREE.Group {
  const group = new THREE.Group();
  group.add(createStandardBase(mat));

  // Pedestal neck base
  const neckBaseGeo = new THREE.CylinderGeometry(0.24, 0.29, 0.20, 20);
  const neckBase = new THREE.Mesh(neckBaseGeo, mat.main);
  neckBase.position.y = 0.35;
  neckBase.castShadow = true;
  group.add(neckBase);

  // Golden harness ring
  const harness = new THREE.Mesh(ringAccentGeo, mat.accent);
  harness.position.y = 0.45;
  harness.scale.set(0.9, 0.9, 0.9);
  group.add(harness);

  // Horse Head & Neck Profile Shape
  const horseShape = new THREE.Shape();
  horseShape.moveTo(-0.16, 0.0);
  horseShape.lineTo(-0.18, 0.40); // back of neck
  horseShape.lineTo(-0.14, 0.65); // crest
  horseShape.lineTo(-0.10, 0.78); // ear tip back
  horseShape.lineTo(-0.04, 0.68); // between ears
  horseShape.lineTo(0.04, 0.76);  // ear tip front
  horseShape.lineTo(0.08, 0.62);  // forehead
  horseShape.lineTo(0.28, 0.40);  // muzzle top
  horseShape.lineTo(0.24, 0.30);  // mouth/chin
  horseShape.lineTo(0.08, 0.28);  // throat
  horseShape.lineTo(-0.02, 0.0);  // chest base
  horseShape.closePath();

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 0.22,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.04,
    bevelThickness: 0.04,
  };

  const headGeo = new THREE.ExtrudeGeometry(horseShape, extrudeSettings);
  headGeo.center();
  const horseHead = new THREE.Mesh(headGeo, mat.main);
  horseHead.position.set(0.03, 0.88, 0);
  horseHead.castShadow = true;
  horseHead.receiveShadow = true;

  // Orient face forward (+Z for white, -Z for black)
  if (color === 'w') {
    horseHead.rotation.y = Math.PI / 2;
  } else {
    horseHead.rotation.y = -Math.PI / 2;
  }
  group.add(horseHead);

  // Mane ridge accent
  const maneGeo = new THREE.BoxGeometry(0.06, 0.35, 0.14);
  const mane = new THREE.Mesh(maneGeo, mat.accent);
  mane.position.set(0, 0.92, color === 'w' ? -0.16 : 0.16);
  mane.rotation.x = color === 'w' ? -0.3 : 0.3;
  mane.castShadow = true;
  group.add(mane);

  return group;
}

function buildBishop(mat: PieceMaterials): THREE.Group {
  const group = new THREE.Group();
  group.add(createStandardBase(mat));

  // Robed column
  const bodyGeo = new THREE.CylinderGeometry(0.20, 0.28, 0.68, 20);
  const body = new THREE.Mesh(bodyGeo, mat.main);
  body.position.y = 0.59;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Clerical sash ring
  const sash = new THREE.Mesh(ringAccentGeo, mat.accent);
  sash.position.y = 0.52;
  sash.scale.set(0.82, 0.82, 0.82);
  group.add(sash);

  // Collar collar ring
  const collarGeo = new THREE.CylinderGeometry(0.24, 0.19, 0.08, 20);
  const collar = new THREE.Mesh(collarGeo, mat.accent);
  collar.position.y = 0.97;
  collar.castShadow = true;
  group.add(collar);

  // Mitre / Dome head
  const mitreGeo = new THREE.SphereGeometry(0.24, 20, 16);
  mitreGeo.scale(1, 1.45, 0.9);
  const mitre = new THREE.Mesh(mitreGeo, mat.main);
  mitre.position.y = 1.30;
  mitre.castShadow = true;
  mitre.receiveShadow = true;
  group.add(mitre);

  // Mitre cut accent notch
  const notchGeo = new THREE.BoxGeometry(0.06, 0.22, 0.26);
  const notch = new THREE.Mesh(notchGeo, mat.accent);
  notch.position.set(0.12, 1.35, 0);
  notch.rotation.z = -0.4;
  group.add(notch);

  // Finial pearl / cross point
  const pearlGeo = new THREE.SphereGeometry(0.065, 12, 12);
  const pearl = new THREE.Mesh(pearlGeo, mat.accent);
  pearl.position.y = 1.68;
  pearl.castShadow = true;
  group.add(pearl);

  return group;
}

function buildQueen(mat: PieceMaterials): THREE.Group {
  const group = new THREE.Group();
  group.add(createStandardBase(mat));

  // Regal corseted gown
  const gownGeo = new THREE.CylinderGeometry(0.22, 0.31, 0.85, 24);
  const gown = new THREE.Mesh(gownGeo, mat.main);
  gown.position.y = 0.675;
  gown.castShadow = true;
  gown.receiveShadow = true;
  group.add(gown);

  // Royal girdle sash
  const sash = new THREE.Mesh(ringAccentGeo, mat.accent);
  sash.position.y = 0.65;
  sash.scale.set(0.92, 0.92, 0.92);
  group.add(sash);

  // Neck mantle collar
  const collarGeo = new THREE.CylinderGeometry(0.27, 0.22, 0.09, 24);
  const collar = new THREE.Mesh(collarGeo, mat.accent);
  collar.position.y = 1.14;
  collar.castShadow = true;
  group.add(collar);

  // Flared coronet crown
  const coronetGeo = new THREE.CylinderGeometry(0.35, 0.24, 0.36, 24);
  const coronet = new THREE.Mesh(coronetGeo, mat.main);
  coronet.position.y = 1.365;
  coronet.castShadow = true;
  coronet.receiveShadow = true;
  group.add(coronet);

  // 8 Crown petal peaks
  const numPetals = 8;
  const petalGeo = new THREE.SphereGeometry(0.045, 10, 10);
  for (let i = 0; i < numPetals; i++) {
    const angle = (i / numPetals) * Math.PI * 2;
    const px = Math.cos(angle) * 0.34;
    const pz = Math.sin(angle) * 0.34;
    const petal = new THREE.Mesh(petalGeo, mat.accent);
    petal.position.set(px, 1.55, pz);
    petal.castShadow = true;
    group.add(petal);
  }

  // Central pearl finial
  const topPearlGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const topPearl = new THREE.Mesh(topPearlGeo, mat.accent);
  topPearl.position.y = 1.63;
  topPearl.castShadow = true;
  group.add(topPearl);

  return group;
}

function buildKing(mat: PieceMaterials): THREE.Group {
  const group = new THREE.Group();
  group.add(createStandardBase(mat));

  // Sovereign cloak / body
  const bodyGeo = new THREE.CylinderGeometry(0.26, 0.33, 0.95, 24);
  const body = new THREE.Mesh(bodyGeo, mat.main);
  body.position.y = 0.725;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Monarch belt
  const belt = new THREE.Mesh(ringAccentGeo, mat.accent);
  belt.position.y = 0.70;
  group.add(belt);

  // Imperial shoulder mantle
  const mantleGeo = new THREE.CylinderGeometry(0.31, 0.26, 0.12, 24);
  const mantle = new THREE.Mesh(mantleGeo, mat.accent);
  mantle.position.y = 1.26;
  mantle.castShadow = true;
  group.add(mantle);

  // King's crown arches
  const crownDomeGeo = new THREE.CylinderGeometry(0.34, 0.28, 0.32, 24);
  const crownDome = new THREE.Mesh(crownDomeGeo, mat.main);
  crownDome.position.y = 1.48;
  crownDome.castShadow = true;
  crownDome.receiveShadow = true;
  group.add(crownDome);

  // Crown rim band
  const crownBandGeo = new THREE.CylinderGeometry(0.355, 0.35, 0.06, 24);
  const crownBand = new THREE.Mesh(crownBandGeo, mat.accent);
  crownBand.position.y = 1.62;
  crownBand.castShadow = true;
  group.add(crownBand);

  // Cross Patonce Finial (Vertical shaft + Horizontal arm)
  const crossGroup = new THREE.Group();
  const vBarGeo = new THREE.BoxGeometry(0.06, 0.28, 0.06);
  const vBar = new THREE.Mesh(vBarGeo, mat.accent);
  vBar.position.y = 0.14;
  vBar.castShadow = true;
  crossGroup.add(vBar);

  const hBarGeo = new THREE.BoxGeometry(0.22, 0.06, 0.06);
  const hBar = new THREE.Mesh(hBarGeo, mat.accent);
  hBar.position.y = 0.18;
  hBar.castShadow = true;
  crossGroup.add(hBar);

  crossGroup.position.y = 1.65;
  group.add(crossGroup);

  return group;
}

export function createProceduralPiece(
  type: PieceSymbol,
  color: Color,
  square: string,
  customMat?: PieceMaterials
): THREE.Group {
  const mat = customMat || (color === 'w' ? whitePieceMaterials : blackPieceMaterials);
  let pieceGroup: THREE.Group;

  switch (type) {
    case 'p':
      pieceGroup = buildPawn(mat);
      break;
    case 'r':
      pieceGroup = buildRook(mat);
      break;
    case 'n':
      pieceGroup = buildKnight(mat, color);
      break;
    case 'b':
      pieceGroup = buildBishop(mat);
      break;
    case 'q':
      pieceGroup = buildQueen(mat);
      break;
    case 'k':
      pieceGroup = buildKing(mat);
      break;
    default:
      pieceGroup = buildPawn(mat);
  }

  // Tag group with user data
  pieceGroup.userData = {
    square,
    pieceType: type,
    color,
    originalY: 0,
    isPiece: true,
  };

  return pieceGroup;
}
