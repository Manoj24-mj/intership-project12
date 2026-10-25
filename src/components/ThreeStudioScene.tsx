import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Product } from '../types/index.ts';
import {
  RotateCcw,
  Sun,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Layers,
  Camera,
  Palette,
  Sparkles,
  Eye,
} from 'lucide-react';

interface ThreeStudioSceneProps {
  products: Product[];
  selectedProductId?: string;
  onSelectProduct?: (productId: string) => void;
  onClose?: () => void;
}

// Scratch math helpers outside the animation loop to ensure 0 GC allocations
const _vec3 = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

export const ThreeStudioScene: React.FC<ThreeStudioSceneProps> = ({
  products,
  selectedProductId,
  onSelectProduct,
  onClose,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Active state
  const [activeProduct, setActiveProduct] = useState<Product | null>(() => {
    if (selectedProductId) {
      const found = products.find(p => p.id === selectedProductId);
      if (found) return found;
    }
    return products[0] || null;
  });

  const [exploded, setExploded] = useState(0); // 0 to 1
  const [finish, setFinish] = useState<'teak' | 'walnut' | 'pine'>('teak');
  const [lightingMood, setLightingMood] = useState<'studio' | 'golden' | 'gallery'>('studio');
  const [cameraView, setCameraView] = useState<'hero' | 'canvas' | 'palette' | 'top'>('hero');
  const [autoRotate, setAutoRotate] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  // References to mutable Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const canvasMeshRef = useRef<THREE.Mesh | null>(null);
  const easelGroupRef = useRef<THREE.Group | null>(null);
  const paletteGroupRef = useRef<THREE.Group | null>(null);
  const topClampRef = useRef<THREE.Group | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.HemisphereLight | null>(null);
  const woodMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  // Interaction dragging state
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const orbitAngleRef = useRef({ theta: 0.5, phi: 0.35, radius: 4.8 });
  const explodedTargetRef = useRef(0);
  const autoRotateRef = useRef(true);

  explodedTargetRef.current = exploded;
  autoRotateRef.current = autoRotate;

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect Software WebGL guard
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x191817);
    scene.fog = new THREE.FogExp2(0x191817, 0.05);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.8, 2.2, 3.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Studio Environment Reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xfff3e3, 2.2);
    keyLight.position.set(4, 6, 3);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.HemisphereLight(0xe8edf5, 0x221a15, 1.2);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    const rimLight = new THREE.DirectionalLight(0xa5c4e8, 1.4);
    rimLight.position.set(-4, 4, -4);
    scene.add(rimLight);

    // 5. Studio Ground Contact Shadow
    const floorGeo = new THREE.PlaneGeometry(12, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x242220,
      roughness: 0.85,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = !isSoftwareGl;
    scene.add(floor);

    // Radial shadow gradient decal under easel
    const canvasShadow = document.createElement('canvas');
    canvasShadow.width = 128;
    canvasShadow.height = 128;
    const ctxShadow = canvasShadow.getContext('2d')!;
    const grad = ctxShadow.createRadialGradient(64, 64, 5, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0,0,0,0.7)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctxShadow.fillStyle = grad;
    ctxShadow.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(canvasShadow);
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 3.2),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, 0.01, 0);
    scene.add(contactShadow);

    // 6. BUILD PROCEDURAL 3-12 PART PROCEDURAL EASEL, CANVAS, PALETTE
    const rootStudioGroup = new THREE.Group();
    scene.add(rootStudioGroup);

    // Materials
    const woodMaterials: THREE.MeshStandardMaterial[] = [];
    const createWoodMat = (color: number, roughness = 0.6) => {
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness: 0.08,
      });
      woodMaterials.push(mat);
      return mat;
    };
    woodMaterialsRef.current = woodMaterials;

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.22,
      metalness: 0.9,
    });

    const primaryWood = createWoodMat(0x8b5a2b, 0.55); // Teak
    const accentWood = createWoodMat(0x6e431f, 0.7);

    // A-Frame Easel Group
    const easelGroup = new THREE.Group();
    rootStudioGroup.add(easelGroup);
    easelGroupRef.current = easelGroup;

    // Part 1: Central vertical mast
    const mastGeo = new THREE.BoxGeometry(0.08, 2.8, 0.08);
    const mast = new THREE.Mesh(mastGeo, primaryWood);
    mast.position.set(0, 1.4, 0);
    mast.castShadow = !isSoftwareGl;
    mast.receiveShadow = !isSoftwareGl;
    easelGroup.add(mast);

    // Part 2 & 3: Left and Right Front Legs
    const frontLegGeo = new THREE.BoxGeometry(0.07, 2.6, 0.07);
    const leftLeg = new THREE.Mesh(frontLegGeo, primaryWood);
    leftLeg.position.set(-0.55, 1.25, 0.2);
    leftLeg.rotation.z = -0.18;
    leftLeg.castShadow = !isSoftwareGl;
    easelGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(frontLegGeo, primaryWood);
    rightLeg.position.set(0.55, 1.25, 0.2);
    rightLeg.rotation.z = 0.18;
    rightLeg.castShadow = !isSoftwareGl;
    easelGroup.add(rightLeg);

    // Part 4: Back Support Leg
    const backLegGeo = new THREE.BoxGeometry(0.07, 2.7, 0.07);
    const backLeg = new THREE.Mesh(backLegGeo, accentWood);
    backLeg.position.set(0, 1.28, -0.65);
    backLeg.rotation.x = -0.32;
    backLeg.castShadow = !isSoftwareGl;
    easelGroup.add(backLeg);

    // Part 5: Crossbar Stabilizers
    const crossbarGeo = new THREE.BoxGeometry(1.2, 0.06, 0.06);
    const crossbar = new THREE.Mesh(crossbarGeo, accentWood);
    crossbar.position.set(0, 0.6, 0.2);
    crossbar.castShadow = !isSoftwareGl;
    easelGroup.add(crossbar);

    // Part 6: Lower Canvas Shelf (adjustable cradle)
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(0, 1.15, 0.18);
    const shelfGeo = new THREE.BoxGeometry(1.4, 0.08, 0.22);
    const shelf = new THREE.Mesh(shelfGeo, primaryWood);
    shelf.castShadow = !isSoftwareGl;
    shelfGroup.add(shelf);

    // Shelf lip
    const shelfLipGeo = new THREE.BoxGeometry(1.4, 0.04, 0.03);
    const shelfLip = new THREE.Mesh(shelfLipGeo, accentWood);
    shelfLip.position.set(0, 0.05, 0.1);
    shelfGroup.add(shelfLip);

    // Brass adjustment knob underneath shelf
    const knobGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 16);
    const knob = new THREE.Mesh(knobGeo, brassMat);
    knob.position.set(0, -0.06, 0);
    shelfGroup.add(knob);
    easelGroup.add(shelfGroup);

    // Part 7: Top Clamp (moves with exploded view)
    const topClampGroup = new THREE.Group();
    topClampGroup.position.set(0, 2.2, 0.1);
    const clampBlockGeo = new THREE.BoxGeometry(0.18, 0.1, 0.16);
    const clampBlock = new THREE.Mesh(clampBlockGeo, primaryWood);
    clampBlock.castShadow = !isSoftwareGl;
    topClampGroup.add(clampBlock);

    const clampKnob = new THREE.Mesh(knobGeo, brassMat);
    clampKnob.rotation.x = Math.PI / 2;
    clampKnob.position.set(0, 0, 0.09);
    topClampGroup.add(clampKnob);
    easelGroup.add(topClampGroup);
    topClampRef.current = topClampGroup;

    // Part 8: Stretched Canvas Board with Artwork Texture
    const canvasGroup = new THREE.Group();
    canvasGroup.position.set(0, 1.65, 0.2);
    canvasGroup.rotation.x = -0.08; // slightly leaned against easel
    rootStudioGroup.add(canvasGroup);

    // Stretched linen body
    const canvasGeo = new THREE.BoxGeometry(1.15, 0.9, 0.04);

    // Create initial procedural canvas texture with linen weave
    const defaultCanvasTexture = createProceduralCanvasTexture(
      activeProduct?.title || 'Studio Art',
      activeProduct?.imageUrl
    );

    const canvasMat = new THREE.MeshStandardMaterial({
      map: defaultCanvasTexture,
      roughness: 0.65,
      metalness: 0.05,
    });
    const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
    canvasMesh.castShadow = !isSoftwareGl;
    canvasMesh.receiveShadow = !isSoftwareGl;
    canvasGroup.add(canvasMesh);
    canvasMeshRef.current = canvasMesh;

    // Canvas wooden stretcher bars on back
    const barMat = accentWood;
    const stretcherH = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.02), barMat);
    stretcherH.position.set(0, 0, -0.025);
    canvasGroup.add(stretcherH);

    // Part 9: Artist Wooden Palette with 3D Paint Dollops & Brush
    const paletteGroup = new THREE.Group();
    paletteGroup.position.set(0.7, 0.88, 0.55);
    paletteGroup.rotation.x = 0.2;
    paletteGroup.rotation.y = -0.3;
    rootStudioGroup.add(paletteGroup);
    paletteGroupRef.current = paletteGroup;

    // Kidney palette base
    const paletteShape = new THREE.Shape();
    paletteShape.moveTo(-0.35, -0.2);
    paletteShape.bezierCurveTo(-0.45, 0.0, -0.3, 0.3, 0.0, 0.32);
    paletteShape.bezierCurveTo(0.3, 0.32, 0.42, 0.15, 0.4, -0.05);
    paletteShape.bezierCurveTo(0.38, -0.22, 0.15, -0.28, -0.05, -0.24);
    paletteShape.bezierCurveTo(-0.15, -0.22, -0.25, -0.3, -0.35, -0.2);

    const paletteExtrudeGeo = new THREE.ExtrudeGeometry(paletteShape, {
      depth: 0.018,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.008,
      bevelThickness: 0.006,
    });
    const paletteMesh = new THREE.Mesh(paletteExtrudeGeo, primaryWood);
    paletteMesh.castShadow = !isSoftwareGl;
    paletteGroup.add(paletteMesh);

    // Thumb hole
    const thumbHole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.04, 16),
      new THREE.MeshBasicMaterial({ color: 0x191817 })
    );
    thumbHole.position.set(-0.25, -0.05, 0.01);
    paletteGroup.add(thumbHole);

    // Wet 3D Paint Dollops (Cadmium Yellow, Crimson, Ultramarine, Sap Green, Burnt Umber, White)
    const paintColors = [0xf4d03f, 0xc0392b, 0x2980b9, 0x27ae60, 0x784212, 0xfafafa];
    const dollopGeo = new THREE.SphereGeometry(0.03, 16, 12);
    dollopGeo.scale(1, 0.4, 1);

    paintColors.forEach((color, i) => {
      const angle = (i / paintColors.length) * Math.PI * 1.1 - 0.2;
      const radius = 0.26;
      const px = Math.cos(angle) * radius * 0.8;
      const py = Math.sin(angle) * radius * 0.9;

      const dollopMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.15, // glossy wet oil paint
        metalness: 0.1,
      });
      const dollop = new THREE.Mesh(dollopGeo, dollopMat);
      dollop.position.set(px, py, 0.025);
      dollop.castShadow = !isSoftwareGl;
      paletteGroup.add(dollop);
    });

    // Part 10: Studio Artist Paintbrush
    const brushGroup = new THREE.Group();
    brushGroup.position.set(0.05, -0.08, 0.035);
    brushGroup.rotation.z = 0.6;
    paletteGroup.add(brushGroup);

    // Handle
    const handleGeo = new THREE.CylinderGeometry(0.008, 0.004, 0.38, 12);
    const handleMat = createWoodMat(0x3e2723, 0.4);
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.castShadow = !isSoftwareGl;
    brushGroup.add(handle);

    // Brass Ferrule
    const ferruleGeo = new THREE.CylinderGeometry(0.009, 0.008, 0.06, 16);
    const ferrule = new THREE.Mesh(ferruleGeo, brassMat);
    ferrule.position.y = 0.2;
    brushGroup.add(ferrule);

    // Bristles tip (with slight crimson paint residue on tip)
    const bristleGeo = new THREE.ConeGeometry(0.009, 0.08, 16);
    const bristleMat = new THREE.MeshStandardMaterial({
      color: 0x9e2a2b, // tinted with paint
      roughness: 0.8,
    });
    const bristle = new THREE.Mesh(bristleGeo, bristleMat);
    bristle.position.y = 0.26;
    brushGroup.add(bristle);

    // 7. Render Loop with Smooth Damping and Software WebGL pacing
    let frameId = 0;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 60);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Auto-rotation when not interacting
      if (autoRotateRef.current && !isDraggingRef.current) {
        orbitAngleRef.current.theta += 0.25 * dt;
      }

      // Smooth camera interpolation based on spherical coordinates
      const { theta, phi, radius } = orbitAngleRef.current;
      _targetCamPos.set(
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(phi) + 1.2,
        radius * Math.cos(theta) * Math.cos(phi)
      );

      // Frame-rate independent exponential damping: 1 - Math.exp(-k * dt)
      const dampFactor = 1 - Math.exp(-6 * dt);
      camera.position.lerp(_targetCamPos, dampFactor);
      _targetLookAt.set(0, 1.45, 0);
      camera.lookAt(_targetLookAt);

      // Smooth Exploded view kinematics
      const curExploded = explodedTargetRef.current;
      if (canvasMeshRef.current) {
        // Canvas moves forward and hovers
        canvasMeshRef.current.position.z = THREE.MathUtils.damp(
          canvasMeshRef.current.position.z,
          curExploded * 0.45,
          6,
          dt
        );
      }
      if (topClampRef.current) {
        // Top clamp raises upward
        topClampRef.current.position.y = THREE.MathUtils.damp(
          topClampRef.current.position.y,
          2.2 + curExploded * 0.35,
          6,
          dt
        );
      }
      if (paletteGroupRef.current) {
        // Palette floats forward and slightly tilts
        paletteGroupRef.current.position.z = THREE.MathUtils.damp(
          paletteGroupRef.current.position.z,
          0.55 + curExploded * 0.4,
          6,
          dt
        );
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Pointer orbit control handlers on canvas
    const dom = renderer.domElement;
    const handlePointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevPointerRef.current.x;
      const dy = e.clientY - prevPointerRef.current.y;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };

      orbitAngleRef.current.theta -= dx * 0.008;
      orbitAngleRef.current.phi = Math.max(
        0.05,
        Math.min(1.4, orbitAngleRef.current.phi + dy * 0.008)
      );
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitAngleRef.current.radius = Math.max(
        2.2,
        Math.min(7.5, orbitAngleRef.current.radius + e.deltaY * 0.003)
      );
    };

    dom.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('wheel', handleWheel);

      renderer.dispose();
      if (dom.parentElement) {
        dom.parentElement.removeChild(dom);
      }
    };
  }, []);

  // Update canvas texture whenever active product changes
  useEffect(() => {
    if (!canvasMeshRef.current || !activeProduct) return;
    const texture = createProceduralCanvasTexture(activeProduct.title, activeProduct.imageUrl);
    const mat = canvasMeshRef.current.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat.map = texture;
      mat.needsUpdate = true;
    }
  }, [activeProduct]);

  // Update wood finish
  useEffect(() => {
    const finishColors: Record<string, number> = {
      teak: 0x8b5a2b,
      walnut: 0x4a2e18,
      pine: 0xd4b483,
    };
    const c = finishColors[finish] || 0x8b5a2b;
    woodMaterialsRef.current.forEach(mat => {
      mat.color.setHex(c);
      mat.needsUpdate = true;
    });
  }, [finish]);

  // Update lighting mood
  useEffect(() => {
    if (!keyLightRef.current || !fillLightRef.current) return;
    if (lightingMood === 'studio') {
      keyLightRef.current.color.setHex(0xfff3e3);
      keyLightRef.current.intensity = 2.2;
      fillLightRef.current.color.setHex(0xe8edf5);
      fillLightRef.current.groundColor.setHex(0x221a15);
      fillLightRef.current.intensity = 1.2;
    } else if (lightingMood === 'golden') {
      keyLightRef.current.color.setHex(0xffaa5e);
      keyLightRef.current.intensity = 2.8;
      fillLightRef.current.color.setHex(0xffd8b3);
      fillLightRef.current.groundColor.setHex(0x3a1d0f);
      fillLightRef.current.intensity = 0.9;
    } else {
      // gallery spotlight
      keyLightRef.current.color.setHex(0xffffff);
      keyLightRef.current.intensity = 3.4;
      fillLightRef.current.color.setHex(0x778899);
      fillLightRef.current.groundColor.setHex(0x111111);
      fillLightRef.current.intensity = 0.6;
    }
  }, [lightingMood]);

  // Update Camera preset
  useEffect(() => {
    if (cameraView === 'hero') {
      orbitAngleRef.current = { theta: 0.5, phi: 0.35, radius: 4.8 };
    } else if (cameraView === 'canvas') {
      orbitAngleRef.current = { theta: 0.05, phi: 0.18, radius: 2.8 };
    } else if (cameraView === 'palette') {
      orbitAngleRef.current = { theta: 0.95, phi: 0.55, radius: 2.6 };
    } else if (cameraView === 'top') {
      orbitAngleRef.current = { theta: 0.1, phi: 1.25, radius: 4.5 };
    }
  }, [cameraView]);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-[#191817] overflow-hidden select-none">
      {/* Three.js Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Top Header Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-3 pointer-events-auto">
        <div className="bg-[#24211e] border border-stone-700/80 rounded-xl px-4 py-2.5 shadow-lg flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#C85A32] text-white flex items-center justify-center">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-sm text-stone-100">
                3D Artist Studio & Easel
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                Three.js PBR
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Drag to orbit • Scroll to zoom • Inspect material finish in 360°
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3.5 py-2.5 bg-[#24211e] hover:bg-stone-800 text-stone-300 text-xs font-semibold rounded-xl border border-stone-700/80 shadow-md transition-colors"
          >
            Back to Marketplace
          </button>
        )}
      </div>

      {/* Floating Active Product Card (Top Right) */}
      {activeProduct && (
        <div className="absolute top-4 right-4 z-20 hidden sm:block max-w-xs bg-[#24211e] border border-stone-700/80 rounded-xl p-3 shadow-lg pointer-events-auto">
          <div className="flex items-center space-x-3">
            <img
              src={activeProduct.imageUrl}
              alt={activeProduct.title}
              className="w-12 h-12 rounded-lg object-cover border border-stone-600 shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-[#C85A32] uppercase block truncate">
                {activeProduct.category}
              </span>
              <h4 className="font-serif font-bold text-xs text-stone-100 truncate">
                {activeProduct.title}
              </h4>
              <p className="text-[11px] text-stone-400">
                Condition: {activeProduct.condition} • ₹{activeProduct.price}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* COLLAPSIBLE UNIFIED BOTTOM CONTROL DOCK */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 w-full max-w-[940px] px-4 pointer-events-auto">
        <div className="flex justify-center mb-1.5">
          <button
            onClick={() => setDockCollapsed(!dockCollapsed)}
            className="flex items-center space-x-1.5 px-3 py-1 bg-[#24211e] text-stone-300 hover:text-white rounded-t-lg border border-b-0 border-stone-700 text-xs font-medium shadow-md transition-colors"
          >
            {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{dockCollapsed ? 'Expand Studio Controls' : 'Hide Controls (Zen Mode)'}</span>
          </button>
        </div>

        {!dockCollapsed && (
          <div className="bg-[#24211e] border border-stone-700/90 rounded-2xl p-4 shadow-2xl text-stone-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* Column 1: Choose Product to Project on Canvas */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Mounted Artwork / Material
                </label>
                <select
                  value={activeProduct?.id || ''}
                  onChange={e => {
                    const found = products.find(p => p.id === e.target.value);
                    if (found) {
                      setActiveProduct(found);
                      onSelectProduct?.(found.id);
                    }
                  }}
                  className="w-full text-xs bg-[#191817] border border-stone-600 rounded-lg px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-[#C85A32]"
                >
                  {products.slice(0, 25).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Column 2: Studio Wood Finish */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Easel Timber Finish
                </label>
                <div className="flex space-x-1.5">
                  {[
                    { id: 'teak', label: 'Teak', bg: 'bg-[#8B5A2B]' },
                    { id: 'walnut', label: 'Walnut', bg: 'bg-[#4A2E18]' },
                    { id: 'pine', label: 'Blonde Pine', bg: 'bg-[#D4B483]' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFinish(f.id as any)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1.5 border transition-all ${
                        finish === f.id
                          ? 'border-[#C85A32] bg-stone-800 text-white shadow-xs'
                          : 'border-stone-700 bg-[#191817] text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${f.bg}`} />
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 3: Studio Lighting Preset */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Studio Atmosphere
                </label>
                <div className="flex space-x-1.5">
                  {[
                    { id: 'studio', label: 'Daylight' },
                    { id: 'golden', label: 'Sunset' },
                    { id: 'gallery', label: 'Spotlight' },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setLightingMood(m.id as any)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                        lightingMood === m.id
                          ? 'border-[#C85A32] bg-stone-800 text-white shadow-xs'
                          : 'border-stone-700 bg-[#191817] text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 4: Exploded View & Camera Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 flex items-center space-x-1">
                    <Layers className="w-3 h-3 text-[#C85A32]" />
                    <span>Exploded View</span>
                  </label>
                  <span className="text-[10px] text-stone-400">{Math.round(exploded * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={exploded}
                  onChange={e => setExploded(parseFloat(e.target.value))}
                  className="w-full accent-[#C85A32] cursor-pointer"
                />
              </div>
            </div>

            {/* Sub-row: Camera angle buttons & Auto-rotate toggle */}
            <div className="mt-3 pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-stone-500 font-semibold uppercase">Camera:</span>
                {[
                  { id: 'hero', label: 'Studio Hero' },
                  { id: 'canvas', label: 'Canvas Focus' },
                  { id: 'palette', label: 'Palette & Brush' },
                  { id: 'top', label: 'Top View' },
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => setCameraView(v.id as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                      cameraView === v.id
                        ? 'bg-amber-600/30 border-amber-500/60 text-amber-200 font-bold'
                        : 'bg-[#191817] border-stone-700 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`px-3 py-1 rounded-md text-[11px] font-medium border flex items-center space-x-1.5 transition-colors ${
                    autoRotate
                      ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                      : 'bg-[#191817] border-stone-700 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{autoRotate ? 'Auto-Rotate ON' : 'Auto-Rotate OFF'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Procedural Canvas Texture Generation with High Anisotropy
function createProceduralCanvasTexture(title: string, imageUrl?: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Background primed linen canvas color
  ctx.fillStyle = '#E8E2D7';
  ctx.fillRect(0, 0, 512, 512);

  // Procedural woven linen canvas grain
  ctx.fillStyle = 'rgba(0,0,0,0.035)';
  for (let x = 0; x < 512; x += 4) {
    ctx.fillRect(x, 0, 2, 512);
  }
  for (let y = 0; y < 512; y += 4) {
    ctx.fillRect(0, y, 512, 2);
  }

  // Draw simulated oil or watercolor study
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#A34828');
  grad.addColorStop(0.3, '#E09F3E');
  grad.addColorStop(0.7, '#335C67');
  grad.addColorStop(1, '#1D2D44');
  ctx.fillStyle = grad;
  ctx.fillRect(32, 32, 448, 448);

  // If image URL is provided, load into canvas texture asynchronously
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  if (imageUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 32, 32, 448, 448);
      // Subtle linen overlay on top of artwork
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let x = 32; x < 480; x += 6) {
        ctx.fillRect(x, 32, 2, 448);
      }
      texture.needsUpdate = true;
    };
    img.src = imageUrl;
  }

  return texture;
}
