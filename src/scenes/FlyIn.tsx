import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FLY_IN_CLOUD, FLY_IN_POINTS, OVERVIEW } from '@/data/world';
import { introAt } from '@/debug/isDebug';
import { useWorld } from '@/store/useWorld';
import { setVeilOpacity } from './introEffects';

/** Full dive length in seconds. */
const DURATION = 5;
/** Returning visitors start the curve just above the cloud band and take this long. */
const RETURN_START = 0.42;
const RETURN_DURATION = 2.2;

const BASE_FOV = 45;
/** Extra field of view at the fastest point of the dive, for a sense of speed. */
const FOV_KICK = 14;

const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const smoothstep = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

const overviewTarget = new THREE.Vector3(...OVERVIEW.target);
const cloudCenter = new THREE.Vector3(...FLY_IN_CLOUD.position);
const lookTarget = new THREE.Vector3();
const ahead = new THREE.Vector3();

/**
 * Owns the camera until the world is ready: holds the welcome view, flies the dive,
 * then hands over to CameraRig. The curve ends exactly at the overview pose, so the
 * handoff is invisible.
 */
export function FlyIn() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const phase = useWorld((s) => s.phase);

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(FLY_IN_POINTS.map((p) => new THREE.Vector3(...p))),
    [],
  );

  const progress = useRef(0);
  const from = useRef(0);
  const duration = useRef(DURATION);
  const introSeen = useRef(false);

  /** Puts the camera at curve position k (0..1), looking along the path, then at the islands. */
  const placeAt = (k: number, sway = 0) => {
    camera.position.copy(curve.getPointAt(k));
    ahead.copy(curve.getPointAt(Math.min(k + 0.02, 1)));
    lookTarget.lerpVectors(ahead, overviewTarget, smoothstep(0.6, 1, k));
    lookTarget.x += sway;
    camera.lookAt(lookTarget);
  };

  const setFov = (fov: number) => {
    if (Math.abs(camera.fov - fov) < 0.01) return;
    camera.fov = fov;
    camera.updateProjectionMatrix();
  };

  /** Inside the cloud band: whiten the screen. Mid-dive: widen the view for a sense of speed. */
  const applyCloudEffects = (t: number) => {
    const distance = camera.position.distanceTo(cloudCenter);
    const inCloud = 1 - smoothstep(FLY_IN_CLOUD.radius * 0.35, FLY_IN_CLOUD.radius, distance);
    setVeilOpacity(inCloud * 0.85);
    setFov(BASE_FOV + FOV_KICK * Math.sin(Math.PI * t) * (1 - from.current));
  };

  // Layout effect: runs before CameraRig's mount effect reads the camera at handoff.
  useLayoutEffect(() => {
    if (phase === 'loading' || phase === 'welcome') {
      introSeen.current = true;
      placeAt(0);
    } else if (phase === 'flyIn') {
      introSeen.current = true;
      const returning = useWorld.getState().visited.length > 0;
      from.current = returning ? RETURN_START : 0;
      duration.current = returning ? RETURN_DURATION : DURATION;
      progress.current = 0;
    } else if (phase === 'world' && introSeen.current) {
      // Finished or skipped: land exactly on the overview pose.
      placeAt(1);
      setFov(BASE_FOV);
      setVeilOpacity(0);
    }
    // placeAt and setFov only touch the camera; phase is the only trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useFrame((state, delta) => {
    const current = useWorld.getState().phase;

    if (introAt !== undefined) {
      // Debug: hold the dive at a fixed point, with the same veil and field of view.
      placeAt(introAt);
      applyCloudEffects(introAt);
      return;
    }

    if (current === 'loading' || current === 'welcome') {
      // A slow, gentle look around while the visitor reads the welcome screen.
      placeAt(0, Math.sin(state.clock.elapsedTime * 0.25) * 6);
      return;
    }
    if (current !== 'flyIn') return;

    progress.current = Math.min(progress.current + delta / duration.current, 1);
    const k = from.current + (1 - from.current) * easeInOutCubic(progress.current);
    placeAt(k);

    applyCloudEffects(progress.current);

    if (progress.current >= 1) useWorld.getState().setPhase('world');
  });

  return null;
}
