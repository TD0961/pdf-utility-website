'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createPhysicalPaperTexture, createPhysicalPaperNormalTexture } from './paper-material';

export type UniverseStoryPhase = 'hero' | 'organize' | 'optimize' | 'convert' | 'protect';

interface DocumentUniverseCanvasProps {
  phase?: UniverseStoryPhase;
  interactive?: boolean;
  className?: string;
  onReady?: () => void;
}

function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const testCanvas = document.createElement('canvas');
    return Boolean(testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export function DocumentUniverseCanvas({
  phase = 'hero',
  interactive = true,
  className = '',
  onReady,
}: DocumentUniverseCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL] = useState(() => checkWebGLSupport());

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasWebGL || typeof window === 'undefined') return;

    // Reduced motion media query handling
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let isReducedMotion = motionMediaQuery.matches;

    // Theme detection
    const getIsDark = () => document.documentElement.classList.contains('dark');
    let isDark = getIsDark();

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(isDark ? 0x0b0e14 : 0xfcfbf9, 0.025);

    const aspect = container.clientWidth / Math.max(container.clientHeight, 1);
    const camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 50);
    camera.position.set(0, 0.15, 5.8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 0.96 : 1.04;

    container.appendChild(renderer.domElement);

    // 2. Lighting Setup (Architectural Studio Lighting with warm cotton paper bounce)
    const ambientLight = new THREE.HemisphereLight(
      isDark ? 0x242a36 : 0xfffefb,
      isDark ? 0x0c0f16 : 0xf2eee8,
      isDark ? 0.65 : 0.85
    );
    scene.add(ambientLight);

    // Warm Directional Key Light (illuminates paper face at an editorial angle)
    const keyLight = new THREE.DirectionalLight(isDark ? 0xfffbf2 : 0xfffcf5, isDark ? 1.2 : 1.35);
    keyLight.position.set(2.6, 5.4, 4.4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    // Architectural Soft Fill Light (softens shadow crevices)
    const fillLight = new THREE.DirectionalLight(isDark ? 0x2c3342 : 0xf6f3ec, isDark ? 0.4 : 0.5);
    fillLight.position.set(-3.2, 2.2, 2.0);
    scene.add(fillLight);

    // Edge Rim Light (Highlights tactile paper sheet perimeter)
    const rimLight = new THREE.DirectionalLight(0xffffff, isDark ? 0.65 : 0.55);
    rimLight.position.set(0.8, -3.2, -3.5);
    scene.add(rimLight);

    // 3. Materials & Textures
    const paperTexture = createPhysicalPaperTexture();
    const paperNormal = createPhysicalPaperNormalTexture();

    const paperMaterial = new THREE.MeshStandardMaterial({
      map: paperTexture,
      normalMap: paperNormal,
      normalScale: new THREE.Vector2(0.025, 0.025),
      roughness: 0.82,
      metalness: 0.01,
      color: isDark ? 0xede8df : 0xfffdfa,
      side: THREE.DoubleSide,
    });

    // Companion / Base paper tone for optical depth
    const stackPaperMaterial = new THREE.MeshStandardMaterial({
      map: paperTexture,
      normalMap: paperNormal,
      normalScale: new THREE.Vector2(0.02, 0.02),
      roughness: 0.88,
      metalness: 0.01,
      color: isDark ? 0xded8ce : 0xf7f4ec,
      side: THREE.DoubleSide,
    });

    // 4. Geometry & Meshes

    // Main Hero Sheet (DIN A4 proportion with physical sheet caliper: 2.15 x 3.04 x 0.007)
    const heroSegmentsX = 36;
    const heroSegmentsY = 48;
    const heroGeom = new THREE.BoxGeometry(2.15, 3.04, 0.007, heroSegmentsX, heroSegmentsY, 1);

    // Apply natural physical diagonal paper curl (lifts top-right corner, subtle body bow)
    const heroPos = heroGeom.attributes.position;
    for (let i = 0; i < heroPos.count; i++) {
      const x = heroPos.getX(i);
      const y = heroPos.getY(i);
      const z = heroPos.getZ(i);
      const nx = x / 1.075;
      const ny = y / 1.52;
      const diag = Math.max(0, (nx + ny) * 0.5);
      const cornerLift = diag * diag * 0.085;
      const bodyBow = -0.028 * Math.cos(nx * Math.PI * 0.5);
      heroPos.setZ(i, z + bodyBow + cornerLift);
    }
    heroGeom.computeVertexNormals();

    const heroMesh = new THREE.Mesh(heroGeom, paperMaterial);
    heroMesh.castShadow = true;
    heroMesh.receiveShadow = true;
    scene.add(heroMesh);

    // Layered Companion Folio (Fanned underlayer revealing secondary page)
    const heroGeom2 = new THREE.BoxGeometry(2.15, 3.04, 0.007, 28, 36, 1);
    const heroPos2 = heroGeom2.attributes.position;
    for (let i = 0; i < heroPos2.count; i++) {
      const x = heroPos2.getX(i);
      const y = heroPos2.getY(i);
      const z = heroPos2.getZ(i);
      const nx = x / 1.075;
      const ny = y / 1.52;
      const diag = Math.max(0, (nx + ny) * 0.5);
      const cornerLift = diag * diag * 0.065;
      const bodyBow = -0.022 * Math.cos(nx * Math.PI * 0.5);
      heroPos2.setZ(i, z + bodyBow + cornerLift);
    }
    heroGeom2.computeVertexNormals();

    const heroMesh2 = new THREE.Mesh(heroGeom2, stackPaperMaterial);
    heroMesh2.castShadow = true;
    heroMesh2.receiveShadow = true;
    scene.add(heroMesh2);

    // Soft Physical Point Light (Catches cotton fibers and paper bevel specularly)
    const paperSpecLight = new THREE.PointLight(0xfffaf0, isDark ? 0.9 : 1.05, 10);
    paperSpecLight.position.set(1.6, 2.6, 3.2);
    scene.add(paperSpecLight);

    // Archival Dossier Plinth (Grounded 3-sheet document foundation at desk elevation)
    const plinthGroup = new THREE.Group();
    const plinthGeom = new THREE.BoxGeometry(1.9, 2.7, 0.006, 16, 20, 1);

    for (let i = 0; i < 3; i++) {
      const sheet = new THREE.Mesh(plinthGeom, stackPaperMaterial);
      sheet.position.set(i * 0.025, -i * 0.012, -i * 0.035);
      sheet.rotation.set(-1.18 + (i % 2) * 0.02, 0.06 - i * 0.015, -0.16 + (i % 3) * 0.015);
      sheet.castShadow = true;
      sheet.receiveShadow = true;
      plinthGroup.add(sheet);
    }
    scene.add(plinthGroup);

    // Soft Shadow Contact Ground Plane
    const shadowPlaneGeom = new THREE.PlaneGeometry(14, 14);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: isDark ? 0.20 : 0.07 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeom, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.6;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Helper to calculate target resting poses based on container width
    const getRestingPose = (w: number) => {
      if (w < 640) {
        // Mobile Viewport (320px - 430px screens)
        // Perfectly centered, fully unclipped A4 document sheet with companion folio
        return {
          heroX: 0.0,
          heroY: 0.04,
          heroZ: 0.05,
          heroScale: 0.68,
          heroRotX: -0.06,
          heroRotY: -0.20,
          heroRotZ: 0.03,
          hero2Visible: true,
          hero2OffsetX: 0.16,
          hero2OffsetY: -0.10,
          hero2OffsetZ: -0.12,
          plinthVisible: false,
          plinthX: 0.0,
          plinthY: -1.2,
          plinthZ: -0.5,
          cameraZ: 5.4,
          cameraY: 0.0,
        };
      } else if (w < 1024) {
        // Tablet / Small Laptop Viewport
        return {
          heroX: 0.0,
          heroY: 0.04,
          heroZ: 0.08,
          heroScale: 0.74,
          heroRotX: -0.06,
          heroRotY: -0.22,
          heroRotZ: 0.03,
          hero2Visible: true,
          hero2OffsetX: 0.20,
          hero2OffsetY: -0.12,
          hero2OffsetZ: -0.14,
          plinthVisible: false,
          plinthX: 0.0,
          plinthY: -1.25,
          plinthZ: -0.5,
          cameraZ: 5.4,
          cameraY: 0.0,
        };
      } else {
        // Desktop Viewport (1024px+ screens)
        // Full architectural composition with fanned companions and grounded plinth
        return {
          heroX: -0.04,
          heroY: 0.06,
          heroZ: 0.12,
          heroScale: 0.82,
          heroRotX: -0.06,
          heroRotY: -0.24,
          heroRotZ: 0.03,
          hero2Visible: true,
          hero2OffsetX: 0.22,
          hero2OffsetY: -0.12,
          hero2OffsetZ: -0.15,
          plinthVisible: true,
          plinthX: 0.12,
          plinthY: -1.35,
          plinthZ: -0.55,
          cameraZ: 5.5,
          cameraY: 0.05,
        };
      }
    };

    // Apply viewport configuration to scene meshes
    const applyViewportLayout = (w: number) => {
      const pose = getRestingPose(w);
      camera.position.z = pose.cameraZ;
      camera.position.y = pose.cameraY;

      heroMesh.position.set(pose.heroX, pose.heroY, pose.heroZ);
      heroMesh.rotation.set(pose.heroRotX, pose.heroRotY, pose.heroRotZ);
      heroMesh.scale.set(pose.heroScale, pose.heroScale, pose.heroScale);

      heroMesh2.visible = pose.hero2Visible;
      if (pose.hero2Visible) {
        heroMesh2.position.set(
          pose.heroX + pose.hero2OffsetX,
          pose.heroY + pose.hero2OffsetY,
          pose.heroZ + pose.hero2OffsetZ
        );
        heroMesh2.rotation.set(pose.heroRotX - 0.02, pose.heroRotY - 0.08, pose.heroRotZ - 0.10);
        heroMesh2.scale.set(pose.heroScale, pose.heroScale, pose.heroScale);
      }

      plinthGroup.visible = pose.plinthVisible;
      if (pose.plinthVisible) {
        plinthGroup.position.set(pose.plinthX, pose.plinthY, pose.plinthZ);
      }
    };

    // Render a single stable static frame (for reduced motion or resize)
    const renderStaticFrame = () => {
      if (!container) return;
      applyViewportLayout(container.clientWidth);
      renderer.render(scene, camera);
    };

    // Theme mutation observer to update lighting seamlessly
    const themeObserver = new MutationObserver(() => {
      const currentDark = getIsDark();
      if (currentDark !== isDark) {
        isDark = currentDark;
        if (scene.fog) {
          (scene.fog as THREE.FogExp2).color.setHex(isDark ? 0x0b0e14 : 0xfcfbf9);
        }
        renderer.toneMappingExposure = isDark ? 0.96 : 1.04;
        ambientLight.color.setHex(isDark ? 0x242a36 : 0xfffefb);
        ambientLight.groundColor.setHex(isDark ? 0x0c0f16 : 0xf2eee8);
        ambientLight.intensity = isDark ? 0.65 : 0.85;
        keyLight.color.setHex(isDark ? 0xfffbf2 : 0xfffcf5);
        keyLight.intensity = isDark ? 1.2 : 1.35;
        fillLight.color.setHex(isDark ? 0x2c3342 : 0xf6f3ec);
        fillLight.intensity = isDark ? 0.4 : 0.5;
        rimLight.intensity = isDark ? 0.65 : 0.55;
        paperSpecLight.intensity = isDark ? 0.9 : 1.05;
        paperMaterial.color.setHex(isDark ? 0xede8df : 0xfffdfa);
        stackPaperMaterial.color.setHex(isDark ? 0xded8ce : 0xf7f4ec);
        shadowPlaneMat.opacity = isDark ? 0.20 : 0.07;

        if (isReducedMotion) {
          renderStaticFrame();
        }
      }
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // 5. Interaction Tracking & Damped Animation Loop
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      if (!interactive || !container) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.22;
      targetY = y * 0.16;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!interactive || !container || !e.touches || e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((touch.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = Math.max(-0.25, Math.min(0.25, x * 0.22));
      targetY = Math.max(-0.2, Math.min(0.2, y * 0.16));
    };

    const handleTouchEnd = () => {
      targetX = 0;
      targetY = 0;
    };

    if (interactive && typeof window !== 'undefined') {
      window.addEventListener('mousemove', handlePointerMove, { passive: true });
      if (container) {
        container.addEventListener('touchmove', handleTouchMove, { passive: true });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });
      }
    }

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      applyViewportLayout(w);

      if (isReducedMotion) {
        renderStaticFrame();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Animation Loop with high-precision time tracking and calm motion
    let animFrameId: number | null = null;
    let startTime = performance.now();
    let isIntersecting = true;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Smooth camera & pointer damping
      mouseX += (targetX - mouseX) * 0.035;
      mouseY += (targetY - mouseY) * 0.035;

      const w = container ? container.clientWidth : window.innerWidth;
      const pose = getRestingPose(w);

      // Natural, restrained organic breathing (slow 14-second architectural cycle)
      const breathingOffset = Math.sin(elapsedTime * 0.45) * 0.012;
      const gentleTilt = Math.cos(elapsedTime * 0.35) * 0.007;

      // Apply mouse tilt + breathing without cumulative drift
      heroMesh.position.y = pose.heroY + breathingOffset + mouseY * 0.08;
      heroMesh.position.x = pose.heroX + mouseX * 0.12;
      heroMesh.rotation.y = pose.heroRotY + mouseX * 0.07;
      heroMesh.rotation.x = pose.heroRotX - mouseY * 0.05 + gentleTilt;

      if (pose.hero2Visible) {
        const compBreath = Math.sin(elapsedTime * 0.45 - 0.4) * 0.01;
        heroMesh2.position.y = pose.heroY + pose.hero2OffsetY + compBreath + mouseY * 0.06;
        heroMesh2.position.x = pose.heroX + pose.hero2OffsetX + mouseX * 0.1;
        heroMesh2.rotation.y = pose.heroRotY - 0.08 + mouseX * 0.06;
        heroMesh2.rotation.x = pose.heroRotX - 0.02 - mouseY * 0.04 + gentleTilt * 0.8;
      }

      renderer.render(scene, camera);
    };

    const startAnimation = () => {
      if (animFrameId !== null || isReducedMotion || !isIntersecting || (typeof document !== 'undefined' && document.hidden)) return;
      startTime = performance.now();
      animFrameId = requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    };

    // Viewport Intersection Observer (Battery & CPU conservation when scrolled away)
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined' && container) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            isIntersecting = entry.isIntersecting;
            if (isIntersecting) {
              startAnimation();
            } else {
              stopAnimation();
            }
          }
        },
        { threshold: 0.05 }
      );
      observer.observe(container);
    }

    // Document Visibility Listener (Pause rendering when tab is hidden)
    const handleDocVisibility = () => {
      if (document.hidden) {
        stopAnimation();
      } else if (isIntersecting && !isReducedMotion) {
        startAnimation();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleDocVisibility);
    }

    // Motion preference change listener
    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
      if (isReducedMotion) {
        stopAnimation();
        renderStaticFrame();
      } else {
        startAnimation();
      }
    };

    motionMediaQuery.addEventListener('change', handleMotionChange);

    // Initial launch
    if (isReducedMotion) {
      renderStaticFrame();
    } else {
      startAnimation();
    }

    if (onReady) {
      onReady();
    }

    // Cleanup
    return () => {
      stopAnimation();
      if (observer) {
        observer.disconnect();
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleDocVisibility);
      }
      motionMediaQuery.removeEventListener('change', handleMotionChange);
      themeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handlePointerMove);
        if (container) {
          container.removeEventListener('touchmove', handleTouchMove);
          container.removeEventListener('touchend', handleTouchEnd);
        }
      }
      heroGeom.dispose();
      heroGeom2.dispose();
      plinthGeom.dispose();
      shadowPlaneGeom.dispose();
      paperMaterial.dispose();
      stackPaperMaterial.dispose();
      shadowPlaneMat.dispose();
      paperTexture.dispose();
      paperNormal.dispose();
      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [phase, interactive, onReady, hasWebGL]);

  if (!hasWebGL) {
    return (
      <div className={`relative flex items-center justify-center p-4 ${className}`}>
        <div className="relative w-44 sm:w-60 lg:w-68 aspect-[1/1.414] rounded-xl sm:rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-2xl p-4 sm:p-6 flex flex-col justify-between transform -rotate-3">
          <div className="space-y-2 sm:space-y-3">
            <div className="w-12 sm:w-16 h-1 bg-stone-300 dark:bg-stone-700 rounded-full" />
            <div className="w-full h-0.5 bg-stone-200/80 dark:bg-stone-800" />
            <div className="w-4/5 h-0.5 bg-stone-200/80 dark:bg-stone-800" />
            <div className="w-5/6 h-0.5 bg-stone-200/80 dark:bg-stone-800" />
          </div>
          <div className="space-y-1.5 sm:space-y-2 py-2">
            <div className="w-full h-0.5 bg-stone-100 dark:bg-stone-800/60" />
            <div className="w-11/12 h-0.5 bg-stone-100 dark:bg-stone-800/60" />
          </div>
          <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-mono text-stone-400 dark:text-stone-500 pt-2 border-t border-stone-100 dark:border-stone-800/80">
            <span>PAGE 01 / SPEC</span>
            <span>AIR-GAPPED RAM</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full pointer-events-auto ${className}`}
      aria-label="3D Paper and Document Universe Interactive Scene"
    />
  );
}
