// Lightweight informational project dialog. It is deliberately separate from
// the four interactive demos: opening an overview never starts or stops a demo.
export function initProjectOverviews() {
    const dialog = document.getElementById("project-overview-modal");
    const content = document.getElementById("overview-content");
    const scroll = document.getElementById("overview-scroll");
    const close = document.getElementById("overview-close");
    if (!dialog || !content || !scroll || !close) return;
    let trigger = null;

    document.querySelectorAll("button[data-overview]").forEach(button => {
        button.addEventListener("click", () => {
            const template = document.getElementById(`overview-template-${button.dataset.overview}`);
            if (!template || dialog.open) return;
            trigger = button;
            content.replaceChildren(template.content.cloneNode(true));
            dialog.showModal();
            // Reset after opening: a closed dialog is display:none and can retain its old scroll position.
            scroll.scrollTop = 0;
            close.focus();
        });
    });
    const dismiss = () => { if (dialog.open) dialog.close(); };
    close.addEventListener("click", dismiss);
    dialog.addEventListener("click", event => { if (event.target === dialog) dismiss(); });
    dialog.addEventListener("close", () => { trigger?.focus({ preventScroll: true }); });
}
