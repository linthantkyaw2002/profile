// Main portfolio interactions — original V16 design, four small browser demos.
import { createDemoModal } from "./modal.js";
import { initProjectOverviews } from "./overviews.js?v=27.3";
import { createMinishell } from "./demos/minishell.js";
import { createFaceDemo } from "./demos/face.js";
import { createFlowDemo } from "./demos/flow.js?v=24";
import { createSoLongDemo } from "./demos/solong.js?v=25";

const demoModal = createDemoModal();
initProjectOverviews();
const modalContent = document.getElementById("demo-modal-content");
const modalTitle = document.getElementById("demo-modal-title");
const dialog = document.getElementById("demo-modal");
let activeDemo = null;

function showDemo(kind, origin = null) {
    activeDemo?.destroy?.();
    activeDemo = null;
    modalContent.replaceChildren();
    if (kind === "face") {
        modalTitle.textContent = "linthant — ~/portfolio — face attendance";
        activeDemo = createFaceDemo({ container: modalContent, backToShell: () => showDemo("minishell") });
    } else if (kind === "flow") {
        modalTitle.textContent = "linthant — ~/portfolio — flow cli";
        activeDemo = createFlowDemo({ container: modalContent, backToShell: () => showDemo("minishell") });
    } else if (kind === "solong") {
        modalTitle.textContent = "linthant — ~/portfolio — so_long";
        activeDemo = createSoLongDemo({ container: modalContent, backToShell: () => showDemo("minishell") });
    } else {
        modalTitle.textContent = "linthant — ~/portfolio — minishell";
        activeDemo = createMinishell({
            container: modalContent,
            close: () => demoModal.close(),
            launchDemo: name => showDemo(name),
        });
    }
    if (!dialog.open) demoModal.open(origin);
    else activeDemo.focus();
}

demoModal.setOnOpen(() => activeDemo?.focus?.());
demoModal.setOnClose(() => { activeDemo?.destroy?.(); activeDemo = null; });

// Both Minishell launchers and the Face Attendance card reuse one window.
const heroLaunch = document.getElementById("hero-minishell-launch");
const cardLaunch = document.getElementById("minishell-card-launch");
const faceLaunch = document.getElementById("face-card-launch");
const flowLaunch = document.getElementById("flow-card-launch");
const solongLaunch = document.getElementById("solong-card-launch");
heroLaunch.addEventListener("click", () => showDemo("minishell", heroLaunch));
heroLaunch.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showDemo("minishell", heroLaunch);
    }
});
cardLaunch.addEventListener("click", () => showDemo("minishell", cardLaunch));
faceLaunch.addEventListener("click", () => showDemo("face", faceLaunch));
flowLaunch.addEventListener("click", () => showDemo("flow", flowLaunch));
solongLaunch.addEventListener("click", () => showDemo("solong", solongLaunch));

// Brand Photo Preview — expands from the LTK badge on hover or click.
// Click pins the preview open; outside click and Escape close it.
const brandProfile = document.getElementById("brand-profile");
const profileToggle = document.getElementById("profile-toggle");
const profilePreview = document.getElementById("profile-preview");

if (brandProfile && profileToggle && profilePreview) {
    let profilePinned = false;
    const canHoverProfile = window.matchMedia("(hover: hover) and (pointer: fine)");

    function showProfile(open) {
        profilePreview.classList.toggle("is-open", open);
        profilePreview.setAttribute("aria-hidden", String(!open));
        profileToggle.setAttribute("aria-expanded", String(open));
    }

    profileToggle.addEventListener("pointerenter", () => {
        if (canHoverProfile.matches) showProfile(true);
    });

    brandProfile.addEventListener("pointerleave", () => {
        if (!profilePinned) showProfile(false);
    });

    profileToggle.addEventListener("focus", () => showProfile(true));

    profileToggle.addEventListener("click", () => {
        profilePinned = !profilePinned;
        showProfile(profilePinned);
    });

    brandProfile.addEventListener("focusout", event => {
        if (!profilePinned && !brandProfile.contains(event.relatedTarget)) showProfile(false);
    });

    document.addEventListener("pointerdown", event => {
        if (!brandProfile.contains(event.target)) {
            profilePinned = false;
            showProfile(false);
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            profilePinned = false;
            showProfile(false);
            if (document.activeElement === profileToggle) profileToggle.blur();
        }
    });
}

