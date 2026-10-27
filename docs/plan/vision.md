# Vision

[Back to plan](../../PLAN.md)

## Goal

A CV that people remember, which still works for a recruiter who has 30 seconds.

## Audiences

| Visitor                     | What they want                            | How the site serves them                                                                    |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| Recruiter or HR             | Role, years, stack, contacts, a PDF, fast | "Classic CV" and "Download PDF" are visible on every screen. Panels show full text at once. |
| Hiring manager or tech lead | What you owned and what impact it had     | Each island panel lists all achievements, tech used and links.                              |
| Fellow developers           | Craft, fun, how it was built              | Interactive objects, polish, and a "How I built this" link to the GitHub repo.              |

## Design principles

1. **Never gate content.** Every achievement is readable in the panel without clicking any object.
2. **Fast to the first impression.** The welcome text appears in under 2 seconds, before the 3D scene finishes loading.
3. **Short and skippable.** The fly-in lasts at most 6 seconds, has a Skip button, and is skipped automatically for reduced-motion users.
4. **Always alive.** Something always moves: clouds drift, islands bob, birds fly, objects idle.
5. **Works everywhere.** Laptop, phone, keyboard only, and browsers without WebGL all get a usable CV.

---

## Experience flow

```
loading ──> welcome ──> flyIn ──> overview <──> focus(island)
   │            │                     │
   └────────────┴─────────────────────┴──> classic CV (any time)
```

### 1. Loading and welcome

- The welcome overlay is plain HTML, so it shows immediately: "Welcome to my World", the name and the role.
- The 3D scene loads behind it. A thin progress line, drawn like a cloud trail, fills up.
- When loading finishes, two buttons appear: **Enter with sound** and **Enter quietly**. This solves the browser rule that sound can only start after a click.
- A small link under them reads "Just the CV, please" and opens the classic CV.
- Behind the overlay, the live sky is already rendering: the camera sits high above the cloud layer and clouds drift slowly.

### 2. Fly-in

- The camera dives into the cloud layer, the screen whitens briefly, then it bursts out into clear sky with the islands below.
- It settles on the overview position. Total length 4 to 6 seconds.
- A Skip button sits in the bottom corner. Any key also skips.
- Optional title beats fade in and out during the dive: the name, then the role.
- Return visitors get a 2-second version.

### 3. Overview

- All islands are visible, linked by a route in timeline order, oldest on the left. The route can be rope bridges or a flying tram line.
- Each island has a tag label like the first reference image: an icon, the company name and the years.
- Radio Gigabit is still ongoing, so its island has a lit beacon and a "Now" badge.
- On a first visit the Home island has a "You are here" speech bubble.
- The visitor can rotate a little and zoom within limits, but cannot get lost.
- A top bar holds the name, an island menu, Classic CV, Download PDF and the sound toggle.

### 4. Focus on an island

- Clicking an island or its label flies the camera to that island's viewpoint.
- On desktop the island shifts left to make room for the panel. On phones it shifts up above a bottom sheet.
- The panel looks like a travel-journal page. It shows role, company, dates, location, a one-line summary, all achievements, tech chips, links, and Previous and Next island buttons.
- Interactive objects wake up. Hovering one makes it glow. Clicking it plays its animation and highlights the matching achievement in the panel.
- Hovering an achievement in the panel makes its object glow, so the link works both ways.
- A small counter reads, for example, "2 of 4 discovered".

### 5. Back to the overview

- The Back button, Esc, the browser Back button, or a click on empty sky all return to the overview.
- Visited islands get a small flag on their label.

### 6. Classic CV

- Address `#/cv` shows a plain, printable page built from the same data, with a Download PDF button.
- It is also the automatic fallback when WebGL is unavailable.

---

## Islands

The career islands are ordered by start date and arc behind the Home island from left (oldest) to right (newest).
The Home island sits front and centre, nearest the overview camera. The Lighthouse floats off to one side.

| Island      | Id           | CV source                                       | Dates        | Theme                                                      | Landmark                         |
| ----------- | ------------ | ----------------------------------------------- | ------------ | ---------------------------------------------------------- | -------------------------------- |
| Home        | `home`       | Summary, skills, education, languages, contacts |              | Cozy cottage with a big tree and a lofi desk in the window | Cottage and tree                 |
| Workshop    | `workshop`   | JSC NPP Salyut, Design Engineer                 | 2015 to 2020 | Steampunk machine island in the mood of Howl's castle      | Brick factory with giant gears   |
| Green Grove | `grove`      | Eco Activists, Frontend Software Engineer       | 2020 to 2022 | Mossy forest island with a waterfall                       | Huge old tree and recycling bins |
| Radio Tower | `radio`      | Radio Gigabit, Senior Full Stack Engineer       | 2022 to now  | Rocky island with antennas, like the first reference       | Lattice tower and satellite dish |
| Arena       | `arena`      | Olimpbet KZ, Frontend Software Engineer         | 2024 to 2025 | Small floating stadium with floodlights                    | Stadium and scoreboard           |
| Market Town | `market`     | Monetech, Senior Frontend Developer             | 2025 to 2026 | Tall cliff town with stacked houses and a tram             | Domed bank and tram loop         |
| Lighthouse  | `lighthouse` | Kafka UI, open source contributor               | 2024 to now  | Tiny rock with a lighthouse                                | Rotating lighthouse beam         |

The full list of interactive objects, and which achievement each one reveals, lives in [Phase 5](phase-5-interactive-objects.md#object-catalogue).

### About overlapping dates

Radio Gigabit is part-time and overlaps Olimpbet, Monetech and Kafka UI.
The labels show the real dates, and the panel for Radio Gigabit says "part-time, ongoing".
Order on the map follows start date.

---

## Scope

### Version 1

- Welcome screen, fly-in, overview, island focus, panels.
- Seven islands with their own art and interactive objects.
- Classic CV page and PDF download.
- Sound with a toggle.
- Desktop and mobile, keyboard navigation, reduced motion support.

### Stretch ideas after launch

- A steerable airship mode for visitors who want to explore freely.
- A day and night toggle with lanterns on every island.
- A guestbook where visitors leave paper planes that fly around the sky.
- A Russian language version.
- A "How I built this" page or blog post.

### Not planned

- Any game mechanic that is required to read the CV.
- A backend or a CMS. Content lives in one TypeScript file.
