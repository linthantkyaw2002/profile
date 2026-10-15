// Shared demo window. Opening from the hero grows outward from the terminal;
// opening from a project card opens the *same* window from the card button.
export function createDemoModal() {
    const dialog = document.getElementById("demo-modal");
    const closeButton = document.getElementById("demo-close");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let source = null;
    let runningAnimation = null;
    let onOpen = () => {};
    let onClose = () => {};
    let closing = false;

    function animateFromSource(reverse = false) {
        if (reducedMotion.matches || !source || !dialog.animate) return Promise.resolve();
        const origin = source.getBoundingClientRect();
        const destination = dialog.getBoundingClientRect();
        if (!origin.width || !origin.height || !destination.width || !destination.height) return Promise.resolve();

        // Do not fly toward a source that the visitor has scrolled away from.
        if (origin.bottom < 0 || origin.top > window.innerHeight) return Promise.resolve();

        const dx = origin.left - destination.left;
        const dy = origin.top - destination.top;
        const sx = Math.max(0.09, Math.min(1.4, origin.width / destination.width));
        const sy = Math.max(0.09, Math.min(1.2, origin.height / destination.height));
        const start = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
        const end = "translate(0, 0) scale(1, 1)";
        const keyframes = reverse
            ? [{ transform: end, opacity: 1 }, { transform: start, opacity: 0.35 }]
            : [{ transform: start, opacity: 0.45 }, { transform: end, opacity: 1 }];

        runningAnimation?.cancel();
        runningAnimation = dialog.animate(keyframes, {
            duration: reverse ? 185 : 300,
            easing: reverse ? "ease-in" : "cubic-bezier(.2,.85,.22,1)",
            fill: "none"
        });
        return runningAnimation.finished.catch(() => {});
    }

    function open(origin) {
        if (closing) return;
        source = origin;
        if (dialog.open) {
            onOpen();
            return;
        }
        dialog.showModal();
        void animateFromSource(false);
        onOpen();
    }

    async function close({ immediate = false } = {}) {
        if (!dialog.open || closing) return;
        closing = true;
        onClose(); // Release any active camera before the closing animation.
        if (!immediate) await animateFromSource(true);
        dialog.close();
        closing = false;
    }

    closeButton.addEventListener("click", () => { void close(); });
    dialog.addEventListener("cancel", event => {
        event.preventDefault();
        void close();
    });
    dialog.addEventListener("click", event => {
        // Clicking the backdrop (not inside the panel) closes it.
        if (event.target === dialog) void close();
    });

    return { open, close, setOnOpen(callback) { onOpen = callback; }, setOnClose(callback) { onClose = callback; } };
}
