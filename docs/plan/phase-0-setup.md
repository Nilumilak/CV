# Phase 0. Setup

[Back to plan](../../PLAN.md) · Next: [Phase 1. Sky world](phase-1-sky-world.md)

**Estimate:** 1 day
**Goal:** a working project with tooling, all CV content in typed data, and automatic deploys from the first day.

---

## Tasks

### 1. Upgrade Node.js

- [x] Install the current Node.js LTS (24 or newer) from nodejs.org, or with `nvm-windows`.
- [x] Check it in a new terminal.

```
node -v    # v24.x or newer
npm -v
```

Node 20.11, which is installed now, is too old for current Vite and no longer supported.

### 2. Scaffold the project in this folder

- [x] Move the existing CV into a reference folder, so it is not confused with the new `index.html`.
- [x] Create the Vite project in the current folder. When Vite says the folder is not empty, choose to ignore existing files and continue.

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

- [x] Open `package.json` and check that `react` is 19, `@react-three/fiber` is 9 and `@react-three/drei` is 10.

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

- [x] Add `"paths": { "@/*": ["./src/*"] }` to `compilerOptions` in `tsconfig.app.json`.
- [x] Add `/// <reference types="vitest/config" />` at the top of `vite.config.ts` if TypeScript complains about the `test` key.
- [x] Create `src/test/setup.ts` with `import '@testing-library/jest-dom/vitest';`.

### 5. Scripts, linting and formatting

- [x] ~~Add `eslint-config-prettier`~~ The current Vite template uses oxlint instead of ESLint. It has no formatting rules, so it does not conflict with Prettier.
- [x] Add a `.prettierrc` with your preferred style, for example `{ "singleQuote": true, "printWidth": 100 }`.
- [x] Add scripts to `package.json`:

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

- [x] `git init`, then check `.gitignore` contains `node_modules`, `dist`, `.env*`, `*.blend1`, `test-results`, `playwright-report`.
- [x] First commit.
- [x] Create a GitHub repository and push. A public repository is a good portfolio piece.

### 7. Global styles

- [x] Give the page full height and the sky colour as background, so there is no white flash while loading.

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

- [x] Create the folders from [Architecture](architecture.md#folder-structure). Empty folders can wait until they get their first file.

### 9. Move the CV into data

- [x] Create `src/data/types.ts` from the [data model](architecture.md#data-model).
- [x] Create `src/data/cv.ts` with the profile and all seven chapters, copied from the reference CV.
- [x] Split long CV bullets into separate achievements. For example the Salyut bullet becomes four: projects led, products built, precision assemblies, Python macros.
- [x] Give each achievement a short title of 6 words or fewer. These titles appear in the panel list and on object tooltips.
- [x] Leave `objectId` empty for now. Phase 5 fills it in.
- [x] Create `src/data/world.ts` with rough positions for each island.
- [x] Write a data test.

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

- [x] Replace `App.tsx` with a Canvas, a rotating toon cube and OrbitControls.

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

- [x] Create `src/debug/Debug.tsx` that renders `<Perf position="top-left" />` from r3f-perf.
- [x] Show leva and Perf only when the address contains `?debug`. Hide leva otherwise with `<Leva hidden={!debug} />`.

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

- [x] `npm run dev`, `npm run build`, `npm run lint` and `npm test` all pass.
- [ ] A rotating green toon cube shows locally (done) and on the deployed address (waiting for Vercel).
- [x] `?debug` shows FPS and draw calls.
- [x] All CV text is in `cv.ts`, and the data test passes.

## Pitfalls

- **Canvas has zero height.** The Canvas fills its parent. If `html`, `body` and `#root` have no height, nothing shows.
- **Version mismatch.** React Three Fiber 8 with React 19, or drei 9 with Fiber 9, crashes with confusing errors. Keep the majors from the stack table.
- **Windows paths.** Import paths are case sensitive on the Linux build servers. `./Island` and `./island` both work on Windows but only one works on Vercel.

---

## Progress notes

- **Linting.** The Vite 8 template ships oxlint and TypeScript 7 instead of ESLint and TypeScript 5. Kept them: they are faster and need no extra config.
- **Browser tests.** `npm run e2e` runs a Playwright smoke test on desktop and phone sizes against the production build. The preview server binds to `127.0.0.1:4321`, because on Windows `localhost` can resolve to IPv6 only and Playwright then waits forever.
- **CI.** `.github/workflows/ci.yml` runs lint, format check, unit tests and browser tests on every push to `main` and on pull requests.
- **Phone number.** It is left out of `cv.ts` on purpose, because the site will be public. Add `phone` to `profile.contacts` if you want it shown.
