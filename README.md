# Lin Thant Kyaw — Portfolio V26

website link: https://linthantkyaw2002.github.io/profile/

Static portfolio: HTML, CSS, JavaScript modules, Bootstrap, and browser-side MediaPipe.
Designed for GitHub Pages or Vercel; no server-side code, database, or Node build required.

## Test locally

From the folder containing `index.html`:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000/ in a browser. JavaScript ES modules do not reliably work from `file://`.

## Minishell

Click the hero terminal or Minishell's **Try Demo** button. Both use the same modal.

Commands: `help`, `ls`, `ls sections`, `ls projects`, `ls links`, `ls demos`, `cat <item>`, `goto <section>`, `open <link-or-demo>`, `history`, `clear`.

`ls`/`cat`/`goto` discover content from the **current HTML**. Changing a `.project-card` heading, description, or tags changes the corresponding Minishell output automatically. `main section[id]` supplies navigation; external/document `a[href]` supply links. Adding a demo still requires a `data-demo` button and registration in `js/main.js`.

`cat skills` reads the front-face titles and summaries of the flip cards;
`cat now` includes the current workbench project's information; and
`cat contact` reads actual LinkedIn/email links with normalized whitespace.
All three refresh automatically as their HTML content changes.

The shell is a browser simulation; it never executes operating-system commands.

## Face Attendance miniature

Open from the Face Attendance **Try Demo** button or type `open face` in Minishell.

1. Enter a display name.
2. Click **Enable Camera** and grant browser permission.
3. A MediaPipe Face Detector model and its WASM runtime load from external CDNs only when camera starts.
4. When one face is detected, a moving frame and the *self-entered* display name appear over the mirrored camera view.
5. Click **Record Attendance** to add an in-memory name/time entry (up to eight per session).
6. Click **Stop Camera** or close the modal to release the camera. Closing the demo clears its temporary records.

**This is face tracking, not recognition, authentication, or identity verification.** No camera frames are uploaded by the portfolio code, and no video/images are saved. MediaPipe may transmit its own library usage metrics, as described in its official privacy notice. The visitor downloads the code/model from the CDNs; a live network connection is necessary for first-time loading. Camera use requires HTTPS or localhost.

## Flow CLI miniature (V24)

Open from the Flow CLI project card's **Try Demo** button or enter `open flow` in Minishell. It shares the same dialog with Minishell and Face Attendance.

Type one command and playback continues **automatically** (no Next button):

- `flow list` — discover available examples.
- `flow list example1` — inspect a saved command sequence.
- `flow run example1` — build a complex C project tree by replaying multiple `mkdir` and `touch` commands, plus a simulated `git clone` that places a sample Libft library in `myapp/lib/libft`.
- `flow run example2` — `cd` between four tester folders, simulate `tester1.sh` through `tester4.sh`, then simulate a build.
- `flow run example3` — simulate cloning two **fictional** repositories from the reserved `example.invalid` domain, copy their source files into `combined-app`, delete obsolete files, and add new configuration and documentation files. The source clone folders remain visible so visitors can compare them with the combined result.
- `flow stop` — cancel the current replay; `clear` — clear terminal output; `help` — command summary.

A live virtual file tree appears alongside the terminal. New files/folders highlight, the active working directory is indicated, and the tree follows the most recent change. Commands display before their effects, followed by a short delay before the next command. The optional Pause and Stop controls are not required for normal playback.

**No commands, tests, clones, file deletions, or builds run on the visitor's device.** The filesystem and test results are simulated in JavaScript memory only. Closing or switching away from Flow cancels timers and discards the session. No backend or build tooling is required; GitHub Pages is supported.

## so_long: playable browser adaptation (V25)

Open from the so_long project's **Try Demo** button or type `open solong` in Minishell. Both share the same dialog as the other miniatures.

- This is an actual **playable JavaScript Canvas adaptation** of the C/MiniLibX game, not the original C executable, WebAssembly, or a static animation.
- Uses **44 unmodified PNG sprites** from the user's supplied `spikes(1).zip`: floor, walls, knight movement, collectible coin animation, door frames, goblin walking frames (left/right), and attacks.
- Three short levels with level/map validation (rectangular, wall-enclosed, one player, one exit, accessible coins/exit).
- Keyboard: **WASD** or **arrow keys** to move, **R** to restart. Touch direction buttons work on phones/tablets.
- Collect all coins, then enter the unlocked exit. Goblins patrol and cause game over on contact. Retry after loss and proceed to the next level after a win.
- A compact title/start screen, level counter, move count, coin counter, exit state, and restart button are included.
- Animations are drawn with `image-rendering: pixelated` to retain the original 32×32 pixel-art style.
- Switching to another demo or closing the popup ends the animation loop and releases event listeners. No downloads, external game library, or backend are required.