// Mobile Navigation
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("homeNavbar");

menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    navLinks.classList.toggle("open", !isOpen);
});

navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
    });
});

// Decorative so_long project-card tilemap; the playable game opens in the shared modal.
const map = [
    "##########",
    "#..C.....#",
    "#.###.##.#",
    "#...P....#",
    "#.##.##..#",
    "#..C....E#",
    "##########"
];

const tilemap = document.getElementById("tilemap");
const tileTypes = {
    "#": "wall",
    ".": "path",
    "C": "coin",
    "P": "player",
    "E": "exit"
};

map.join("").split("").forEach(tile => {
    const cell = document.createElement("span");
    cell.className = "tile " + (tileTypes[tile] || "path");
    tilemap.appendChild(cell);
});


// Fade-in on Scroll (restored from the original portfolio)
// Sections reveal when visible and slide out again when leaving the viewport.
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("scroll-effects");

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            entry.target.classList.toggle("show-section", entry.isIntersecting);
        });
    }, { threshold: 0.1 });

    document.querySelectorAll("main > section").forEach(sec => observer.observe(sec));

    // Staggered reveals for the highlight strip and project/skill cards.
    const cardObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            entry.target.classList.toggle("show-item", entry.isIntersecting);
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });

    document.querySelectorAll(".strength, .project-card, .skill-card").forEach(item => {
        item.classList.add("scroll-item");
        cardObserver.observe(item);
    });
}


// One-time terminal entrance when the portfolio finishes loading.
// This is a visual animation, not execution of actual shell commands.
window.addEventListener("load", () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.documentElement.classList.add("page-ready");

    const command = document.getElementById("terminal-command");
    if (!command) return;

    const text = command.textContent;
    command.textContent = "";
    let index = 0;

    const start = window.setTimeout(() => {
        const type = window.setInterval(() => {
            command.textContent = text.slice(0, ++index);
            if (index >= text.length) window.clearInterval(type);
        }, 26);
    }, 860);
});


// Skill Cards — hover previews the back; a click pins it open until clicked again.
// This distinguishes transient hover from a deliberate click (including touch/keyboard).
const skillCards = document.querySelectorAll(".skill-card");
const canHoverSkills = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");

skillCards.forEach(card => {
    const button = card.querySelector(".skill-flip");
    const front = card.querySelector(".skill-front");
    const back = card.querySelector(".skill-back");
    const backHint = back.querySelector(".skill-hint");
    const label = card.dataset.skill;

    const isPinned = () => card.classList.contains("is-flipped");
    const isShowingBack = () => isPinned() ||
        (canHoverSkills.matches && card.matches(":hover") && !card.classList.contains("force-front"));

    function updateCardAccess() {
        const pinned = isPinned();
        const showingBack = isShowingBack();
        // aria-pressed describes the click-to-pin state, not the temporary hover preview.
        button.setAttribute("aria-pressed", String(pinned));
        button.setAttribute("aria-label", `${label} — ${pinned ? "show summary" : showingBack ? "keep details open" : "show more details"}`);
        front.setAttribute("aria-hidden", String(showingBack));
        back.setAttribute("aria-hidden", String(!showingBack));
        if (backHint) backHint.textContent = pinned ? "Click or tap to see summary ↶" : "Click to keep details open ↗";
    }

    button.addEventListener("click", () => {
        if (isPinned()) {
            // On desktop, suppress hover temporarily so clicking a pinned back
            // immediately reveals the front even with the pointer still over it.
            card.classList.remove("is-flipped");
            card.classList.add("force-front");
        } else {
            // A click while already previewing via hover MUST pin the back,
            // rather than treating the hover preview as a click-toggle state.
            card.classList.remove("force-front");
            card.classList.add("is-flipped");
        }
        updateCardAccess();
    });

    card.addEventListener("pointerenter", updateCardAccess);
    card.addEventListener("pointerleave", () => {
        card.classList.remove("force-front");
        updateCardAccess();
    });

    updateCardAccess();
});
