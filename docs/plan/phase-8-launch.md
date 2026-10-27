# Phase 8. Launch

[Back to plan](../../PLAN.md) · Previous: [Phase 7](phase-7-performance-mobile-a11y.md)

**Estimate:** 1 to 2 days
**Goal:** the site is live on its own domain, tested on real devices, and people know about it.

---

## Tasks

### 1. Hosting
Vercel has deployed every push since Phase 0. Now finish the production setup.

- [ ] Set the production branch to `main`.
- [ ] Add caching headers: files under `/assets/` are hashed by Vite and can be cached for a year. `index.html` must not be cached.

```json
// vercel.json
{
  "headers": [
    { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
  ]
}
```

- [ ] Files in `public/` keep their names. If a model or audio file changes, rename it, for example `ambient-v2.mp3`, or import it through Vite to get a hashed name.

### GitHub Pages alternative
- [ ] Set `base: '/<repository-name>/'` in `vite.config.ts`, unless you use a custom domain.
- [ ] Add a workflow. Check the latest major versions of each action when you create it.

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test -- --run
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] In the repository settings, set Pages source to GitHub Actions.

### 2. Custom domain
- [ ] Buy a short domain with your name, for example a `.dev` or `.me` address.
- [ ] Add it in Vercel or GitHub Pages and set the DNS records they show. HTTPS is automatic.
- [ ] Redirect `www` to the bare domain, or the other way, so there is one address.

### 3. Analytics (optional)
- [ ] Use a cookie-free tool such as Plausible, Umami or Vercel Web Analytics, so no consent banner is needed.
- [ ] Track a few events: Enter with or without sound, island focused, object activated, all objects found, classic CV opened, PDF downloaded, email copied.
- [ ] These tell you what recruiters actually do, and whether the fly-in is skipped a lot.

### 4. Error monitoring (optional)
- [ ] Add Sentry with a low sample rate to catch WebGL errors and crashes on devices you do not own.

### 5. Pre-launch checklist

**Browsers and devices**
- [ ] Chrome, Edge and Firefox on Windows
- [ ] Safari on macOS
- [ ] Safari on iPhone
- [ ] Chrome on a mid-range Android phone
- [ ] A tablet in both orientations

**Conditions**
- [ ] Slow 4G throttling in DevTools: the welcome text appears fast, Enter appears in reasonable time
- [ ] Low quality mode
- [ ] Reduced motion
- [ ] Keyboard only
- [ ] Screen reader quick pass
- [ ] WebGL disabled: the classic CV appears

**Content**
- [ ] Every link works: LinkedIn, GitHub, Kafka UI pull request, trash-free.ru, email
- [ ] `cv.pdf` matches the current CV
- [ ] Spelling and dates checked one last time
- [ ] `CREDITS.md` is complete, and a Credits link is in the top bar menu

**Sharing**
- [ ] The preview looks right in LinkedIn Post Inspector and in Telegram or WhatsApp
- [ ] Lighthouse on the classic CV page: Accessibility and Best Practices 95 or higher

### 6. Announce
- [ ] Record a 20 to 30 second screen video: welcome, fly-in, one island, one object. Export a GIF version too.
- [ ] Post on LinkedIn with the video and a short story of how you built it.
- [ ] Add the link to the LinkedIn profile, the GitHub profile README and the PDF CV header.
- [ ] Share in the three.js forum showcase and on r/threejs for feedback from other developers.
- [ ] Optional: write a "How I built this" post. It doubles as proof of your frontend skills.

---

## Maintenance

### Updating the CV
1. Edit `src/data/cv.ts`.
2. Run `npm test` to check the data.
3. Regenerate `cv.pdf` from the classic CV page.
4. Push. The site deploys itself.

### Adding a new job island
1. Add the id to `ISLAND_IDS` in `types.ts`.
2. Add the chapter to `cv.ts` and the layout to `world.ts`.
3. The placeholder island appears automatically. Ship it like that if you are in a hurry.
4. Later, follow the build sheet steps in [Phase 4](phase-4-island-art.md) and the object steps in [Phase 5](phase-5-interactive-objects.md).

---

## Acceptance criteria

- [ ] The site is live on the custom domain over HTTPS.
- [ ] The full pre-launch checklist passes.
- [ ] The link is on LinkedIn, GitHub and the PDF CV.
