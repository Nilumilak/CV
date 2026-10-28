import type { SoundCue } from '@/audio/sound';

/** A section of the Home panel. Each one has an object on the island that leads to it. */
export type HomeSection = 'summary' | 'contacts' | 'skills' | 'education' | 'languages';

export interface HomeObject {
  id: string;
  section: HomeSection;
  /** Short hover hint on the island, and the "Show me" button's accessible name. */
  label: string;
  /** What the object is, for screen readers ("Show me the cat"). */
  name: string;
  cue: SoundCue;
}

/**
 * The interactive objects on Home (design: docs/plan/islands/home.md).
 * The island and the panel both read this, so an object and its section can't drift apart.
 */
export const HOME_OBJECTS = [
  { id: 'home-cat', section: 'summary', label: 'About me', name: 'the cat', cue: 'mrrp' },
  { id: 'home-mailbox', section: 'contacts', label: 'Contacts', name: 'the mailbox', cue: 'paper' },
  { id: 'home-lantern', section: 'skills', label: 'Skills', name: 'the lantern', cue: 'chime' },
  {
    id: 'home-bookshelf',
    section: 'education',
    label: 'Education',
    name: 'the bookshelf',
    cue: 'knock',
  },
  { id: 'home-globe', section: 'languages', label: 'Languages', name: 'the globe', cue: 'whirr' },
] as const satisfies readonly HomeObject[];

export type HomeObjectId = (typeof HOME_OBJECTS)[number]['id'];

export const homeObject = (id: HomeObjectId): HomeObject => HOME_OBJECTS.find((o) => o.id === id)!;

export const objectForSection = (section: HomeSection): HomeObject =>
  HOME_OBJECTS.find((o) => o.section === section)!;
