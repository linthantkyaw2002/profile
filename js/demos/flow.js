// Flow CLI miniature — automatic playback over a safe, in-memory filesystem.
// No actual shell commands, Git requests, scripts, or file operations take place.
const ROOT = "/workspace";
const WORKFLOWS = {
    example1: {
        title: "Complex C project template",
        summary: "Create a C project template and clone a sample libft library into lib/.",
        seed: "empty",
        commands: [
            { text: "mkdir -p myapp/src/core myapp/src/utils", type: "mkdir", paths: ["myapp/src/core", "myapp/src/utils"] },
            { text: "mkdir -p myapp/include myapp/lib", type: "mkdir", paths: ["myapp/include", "myapp/lib"] },
            { text: "git clone https://example.invalid/libs/libft.git myapp/lib/libft", type: "clone", repo: "libft", destination: "myapp/lib/libft" },
            { text: "mkdir -p myapp/tests/unit myapp/tests/integration", type: "mkdir", paths: ["myapp/tests/unit", "myapp/tests/integration"] },
            { text: "mkdir -p myapp/docs myapp/scripts", type: "mkdir", paths: ["myapp/docs", "myapp/scripts"] },
            { text: "touch myapp/src/main.c", type: "touch", paths: ["myapp/src/main.c"] },
            { text: "touch myapp/src/core/init.c", type: "touch", paths: ["myapp/src/core/init.c"] },
            { text: "touch myapp/src/utils/logger.c", type: "touch", paths: ["myapp/src/utils/logger.c"] },
            { text: "touch myapp/include/app.h", type: "touch", paths: ["myapp/include/app.h"] },
            { text: "touch myapp/tests/unit/test_core.sh", type: "touch", paths: ["myapp/tests/unit/test_core.sh"] },
            { text: "touch myapp/tests/integration/test_app.sh", type: "touch", paths: ["myapp/tests/integration/test_app.sh"] },
            { text: "touch myapp/scripts/build.sh", type: "touch", paths: ["myapp/scripts/build.sh"] },
            { text: "touch myapp/Makefile myapp/README.md", type: "touch", paths: ["myapp/Makefile", "myapp/README.md"] }
        ]
    },
    example2: {
        title: "Four testers, four directories",
        summary: "Move among test suites using relative paths and simulate four test runs.",
        seed: "tests",
        commands: [
            { text: "cd project/tests/unit", type: "cd", path: "project/tests/unit" },
            { text: "./tester1.sh", type: "test", file: "tester1.sh", result: "Unit checks: PASS" },
            { text: "cd ../integration", type: "cd", path: "../integration" },
            { text: "./tester2.sh", type: "test", file: "tester2.sh", result: "Integration checks: PASS" },
            { text: "cd ../regression", type: "cd", path: "../regression" },
            { text: "./tester3.sh", type: "test", file: "tester3.sh", result: "Regression checks: PASS" },
            { text: "cd ../performance", type: "cd", path: "../performance" },
            { text: "./tester4.sh", type: "test", file: "tester4.sh", result: "Performance checks: PASS" },
            { text: "cd ../../src", type: "cd", path: "../../src" },
            { text: "make", type: "build", result: "Build target: PASS (simulated)" }
        ]
    },
    example3: {
        title: "Combine two Git starter repositories",
        summary: "Clone fictional repositories, copy selected source files, and clean up a combined app.",
        seed: "empty",
        commands: [
            { text: "git clone https://example.invalid/demo/ui-starter.git", type: "clone", repo: "ui-starter" },
            { text: "git clone https://example.invalid/demo/api-starter.git", type: "clone", repo: "api-starter" },
            { text: "mkdir -p combined-app/frontend combined-app/backend", type: "mkdir", paths: ["combined-app/frontend", "combined-app/backend"] },
            { text: "cp -R ui-starter/src/. combined-app/frontend/", type: "copy", from: "ui-starter/src", to: "combined-app/frontend" },
            { text: "cp -R api-starter/src/. combined-app/backend/", type: "copy", from: "api-starter/src", to: "combined-app/backend" },
            { text: "rm -f combined-app/frontend/demo.js", type: "remove", path: "combined-app/frontend/demo.js" },
            { text: "rm -f combined-app/backend/legacy.js", type: "remove", path: "combined-app/backend/legacy.js" },
            { text: "touch combined-app/README.md combined-app/.env.example", type: "touch", paths: ["combined-app/README.md", "combined-app/.env.example"] },
            { text: "touch combined-app/frontend/config.js", type: "touch", paths: ["combined-app/frontend/config.js"] },
            { text: "touch combined-app/backend/.env.example", type: "touch", paths: ["combined-app/backend/.env.example"] }
        ]
    }
};

