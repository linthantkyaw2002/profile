// Portfolio Minishell — a lightweight browser simulation, not a system shell.
// No eval, subprocesses, servers or filesystem access. All output is local.
export function createMinishell({ container, close, launchDemo }) {
    const roots = ["help", "ls", "cat", "goto", "open", "history", "clear"];
    const normalize = value => value.toLowerCase().normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
    const slug = value => normalize(value).replace(/[^a-z0-9]+/g, "");

    // Normalize whitespace from the live HTML, including line breaks and indentation.
    // This avoids copying source-code whitespace into terminal output.
    const textOf = element => element?.textContent.replace(/\s+/g, " ").trim() || "";

    // Read from the CURRENT document whenever a command runs. A new project card,
    // heading, section, or link shows up without editing a separate shell list.
    function readCatalog() {
        const sections = new Map();
        document.querySelectorAll("main section[id]").forEach(section => {
            const key = slug(section.id);
            const heading = textOf(section.querySelector("h1, h2"))
                || section.getAttribute("aria-label") || section.id;
            const intro = textOf(section.querySelector(".section-heading p, .hero-description, .contact-card p"));
            const lines = [heading];

            if (intro) lines.push(intro);

            if (key === "focus") {
                // Focus entries have actual h3 and p elements.
                for (const item of section.querySelectorAll(".strength")) {
                    const title = textOf(item.querySelector("h3"));
                    const summary = textOf(item.querySelector("p"));
                    if (title) lines.push(`${title}${summary ? ": " + summary : ""}`);
                }
            } else if (key === "skills") {
                // Skills use flip-card spans/strong tags, NOT h3/p elements.
                // Read the visible front summary only, rather than the hidden back
                // and its helper text, so each skill appears once and stays concise.
                for (const card of section.querySelectorAll(".skill-card")) {
                    const title = textOf(card.querySelector(".skill-title"))
                        || card.getAttribute("data-skill") || "";
                    const summary = textOf(card.querySelector(".skill-summary"));
                    if (title) lines.push(`${title}${summary ? ": " + summary : ""}`);
                }
            } else if (key === "now") {
                // Include the currently featured project's details, not just
                // the generic introductory paragraph above the project.
                const details = section.querySelector(".now-details");
                if (details) {
                    const category = textOf(details.querySelector(".eyebrow"));
                    const title = textOf(details.querySelector("h3"));
                    const summary = textOf(details.querySelector("p"));
                    if (category) lines.push(category);
                    if (title) lines.push(title);
                    if (summary) lines.push(summary);
                }
            } else if (key === "contact") {
                // Pull live contact destinations from anchors; no hardcoded email
                // or LinkedIn profile inside the Minishell source.
                for (const anchor of section.querySelectorAll(".contact-actions a[href]")) {
                    const href = anchor.getAttribute("href")?.trim() || "";
                    if (/^mailto:/i.test(href)) {
                        lines.push(`Email: ${decodeURIComponent(href.slice(7).split("?")[0])}`);
                    } else if (/linkedin\.com/i.test(href)) {
                        lines.push(`LinkedIn: ${anchor.href}`);
                    }
                }
            }

            sections.set(key, {
                key,
                element: section,
                description: lines.filter(Boolean).join("\n")
            });
        });

        const projects = new Map();
        document.querySelectorAll(".project-card").forEach(card => {
            const name = textOf(card.querySelector(".project-info h3"));
            if (!name) return;
            const key = slug(name);
            const description = textOf(card.querySelector(".project-info > p"));
            const tech = [...card.querySelectorAll(".project-tags span")].map(textOf).join(" · ");
            projects.set(key, { key, name, card, description: `${name} — ${description}${tech ? "\nTechnologies: " + tech : ""}` });
        });

        const links = new Map();
        // Link destinations are taken from the live anchors, not copied URLs.
        const anchors = document.querySelectorAll("a[href]");
        anchors.forEach(anchor => {
            const href = anchor.getAttribute("href")?.trim();
            if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
            let destination;
            try { destination = new URL(href, document.baseURI); } catch { return; }
            if (!["https:", "http:", "mailto:"].includes(destination.protocol)) return;
            const text = normalize(textOf(anchor));
            let key = "";
            if (destination.protocol === "mailto:") key = "email";
            else if (/github\.com$/i.test(destination.hostname) && !anchor.closest(".project-card")) key = "github";
            else if (/linkedin\.com$/i.test(destination.hostname)) key = "linkedin";
            else if (/\.pdf$/i.test(destination.pathname) || /resume|résumé/i.test(text)) key = "resume";
            else if (anchor.closest(".project-card")) {
                const projectName = anchor.closest(".project-card").querySelector("h3")?.textContent || "project";
                key = "source-" + slug(projectName);
            } else if (destination.protocol !== "mailto:") {
                key = slug(text.replace(/↗|→|↓/g, "")) || slug(destination.hostname);
            }
            if (key && !links.has(key)) links.set(key, { key, href: destination.href,
                description: `${key === "email" ? "Email" : textOf(anchor)} — ${destination.protocol === "mailto:" ? destination.pathname : destination.href}` });
        });

        const demos = new Map();
        document.querySelectorAll("[data-demo]").forEach(button => {
            const key = slug(button.dataset.demo || "");
            if (!key) return;
            const card = button.closest(".project-card");
            const label = textOf(card?.querySelector("h3")) || key;
            demos.set(key, { key, label });
        });
        return { sections, projects, links, demos };
    }

    // Resolve natural shorthand from the current projects, e.g. `cat face`
    // finds "Face Attendance" and `open flow` refers to "Flow CLI".
    function resolveProject(input, projects) {
        const key = slug(input);
        if (projects.has(key)) return key;
        const matches = [...projects.keys()].filter(projectKey => projectKey.startsWith(key));
        return matches.length === 1 ? matches[0] : key;
    }

    // Only fixed application markup is written as HTML. User input is always textContent.
    container.innerHTML = `
        <div class="mini-shell">
            <div class="shell-intro">Interactive portfolio · Browser simulation <span class="shell-tag">no system commands</span></div>
            <div class="shell-output" id="shell-output" aria-label="Interactive terminal transcript">
                <div class="shell-history" id="shell-history" role="log" aria-label="Command output"
                    aria-live="polite" aria-relevant="additions text"></div>
                <form class="shell-form" id="shell-form" autocomplete="off">
                    <label class="shell-prompt" for="shell-input">lin@portfolio:~$</label>
                    <input class="shell-input" id="shell-input" type="text" spellcheck="false" autocapitalize="none"
                        autocomplete="off" aria-label="Enter a Minishell command" maxlength="180" />
                    <button class="shell-enter" type="submit" aria-label="Run command">↵</button>
                </form>
                <div class="shell-suggestions" id="shell-suggestions" aria-live="polite"></div>
            </div>
            <div class="shell-quick" aria-label="Suggested commands">
                <button type="button" data-command="help">help</button>
                <button type="button" data-command="ls">ls</button>
                <button type="button" data-command="cat projects">cat projects</button>
                <button type="button" data-command="ls demos">ls demos</button>
                <button type="button" data-command="clear">clear</button>
            </div>
            <div class="shell-footer">TAB autocomplete · ↑ / ↓ history · ESC to close</div>
        </div>`;

    const output = container.querySelector("#shell-output");
    const historyArea = container.querySelector("#shell-history");
    const input = container.querySelector("#shell-input");
    const form = container.querySelector("#shell-form");
    const suggestions = container.querySelector("#shell-suggestions");
    const commandHistory = [];
    let historyIndex = 0;
    let savedInput = "";
    const maxEntries = 100;

    function appendEntry(command, lines = [], buttons = []) {
        const entry = document.createElement("div");
        entry.className = "shell-entry";
        if (command !== null) {
            const echo = document.createElement("div");
            echo.className = "shell-echo";
            const prefix = document.createElement("span");
            prefix.className = "shell-dollar";
            prefix.textContent = "lin@portfolio:~$ ";
            echo.append(prefix, document.createTextNode(command));
            entry.appendChild(echo);
        }
        for (const line of lines) {
            const paragraph = document.createElement("div");
            paragraph.className = "shell-line";
            paragraph.textContent = line;
            entry.appendChild(paragraph);
        }
        if (buttons.length) {
            const row = document.createElement("div");
            row.className = "shell-results";
            for (const { label, next } of buttons) {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "shell-result";
                button.textContent = label;
                button.addEventListener("click", () => run(next));
                row.appendChild(button);
            }
            entry.appendChild(row);
        }
        historyArea.appendChild(entry);
        while (historyArea.childElementCount > maxEntries) historyArea.firstElementChild.remove();
        output.scrollTop = output.scrollHeight;
    }

    function groupButtons(items, action) {
        return items.map(item => ({ label: item, next: `${action} ${item}` }));
    }

    function openTarget(input, catalog) {
        const key = slug(input);
        const projectKey = resolveProject(input, catalog.projects);
        const demo = catalog.demos.get(key) || catalog.demos.get(projectKey);
        if (demo) {
            if (demo.key === "minishell") return ["You're already using the Minishell demo."];
            launchDemo(demo.key);
            return [`Launching ${demo.label}...`];
        }
        const link = catalog.links.get(input) || catalog.links.get(key);
        if (!link) {
            if (catalog.projects.has(projectKey)) return ["That project does not have a demo yet. Try 'cat " + projectKey + "' or 'open source-" + projectKey + "'."];
            return ["No launchable item with that name. Use 'ls links' or 'ls demos'."];
        }
        if (link.href.startsWith("mailto:")) {
            window.location.href = link.href;
            return ["Opening your email application..."];
        }
        window.open(link.href, "_blank", "noopener,noreferrer");
        return [`Opening ${link.key} in a new tab...`, "If blocked, use the corresponding link on the page."];
    }

    function run(rawValue) {
        const raw = rawValue.trim().replace(/\s+/g, " ").slice(0, 180);
        if (!raw) return;
        const catalog = readCatalog();
        input.value = "";
        suggestions.textContent = "";
        commandHistory.push(raw);
        if (commandHistory.length > 100) commandHistory.shift();
        historyIndex = commandHistory.length;
        savedInput = "";
        const first = normalize(raw.split(" ")[0]);
        const rest = raw.includes(" ") ? normalize(raw.slice(raw.indexOf(" ") + 1)) : "";
        const projectKey = resolveProject(rest, catalog.projects);

        if (first === "clear") {
            if (rest) appendEntry(raw, ["Usage: clear"]);
            else historyArea.replaceChildren();
            return;
        }
        if (first === "help") {
            appendEntry(raw, [
                "ls [sections|projects|links|demos] — browse this portfolio",
                "cat <item>                     — read a live page/project summary",
                "goto <section>                 — scroll to a section",
                "open <link|demo>               — open a link or mini application",
                "history                        — previous commands",
                "clear                          — clear terminal output",
                "TAB to autocomplete · ↑/↓ for history · click results to navigate."
            ], groupButtons(["sections", "projects", "links", "demos"], "ls"));
            return;
        }
        if (first === "history") {
            appendEntry(raw, commandHistory.map((cmd, i) => `${String(i + 1).padStart(2, " ")}  ${cmd}`));
            return;
        }
        if (first === "ls") {
            const groups = ["sections", "projects", "links", "demos"];
            if (!rest) {
                appendEntry(raw, ["Portfolio directories:"], groups.map(item => ({ label: item + "/", next: "ls " + item })));
            } else if (rest === "sections") {
                appendEntry(raw, ["Page sections — click to navigate:"], groupButtons([...catalog.sections.keys()], "goto"));
            } else if (rest === "projects") {
                appendEntry(raw, ["Featured projects — click for a description:"], [...catalog.projects.values()].map(project => ({ label: project.name, next: `cat ${project.key}` })));
            } else if (rest === "links") {
                appendEntry(raw, ["Detected links — click to open:"], groupButtons([...catalog.links.keys()], "open"));
            } else if (rest === "demos") {
                appendEntry(raw, ["Currently available interactive demos:"], groupButtons([...catalog.demos.keys()], "open"));
            } else appendEntry(raw, ["Unknown list. Use 'ls' for choices."]);
            return;
        }
        if (first === "cat") {
            if (!rest) { appendEntry(raw, ["Usage: cat <section|project|link|demo>"]); return; }
            if (catalog.projects.has(projectKey)) {
                const buttons = [];
                const demoKey = catalog.projects.get(projectKey).card.querySelector("[data-demo]")?.dataset.demo;
                if (demoKey && catalog.demos.has(slug(demoKey))) buttons.push({ label: "open " + demoKey, next: "open " + demoKey });
                if (catalog.links.has("source-" + projectKey)) buttons.push({ label: "source", next: "open source-" + projectKey });
                appendEntry(raw, [catalog.projects.get(projectKey).description], buttons);
            } else if (catalog.sections.has(slug(rest))) {
                const lines = slug(rest) === "projects"
                    ? [catalog.sections.get("projects").description, ...[...catalog.projects.values()].map(p => `• ${p.description}`)]
                    : [catalog.sections.get(slug(rest)).description];
                appendEntry(raw, lines, [{ label: "goto " + slug(rest), next: "goto " + slug(rest) }]);
            } else if (catalog.links.has(rest)) {
                appendEntry(raw, [catalog.links.get(rest).description], [{ label: "open " + rest, next: "open " + rest }]);
            } else if (["sections", "projects", "links", "demos"].includes(rest)) {
                appendEntry(raw, ["Run 'ls " + rest + "' to see current " + rest + "."]);
            } else appendEntry(raw, [`No summary found for '${rest}'. Try 'ls projects' or 'ls sections'.`]);
            return;
        }
        if (first === "goto") {
            const section = catalog.sections.get(slug(rest));
            if (!section) { appendEntry(raw, ["Usage: goto <section>", "Available: " + [...catalog.sections.keys()].join(", ")]); return; }
            appendEntry(raw, ["Navigating to " + section.key + "..."]);
            Promise.resolve(close()).then(() => {
                section.element.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
            });
            return;
        }
        if (first === "open") {
            if (!rest) appendEntry(raw, ["Usage: open <link|demo>. Try 'ls links' or 'ls demos'."]);
            else appendEntry(raw, openTarget(rest, catalog));
            return;
        }
        appendEntry(raw, [`minishell: command not found: ${first}`, "Type 'help' to see available commands."]);
    }

    function autocomplete() {
        const value = input.value;
        const match = value.match(/^(\s*)(\S*)(\s+)?(.*)$/);
        if (!match) return;
        const [, whitespace, word, gap, remainder] = match;
        const catalog = readCatalog();
        let choices;
        let prefix;
        if (!gap) {
            choices = roots.filter(item => item.startsWith(normalize(word)));
            prefix = "";
        } else {
            const verb = normalize(word);
            const targets = verb === "ls" ? ["sections", "projects", "links", "demos"]
                : verb === "goto" ? [...catalog.sections.keys()]
                : verb === "cat" ? [...catalog.projects.keys(), ...catalog.sections.keys(), ...catalog.links.keys(), "sections", "projects", "links", "demos"]
                : verb === "open" ? [...catalog.links.keys(), ...catalog.demos.keys()] : [];
            choices = [...new Set(targets)].filter(item => item.startsWith(normalize(remainder)));
            prefix = `${whitespace}${word} `;
        }
        if (choices.length === 1) {
            input.value = prefix + choices[0] + " ";
            input.setSelectionRange(input.value.length, input.value.length);
            suggestions.textContent = "";
        } else if (choices.length > 1) {
            suggestions.textContent = "Suggestions: " + choices.join(" · ");
        }
    }

    output.addEventListener("click", event => {
        if (event.target === output || event.target === historyArea) input.focus({ preventScroll: true });
    });
    // Repeated commands appear above the same inline prompt; keep it visible.
    function scrollToPrompt() { output.scrollTop = output.scrollHeight; }
    input.addEventListener("input", scrollToPrompt);

    form.addEventListener("submit", event => {
        event.preventDefault();
        run(input.value);
    });
    input.addEventListener("keydown", event => {
        if (event.key === "Tab") {
            event.preventDefault();
            autocomplete();
        } else if (event.key === "ArrowUp" && commandHistory.length) {
            event.preventDefault();
            if (historyIndex === commandHistory.length) savedInput = input.value;
            historyIndex = Math.max(0, historyIndex - 1);
            input.value = commandHistory[historyIndex];
        } else if (event.key === "ArrowDown" && commandHistory.length) {
            event.preventDefault();
            historyIndex = Math.min(commandHistory.length, historyIndex + 1);
            input.value = historyIndex === commandHistory.length ? savedInput : commandHistory[historyIndex];
        } else {
            suggestions.textContent = "";
        }
    });
    container.querySelectorAll(".shell-quick [data-command]").forEach(button => {
        button.addEventListener("click", () => run(button.dataset.command));
    });

    appendEntry(null, ["Welcome to Lin's Portfolio Minishell!", "Type 'help' or select a command to get started."]);
    return { focus() { input.focus({ preventScroll: true }); } };
}
