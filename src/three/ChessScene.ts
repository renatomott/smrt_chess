import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Square, PieceSymbol, Color } from 'chess.js';
import { createProceduralPiece } from './proceduralPieces';
import { buildChessboard, squareToCoords, BoardHighlights } from './boardVisuals';
import type { CameraPreset } from '../game/chessTypes';
import { getPieceMaterialsForTheme } from '../themes/themeMaterials';
import { THEMES } from '../themes/themes';
import { boardMaterials, whitePieceMaterials, blackPieceMaterials, type PieceMaterials } from './materials';

// Pre-allocated vectors for zero-allocation tick loop
const _tempVec = new THREE.Vector3();
const _camTarget = new THREE.Vector3(0, 0, 0);

interface PieceAnimation {
  mesh: THREE.Group;
  startX: number;
  startZ: number;
  targetX: number;
  targetZ: number;
  progress: number;
  duration: number; // seconds
  isKnight: boolean;
}

interface CaptureAnimation {
  mesh: THREE.Group;
  particles: THREE.Points;
  ring: THREE.Mesh;
  particleVelocities: THREE.Vector3[];
  tumbleAxis: THREE.Vector3;
  progress: number;
  duration: number;
  startX: number;
  startZ: number;
}

export class ChessSceneManager {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private highlights!: BoardHighlights;
  private boardGroup!: THREE.Group;
  private squareMeshes = new Map<Square, THREE.Mesh>();

  // Piece map: square -> Group
  private pieceMap = new Map<Square, THREE.Group>();
  private activeAnimations: PieceAnimation[] = [];
  private captureAnimations: CaptureAnimation[] = [];

  // Interaction & callbacks
  private onSquareClick?: (square: Square) => void;
  private selectedSquare: Square | null = null;
  private animationFrameId: number | null = null;
  private clock = new THREE.Clock();

  // Camera targets
  private targetCameraPos = new THREE.Vector3(0, 8.5, 9.5);
  private currentCameraPreset: CameraPreset = 'default';

  // Themes & Materials
  private whiteThemeId: string = 'classic';
  private blackThemeId: string = 'classic';
  private whiteMaterials: PieceMaterials = whitePieceMaterials;
  private blackMaterials: PieceMaterials = blackPieceMaterials;

  constructor(container: HTMLDivElement, onSquareClick?: (square: Square) => void) {
    this.container = container;
    this.onSquareClick = onSquareClick;

    this.initScene();
    this.initLights();
    this.initEnvironment();
    this.initBoard();
    this.initInteractions();
    this.startLoop();
  }

  private initScene() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0c0d11');
    this.scene.fog = new THREE.FogExp2('#0c0d11', 0.035);

