// Project overview links are ordinary links first, so they work without JavaScript.
// Desktop enhances them into dialogs; phones navigate to a static overview page.
export function initProjectOverviews() {
    const dialog = document.getElementById("project-overview-modal");
    const content = document.getElementById("overview-content");
    const scroll = document.getElementById("overview-scroll");
    const close = document.getElementById("overview-close");
    if (!dialog || !content || !scroll || !close) return;

    const touchScreen = window.matchMedia("(hover: none) and (pointer: coarse)");
    const narrowScreen = window.matchMedia("(max-width: 600px)");
    let trigger = null;

    document.querySelectorAll("a[data-overview]").forEach(link => {
        link.addEventListener("click", event => {
            // Let the browser follow the real link on phones and narrow screens.
            // This avoids native-dialog, z-index and touch event incompatibilities.
            if (touchScreen.matches || narrowScreen.matches) return;

            const template = document.getElementById(`overview-template-${link.dataset.overview}`);
            if (!template || typeof dialog.showModal !== "function") return;
            if (dialog.open) {
                event.preventDefault();
                return;
            }

            try {
                content.replaceChildren(template.content.cloneNode(true));
                dialog.showModal();
            } catch (error) {
                // If a desktop browser rejects dialogs, the regular link still works.
                return;
            }

            event.preventDefault();
            trigger = link;
            scroll.scrollTop = 0;
            close.focus({ preventScroll: true });
        });
    });

    close.addEventListener("click", () => {
        if (dialog.open) dialog.close();
    });

    dialog.addEventListener("click", event => {
        if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener("close", () => {
        if (trigger?.isConnected) trigger.focus({ preventScroll: true });
        trigger = null;
    });
}
