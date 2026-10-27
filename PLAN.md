# Sky Islands CV

An interactive 3D CV set in a hand-painted, Ghibli-inspired sky.
Visitors fly through clouds to a chain of floating islands. Each island is one chapter of the career.
Clicking an island brings it close, shows the achievements, and wakes up animated objects that tell the same story.

Built with React, TypeScript, Three.js and React Three Fiber.

---

## Plan documents

Read the first three once. Then work through the phases in order.

| Document                                    | What it covers                                                                         |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| [Vision](docs/plan/vision.md)               | Audiences, design principles, experience flow, islands mapped to the CV, scope         |
| [Architecture](docs/plan/architecture.md)   | Stack and versions, folder structure, data model, state, routing, camera, coding rules |
| [Art direction](docs/plan/art-direction.md) | References, palette, toon shading, clouds, typography, UI style, motion, sound         |

## Phases

| #   | Phase                                                                              | Estimate     | You can open in the browser                                    | Status                          |
| --- | ---------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------- | ------------------------------- |
| 0   | [Setup](docs/plan/phase-0-setup.md)                                                | 1 day        | A rotating toon cube, auto-deployed                            | In progress, waiting for Vercel |
| 1   | [Sky world](docs/plan/phase-1-sky-world.md)                                        | 2 to 3 days  | A painted sky with layered clouds                              | Not started                     |
| 2   | [Islands and navigation](docs/plan/phase-2-islands-navigation.md)                  | 4 to 5 days  | The complete CV on placeholder islands, classic CV, deep links | Not started                     |
| 3   | [Welcome and fly-in](docs/plan/phase-3-welcome-flyin.md)                           | 2 days       | Welcome screen, cloud dive, sound                              | Not started                     |
| 4   | [Island art](docs/plan/phase-4-island-art.md)                                      | 1 to 3 weeks | Every island with its own look                                 | Not started                     |
| 5   | [Interactive objects](docs/plan/phase-5-interactive-objects.md)                    | 1 to 2 weeks | One animated object per achievement                            | Not started                     |
| 6   | [Polish](docs/plan/phase-6-polish.md)                                              | 3 to 5 days  | Post effects, ambient life, sound design                       | Not started                     |
| 7   | [Performance, mobile, accessibility](docs/plan/phase-7-performance-mobile-a11y.md) | 3 to 5 days  | Smooth on phones, full keyboard support, good previews         | Not started                     |
| 8   | [Launch](docs/plan/phase-8-launch.md)                                              | 1 to 2 days  | Custom domain, QA passed, announced                            | Not started                     |

**Total:** roughly 25 to 45 working days.
Phases 0 to 3 take about two weeks and already give a complete, shareable CV with placeholder art.

---

## Key decisions

1. **Content is never hidden behind interaction.** The island panel always lists every achievement. Objects are a fun second way in, not a puzzle a recruiter must solve.
2. **One data file feeds everything.** `src/data/cv.ts` drives the islands, the panels and the classic CV page, so they never drift apart.
3. **Every phase ends deployed.** Auto-deploy is set up in Phase 0, so each phase can be shown to people.
4. **Basics come early.** The classic CV, deep links, keyboard navigation and the mobile panel layout are built in Phase 2, because they shape the architecture.
5. **One tool per job.** drei CameraControls for the camera, maath for frame easing, motion for DOM animation, howler for audio, gltfjsx for models.
6. **Inspired by Ghibli, not copied.** No Studio Ghibli images, characters or music on the site.

## Working rhythm

- One branch per phase. Merge when the phase's acceptance criteria pass.
- Tick the checkboxes inside each phase file as you go, and update the Status column above.
- Deploy after every merge and look at the result on a phone at least once per phase.
