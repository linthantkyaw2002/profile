// Informational project overviews are separate from the interactive demo modal.
// Mobile touch browsers use a fixed overlay rather than relying on native showModal().
export function initProjectOverviews() {
    const dialog = document.getElementById("project-overview-modal");
    const backdrop = document.getElementById("overview-backdrop");
    const content = document.getElementById("overview-content");
    const scroll = document.getElementById("overview-scroll");
    const close = document.getElementById("overview-close");
    if (!dialog || !backdrop || !content || !scroll || !close) return;

    const touchScreen = window.matchMedia("(hover: none) and (pointer: coarse)");
    const narrowScreen = window.matchMedia("(max-width: 600px)");
    let trigger = null;
    let fallbackOpen = false;

    const isOpen = () => dialog.open || fallbackOpen;

    function returnFocus() {
        if (trigger?.isConnected) trigger.focus({ preventScroll: true });
        trigger = null;
    }

    function openFallback() {
        fallbackOpen = true;
        backdrop.hidden = false;
        dialog.classList.add("is-fallback-open");
        dialog.setAttribute("open", "");
        document.documentElement.classList.add("overview-is-open");
    }

    function dismiss() {
        if (!isOpen()) return;

        if (fallbackOpen) {
            dialog.removeAttribute("open");
            dialog.classList.remove("is-fallback-open");
            backdrop.hidden = true;
            document.documentElement.classList.remove("overview-is-open");
            fallbackOpen = false;
            returnFocus();
        } else {
            dialog.close();
        }
    }

    document.querySelectorAll("button[data-overview]").forEach(button => {
        button.addEventListener("click", () => {
            const template = document.getElementById(`overview-template-${button.dataset.overview}`);
            if (!template || isOpen()) return;

            trigger = button;
            content.replaceChildren(template.content.cloneNode(true));

            // A fixed-position fallback avoids WebKit dialog/top-layer issues on touch.
            if (touchScreen.matches || narrowScreen.matches || typeof dialog.showModal !== "function") {
                openFallback();
            } else {
                try {
                    dialog.showModal();
                } catch (error) {
                    openFallback();
                }
            }

            scroll.scrollTop = 0;
            close.focus({ preventScroll: true });
        });
    });

    close.addEventListener("click", dismiss);
    backdrop.addEventListener("click", dismiss);

    // Native dialogs handle Escape themselves; the fallback needs explicit handling.
    document.addEventListener("keydown", event => {
        if (!fallbackOpen) return;

        if (event.key === "Escape") {
            event.preventDefault();
            dismiss();
            return;
        }

        if (event.key !== "Tab") return;
        const focusable = [close, ...content.querySelectorAll("a[href], button:not([disabled])")];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    dialog.addEventListener("close", returnFocus);
}
