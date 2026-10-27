export const ISLAND_IDS = [
  'home',
  'workshop',
  'grove',
  'radio',
  'arena',
  'market',
  'lighthouse',
] as const;

export type IslandId = (typeof ISLAND_IDS)[number];

export type Vec3 = [number, number, number];

export interface Achievement {
  /** Unique across the whole CV, e.g. 'radio-llm'. */
  id: string;
  /** Short headline, 6 words or fewer. Shown in the panel list and object tooltips. */
  title: string;
  /** The full sentence from the CV. */
  text: string;
  /** The 3D object that reveals this achievement. Filled in during Phase 5. */
  objectId?: string;
}

export interface Link {
  label: string;
  href: string;
}

export interface Chapter {
  id: Exclude<IslandId, 'home'>;
  kind: 'job' | 'open-source';
  company: string;
  role: string;
  /** 'YYYY-MM' */
  start: string;
  /** 'YYYY-MM', or null when ongoing. */
  end: string | null;
  employment?: string;
  location?: string;
  /** One line under the title. */
  summary: string;
  achievements: Achievement[];
  tech: string[];
  links?: Link[];
}

export interface Education {
  title: string;
  school: string;
  start: string;
  end: string;
  note?: string;
}

export interface Profile {
  name: string;
  role: string;
  tagline: string;
  location: string;
  summary: string;
  contacts: {
    email: string;
    phone?: string;
    linkedin: string;
    github: string;
  };
  skills: { group: string; items: string[] }[];
  education: Education[];
  languages: { name: string; level: string }[];
}

export interface IslandLayout {
  id: IslandId;
  position: Vec3;
  scale: number;
  /** Seed for the procedural placeholder shape. */
  seed: number;
  labelOffset: Vec3;
  camera: { position: Vec3; target: Vec3 };
  /** Theme colour for the label and panel. */
  accent: string;
}