The `assets/sprites/solong` directory contains only browser-ready PNGs. The redundant XPM sources were not copied into the website; they remain in the original uploaded sprite archive and the developer's native game project.

## File organization

- `css/style.css` — existing design
- `css/animations.css` — existing animations
- `css/modal.css` — shared modal and Minishell styles
- `css/face.css` — Face Attendance demo styles
- `css/flow.css` — Flow CLI two-pane workflow UI
- `css/solong.css` — responsive pixel-game and mobile-control layout
- `js/main.js` — portfolio interactions and demo routing
- `js/modal.js` — shared popup lifecycle and cleanup
- `js/demos/minishell.js` — dynamic portfolio explorer
- `js/demos/face.js` — optional camera and on-device face detector
- `js/demos/flow.js` — automatic saved-workflow replay and virtual filesystem
- `js/demos/solong.js` — playable Canvas game, three levels, collision and enemy logic
- `assets/sprites/solong` — original browser-ready pixel-art sprites supplied by the developer
- `assets/images` — original background and placeholder portrait
- `assets/docs` — **placeholder résumé**; replace with your real PDF before publishing

## Deployment

Upload the folder contents to a public GitHub Pages repository and enable Pages in repository settings. Keep all relative file paths unchanged. The Face Attendance demo requires the page to be loaded over HTTPS. If the external MediaPipe library/model cannot load, a clear error appears and the camera stops.

### V23 playback and tree refinements

Flow runs automatically with a deliberate ~1.45 second per-command rhythm: the command appears, then the filesystem changes, then playback continues. No Next control is required. The live workspace now has a true nested directory tree, folder/file icons, branch guides, directories-first sorting, and an active-directory marker. The tree follows the latest change during replay. These changes do not alter any workflows or execute real files.

### V24 visual and playback refinements

- Remove the virtual `/workspace` root from the visible file tree; only actual project folders and their children are displayed. Internal path sandboxing remains unchanged.
- Add a live 0.1×–1.0× speed slider (default 1.0×). At 0.9×–0.1× commands play progressively more slowly; changes also work during a replay. Pause and Resume preserve timing instead of skipping ahead.
- Enhance the primary CTA's moving white hover reflection without changing its emerald base color.
- In Example 1, simulate cloning a fictional libft repository (`https://example.invalid/libs/libft.git`) into `myapp/lib/libft`, including headers, C source files, and a Makefile. No network request is made.

## V26 minor UI refinements

- The hero **Résumé** download button uses a downward arrow (`↓`), distinguishing the download from external navigation. The bundled PDF is still a placeholder.
- Toolkit cards preview details when hovered on desktop, and **click/tap pins the back side** until clicked again. Clicking while hovering now pins rather than immediately closing. Keyboard activation also toggles the pinned state. Accessible pressed state reflects pinning rather than hover.
- The back-face instruction reflects whether a card is pinned. No game, shell, workflow, or camera behavior was changed.


## V27 — Content and Engineering Overviews

- Existing V26 layout, animations, keyboard navigation, and four demos remain unchanged.
- Revised the hero, four engineering focus areas, and project-card descriptions.
- Each project card has a **View Project Overview** button opening an accessible native dialog with technical background, implementation, challenges, and lessons.
- Six Toolkit flip cards replace the original three; existing hover/click-to-pin interactions are reused.
- Added a short engineering-mindset paragraph and expanded Flow's motivation, current scope, and longer-term vision.
- Preserved the latest approved sample résumé PDF as `assets/docs/Lin_Thant_Kyaw_Resume.pdf`; replace that file after editing your CV.
- Overviews are in `<template>` elements in `index.html`; edit the templates to change their content.
- `js/overviews.js` and `css/overview.css` implement the new project-information dialog independently from the demo modal.


### V27.1 — Project overview visibility fix
- Scope the IntersectionObserver reveal CSS and the observed section list to direct children of `main`, so cloned case-study sections in the overview dialog are always visible.
- Bump the CSS and main script query versions to avoid stale browser cache. No content, project cards, demos or layout changes.

## V27.2 — Source formatting

- Reindented `index.html` using the original V26 four-space HTML nesting style.
- Expanded the new `css/overview.css` rules into readable blocks.
- The HTML structure, project and skill content, JavaScript logic, CSS styling, and all interactive demos remain unchanged.
