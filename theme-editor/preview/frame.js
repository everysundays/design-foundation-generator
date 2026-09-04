// Preview-frame side of the click-to-edit protocol (the other side is the
// 'message' listener in scripts.js). Runs inside the srcdoc iframe; the editor is the parent
// window. Hover outline and selection are attributes pages.css paints; the
// parent is told what was clicked via postMessage and answers by writing
// straight into this document (same-origin).
(() => {
    const post = (msg) => window.parent.postMessage(msg, '*');
    const elementsPage = () => document.querySelector('[data-page="elements"]');
    let hovered = null;

    document.addEventListener('pointerover', (e) => {
        const page = elementsPage();
        if (!page || !page.contains(e.target)) return;
        const part = e.target.closest('[data-part]');
        if (part === hovered) return;
        if (hovered) hovered.removeAttribute('data-hover');
        hovered = part;
        if (hovered) hovered.setAttribute('data-hover', '');
    });
    document.addEventListener('pointerout', (e) => {
        if (hovered && !e.relatedTarget) { hovered.removeAttribute('data-hover'); hovered = null; }
    });

    document.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]');
        if (action) {
            e.preventDefault();
            post({ type: 'ds:action', ...action.dataset });
            return;
        }
        const part = e.target.closest('[data-part]');
        const root = e.target.closest('[data-element]');
        // Anywhere that isn't a specimen part clears the selection.
        if (!part || !root) {
            document.querySelectorAll('[data-selected]').forEach(el => el.removeAttribute('data-selected'));
            post({ type: 'ds:clear' });
            return;
        }
        const page = elementsPage();
        if (!page || !page.contains(e.target)) return;
        // Buttons/links in the gallery are specimens, never real controls.
        if (e.target.closest('a, button, input, select, textarea, label')) e.preventDefault();
        document.querySelectorAll('[data-selected]').forEach(el => el.removeAttribute('data-selected'));
        part.setAttribute('data-selected', '');
        post({
            type: 'ds:select',
            element: root.dataset.element,
            variant: root.dataset.variant || null,
            part: part.dataset.part,
            state: root.dataset.state || 'default'
        });
    });

    // Focus/typing inside gallery specimens would mutate them - keep them inert.
    document.addEventListener('keydown', (e) => {
        if (elementsPage() && elementsPage().contains(e.target) && e.target.matches('input, textarea, select')) e.preventDefault();
    });

    post({ type: 'ds:ready' });
})();
