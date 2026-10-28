import { ISLANDS } from '@/data/world';
import { Island } from './Island';
import { LabelProjector } from './LabelProjector';

/** All islands from world.ts. Real island components replace placeholders in Phase 4. */
export function Islands() {
  return (
    <>
      {ISLANDS.map((layout) => (
        <Island key={layout.id} layout={layout} />
      ))}
      <LabelProjector />
    </>
  );
}
