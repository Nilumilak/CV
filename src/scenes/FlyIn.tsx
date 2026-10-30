import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FLY_IN_CLOUD, FLY_IN_POINTS, ISLANDS, OVERVIEW } from '@/data/world';
import { introAt } from '@/debug/isDebug';
import { useWorld } from '@/store/useWorld';
import { setVeilOpacity } from './introEffects';

/** Full dive length in seconds, the drift back included. */
const DURATION = 6.5;
/**
 * Returning visitors take the same dive from the welcome view, only faster. (Starting them
 * partway down the curve made the camera jump from the welcome view into the clouds.)
 */
const RETURN_DURATION = 3.9;

const BASE_FOV = 45;
/** Extra field of view at the fastest point of the dive, for a sense of speed. */
const FOV_KICK = 14;

const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeInOutSine = (x: number) => (1 - Math.cos(Math.PI * x)) / 2;

/**
 * Out of the clouds the camera glides past the overview, a little closer to the islands,
 * then drifts back to it, instead of braking to a stop on it. OVERSHOOT is how much closer
 * (island units), and the drift back takes the last SETTLE share of the dive.
 */
const OVERSHOOT = 8;
const SETTLE = 0.22;

/**
 * If the islands are still loading when the dive reaches the cloud bank, it eases to a stop
 * deep inside (where the veil hides everything) and goes on once they're in. HOLD_EASE is how
 * much of the dive the slowing takes; after HOLD_LIMIT seconds it goes on regardless.
 */
const HOLD_EASE = 0.05;
const HOLD_LIMIT = 15;
const smoothstep = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * The welcome view looks out towards the horizon (about 14° down), so the sky and the low
 * welcome sun show above the sea of clouds. The dive tips down from it in its first part.
 */
const WELCOME_LOOK = new THREE.Vector3(0, -0.25, -1).normalize();
/** Share of the dive over which the view tips from the welcome look to the dive's own. */
const TIP_DOWN = 0.35;
/** The welcome float: a slow drift of the gaze (radians) and a faint rise and fall. */
const DRIFT = THREE.MathUtils.degToRad(2.5);
const RISE = 0.35;

const overviewTarget = new THREE.Vector3(...OVERVIEW.target);
const overviewPosition = new THREE.Vector3(...OVERVIEW.position);
/** The point past the overview where the glide turns back, on the line towards the islands. */
const turnPoint = overviewPosition
  .clone()
  .add(overviewTarget.clone().sub(overviewPosition).setLength(OVERSHOOT));
const cloudCenter = new THREE.Vector3(...FLY_IN_CLOUD.position);
const lookTarget = new THREE.Vector3();
const ahead = new THREE.Vector3();
const look = new THREE.Vector3();
const welcomeLook = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

/**
 * Owns the camera until the world is ready: holds the welcome view, flies the dive,
 * then hands over to CameraRig. The curve ends exactly at the overview pose, so the
 * handoff is invisible.
 */
