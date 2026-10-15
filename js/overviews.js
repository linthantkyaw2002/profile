// Same shared dialog for project details and interactive demos.
// Keep href destinations as a no-JavaScript fallback; normal taps never navigate.
export function initProjectOverviews(openOverview) {
    document.querySelectorAll("a[data-overview]").forEach(link => {
        link.setAttribute("aria-haspopup", "dialog");
        link.setAttribute("aria-controls", "demo-modal");

        link.addEventListener("click", event => {
            // Preserve browser shortcuts such as Cmd+click to open the fallback page.
            if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
                event.ctrlKey || event.shiftKey || event.altKey) return;

            const template = document.getElementById(`overview-template-${link.dataset.overview}`);
            if (!template) return;

            event.preventDefault();
            openOverview(link.dataset.overview, link);
        });
    });
}
