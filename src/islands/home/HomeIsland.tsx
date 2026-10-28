import catUrl from '@/assets/models/home/cat.glb?url';
import cottageUrl from '@/assets/models/home/cottage.glb?url';
import { palette } from '@/materials/toon';
import { GeneratedModel } from '../GeneratedModel';
import { DeskWindow } from './DeskWindow';
import { PLACEHOLDER_GROUND_Y, PlaceholderIsland } from '../PlaceholderIsland';

/**
 * Home island (design: docs/plan/islands/home.md).
 * Local frame: +Z faces the overview camera, +X is the visitor's right.
 * Style test: the cottage and the cat are AI-generated; the rest is placeholder for now.
 */
export function HomeIsland({ seed }: { seed: number }) {
  return (
    <group>
      <PlaceholderIsland id="home" seed={seed} bare />

      <group position-y={PLACEHOLDER_GROUND_Y}>
        <GeneratedModel url={cottageUrl} height={5} position={[0.2, 0, -1]} rotation-y={0.3}>
          <DeskWindow position={[0, 2.47, 1.18]} radius={0.55} />
        </GeneratedModel>

        {/* Placeholder bench until the generated one arrives. */}
        <group position={[2.6, 0, 1.2]} rotation-y={-0.4}>
          <mesh position={[0, 0.45, 0]} material={palette.wood}>
            <boxGeometry args={[1.6, 0.12, 0.55]} />
          </mesh>
          {[-0.65, 0.65].map((x) => (
            <mesh key={x} position={[x, 0.2, 0]} material={palette.wood}>
              <boxGeometry args={[0.12, 0.4, 0.45]} />
            </mesh>
          ))}
          <GeneratedModel url={catUrl} length={0.9} position={[0, 0.51, 0]} rotation-y={0.5} />
        </group>
      </group>
    </group>
  );
}