// A deliberate pace helps visitors follow each filesystem change without
// requiring manual Next actions. Times are milliseconds, not animation speed.
const REPLAY_TIMING = Object.freeze({ begin: 600, command: 760, result: 690 });

const REPOS = {
    // Fictional repository contents; no remote Git operation is performed.
    "libft": ["libft.h", "Makefile", "src/ft_strlen.c", "src/ft_split.c", "README.md"],
    "ui-starter": ["src/App.js", "src/theme.css", "src/demo.js", "README.md"],
    "api-starter": ["src/server.js", "src/routes.js", "src/legacy.js", "README.md"]
};

export function createFlowDemo({ container, backToShell }) {
    container.innerHTML = `
        <div class="flow-demo">
            <div class="flow-heading">
                <div>
                    <span class="flow-eyebrow">DEVELOPER TOOL / BROWSER SIMULATION</span>
                    <h2>Flow CLI <span>· Workflow Replay</span></h2>
                </div>
                <button class="flow-back" type="button">← Minishell</button>
            </div>
            <p class="flow-explainer">Type <code>flow run example1</code> to watch a saved workflow run automatically. Commands and files below are simulated.</p>
            <div class="flow-layout">
                <div class="flow-terminal-panel">
                    <div class="flow-pane-heading"><span>TERMINAL</span><span class="flow-state" role="status">READY</span></div>
                    <div class="flow-terminal-scroll" aria-label="Flow terminal output">
                        <div class="flow-history" role="log" aria-label="Workflow transcript" aria-live="polite"></div>
                        <form class="flow-form" autocomplete="off">
                            <label for="flow-command" class="flow-prompt">$</label>
                            <input id="flow-command" class="flow-input" aria-label="Flow CLI command" spellcheck="false" autocapitalize="none" autocomplete="off" maxlength="100" placeholder="Type a Flow command..." />
                            <button class="flow-enter" type="submit" aria-label="Run command">↵</button>
                        </form>
                    </div>
                    <div class="flow-quick" aria-label="Suggested Flow commands">
                        <button type="button" data-command="flow list">flow list</button>
                        <button type="button" data-command="flow run example1">example1</button>
                        <button type="button" data-command="flow run example2">example2</button>
                        <button type="button" data-command="flow run example3">example3</button>
                    </div>
                </div>
                <div class="flow-workspace-panel">
                    <div class="flow-pane-heading"><span>LIVE WORKSPACE</span><span class="flow-count">0 items</span></div>
                    <div class="flow-live-command" aria-label="Current replay command">
                        <span class="flow-live-label">CURRENT COMMAND <span class="flow-live-phase">READY</span></span>
                        <code class="flow-live-text">Choose a workflow above to watch its effects here.</code>
                    </div>
                    <div class="flow-workspace-meta"><span class="flow-cwd">/</span><span class="flow-activity">Awaiting replay</span></div>
                    <div class="flow-files" role="tree" aria-label="Simulated project filesystem"></div>
                    <div class="flow-tests" aria-label="Simulated tester results"></div>
                </div>
            </div>
            <div class="flow-bottom">
                <div class="flow-progress-wrap">
                    <span class="flow-progress-label">Choose a workflow to begin</span>
                    <div class="flow-progress-track" role="progressbar" aria-label="Workflow progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="flow-progress-fill"></span></div>
                </div>
                <div class="flow-speed-control">
                    <div class="flow-speed-heading"><label for="flow-speed">Playback speed</label><output class="flow-speed-value" for="flow-speed">1.0×</output></div>
                    <input id="flow-speed" class="flow-speed-slider" type="range" min="0.1" max="1" step="0.1" value="1" aria-label="Playback speed" aria-valuetext="1.0 times normal speed" />
                    <div class="flow-speed-ends" aria-hidden="true"><span>0.1×</span><span>1×</span></div>
                </div>
                <div class="flow-controls">
                    <button type="button" class="flow-control flow-pause" disabled>Pause</button>
                    <button type="button" class="flow-control flow-stop" disabled>Stop</button>
                </div>
            </div>
            <p class="flow-note">All workflows run entirely in memory. No real files, repositories, or tester scripts are accessed.</p>
        </div>`;

    const $ = selector => container.querySelector(selector);
    const transcript = $(".flow-history");
    const transcriptScroll = $(".flow-terminal-scroll");
    const form = $(".flow-form");
    const input = $(".flow-input");
    const tree = $(".flow-files");
    const tests = $(".flow-tests");
    const status = $(".flow-state");
    const fileCount = $(".flow-count");
    const cwdLabel = $(".flow-cwd");
    const activity = $(".flow-activity");
    const liveCommand = $(".flow-live-text");
    const livePhase = $(".flow-live-phase");
    const progressLabel = $(".flow-progress-label");
    const progressTrack = $(".flow-progress-track");
    const progressFill = $(".flow-progress-fill");
    const pauseButton = $(".flow-pause");
    const stopButton = $(".flow-stop");
    const backButton = $(".flow-back");
    const speedInput = $(".flow-speed-slider");
    const speedValue = $(".flow-speed-value");

    let fs = new Map();
    let cwd = ROOT;
    let changed = new Set();
    let activePath = "";
    let testResults = [];
    let current = null;
    let stepIndex = 0;
    let phase = "before";
    let timer = 0;
    let playbackSpeed = 1;
    // Base milliseconds remaining until the next phase of playback.
    // Tracking it keeps Pause/Resume and live speed changes accurate.
    let remainingDelay = 0;
    let timerStartedAt = 0;
    let playing = false;
    let paused = false;
    let destroyed = false;
    const commands = [];
    let commandIndex = 0;
    let savedDraft = "";

    function pathOf(raw) {
        if (!raw || typeof raw !== "string") throw new Error("Invalid path");
        const input = raw.startsWith("/") ? raw : `${cwd}/${raw}`;
        const parts = [];
        for (const part of input.split("/")) {
            if (!part || part === ".") continue;
            if (part === "..") parts.pop();
            else parts.push(part);
        }
        const resolved = "/" + parts.join("/");
        if (resolved !== ROOT && !resolved.startsWith(ROOT + "/")) throw new Error("Path outside /workspace");
        return resolved;
    }

    function parentOf(path) { return path.slice(0, path.lastIndexOf("/")) || "/"; }
    function displayPath(path) { return path === ROOT ? "/" : path.slice(ROOT.length); }

    function folder(path, recursive = false) {
        const target = pathOf(path);
        if (target === ROOT) return;
        const parent = parentOf(target);
        if (!fs.has(parent)) {
            if (!recursive) throw new Error(`Missing parent: ${parent}`);
            folder(parent, true);
        }
        if (fs.get(parent)?.kind !== "folder") throw new Error(`Not a directory: ${parent}`);
        if (fs.has(target) && fs.get(target).kind !== "folder") throw new Error(`File already exists: ${target}`);
        if (!fs.has(target)) { fs.set(target, {kind: "folder"}); changed.add(target); }
    }

    function file(path) {
        const target = pathOf(path);
        const parent = parentOf(target);
        if (fs.get(parent)?.kind !== "folder") throw new Error(`Missing directory: ${parent}`);
        if (fs.get(target)?.kind === "folder") throw new Error(`Is a directory: ${target}`);
        fs.set(target, { kind: "file" });
        changed.add(target);
    }

    function resetFilesystem(seed = "empty") {
        fs = new Map([[ROOT, { kind: "folder" }]]);
        cwd = ROOT;
        changed = new Set();
        activePath = "";
        testResults = [];
        if (seed === "tests") {
            folder("project/src", true);
            for (const [dir, script] of [["unit", "tester1.sh"], ["integration", "tester2.sh"], ["regression", "tester3.sh"], ["performance", "tester4.sh"]]) {
                folder(`project/tests/${dir}`, true);
                file(`project/tests/${dir}/${script}`);
                testResults.push({ name: script, result: "WAITING" });
            }
            file("project/src/main.c");
        }
        changed.clear();
        renderFiles();
    }

    function showText(text, style = "") {
        if (destroyed) return null;
        const line = document.createElement("div");
        line.className = `flow-line ${style}`.trim();
        line.textContent = text;
        transcript.appendChild(line);
        while (transcript.childElementCount > 140) transcript.firstElementChild.remove();
        transcriptScroll.scrollTop = transcriptScroll.scrollHeight;
        return line;
    }

    function setLiveCommand(command, state = "ready") {
        liveCommand.textContent = command;
        livePhase.textContent = state === "running" ? "RUNNING" : state === "done" ? "DONE"
            : state === "error" ? "ERROR" : state === "complete" ? "COMPLETE" : "READY";
        livePhase.dataset.state = state;
    }

    function updateMeta() {
        cwdLabel.textContent = displayPath(cwd);
        fileCount.textContent = `${Math.max(0, fs.size - 1)} items`;
        const total = current?.commands.length || 0;
        const value = total ? Math.round((stepIndex / total) * 100) : 0;
        progressTrack.setAttribute("aria-valuenow", String(value));
        progressFill.style.width = `${value}%`;
        progressLabel.textContent = current ? `${current.title} · ${stepIndex}/${total} commands` : "Choose a workflow to begin";
        status.textContent = paused ? "PAUSED" : playing ? "RUNNING" : current && stepIndex >= total ? "COMPLETE" : "READY";
        status.dataset.state = status.textContent.toLowerCase();
        pauseButton.disabled = !playing && !paused;
        stopButton.disabled = !playing && !paused;
        pauseButton.textContent = paused ? "Resume" : "Pause";
    }

    // Render an actual nested hierarchy instead of positioning a flat list
    // with increasing padding. Directories appear first, files second.
    function renderFiles() {
        tree.replaceChildren();
        const byParent = new Map();
        for (const [path] of fs) {
            if (path === ROOT) continue;
            const parent = parentOf(path);
            if (!byParent.has(parent)) byParent.set(parent, []);
            byParent.get(parent).push(path);
        }
        for (const siblings of byParent.values()) {
            siblings.sort((a, b) => {
                const aIsFolder = fs.get(a).kind === "folder";
                const bIsFolder = fs.get(b).kind === "folder";
                if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
                return a.split("/").pop().localeCompare(b.split("/").pop(), undefined, { numeric: true, sensitivity: "base" });
            });
        }

        function createNode(path, depth) {
            const info = fs.get(path);
            const isFolder = info.kind === "folder";
            const li = document.createElement("li");
            li.className = "flow-tree-item";
            li.setAttribute("role", "none");

            const row = document.createElement("div");
            row.className = "flow-file-row" + (changed.has(path) ? " is-changed" : "")
                + (cwd === path && path !== ROOT ? " is-current" : "")
                + (activePath === path ? " is-active" : "");
            row.dataset.path = path;
            row.setAttribute("role", "treeitem");
            row.setAttribute("aria-level", String(depth));
            if (isFolder) row.setAttribute("aria-expanded", "true");

            const glyph = document.createElement("span");
            glyph.className = "flow-file-icon " + (isFolder ? "flow-icon-folder" : "flow-icon-file");
            glyph.setAttribute("aria-hidden", "true");

            const label = document.createElement("span");
            label.className = "flow-node-label";
            label.textContent = path.split("/").pop();

            row.append(glyph, label);
            if (isFolder) {
                const slash = document.createElement("span");
                slash.className = "flow-folder-slash";
                slash.textContent = "/";
                slash.setAttribute("aria-hidden", "true");
                row.appendChild(slash);
            }
            if (cwd === path && path !== ROOT) {
                const badge = document.createElement("span");
                badge.className = "flow-node-badge";
                badge.textContent = "cwd";
                row.appendChild(badge);
            }
            li.appendChild(row);

            const children = byParent.get(path);
            if (children && children.length) {
                const group = document.createElement("ul");
                group.className = "flow-tree-children";
                group.setAttribute("role", "group");
                for (const child of children) group.appendChild(createNode(child, depth + 1));
                li.appendChild(group);
            }
            return li;
        }

        const rootList = document.createElement("ul");
        rootList.className = "flow-tree-list";
        rootList.setAttribute("role", "none");
        const topLevel = byParent.get(ROOT) || [];
        for (const child of topLevel) rootList.appendChild(createNode(child, 1));
        tree.appendChild(rootList);
        if (!topLevel.length) {
            const empty = document.createElement("p");
            empty.className = "flow-empty-state";
            empty.textContent = "No files yet. Run a saved workflow to build the project tree.";
            tree.appendChild(empty);
        }

        tests.replaceChildren();
        for (const item of testResults) {
            const row = document.createElement("div");
            row.className = "flow-test-row";
            const label = document.createElement("span");
            label.textContent = item.name;
            const result = document.createElement("strong");
            result.textContent = item.result;
            result.className = item.result === "PASS" ? "passed" : "";
            row.append(label, result);
            tests.appendChild(row);
        }
        fileCount.textContent = `${Math.max(0, fs.size - 1)} items`;

        // Follow the most recent filesystem effect, not merely the last item
        // in alphabetic order. Prefer a highlighted active cwd/test/clone.
        const recent = [...changed].at(-1);
        const pathToFollow = activePath || recent || (cwd === ROOT ? "" : cwd);
        const target = [...tree.querySelectorAll(".flow-file-row")].find(row => row.dataset.path === pathToFollow);
        if (target) {
            const area = tree.getBoundingClientRect();
            const row = target.getBoundingClientRect();
            if (row.bottom > area.bottom - 10) tree.scrollTop += row.bottom - area.bottom + 17;
            else if (row.top < area.top + 10) tree.scrollTop -= area.top - row.top + 17;
        }
    }

    function execute(spec) {
        changed.clear();
        activePath = "";
        switch (spec.type) {
        case "mkdir":
            for (const path of spec.paths) folder(path, true);
            activity.textContent = "Created folders";
            return `Created ${spec.paths.length} directories`;
        case "touch":
            for (const path of spec.paths) file(path);
            activity.textContent = "Added files";
            return `Created ${spec.paths.length} file${spec.paths.length === 1 ? "" : "s"}`;
        case "cd": {
            const path = pathOf(spec.path);
            if (fs.get(path)?.kind !== "folder") throw new Error(`Directory not found: ${spec.path}`);
            cwd = path;
            activePath = path;
            activity.textContent = "Changed directory";
            return `Working directory → ${displayPath(path)}`;
        }
        case "test": {
            const location = pathOf(spec.file);
            if (fs.get(location)?.kind !== "file") throw new Error(`Tester not found: ${location}`);
            activePath = location;
            const tester = testResults.find(test => test.name === spec.file);
            if (tester) tester.result = "PASS";
            activity.textContent = `${spec.file}: PASS`;
            return `${spec.result} (simulated)`;
        }
        case "build":
            if (fs.get(pathOf("main.c"))?.kind !== "file") throw new Error("Missing main.c in current directory");
            activity.textContent = "Build simulated";
            return spec.result;
        case "clone": {
            if (!(spec.repo in REPOS)) throw new Error("Unknown sample repository");
            const dest = pathOf(spec.destination || spec.repo);
            if (fs.has(dest)) throw new Error("Repository folder already exists");
            if (fs.get(parentOf(dest))?.kind !== "folder") throw new Error(`Missing clone destination parent: ${parentOf(dest)}`);
            folder(dest);
            for (const entry of REPOS[spec.repo]) {
                const target = `${dest}/${entry}`;
                folder(parentOf(target), true);
                file(target);
            }
            activePath = dest;
            activity.textContent = `${spec.repo} cloned (mock)`;
            return `Simulated clone → ${displayPath(dest)}`;
        }
        case "copy": {
            const source = pathOf(spec.from);
            const dest = pathOf(spec.to);
            if (fs.get(source)?.kind !== "folder" || fs.get(dest)?.kind !== "folder") throw new Error("Copy source or destination missing");
            const entries = [...fs.entries()].filter(([path]) => path.startsWith(source + "/"));
            // Copy parents before children and preserve their types.
            entries.sort((a, b) => a[0].length - b[0].length);
            for (const [path, info] of entries) {
                const target = dest + path.slice(source.length);
                if (info.kind === "folder") folder(target, true);
                else file(target);
            }
            changed.add(source);
            activePath = dest;
            activity.textContent = "Copied source files";
            return `Copied ${entries.filter(([, info]) => info.kind === "file").length} files`;
        }
        case "remove": {
            const path = pathOf(spec.path);
            if (fs.get(path)?.kind !== "file") throw new Error(`File not found: ${spec.path}`);
            fs.delete(path);
            activePath = parentOf(path);
            activity.textContent = `Removed ${path.split("/").pop()}`;
            return `Removed ${path.split("/").pop()}`;
        }
        default:
            throw new Error("Unsupported demo action");
        }
    }

    function cancelTimer() {
        window.clearTimeout(timer);
        timer = 0;
    }

    function saveRemainingDelay() {
        if (!timer) return;
        remainingDelay = Math.max(0, remainingDelay - (performance.now() - timerStartedAt) * playbackSpeed);
        cancelTimer();
    }

    function scheduleNext(baseMilliseconds) {
        remainingDelay = Math.max(0, baseMilliseconds);
        timerStartedAt = performance.now();
        timer = window.setTimeout(() => {
            timer = 0;
            remainingDelay = 0;
            advance();
        }, remainingDelay / playbackSpeed);
    }

    function stopReplay(message = "Playback stopped") {
        cancelTimer();
        remainingDelay = 0;
        if (playing || paused) {
            showText(message, "flow-notice");
            setLiveCommand(message || "Replay stopped", "ready");
        }
        playing = false;
        paused = false;
        phase = "before";
        updateMeta();
    }

    // Two phases per command: display the command, then apply its filesystem effect.
    // Playback moves to the following command automatically; no Next button needed.
    function advance() {
        if (destroyed || !playing || paused || !current) return;
        const spec = current.commands[stepIndex];
        if (!spec) {
            playing = false;
            showText(`✓ Workflow completed: ${stepIndex}/${current.commands.length} commands`, "flow-success");
            activity.textContent = "Replay finished";
            setLiveCommand(`Completed ${stepIndex}/${current.commands.length} commands`, "complete");
            updateMeta();
            return;
        }
        if (phase === "before") {
            changed.clear();
            activePath = "";
            renderFiles();
            showText(`$ ${spec.text}`, "flow-command-line");
            setLiveCommand(`$ ${spec.text}`, "running");
            activity.textContent = "Executing command...";
            phase = "execute";
            scheduleNext(REPLAY_TIMING.command);
            return;
        }
        if (phase === "execute") {
            try {
                const result = execute(spec);
                showText(`✓ ${result}`, "flow-success");
                setLiveCommand(`$ ${spec.text}`, "done");
                stepIndex++;
                renderFiles();
                updateMeta();
                phase = "waiting";
                scheduleNext(REPLAY_TIMING.result);
            } catch (error) {
                showText(`✗ ${error.message}`, "flow-error");
                setLiveCommand(`${spec.text} — ${error.message}`, "error");
                activity.textContent = "Workflow stopped on error";
                playing = false;
                paused = false;
                phase = "before";
                updateMeta();
            }
            return;
        }
        phase = "before";
        advance();
    }

    function start(name) {
        const selected = WORKFLOWS[name];
        if (!selected) { showText("Unknown workflow. Try 'flow list'.", "flow-error"); return; }
        stopReplay("");
        current = selected;
        stepIndex = 0;
        phase = "before";
        resetFilesystem(selected.seed);
        setLiveCommand(`Preparing ${name}…`, "ready");
        updateMeta();
        transcript.replaceChildren();
        showText(`$ flow run ${name}`, "flow-command-line");
        showText(`Replay: ${selected.title} · ${selected.commands.length} commands`, "flow-notice");
        playing = true;
        paused = false;
        updateMeta();
        scheduleNext(REPLAY_TIMING.begin);
    }

    function submitCommand(text) {
        const raw = text.trim().replace(/\s+/g, " ").slice(0, 100);
        if (!raw || destroyed) return;
        commands.push(raw);
        if (commands.length > 60) commands.shift();
        commandIndex = commands.length;
        savedDraft = "";
        input.value = "";
        const tokens = raw.toLowerCase().split(" ");
        if (tokens[0] === "flow" && tokens[1] === "run" && tokens.length === 3) {
            start(tokens[2]);
            return;
        }
        if (tokens[0] === "flow" && tokens[1] === "stop" && tokens.length === 2) {
            showText(`$ ${raw}`, "flow-command-line");
            if (!playing && !paused) showText("No workflow currently running.", "flow-notice");
            else stopReplay("Replay stopped.");
            return;
        }
        if (playing || paused) {
            showText("Replay is active. Use Pause/Stop or run a different example.", "flow-notice");
            return;
        }
        showText(`$ ${raw}`, "flow-command-line");
        if (raw.toLowerCase() === "flow list") {
            for (const [key, workflow] of Object.entries(WORKFLOWS)) showText(`${key} — ${workflow.title}`, "flow-list-line");
        } else if (tokens[0] === "flow" && tokens[1] === "list" && tokens.length === 3) {
            const item = WORKFLOWS[tokens[2]];
            if (!item) showText("Unknown workflow. Use 'flow list'.", "flow-error");
            else item.commands.forEach((spec, index) => showText(`${String(index + 1).padStart(2, "0")}. ${spec.text}`));
        } else if (tokens[0] === "clear" && tokens.length === 1) {
            transcript.replaceChildren();
        } else if (tokens[0] === "help" && tokens.length === 1) {
            ["flow list                 List saved examples", "flow list example1        Preview commands", "flow run example1         Autoplay project template", "flow run example2         Autoplay four testers", "flow run example3         Autoplay repository mix", "flow stop                 Cancel replay", "clear                     Clear terminal"].forEach(text => showText(text));
        } else {
            showText("Unknown command. Type 'help' or 'flow list'.", "flow-error");
        }
    }

    function onInputKeydown(event) {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            if (!commands.length) return;
            event.preventDefault();
            if (commandIndex === commands.length) savedDraft = input.value;
            commandIndex = event.key === "ArrowUp" ? Math.max(0, commandIndex - 1) : Math.min(commands.length, commandIndex + 1);
            input.value = commandIndex === commands.length ? savedDraft : commands[commandIndex];
        }
        if (event.key === "Tab") {
            const parts = input.value.trim().split(/\s+/);
            const options = ["help", "clear", "flow list", "flow run example1", "flow run example2", "flow run example3", "flow stop"];
            const matches = options.filter(option => option.startsWith(input.value.toLowerCase()));
            if (matches.length === 1) { event.preventDefault(); input.value = matches[0]; }
        }
    }

    form.addEventListener("submit", event => { event.preventDefault(); submitCommand(input.value); input.focus(); });
    input.addEventListener("keydown", onInputKeydown);
    container.querySelectorAll(".flow-quick [data-command]").forEach(button => button.addEventListener("click", () => {
        submitCommand(button.dataset.command);
        input.focus();
    }));
    speedInput.addEventListener("input", () => {
        if (playing && !paused) saveRemainingDelay();
        playbackSpeed = Number(speedInput.value);
        speedValue.textContent = `${playbackSpeed.toFixed(1)}×`;
        speedInput.setAttribute("aria-valuetext", `${playbackSpeed.toFixed(1)} times normal speed`);
        if (playing && !paused) scheduleNext(remainingDelay);
    });
    pauseButton.addEventListener("click", () => {
        if (paused) {
            paused = false;
            playing = true;
            updateMeta();
            scheduleNext(remainingDelay);
        } else if (playing) {
            saveRemainingDelay();
            paused = true;
            playing = false;
            updateMeta();
        }
    });
    stopButton.addEventListener("click", () => stopReplay());
    backButton.addEventListener("click", () => { stopReplay(""); backToShell(); });

    resetFilesystem();
    showText("Flow CLI browser simulator. Type 'flow list' or 'flow run example1' to begin.", "flow-notice");
    updateMeta();

    return {
        // Avoid summoning a virtual keyboard when a visitor only wants to watch playback.
        focus() {
            if (!window.matchMedia("(hover: none) and (pointer: coarse)").matches) {
                input.focus({ preventScroll: true });
            }
        },
        destroy() { destroyed = true; cancelTimer(); playing = false; paused = false; }
    };
}
