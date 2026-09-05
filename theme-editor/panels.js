// Sidebar panels for Theme Editor v3 ("touch and go"): the left tabs ARE the
// pickers. Every builder here is a pure function of a ctx (built by
// scripts.js panelCtx) returning HTML for #panelBody; it never
// reads editor state directly. Everything assignable carries `data-ref` (the
// ref a click writes to the active token) and `data-tip` (the tooltip text);
// scripts.js owns the one delegated click handler and the tooltip.
//
// Marks (ctx.marks[ref] = { count, ids, roles, used, active }) drive the
// three visual signals on an entry: the count badge (how many default-state
// component tokens + semantic roles land on this entry), the "used" dot (the
// selected element uses it somewhere) and the "active" ring (the active
// token id resolves here - i.e. what a click would replace).

const PANEL_KIND_LABELS = {
    color: 'Colors', space: 'Space', radius: 'Radius', borderWidth: 'Border width',
    borderStyle: 'Border style', shadow: 'Shadow', type: 'Type'
};

const PANEL_SPECIALS = [['white', '#ffffff'], ['black', '#000000'], ['transparent', 'transparent']];

function panelEsc(text) {
    return String(text === undefined || text === null ? '' : text)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function panelMark(ctx, ref) {
    const m = ctx && ctx.marks && ctx.marks[ref];
    return m || { count: 0, ids: [], roles: [], used: false, active: false };
}

// Badge = component tokens landing here + semantic roles linked here, so a
// palette step that only backs a role still shows as "in use".
function panelBadgeCount(mark) {
    return (mark.count || 0) + ((mark.roles && mark.roles.length) || 0);
}

// Tooltip per contract: `name · value`, then `roles: …`, then `used by: …`
// capped at six ids (+N). Newlines are rendered via white-space: pre-line.
function panelTip(name, value, mark) {
    const lines = [value ? `${name} · ${value}` : name];
    if (mark.roles && mark.roles.length) lines.push(`roles: ${mark.roles.join(', ')}`);
    if (mark.ids && mark.ids.length) {
        const shown = mark.ids.slice(0, 6);
        const rest = mark.ids.length - shown.length;
        lines.push(`used by: ${shown.join(', ')}${rest > 0 ? ` (+${rest})` : ''}`);
    }
    return lines.join('\n');
}

// The data-* attributes shared by every clickable entry.
function panelMarkAttrs(ref, tip, mark) {
    const badge = panelBadgeCount(mark);
    return `data-ref="${panelEsc(ref)}" data-tip="${panelEsc(tip)}" data-count="${badge}"` +
        (mark.used ? ' data-used' : '') + (mark.active ? ' data-active' : '');
}

function panelBadgeHtml(mark) {
    const n = panelBadgeCount(mark);
    return n > 0 ? `<i class="fp-count">${n}</i>` : '';
}

// --- prop chips (multi-prop parts: padding{x,y}) ---

// The selected part's props of `kind`, read from the ELEMENTS spec when it's
// loaded (components.js); an unknown part yields [].
function panelPartProps(ctx, kind) {
    const sel = ctx && ctx.selection;
    if (!sel || typeof elementSpec !== 'function' || typeof partSpec !== 'function') return [];
    const el = elementSpec(sel.element);
    const part = el && partSpec(el, sel.part);
    if (!part) return [];
    return part.props.filter(p => p.kind === kind);
}

function buildPropChipsHtml(ctx, kind) {
    const props = panelPartProps(ctx, kind);
    if (props.length <= 1) return '';
    const active = (ctx.activeProps && ctx.activeProps[kind]) || props[0].key;
    return `<div class="fp-chips" data-kind="${panelEsc(kind)}">${props.map(p =>
        `<button type="button" class="fp-chip" data-prop="${panelEsc(p.key)}" aria-pressed="${p.key === active ? 'true' : 'false'}">${panelEsc(p.label || p.key)}</button>`
    ).join('')}</div>`;
}

// --- Colors ---

// Light text on a dark step, dark text on a light one (YIQ luma, the usual
// 128 midpoint nudged up so mid-tones like blue-500 read as dark).
function panelSwatchIsDark(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return false;
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 < 150;
}

// A ramp step's shade number (800, 900, 950…) isn't shown - hover already
// gives name · hex via the tooltip. Only the specials carry a visible label,
// since "white" / "black" / "transparent" aren't guessable from the swatch
// alone. The count badge (panelBadgeHtml) is separate and always shows.
function panelSwatchHtml(ctx, name, hex, family, label) {
    const ref = `palette.${name}`;
    const mark = panelMark(ctx, ref);
    const tip = panelTip(name, hex, mark);
    const transparent = hex === 'transparent';
    const text = label === undefined || label === null ? name : '';
    const cls = 'fp-swatch' + (transparent ? ' fp-swatch-transparent' : '') + (panelSwatchIsDark(hex) ? ' fp-swatch-dark' : '');
    return `<button type="button" class="${cls}" ${panelMarkAttrs(ref, tip, mark)}` +
        ` style="--swatch: ${panelEsc(hex)}" aria-label="${panelEsc(name)}" title="">` +
        (text ? `<span class="fp-swatch-label">${panelEsc(text)}</span>` : '') + panelBadgeHtml(mark) + `</button>`;
}

// A semantic role's swatch (color.<role>) - always labelled, since a role
// isn't guessable from its colour alone (ctx.semantic entries carry the
// describeRef() chain as `tip`, passed through as panelTip's `name` with an
// empty `value` so the tooltip's first line is exactly that chain).
function panelSemanticSwatchHtml(ctx, s) {
    const mark = panelMark(ctx, s.ref);
    const tip = panelTip(s.tip || s.ref, '', mark);
    const cls = 'fp-swatch fp-swatch-semantic' + (panelSwatchIsDark(s.hex) ? ' fp-swatch-dark' : '');
    return `<button type="button" class="${cls}" ${panelMarkAttrs(s.ref, tip, mark)}` +
        ` style="--swatch: ${panelEsc(s.hex)}" aria-label="${panelEsc(s.role)}" title="">` +
        `<span class="fp-swatch-label">${panelEsc(s.role)}</span>${panelBadgeHtml(mark)}</button>`;
}

// The semantic role row - every ctx.semantic entry as an assignable swatch,
// above the palette ramps. Empty ctx.semantic (or none supplied) renders
// nothing.
function buildSemanticRowHtml(ctx) {
    const list = ctx.semantic || [];
    if (!list.length) return '';
    return `<div class="fp-ramp fp-ramp-semantic">
  <span class="fp-ramp-label">semantic</span>
  <div class="fp-swatches">${list.map(s => panelSemanticSwatchHtml(ctx, s)).join('')}</div>
</div>`;
}

function buildColorsPanelHtml(ctx) {
    const foundation = ctx.foundation || foundationOf(ctx.source);
    const families = foundation.color.families();
    const specials = `<div class="fp-ramp fp-ramp-specials">
  <span class="fp-ramp-label">special</span>
  <div class="fp-swatches">${PANEL_SPECIALS.map(([name, hex]) => panelSwatchHtml(ctx, name, hex, null)).join('')}</div>
</div>`;
    const rows = families.map(family => {
        const entries = paletteFamilyEntries(ctx.source, family);
        return `<div class="fp-ramp" data-family="${panelEsc(family)}">
  <span class="fp-ramp-label" title="${panelEsc(family)}">${panelEsc(family)}</span>
  <div class="fp-swatches">${entries.map(e => panelSwatchHtml(ctx, e.name, e.hex, family, e.shade)).join('')}</div>
</div>`;
    }).join('\n');
    return `<div class="fp-panel fp-panel-colors">
<div class="fp-panel-head"><span class="fp-panel-title">${panelEsc(foundation.label)}</span><span class="fp-panel-note">${families.length} ramps · click a swatch to assign</span></div>
${buildPropChipsHtml(ctx, 'color')}
${buildSemanticRowHtml(ctx)}
${specials}
${rows}
</div>`;
}

// --- Scales (space / radius / borderWidth / borderStyle / shadow) ---

// The sidebar has no --shadow-color, so shadow samples render the step's
// layers with a literal neutral color - the shape is the token, the color
// is chrome here.
function panelShadowSample(entry) {
    if (!entry.layers || !entry.layers.length) return 'none';
    return entry.layers.map(([x, y, blur, spread, alpha]) => `${x}px ${y}px ${blur}px ${spread}px rgb(0 0 0 / ${alpha})`).join(', ');
}

function panelEntryValue(kind, entry) {
    if (kind === 'borderStyle') return entry.value;
    if (entry.px === null || entry.px === undefined) return entry.value;
    return `${entry.px}px`;
}

// The right-hand readout string for a scale entry ("24px", a shadow's raw
// css, or '' for borderStyle) - shared by a plain step row (panelEntryHtml)
// and a semantic token row (panelSemanticTokenEntryHtml), whose readout is
// its TARGET entry's, not its own.
function panelEntryReadout(kind, entry) {
    if (!entry) return '?';
    if (entry.rem !== null && entry.rem !== undefined && kind !== 'borderStyle') return `${entry.px}px`;
    return kind === 'borderStyle' ? '' : entry.value;
}

function panelSampleHtml(kind, entry) {
    switch (kind) {
        case 'space': {
            const px = entry.px || 0;
            return `<span class="fp-sample fp-sample-space" style="--px: ${px}"><i></i></span>`;
        }
        case 'radius':
            return `<span class="fp-sample fp-sample-radius" style="--sample: ${panelEsc(entry.value)}"></span>`;
        case 'borderWidth':
            return `<span class="fp-sample fp-sample-border-width" style="--sample: ${panelEsc(entry.value)}"></span>`;
        case 'borderStyle':
            return `<span class="fp-sample fp-sample-border-style" style="--sample: ${panelEsc(entry.value)}"></span>`;
        case 'shadow':
            return `<span class="fp-sample fp-sample-shadow" style="--sample: ${panelEsc(panelShadowSample(entry))}"></span>`;
        default:
            return '<span class="fp-sample"></span>';
    }
}

function panelEntryHtml(ctx, kind, entry) {
    const ref = scaleRef(kind, entry.name);
    const mark = panelMark(ctx, ref);
    const value = panelEntryValue(kind, entry);
    const tip = panelTip(entry.name, value === entry.name ? '' : value, mark);
    const readout = panelEntryReadout(kind, entry);
    return `<button type="button" class="fp-entry" ${panelMarkAttrs(ref, tip, mark)}>
  ${panelSampleHtml(kind, entry)}
  <span class="fp-entry-name">${panelEsc(entry.name)}</span>
  <span class="fp-entry-value">${panelEsc(readout)}</span>
  ${panelBadgeHtml(mark)}
</button>`;
}

// A semantic (non-color) scale token's row on its kind's panel (Space tab,
// card 9): same shape as a plain step entry, but its sample/readout come
// from the entry it currently TARGETS (token.ref) - its own data-ref (e.g.
// "space.card-padding") is what a click assigns; the step it targets is
// assigned by clicking that step's OWN row instead. An unresolvable target
// (a corrupt/stale ref) renders a bare '?' rather than throwing.
function panelSemanticTokenEntryHtml(ctx, kind, token) {
    const ref = scaleRef(kind, token.name);
    const targetParsed = parseRef(token.ref);
    const targetEntry = targetParsed ? findScaleEntry(ctx.source, kind, targetParsed.name) : null;
    const mark = panelMark(ctx, ref);
    const value = targetEntry ? panelEntryValue(kind, targetEntry) : '?';
    const tip = panelTip(token.name, value === token.name ? '' : value, mark);
    const readout = panelEntryReadout(kind, targetEntry);
    return `<button type="button" class="fp-entry fp-entry-token" ${panelMarkAttrs(ref, tip, mark)}>
  ${targetEntry ? panelSampleHtml(kind, targetEntry) : '<span class="fp-sample"></span>'}
  <span class="fp-entry-name">${panelEsc(token.name)}</span>
  <span class="fp-entry-value">${panelEsc(readout)}</span>
  ${panelBadgeHtml(mark)}
</button>`;
}

// A kind's "value" field takes a different shape per kind - shown as the
// input's placeholder so the add-row needs no label of its own.
const SCALE_ADD_PLACEHOLDER = {
    space: '4.5rem or 72px', radius: '4.5rem or 72px', borderWidth: '4.5rem or 72px',
    borderStyle: 'double', shadow: '0 4 12 0 0.15'
};

// Inline "add a custom entry" row (see scripts.js addCustomScaleEntry / the
// onPanelClick [data-add-confirm] branch) - one row per kind, self-contained
// so the click handler only needs to look inside its own [data-add-kind].
function buildScaleAddRowHtml(kind) {
    const placeholder = SCALE_ADD_PLACEHOLDER[kind] || 'value';
    return `<div class="fp-add-row" data-add-kind="${panelEsc(kind)}">
  <input type="text" class="fp-add-input fp-add-input-name" placeholder="name" data-add-field="name">
  <input type="text" class="fp-add-input fp-add-input-value" placeholder="${panelEsc(placeholder)}" data-add-field="value">
  <button type="button" class="fp-add-btn" data-add-confirm>+ Add</button>
  <span class="fp-add-error" data-add-error hidden></span>
</div>`;
}

function buildScalePanelHtml(kind, ctx, opts = {}) {
    const entries = scaleEntries(ctx.source, kind);
    const foundation = ctx.foundation || foundationOf(ctx.source);
    const note = kind === 'space' ? foundation.unitNote : `${entries.length} steps`;
    const tokens = (ctx.semanticTokens || []).filter(t => t && t.kind === kind);
    const tokenRows = tokens.length ? `<div class="fp-entries fp-entries-tokens">
${tokens.map(t => panelSemanticTokenEntryHtml(ctx, kind, t)).join('\n')}
</div>` : '';
    return `<div class="fp-panel fp-panel-scale" data-kind="${panelEsc(kind)}">
<div class="fp-panel-head"><span class="fp-panel-title">${panelEsc(PANEL_KIND_LABELS[kind] || kind)}</span><span class="fp-panel-note">${panelEsc(note)}</span></div>
${buildPropChipsHtml(ctx, kind)}
${tokenRows}
<div class="fp-entries">
${entries.map(e => panelEntryHtml(ctx, kind, e)).join('\n')}
</div>
${opts.allowAdd ? buildScaleAddRowHtml(kind) : ''}
</div>`;
}

function buildBorderPanelHtml(ctx) {
    return `<div class="fp-panel fp-panel-border">
<div class="fp-section"><h3 class="fp-section-title">Width</h3>${buildScalePanelHtml('borderWidth', ctx, { allowAdd: true })}</div>
<div class="fp-section"><h3 class="fp-section-title">Style</h3>${buildScalePanelHtml('borderStyle', ctx, { allowAdd: true })}</div>
</div>`;
}

// --- Type ---

function panelFirstFamily(value) {
    return String(value || '').split(',')[0].trim().replace(/^["']|["']$/g, '');
}

// Inline style for a set's specimen from the actual var values (the sidebar
// document has no --type-* vars to lean on).
function panelTypeSetStyle(vars, set) {
    const key = set.key;
    let family = vars[`type-${key}-family`] || `var(--font-${set.family})`;
    const ref = family.match(/^var\(--font-(sans|serif|mono)\)$/);
    if (ref) family = vars[`font-${ref[1]}`] || { sans: 'sans-serif', serif: 'serif', mono: 'monospace' }[ref[1]];
    const weight = vars[`type-${key}-weight`] || set.weight;
    const size = vars[`type-${key}-size`] || `${set.size}rem`;
    const leading = vars[`type-${key}-leading`] || `${set.leading}rem`;
    const tracking = vars[`type-${key}-tracking`] || set.tracking;
    return `font-family: ${family}; font-weight: ${weight}; font-size: ${size}; line-height: ${leading}; letter-spacing: ${tracking};`;
}

function buildTypePanelHtml(ctx) {
    const vars = (ctx.vars && ctx.vars[ctx.mode]) || {};
    const sets = ctx.typeSets || [];
    const cards = sets.map(set => {
        const ref = `type.${set.key}`;
        const mark = panelMark(ctx, ref);
        const summary = typeof ctx.typeSetSummary === 'function' ? ctx.typeSetSummary(vars, set) : '';
        const tip = panelTip(set.label, summary, mark);
        return `<button type="button" class="fp-type-set" ${panelMarkAttrs(ref, tip, mark)}>
  <span class="fp-type-badge" style="--type-badge-color: ${panelEsc(set.color)}">${panelEsc(set.abbr)}</span>
  <span class="fp-type-main">
    <span class="fp-type-label">${panelEsc(set.label)}</span>
    <span class="fp-type-summary">${panelEsc(summary)}</span>
    <span class="fp-type-specimen" style="${panelEsc(panelTypeSetStyle(vars, set))}">The quick brown fox</span>
  </span>
  ${panelBadgeHtml(mark)}
</button>`;
    }).join('\n');
    return `<div class="fp-panel fp-panel-type">
<div class="fp-panel-head"><span class="fp-panel-title">Type sets</span><span class="fp-panel-note">click a set to assign · edit below</span></div>
${buildPropChipsHtml(ctx, 'type')}
<div class="fp-type-sets">
${cards}
</div>
<div id="typeControlsMount" class="fp-type-controls"></div>
</div>`;
}

// --- Summary ---

// Everything with count > 0 (or a semantic role on it), per kind, most used
// first - what the work actually draws on, ready to be reconciled to roles.
function panelSummaryEntries(ctx, kind) {
    const out = [];
    if (kind === 'color') {
        PANEL_SPECIALS.forEach(([name, hex]) => out.push({ ref: `palette.${name}`, name, hex, value: hex }));
        const foundation = ctx.foundation || foundationOf(ctx.source);
        foundation.color.families().forEach(family => {
            paletteFamilyEntries(ctx.source, family).forEach(e => out.push({ ref: `palette.${e.name}`, name: e.name, hex: e.hex, value: e.hex }));
        });
    } else if (kind === 'type') {
        (ctx.typeSets || []).forEach(set => out.push({ ref: `type.${set.key}`, name: set.label, set, value: '' }));
    } else {
        scaleEntries(ctx.source, kind).forEach(entry => out.push({ ref: scaleRef(kind, entry.name), name: entry.name, entry, value: panelEntryValue(kind, entry) }));
    }
    return out
        .map(item => ({ ...item, mark: panelMark(ctx, item.ref) }))
        .filter(item => panelBadgeCount(item.mark) > 0)
        .sort((a, b) => panelBadgeCount(b.mark) - panelBadgeCount(a.mark));
}

function panelSummaryItemHtml(ctx, kind, item) {
    const mark = item.mark;
    const tip = panelTip(item.name, item.value === item.name ? '' : item.value, mark);
    let sample;
    if (kind === 'color') sample = `<span class="fp-sample fp-sample-color${item.hex === 'transparent' ? ' fp-swatch-transparent' : ''}" style="--swatch: ${panelEsc(item.hex)}"></span>`;
    else if (kind === 'type') sample = `<span class="fp-type-badge" style="--type-badge-color: ${panelEsc(item.set.color)}">${panelEsc(item.set.abbr)}</span>`;
    else sample = panelSampleHtml(kind, item.entry);
    const readout = kind === 'color' ? item.hex : (kind === 'type' ? '' : (item.entry.px !== null && item.entry.px !== undefined ? `${item.entry.px}px` : (kind === 'borderStyle' ? '' : item.entry.value)));
    return `<button type="button" class="fp-entry fp-summary-entry" ${panelMarkAttrs(item.ref, tip, mark)}>
  ${sample}
  <span class="fp-entry-name">${panelEsc(item.name)}</span>
  <span class="fp-entry-value">${panelEsc(readout)}</span>
  ${panelBadgeHtml(mark)}
</button>`;
}

// --- Semantic scale tokens (Summary tab "Add token" section, card 9) -------
// Color's own add flow (addSemanticColorToken) opens the palette popover
// instead of picking from a plain <select> - see buildAddSemanticTokenRow in
// scripts.js - so it isn't part of this generic, non-color-only shape.

// Every scaleEntries() step as an <option>, `selectedName` marked selected
// (null selects nothing - the browser defaults to the first option, used by
// the add-row before a step is deliberately picked).
function semanticTargetOptionsHtml(ctx, kind, selectedName) {
    return scaleEntries(ctx.source, kind).map(entry => {
        const selected = entry.name === selectedName ? ' selected' : '';
        return `<option value="${panelEsc(entry.name)}"${selected}>${panelEsc(scaleEntryLabel(entry))}</option>`;
    }).join('');
}

// One existing token: its name, and a step-picker for what it targets
// (scripts.js setSemanticTokenTarget) - re-pointing it here moves every part
// assigned to the token, without touching those parts' own assignments.
function buildSemanticTokenSummaryRowHtml(ctx, kind, token) {
    const ref = scaleRef(kind, token.name);
    const targetParsed = parseRef(token.ref);
    const targetName = targetParsed ? targetParsed.name : null;
    return `<div class="fp-semantic-token-row">
  <span class="fp-entry-name">${panelEsc(token.name)}</span>
  <select class="fp-semantic-target-select" data-semantic-target="${panelEsc(ref)}">${semanticTargetOptionsHtml(ctx, kind, targetName)}</select>
</div>`;
}

// The "+ Add" row: a name, a step picker, confirm and inline error - see
// scripts.js addSemanticScaleToken and the onPanelClick
// [data-add-semantic-confirm] branch.
function buildSemanticScaleAddRowHtml(ctx, kind) {
    return `<div class="fp-add-row" data-add-semantic-kind="${panelEsc(kind)}">
  <input type="text" class="fp-add-input fp-add-input-name" placeholder="name" data-add-field="name">
  <select class="fp-semantic-target-select" data-add-field="target">${semanticTargetOptionsHtml(ctx, kind, null)}</select>
  <button type="button" class="fp-add-btn" data-add-semantic-confirm>+ Add</button>
  <span class="fp-add-error" data-add-error hidden></span>
</div>`;
}

// A kind's token rows + add row only, no wrapping section/heading - shared
// by buildSemanticScaleSectionHtml (one heading per kind: space, radius) and
// buildSemanticBorderSectionHtml (card 11: one "Border" section holding both
// border-width and border-style, mirroring buildBorderPanelHtml's own
// Width/Style split on the Border tab).
function buildSemanticScaleTokensHtml(ctx, kind) {
    const tokens = (ctx.semanticTokens || []).filter(t => t && t.kind === kind);
    return `${tokens.map(t => buildSemanticTokenSummaryRowHtml(ctx, kind, t)).join('\n')}
${buildSemanticScaleAddRowHtml(ctx, kind)}`;
}

// A kind's Summary-tab section: its existing tokens (if any) + the add row -
// always rendered, even with zero tokens, so "Add token" stays reachable on
// an empty system. Space and radius (cards 9/10) call it now; shadow (a
// later card) adds its own call, unchanged. Border width/style (card 11)
// share one "Border" section instead - see buildSemanticBorderSectionHtml.
function buildSemanticScaleSectionHtml(ctx, kind) {
    return `<div class="fp-section" data-kind="${panelEsc(kind)}">
<h3 class="fp-section-title">${panelEsc(PANEL_KIND_LABELS[kind] || kind)}</h3>
${buildSemanticScaleTokensHtml(ctx, kind)}
</div>`;
}

// Card 11 ("Semantic border tokens"): one Summary-tab "Border" section
// holding both the width and style token lists + add rows, mirroring
// buildBorderPanelHtml's own Width/Style split on the Border tab (rather
// than two separate top-level sections the way space/radius get one each).
function buildSemanticBorderSectionHtml(ctx) {
    return `<div class="fp-section" data-kind="border">
<h3 class="fp-section-title">Border</h3>
<div class="fp-section"><h3 class="fp-section-title">Width</h3>${buildSemanticScaleTokensHtml(ctx, 'borderWidth')}</div>
<div class="fp-section"><h3 class="fp-section-title">Style</h3>${buildSemanticScaleTokensHtml(ctx, 'borderStyle')}</div>
</div>`;
}

function buildSummaryPanelHtml(ctx) {
    const kinds = ['color', 'space', 'radius', 'borderWidth', 'borderStyle', 'shadow', 'type'];
    const sections = kinds.map(kind => {
        const items = panelSummaryEntries(ctx, kind);
        if (!items.length) return '';
        return `<div class="fp-section" data-kind="${panelEsc(kind)}">
<h3 class="fp-section-title">In use · ${panelEsc(PANEL_KIND_LABELS[kind])}<span class="fp-section-count">${items.length}</span></h3>
<div class="fp-entries">
${items.map(item => panelSummaryItemHtml(ctx, kind, item)).join('\n')}
</div>
</div>`;
    }).filter(Boolean).join('\n');
    const empty = sections ? '' : '<p class="fp-empty">Nothing in use yet - assign values from the other tabs and they collect here.</p>';
    return `<div class="fp-panel fp-panel-summary">
<div class="fp-panel-head"><span class="fp-panel-title">Summary</span><span class="fp-panel-note">values the system draws on · reconcile to roles below</span></div>
${sections}${empty}
<div class="fp-section fp-section-roles">
<h3 class="fp-section-title">Semantic roles</h3>
<div id="semanticRolesMount"></div>
</div>
${buildSemanticScaleSectionHtml(ctx, 'space')}
${buildSemanticScaleSectionHtml(ctx, 'radius')}
${buildSemanticBorderSectionHtml(ctx)}
</div>`;
}