    const aspect = width / height;
    const fov = aspect < 1 ? Math.min(62, Math.max(45, 45 / Math.max(0.72, aspect))) : 45;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);
    this.camera.position.set(0, 8.5, 9.5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2.05; // do not go below table
    this.controls.minDistance = 4.5;
    this.controls.maxDistance = 20;
    this.controls.target.set(0, 0, 0);
  }

  private initLights() {
    // 1. Hemisphere fill (warm key ambient vs cool floor bounce)
    const hemiLight = new THREE.HemisphereLight('#f1f5f9', '#1e293b', 0.85);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    // 2. Key directional light with sharp soft shadows
    const keyLight = new THREE.DirectionalLight('#fffbeb', 1.8);
    keyLight.position.set(6, 14, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -6;
    keyLight.shadow.camera.right = 6;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -6;
    this.scene.add(keyLight);

    // 3. Rim / counter light for edge silhouettes
    const rimLight = new THREE.DirectionalLight('#38bdf8', 0.9);
    rimLight.position.set(-8, 9, -8);
    this.scene.add(rimLight);

    // 4. Warm subtle accent spot
    const accentLight = new THREE.PointLight('#f59e0b', 0.6, 15);
    accentLight.position.set(0, 6, 0);
    this.scene.add(accentLight);
  }

  private initEnvironment() {
    // Generate procedural studio environment map via PMREM
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTexture;
    pmremGenerator.dispose();
  }

  private initBoard() {
    const { boardGroup, squareMeshes } = buildChessboard();
    this.boardGroup = boardGroup;
    this.squareMeshes = squareMeshes;
    this.scene.add(boardGroup);

    this.highlights = new BoardHighlights();
    this.scene.add(this.highlights.getGroup());
  }

  private initInteractions() {
    const dom = this.renderer.domElement;

    let pointerDownPos = { x: 0, y: 0 };
    dom.addEventListener('pointerdown', (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    dom.addEventListener('pointerup', (e) => {
      // Avoid firing on camera drag
      const dx = Math.abs(e.clientX - pointerDownPos.x);
      const dy = Math.abs(e.clientY - pointerDownPos.y);
      if (dx > 6 || dy > 6) return;

      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Check intersections with all pieces and board square tiles
      const targets: THREE.Object3D[] = [];
      this.squareMeshes.forEach((mesh) => targets.push(mesh));
      this.pieceMap.forEach((piece) => {
        piece.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) targets.push(child);
        });
      });

      const intersects = this.raycaster.intersectObjects(targets, false);
      if (intersects.length > 0) {
        let clickedSquare: Square | null = null;

        for (const hit of intersects) {
          // Check if hit object or ancestor has userData.square
          let obj: THREE.Object3D | null = hit.object;
          while (obj && obj !== this.scene) {
            if (obj.userData?.square) {
              clickedSquare = obj.userData.square as Square;
              break;
            }
            obj = obj.parent;
          }
          if (clickedSquare) break;
        }

        if (clickedSquare && this.onSquareClick) {
          this.onSquareClick(clickedSquare);
        }
      }
    });

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 1 ? Math.min(62, Math.max(45, 45 / Math.max(0.72, aspect))) : 45;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private triggerCaptureEffect(capturedMesh: THREE.Group, sq: Square, attackerFrom?: Square) {
    const { x, z } = squareToCoords(sq);

    // Calculate tumble axis away from attacker trajectory
    let tumbleAxis = new THREE.Vector3(1, 0, 0);
    if (attackerFrom) {
      const fromCoord = squareToCoords(attackerFrom);
      const dirX = x - fromCoord.x;
      const dirZ = z - fromCoord.z;
      const len = Math.hypot(dirX, dirZ) || 1;
      // Perpendicular axis for forward topple roll
      tumbleAxis = new THREE.Vector3(-dirZ / len, 0, dirX / len);
    }

    // Expanding shockwave ring on board
    const ringGeo = new THREE.RingGeometry(0.12, 0.28, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#fbbf24',
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(x, 0.055, z);
    this.scene.add(ring);

    // Dynamic sparks particle burst
    const particleCount = 22;
    const positions = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = x;
      positions[i * 3 + 1] = 0.2;
      positions[i * 3 + 2] = z;

      const angle = Math.random() * Math.PI * 2;
      const horizontalSpeed = 0.8 + Math.random() * 2.2;
      velocities.push(
        new THREE.Vector3(
          Math.cos(angle) * horizontalSpeed,
          2.2 + Math.random() * 2.8,
          Math.sin(angle) * horizontalSpeed
        )
      );
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: '#f59e0b',
      size: 0.14,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(particles);

    this.captureAnimations.push({
      mesh: capturedMesh,
      particles,
      ring,
      particleVelocities: velocities,
      tumbleAxis,
      progress: 0,
      duration: 0.48,
      startX: x,
      startZ: z,
    });
  }

  public syncFromBoardState(
    board: ({ type: PieceSymbol; color: Color } | null)[][],
    selectedSquare: Square | null,
    legalMoves: Square[],
    lastMove: { from: Square; to: Square } | null,
    secondaryMove: { from: Square; to: Square; piece: PieceSymbol; color: Color } | null,
    enPassantCapturedSquare: Square | null,
    inCheck: boolean,
    turn: Color,
    hintMove?: { from: Square; to: Square } | null
  ) {
    this.selectedSquare = selectedSquare;

    // Find in-check king square
    let checkSquare: Square | null = null;
    if (inCheck) {
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const piece = board[r][f];
          if (piece && piece.type === 'k' && piece.color === turn) {
            const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
            const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
            checkSquare = `${files[f]}${ranks[r]}` as Square;
          }
        }
      }
    }

    // Update highlight visual indicators
    this.highlights.update(
      selectedSquare,
      legalMoves,
      lastMove,
      checkSquare,
      (targetSq) => {
        return this.pieceMap.has(targetSq);
      },
      hintMove
    );

    // Build desired pieces map from board array
    const desiredPieces = new Map<Square, { type: PieceSymbol; color: Color }>();
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = board[r][f];
        if (piece) {
          const sq = `${files[f]}${ranks[r]}` as Square;
          desiredPieces.set(sq, piece);
        }
      }
    }

    // Handle en passant capture removal with battle effect
    if (enPassantCapturedSquare && this.pieceMap.has(enPassantCapturedSquare)) {
      const epMesh = this.pieceMap.get(enPassantCapturedSquare)!;
      this.pieceMap.delete(enPassantCapturedSquare);
      this.triggerCaptureEffect(epMesh, enPassantCapturedSquare, lastMove?.from);
    }

    // Set of meshes animated in this turn
    const animatedMeshes = new Set<THREE.Group>();

    // 1. Primary Move Animation
    if (lastMove && this.pieceMap.has(lastMove.from)) {
      const fromMesh = this.pieceMap.get(lastMove.from)!;
      const pieceData = desiredPieces.get(lastMove.to);

      if (pieceData) {
        const pStart = squareToCoords(lastMove.from);
        const pEnd = squareToCoords(lastMove.to);

        fromMesh.userData.square = lastMove.to;
        this.pieceMap.delete(lastMove.from);

        // Remove captured piece at destination with dramatic battle knockdown effect
        if (this.pieceMap.has(lastMove.to)) {
          const capturedMesh = this.pieceMap.get(lastMove.to)!;
          this.pieceMap.delete(lastMove.to);
          this.triggerCaptureEffect(capturedMesh, lastMove.to, lastMove.from);
        }

        this.pieceMap.set(lastMove.to, fromMesh);
        animatedMeshes.add(fromMesh);

        this.activeAnimations.push({
          mesh: fromMesh,
          startX: pStart.x,
          startZ: pStart.z,
          targetX: pEnd.x,
          targetZ: pEnd.z,
          progress: 0,
          duration: 0.35,
          isKnight: pieceData.type === 'n',
        });
      }
    }

    // 2. Secondary Move Animation (Castling Rook)
    if (secondaryMove && this.pieceMap.has(secondaryMove.from)) {
      const rookMesh = this.pieceMap.get(secondaryMove.from)!;
      const pRookStart = squareToCoords(secondaryMove.from);
      const pRookEnd = squareToCoords(secondaryMove.to);

      rookMesh.userData.square = secondaryMove.to;
      this.pieceMap.delete(secondaryMove.from);
      this.pieceMap.set(secondaryMove.to, rookMesh);
      animatedMeshes.add(rookMesh);

      this.activeAnimations.push({
        mesh: rookMesh,
        startX: pRookStart.x,
        startZ: pRookStart.z,
        targetX: pRookEnd.x,
        targetZ: pRookEnd.z,
        progress: 0,
        duration: 0.32,
        isKnight: false,
      });
    }

    // 3. Reconcile remaining pieces: remove missing pieces, create new ones
    const toRemove: Square[] = [];
    this.pieceMap.forEach((mesh, sq) => {
      if (animatedMeshes.has(mesh)) return;
      const desired = desiredPieces.get(sq);
      if (
        !desired ||
        desired.type !== mesh.userData.pieceType ||
        desired.color !== mesh.userData.color
      ) {
        this.scene.remove(mesh);
        toRemove.push(sq);
      }
    });
    toRemove.forEach((sq) => this.pieceMap.delete(sq));

    // Add newly created pieces (e.g. initial load or promotions)
    desiredPieces.forEach((piece, sq) => {
      if (this.pieceMap.has(sq)) return;

      const pieceGroup = createProceduralPiece(
        piece.type,
        piece.color,
        sq,
        piece.color === 'w' ? this.whiteMaterials : this.blackMaterials
      );
      const { x, z } = squareToCoords(sq);
      pieceGroup.position.set(x, 0.05, z);
      this.scene.add(pieceGroup);
      this.pieceMap.set(sq, pieceGroup);
    });
  }

  public setThemes(whiteThemeId: string, blackThemeId: string) {
    if (this.whiteThemeId === whiteThemeId && this.blackThemeId === blackThemeId) {
      return;
    }

    this.whiteThemeId = whiteThemeId;
    this.blackThemeId = blackThemeId;

    const isBlackAway = whiteThemeId === blackThemeId;
    this.whiteMaterials = getPieceMaterialsForTheme(whiteThemeId, false);
    this.blackMaterials = getPieceMaterialsForTheme(blackThemeId, isBlackAway);

    // Update board colors to match host/home team palette
    const homeTheme = THEMES[whiteThemeId] || THEMES.classic;
    const kit = homeTheme.homeKit;
    boardMaterials.lightSquare.color.set(kit.boardLight);
    boardMaterials.darkSquare.color.set(kit.boardDark);
    boardMaterials.frame.color.set(kit.boardFrame);
    boardMaterials.frameInlay.color.set(kit.boardInlay);

    // Rebuild existing piece meshes with new theme materials
    this.pieceMap.forEach((mesh, sq) => {
      const color = mesh.userData.color as Color;
      const pieceType = mesh.userData.pieceType as PieceSymbol;
      const currentPos = mesh.position.clone();
      const currentRot = mesh.rotation.clone();

      this.scene.remove(mesh);
      const newPiece = createProceduralPiece(
        pieceType,
        color,
        sq,
        color === 'w' ? this.whiteMaterials : this.blackMaterials
      );
      newPiece.position.copy(currentPos);
      newPiece.rotation.copy(currentRot);
      this.scene.add(newPiece);
      this.pieceMap.set(sq, newPiece);
    });
  }

  public setCameraPreset(preset: CameraPreset, turn?: Color, autoRotate?: boolean) {
    this.currentCameraPreset = preset;

    if (preset === 'default') {
      if (autoRotate && turn === 'b') {
        this.targetCameraPos.set(0, 8.5, -9.5);
      } else {
        this.targetCameraPos.set(0, 8.5, 9.5);
      }
    } else if (preset === 'top') {
      this.targetCameraPos.set(0, 13, 0.001);
    } else if (preset === 'white') {
      this.targetCameraPos.set(0, 6.5, 7.8);
    } else if (preset === 'black') {
      this.targetCameraPos.set(0, 6.5, -7.8);
    } else if (preset === 'cinematic') {
      this.targetCameraPos.set(6.2, 4.6, 6.5);
    }
  }

  private startLoop() {
    const tick = () => {
      this.animationFrameId = requestAnimationFrame(tick);
      const delta = Math.min(this.clock.getDelta(), 0.1);
      const elapsedTime = this.clock.getElapsedTime();

      // 1. Camera interpolation towards target preset
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.targetCameraPos.x, 3.5, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.targetCameraPos.y, 3.5, delta);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.targetCameraPos.z, 3.5, delta);
      this.controls.update();

      // 2. Active piece animations (smooth movement arcs)
      for (let i = this.activeAnimations.length - 1; i >= 0; i--) {
        const anim = this.activeAnimations[i];
        anim.progress += delta / anim.duration;

        if (anim.progress >= 1) {
          anim.mesh.position.set(anim.targetX, 0.05, anim.targetZ);
          this.activeAnimations.splice(i, 1);
        } else {
          // Smooth easeInOutQuad curve
          const t = anim.progress;
          const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

          const currentX = THREE.MathUtils.lerp(anim.startX, anim.targetX, ease);
          const currentZ = THREE.MathUtils.lerp(anim.startZ, anim.targetZ, ease);

          // Jump arc height
          const arcHeight = anim.isKnight ? 0.75 : 0.35;
          const currentY = 0.05 + Math.sin(t * Math.PI) * arcHeight;

          anim.mesh.position.set(currentX, currentY, currentZ);
        }
      }

      // 3. Active capture animations (topple, shockwave ring, sparks)
      for (let i = this.captureAnimations.length - 1; i >= 0; i--) {
        const anim = this.captureAnimations[i];
        anim.progress += delta / anim.duration;

        if (anim.progress >= 1) {
          this.scene.remove(anim.mesh);
          this.scene.remove(anim.ring);
          this.scene.remove(anim.particles);
          anim.ring.geometry.dispose();
          (anim.ring.material as THREE.Material).dispose();
          anim.particles.geometry.dispose();
          (anim.particles.material as THREE.Material).dispose();
          this.captureAnimations.splice(i, 1);
        } else {
          const t = anim.progress;
          // Topple knockdown angle and downward sink
          anim.mesh.position.y = 0.05 - t * 0.65;
          anim.mesh.rotation.x = anim.tumbleAxis.x * t * Math.PI * 0.6;
          anim.mesh.rotation.z = anim.tumbleAxis.z * t * Math.PI * 0.6;
          anim.mesh.scale.setScalar(Math.max(0.01, 1 - t * 0.4));

          // Expanding shockwave ring on board
          const ringScale = 1 + t * 3.8;
          anim.ring.scale.set(ringScale, ringScale, 1);
          (anim.ring.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t);

          // Kinetic particles with gravity arc
          const posAttr = anim.particles.geometry.attributes.position as THREE.BufferAttribute;
          const posArr = posAttr.array as Float32Array;
          for (let p = 0; p < anim.particleVelocities.length; p++) {
            const vel = anim.particleVelocities[p];
            posArr[p * 3] += vel.x * delta;
            posArr[p * 3 + 1] += vel.y * delta;
            posArr[p * 3 + 2] += vel.z * delta;
            vel.y -= 9.8 * delta; // Gravity
          }
          posAttr.needsUpdate = true;
          (anim.particles.material as THREE.PointsMaterial).opacity = 1 - t;
        }
      }

      // 4. Selection elevation & idle breath
      this.pieceMap.forEach((mesh, sq) => {
        // Skip if piece is actively moving
        const isMoving = this.activeAnimations.some((a) => a.mesh === mesh);
        if (isMoving) return;

        if (sq === this.selectedSquare) {
          // Elevated and hovering
          const hoverY = 0.28 + Math.sin(elapsedTime * 6) * 0.04;
          mesh.position.y = THREE.MathUtils.damp(mesh.position.y, hoverY, 8, delta);
        } else {
          // Grounded on the board with subtle idle breathing
          mesh.position.y = THREE.MathUtils.damp(mesh.position.y, 0.05, 8, delta);
        }
      });

      this.renderer.render(this.scene, this.camera);
    };

    tick();
  }

  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);

    // Clean up active capture animations
    this.captureAnimations.forEach((anim) => {
      this.scene.remove(anim.mesh);
      this.scene.remove(anim.ring);
      this.scene.remove(anim.particles);
      anim.ring.geometry.dispose();
      (anim.ring.material as THREE.Material).dispose();
      anim.particles.geometry.dispose();
      (anim.particles.material as THREE.Material).dispose();
    });
    this.captureAnimations = [];

    this.controls.dispose();
    this.highlights.dispose();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