export function FlyIn() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const phase = useWorld((s) => s.phase);

  /**
   * The dive path runs on past the overview to the turn point. `overviewAt` is where the
   * overview sits on it, as a share of its length; dive progress k is measured so that
   * k = 1 is the overview and k = PAST (above 1) is the turn point.
   */
  const { curve, overviewAt } = useMemo(() => {
    const points = [...FLY_IN_POINTS.map((p) => new THREE.Vector3(...p)), turnPoint];
    const path = new THREE.CatmullRomCurve3(points);
    const steps = (points.length - 1) * 100;
    const lengths = path.getLengths(steps);
    return { curve: path, overviewAt: lengths[steps - 100] / lengths[steps] };
  }, []);
  const PAST = 1 / overviewAt;

  /** Dive progress k (see placeAt) at time share t: on past the overview, then back to it. */
  const kAt = (t: number) =>
    t < 1 - SETTLE
      ? PAST * easeInOutCubic(t / (1 - SETTLE))
      : PAST + (1 - PAST) * easeInOutSine((t - (1 - SETTLE)) / SETTLE);

  /** The time share at which the camera is deepest in the cloud bank: where a wait happens. */
  const holdAt = useMemo(() => {
    let best = 0;
    let nearest = Infinity;
    for (let i = 0; i <= 400; i++) {
      const t = (i / 400) * (1 - SETTLE);
      const d = curve.getPointAt(Math.min(kAt(t) * overviewAt, 1)).distanceTo(cloudCenter);
      if (d < nearest) [nearest, best] = [d, t];
    }
    return best;
    // kAt only depends on the curve's constants.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curve, overviewAt]);

  const progress = useRef(0);
  /** Speed of the dive, 0 to 1: it eases down to wait in the cloud for the islands. */
  const pace = useRef(1);
  const waited = useRef(0);
  const duration = useRef(DURATION);
  const introSeen = useRef(false);
  /** The welcome float where it was when the dive began, faded out as the view tips down. */
  const float = useRef({ drift: 0, rise: 0 });

  /**
   * Puts the camera at dive progress k (0 = welcome view, 1 = overview, up to PAST),
   * looking along the path, then at the islands. `welcome` (0..1) turns the gaze towards the welcome view instead; `drift`
   * swings that view sideways (radians) and `rise` lifts the camera a little.
   */
  const placeAt = (k: number, welcome = 0, drift = 0, rise = 0) => {
    const u = Math.min(k * overviewAt, 1);
    camera.position.copy(curve.getPointAt(u));
    camera.position.y += rise;
    ahead.copy(curve.getPointAt(Math.min(u + 0.02, 1)));
    lookTarget.lerpVectors(ahead, overviewTarget, smoothstep(0.6, 1, k));
    if (welcome > 0) {
      // Blend directions, not points: the path's look point is only a few units ahead.
      look.subVectors(lookTarget, camera.position).normalize();
      welcomeLook.copy(WELCOME_LOOK).applyAxisAngle(UP, drift);
      look.lerp(welcomeLook, welcome).normalize();
      lookTarget.copy(camera.position).add(look);
    }
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
    setFov(BASE_FOV + FOV_KICK * Math.sin(Math.PI * t));
  };

  // Layout effect: runs before CameraRig's mount effect reads the camera at handoff.
  useLayoutEffect(() => {
    if (phase === 'loading' || phase === 'welcome') {
      introSeen.current = true;
      placeAt(0, 1);
    } else if (phase === 'flyIn') {
      introSeen.current = true;
      const returning = useWorld.getState().visited.length > 0;
      duration.current = returning ? RETURN_DURATION : DURATION;
      progress.current = 0;
      pace.current = 1;
      waited.current = 0;
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
      // Hanging in the air while the visitor reads: a slow drift and a faint rise and fall.
      const t = state.clock.elapsedTime;
      float.current = { drift: Math.sin(t * 0.15) * DRIFT, rise: Math.sin(t * 0.32) * RISE };
      placeAt(0, 1, float.current.drift, float.current.rise);
      return;
    }
    if (current !== 'flyIn') return;

    const loaded = useWorld.getState().islandsLoaded.length >= ISLANDS.length;
    const go = loaded || waited.current > HOLD_LIMIT;
    const towardsHold = THREE.MathUtils.clamp((holdAt - progress.current) / HOLD_EASE, 0, 1);
    pace.current = THREE.MathUtils.damp(pace.current, go ? 1 : towardsHold, 4, delta);
    if (!go && towardsHold < 1) waited.current += delta;
    progress.current = Math.min(progress.current + (delta / duration.current) * pace.current, 1);
    if (!go) progress.current = Math.min(progress.current, holdAt);
    const t = progress.current;
    const k = kAt(t);
    const tip = 1 - smoothstep(0, TIP_DOWN, progress.current);
    placeAt(k, tip, float.current.drift * tip, float.current.rise * tip);

    applyCloudEffects(progress.current);

    if (progress.current >= 1) useWorld.getState().setPhase('world');
  });

  return null;
}
