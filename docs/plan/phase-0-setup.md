# Phase 0. Setup

[Back to plan](../../PLAN.md) · Next: [Phase 1. Sky world](phase-1-sky-world.md)

**Estimate:** 1 day
**Goal:** a working project with tooling, all CV content in typed data, and automatic deploys from the first day.

---

## Tasks

### 1. Upgrade Node.js

- [ ] Install the current Node.js LTS (24 or newer) from nodejs.org, or with `nvm-windows`.
- [ ] Check it in a new terminal.

```
node -v    # v24.x or newer
npm -v
```

Node 20.11, which is installed now, is too old for current Vite and no longer supported.

### 2. Scaffold the project in this folder

- [ ] Move the existing CV into a reference folder, so it is not confused with the new `index.html`.
- [ ] Create the Vite project in the current folder. When Vite says the folder is not empty, choose to ignore existing files and continue.

```
mkdir reference
move Renat_Kalimulin_CV.html reference\
npm create vite@latest . -- --template react-ts
npm install
npm run dev
```

### 3. Install the stack

```
npm i three @react-three/fiber @react-three/drei @react-three/postprocessing postprocessing zustand maath motion howler
npm i -D @types/three @types/howler leva r3f-perf vitest jsdom @testing-library/react @testing-library/jest-dom @playwright/test prettier eslint-config-prettier
```

- [ ] Open `package.json` and check that `react` is 19, `@react-three/fiber` is 9 and `@react-three/drei` is 10.

### 4. Configure Vite, TypeScript and the `@` alias

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  assetsInclude: ['**/*.glb'],
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] },
});
```

- [ ] Add `"paths": { "@/*": ["./src/*"] }` to `compilerOptions` in `tsconfig.app.json`.
- [ ] Add `/// <reference types="vitest/config" />` at the top of `vite.config.ts` if TypeScript complains about the `test` key.
- [ ] Create `src/test/setup.ts` with `import '@testing-library/jest-dom/vitest';`.

### 5. Scripts, linting and formatting

- [ ] Add `eslint-config-prettier` as the last entry in `eslint.config.js`.
- [ ] Add a `.prettierrc` with your preferred style, for example `{ "singleQuote": true, "printWidth": 100 }`.
- [ ] Add scripts to `package.json`:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint .",
  "format": "prettier --write .",
  "test": "vitest",
  "e2e": "playwright test"
}
```

### 6. Git and GitHub

- [ ] `git init`, then check `.gitignore` contains `node_modules`, `dist`, `.env*`, `*.blend1`, `test-results`, `playwright-report`.
- [ ] First commit.
- [ ] Create a GitHub repository and push. A public repository is a good portfolio piece.

### 7. Global styles

- [ ] Give the page full height and the sky colour as background, so there is no white flash while loading.

```css
/* src/styles/global.css */
html,
body,
#root {
  height: 100%;
  margin: 0;
}
body {
  background: #bfe7f7;
  overflow: hidden;
  font-family: Nunito, system-ui, sans-serif;
}
```

The classic CV page will switch `overflow` back to `auto`.

### 8. Folder skeleton

- [ ] Create the folders from [Architecture](architecture.md#folder-structure). Empty folders can wait until they get their first file.

### 9. Move the CV into data

- [ ] Create `src/data/types.ts` from the [data model](architecture.md#data-model).
- [ ] Create `src/data/cv.ts` with the profile and all seven chapters, copied from the reference CV.
- [ ] Split long CV bullets into separate achievements. For example the Salyut bullet becomes four: projects led, products built, precision assemblies, Python macros.
- [ ] Give each achievement a short title of 6 words or fewer. These titles appear in the panel list and on object tooltips.
- [ ] Leave `objectId` empty for now. Phase 5 fills it in.
- [ ] Create `src/data/world.ts` with rough positions for each island.
- [ ] Write a data test.

```ts
// src/data/cv.test.ts
import { describe, expect, it } from 'vitest';
import { chapters } from './cv';
import { ISLANDS } from './world';

describe('cv data', () => {
  it('has unique achievement ids', () => {
    const ids = chapters.flatMap((c) => c.achievements.map((a) => a.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('gives every chapter a layout', () => {
    for (const c of chapters) expect(ISLANDS.some((i) => i.id === c.id)).toBe(true);
  });
  it('gives every job at least one achievement', () => {
    for (const c of chapters.filter((c) => c.kind === 'job'))
      expect(c.achievements.length).toBeGreaterThan(0);
  });
});
```

### 10. First 3D scene

- [ ] Replace `App.tsx` with a Canvas, a rotating toon cube and OrbitControls.

```tsx
// src/App.tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef } from 'react';
import type { Mesh } from 'three';

function Cube() {
  const ref = useRef<Mesh>(null!);
  useFrame((_, delta) => (ref.current.rotation.y += delta * 0.5));
  return (
    <mesh ref={ref}>
      <boxGeometry />
      <meshToonMaterial color="#9BCB5A" />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas flat camera={{ position: [3, 2, 4] }}>
      <hemisphereLight args={['#BFE7F7', '#8A6A52', 0.6]} />
      <directionalLight position={[5, 8, 3]} intensity={2} color="#FFF1D6" />
      <Cube />
      <OrbitControls />
    </Canvas>
  );
}
```

### 11. Debug mode

- [ ] Create `src/debug/Debug.tsx` that renders `<Perf position="top-left" />` from r3f-perf.
- [ ] Show leva and Perf only when the address contains `?debug`. Hide leva otherwise with `<Leva hidden={!debug} />`.

```tsx
const debug = new URLSearchParams(location.search).has('debug');
const Debug = lazy(() => import('@/debug/Debug'));
// inside Canvas:
{
  debug && (
    <Suspense fallback={null}>
      <Debug />
    </Suspense>
  );
}
```

### 12. Automatic deploy

- [ ] Sign in to Vercel with GitHub and import the repository. Vercel detects Vite automatically.
- [ ] Check that a push to `main` deploys, and that another branch gets its own preview address.
- [ ] Open the deployed address on your phone.

GitHub Pages also works. Its workflow is described in [Phase 8](phase-8-launch.md#github-pages-alternative).

---

## Acceptance criteria

- [ ] `npm run dev`, `npm run build`, `npm run lint` and `npm test` all pass.
- [ ] A rotating green toon cube shows locally and on the deployed address.
- [ ] `?debug` shows FPS and draw calls.
- [ ] All CV text is in `cv.ts`, and the data test passes.

## Pitfalls

- **Canvas has zero height.** The Canvas fills its parent. If `html`, `body` and `#root` have no height, nothing shows.
- **Version mismatch.** React Three Fiber 8 with React 19, or drei 9 with Fiber 9, crashes with confusing errors. Keep the majors from the stack table.
- **Windows paths.** Import paths are case sensitive on the Linux build servers. `./Island` and `./island` both work on Windows but only one works on Vercel.
