import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { CameraControls, CameraControlsImpl } from '@react-three/drei';
import * as THREE from 'three';
import type { Vec3 } from '@/data/types';
import { layoutOf, OVERVIEW } from '@/data/world';
import { debugCamera } from '@/debug/isDebug';
import { useWorld } from '@/store/useWorld';
import { isMobileWidth, PANEL_WIDTH, SHEET_SHARE } from '@/ui/layout';

const { ACTION } = CameraControlsImpl;

/** Seconds the camera takes to settle; flights last roughly three times this. */
const SMOOTH_TIME = 0.5;

/** How far visitors may zoom, per mode. */
const DISTANCE = {
  overview: { min: 25, max: 85 },
  focus: { min: 9, max: 30 },
};

const tmp = new THREE.Vector3();

/** Screens narrower than this aspect ratio see less width, so the camera backs off. */
const REFERENCE_ASPECT = 1.2;
const MAX_BACKOFF = 2.2;

/** How much further away the camera sits on tall, narrow screens such as phones in portrait. */
export function backoffFor(aspect: number): number {
  if (aspect >= REFERENCE_ASPECT) return 1;
  return Math.min(Math.pow(REFERENCE_ASPECT / aspect, 0.85), MAX_BACKOFF);
}

/** Moves the camera away from (or towards) its target along the same line of sight. */
function scalePose(pose: { position: Vec3; target: Vec3 }, k: number) {
  const [tx, ty, tz] = pose.target;
  const [px, py, pz] = pose.position;
  return {
    target: pose.target,
    position: [tx + (px - tx) * k, ty + (py - ty) * k, tz + (pz - tz) * k] as Vec3,
  };
}

/**
 * Shift the view so the focused island sits beside the panel (desktop) or above the
 * bottom sheet (phone). Returns a focal offset in world units at the target distance.
 */
function panelOffset(
  pose: { position: Vec3; target: Vec3 },
  fov: number,
  width: number,
  height: number,
): Vec3 {
  const distance = tmp.set(...pose.position).distanceTo(new THREE.Vector3(...pose.target));
  const visibleHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(fov) / 2);
  const visibleWidth = visibleHeight * (width / height);
  if (isMobileWidth(width)) {
    // Positive Y lifts the island into the space above the sheet.
    const sheetPx = height * SHEET_SHARE;
    return [0, (sheetPx / 2 / height) * visibleHeight, 0];
  }
  return [(PANEL_WIDTH / 2 / width) * visibleWidth, 0, 0];
}

/**
 * Smooth camera flights between the overview and each island, with limits so
 * visitors cannot get lost. Phase 3's fly-in will own the camera before this mounts.
 */
export function CameraRig() {
  const ref = useRef<CameraControlsImpl>(null);
  const focused = useWorld((s) => s.focused);
  const { size, camera } = useThree();
  const fov = (camera as THREE.PerspectiveCamera).fov;
  const first = useRef(true);

  // Controls: rotate with left button or one finger, zoom with wheel or pinch. No panning.
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.smoothTime = SMOOTH_TIME;
    c.mouseButtons.right = ACTION.NONE;
    c.mouseButtons.middle = ACTION.NONE;
    c.touches.two = ACTION.TOUCH_DOLLY;
    c.touches.three = ACTION.NONE;
  }, []);

  // Fly to the focused island, or back to the overview.
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const k = backoffFor(size.width / size.height);
    const pose = scalePose(focused ? layoutOf(focused).camera : OVERVIEW, k);
    const animate = !first.current;

    if (first.current && debugCamera.position) {
      const target = debugCamera.target ?? OVERVIEW.target;
      void c.setLookAt(...debugCamera.position, ...target, false);
    } else {
      void c.setLookAt(...pose.position, ...pose.target, animate);
    }
    first.current = false;

    const limits = focused ? DISTANCE.focus : DISTANCE.overview;
    c.minDistance = limits.min * k;
    c.maxDistance = limits.max * k;

    const offset = focused ? panelOffset(pose, fov, size.width, size.height) : [0, 0, 0];
    void c.setFocalOffset(offset[0], offset[1], offset[2], animate);
  }, [focused, fov, size.width, size.height]);

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minPolarAngle={Math.PI * 0.18}
      maxPolarAngle={Math.PI * 0.49}
      minAzimuthAngle={-1.1}
      maxAzimuthAngle={1.1}
    />
  );
}
