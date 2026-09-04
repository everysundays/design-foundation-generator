// Foundation + Typography page builders for the preview document.
// Both return the HTML that goes INSIDE
// <section data-page="foundation"> / <section data-page="typography">; the
// host (scripts.js) re-renders them with innerHTML on every edit, so they are
// pure functions of `ctx` and hold no state.
//
// Everything visible reads a CSS var the theme-vars block already emits
// (`--palette-*`, `--space-*`, `--radius-*`, `--font-size-*`, `--type-<set>-*`,
// semantic colors), so the pages track edits without being rebuilt; the only
// raw values in the markup are the palette hexes themselves (they ARE the
// data being shown) and the `--px` numbers that size the spacing bars.
// Interactive bits carry data-action attributes for preview/frame.js:
//   data-action="toggle-ramp"   data-family="neutral"
//   data-action="edit-semantic" data-key="primary"

function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function isHexColor(value) {
    return typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value.trim());
}

// The CSS var a scale entry is emitted as: `var(--radius-lg)`, `var(--space-200)`.
function scaleVar(kind, name) {
    return `var(${refToVar(scaleRef(kind, name))})`;
}

function pxLabel(entry) {
    return entry.px === null || entry.px === undefined ? '' : `${entry.px}px`;
}

function remLabel(entry) {
    return entry.rem === null || entry.rem === undefined ? '' : `${entry.rem}rem`;
}

// "3 in use" pill listing the component tokens that reference `ref`, or an
// empty cell so the grid columns stay aligned.
function inUseBadge(usage, ref) {
    const ids = (usage && usage[ref]) || [];
    if (!ids.length) return '<span class="fd-inuse-none"></span>';
    return `<span class="fd-inuse" title="${esc(ids.join('\n'))}">${ids.length} in use</span>`;
}

// --- Foundation page ---

// Semantic keys grouped by the palette name they link to, for one mode:
// { 'neutral-900': [{ key: 'primary', hex }] }. Only links into the active
// source count; a stale link from the other source is just "unlinked".
function linksByPaletteName(ctx, mode) {
    const map = {};
    const links = (ctx.links && ctx.links[mode]) || {};
    Object.keys(links).forEach(key => {
        const link = links[key];
        if (!link || link.source !== ctx.source || !link.name) return;
        (map[link.name] = map[link.name] || []).push({ key, hex: link.hex });
    });
    return map;
}

function buildRampChips(ctx) {
    const chips = ctx.allFamilies.map(family => {
        const hexes = paletteFamilyEntries(ctx.source, family).map(e => e.hex);
        const pressed = ctx.families.includes(family);
        return `<button type="button" class="fd-ramp-chip" data-action="toggle-ramp" data-family="${esc(family)}" aria-pressed="${pressed}" style="--ramp: linear-gradient(to right, ${hexes.join(', ')})"><i class="fd-ramp-mini"></i><span class="fd-ramp-name">${esc(family)}</span></button>`;
    }).join('');
    return `<section class="fd-section">
  <h2 class="fd-heading">Palette ramps</h2>
  <p class="page-muted">The system palette is a subset of ${esc(ctx.foundation.label)}. Pickers only offer these ramps; a semantic color linked outside them reports as unlinked.</p>
  <div class="fd-ramp-chips">${chips}</div>
</section>`;
}

function buildFamilyRows(ctx) {
    const mode = ctx.mode;
    const other = mode === 'dark' ? 'light' : 'dark';
    const mine = linksByPaletteName(ctx, mode);
    const theirs = linksByPaletteName(ctx, other);
    const otherMark = other === 'dark' ? 'D' : 'L';

    const rows = ctx.families.map(family => {
        const cells = paletteFamilyEntries(ctx.source, family).map(entry => {
            const badges = (mine[entry.name] || []).map(ref =>
                `<span class="fd-badge" title="${esc(`${ref.key} → ${entry.name} → ${entry.hex}`)}">${esc(ref.key)}</span>`
            ).join('');
            const otherRefs = theirs[entry.name] || [];
            const mark = otherRefs.length
                ? `<span class="fd-mode-mark" title="${esc(`${other}: ${otherRefs.map(r => r.key).join(', ')}`)}">${otherMark}</span>`
                : '';
            return `<div class="fd-swatch-cell">
          <div class="fd-swatch" style="--swatch: ${esc(entry.hex)}" title="${esc(`${entry.name} ${entry.hex}`)}">${mark}<span class="fd-swatch-badges">${badges}</span></div>
          <span class="fd-swatch-shade">${esc(entry.shade)}</span>
        </div>`;
        }).join('');
        return `<div class="fd-family-row">
      <div class="fd-family-label">${esc(family)}</div>
      <div class="fd-swatches">${cells}</div>
    </div>`;
    }).join('');

    const empty = ctx.families.length ? '' : '<p class="page-muted">No ramps selected — pick one above.</p>';
    return `<section class="fd-section">
  <h2 class="fd-heading">Color</h2>
  <p class="page-muted">Badges name the semantic roles linked to a step in <strong>${esc(mode)}</strong> mode; the <span class="fd-mode-mark fd-mode-mark-inline">${otherMark}</span> corner mark means the ${esc(other)} mode links there too.</p>
  <div class="fd-family-rows">${rows}${empty}</div>
</section>`;
}

function semanticCell(ctx, mode, key) {
    const link = ctx.links && ctx.links[mode] ? ctx.links[mode][key] : null;
    const raw = ctx.vars && ctx.vars[mode] ? ctx.vars[mode][key] : null;
    // white / black / transparent sit outside every ramp but are real,
    // nameable picks - they count as linked regardless of the subset.
    const SPECIALS = { white: '#ffffff', black: '#000000', transparent: 'transparent' };
    const special = link && link.source === ctx.source && SPECIALS[link.name] ? { name: link.name, hex: SPECIALS[link.name], family: null } : null;
    const entry = special || (link && link.source === ctx.source && link.name ? paletteEntryByName(ctx.source, link.name) : null);
    const inSubset = !!(entry && (special || ctx.families.includes(entry.family)));
    if (entry && inSubset) {
        return `<td class="fd-sem-cell"><i class="fd-dot" style="--swatch: ${esc(entry.hex)}"></i><span class="fd-sem-name">${esc(link.name)}</span><code class="fd-hex">${esc(entry.hex)}</code></td>`;
    }
    const hex = (link && isHexColor(link.hex) && link.hex) || (isHexColor(raw) ? raw.trim() : null);
    let why = 'No palette link';
    if (link && link.source !== ctx.source) why = `Linked to ${link.source}, not ${ctx.source}`;
    else if (entry) why = `${link.name} is outside the palette subset (${entry.family})`;
    return `<td class="fd-sem-cell fd-sem-cell-unlinked" title="${esc(why)}">${hex ? `<i class="fd-dot" style="--swatch: ${esc(hex)}"></i>` : ''}<span class="fd-unlinked">unlinked</span>${hex ? `<code class="fd-hex">${esc(hex)}</code>` : ''}</td>`;
}

function buildSemanticTable(ctx) {
    const groups = ctx.semanticGroups.slice();
    const hasShadow = groups.some(g => g.fields.some(([key]) => key === 'shadow-color'));
    if (!hasShadow) groups.push({ key: 'shadow', label: 'Shadow', fields: [['shadow-color', 'Shadow Color']] });

    const body = groups.map(group => {
        const rows = group.fields.map(([key, label]) =>
            `<tr class="fd-sem-row" data-action="edit-semantic" data-key="${esc(key)}">
        <td class="fd-sem-role"><span class="fd-sem-label">${esc(label)}</span><code class="fd-sem-key">${esc(key)}</code></td>
        ${semanticCell(ctx, 'light', key)}
        ${semanticCell(ctx, 'dark', key)}
      </tr>`
        ).join('');
        return `<tr class="fd-sem-group"><th colspan="3">${esc(group.label)}</th></tr>${rows}`;
    }).join('');

    return `<section class="fd-section">
  <h2 class="fd-heading">Semantic colors</h2>
  <p class="page-muted">Role → palette token → hex, light and dark side by side. Click a row to edit it.</p>
  <div class="fd-table-wrap"><table class="fd-semantic">
    <thead><tr><th>Role</th><th>Light</th><th>Dark</th></tr></thead>
    <tbody>${body}</tbody>
  </table></div>
</section>`;
}

// One scale as an aligned grid: name · value · detail · sample · in-use.
function scaleSection(title, note, rows, extraClass) {
    return `<section class="fd-section">
  <h2 class="fd-heading">${esc(title)}</h2>
  ${note ? `<p class="page-muted">${esc(note)}</p>` : ''}
  <div class="fd-scale${extraClass ? ` ${extraClass}` : ''}">${rows}</div>
</section>`;
}

function scaleRow(cells) {
    return `<div class="fd-scale-row">${cells.join('')}</div>`;
}

function buildSpacingSection(ctx) {
    const rows = ctx.foundation.space.map(entry => scaleRow([
        `<span class="fd-scale-name">${esc(entry.name)}</span>`,
        `<span class="fd-scale-value">${esc(remLabel(entry))}</span>`,
        `<span class="fd-scale-value">${esc(pxLabel(entry))}</span>`,
        `<span class="fd-bar" style="--px: ${Number(entry.px) || 0}" title="${esc(scaleVar('space', entry.name))}"></span>`,
        inUseBadge(ctx.usage, scaleRef('space', entry.name))
    ])).join('');
    return scaleSection('Spacing', ctx.foundation.unitNote, rows);
}

function buildRadiusSection(ctx) {
    const rows = ctx.foundation.radius.map(entry => scaleRow([
        `<span class="fd-scale-name">${esc(entry.name)}</span>`,
        `<span class="fd-scale-value">${esc(entry.rem === null ? entry.value : remLabel(entry))}</span>`,
        `<span class="fd-scale-value">${esc(pxLabel(entry))}</span>`,
        `<span class="fd-sample fd-sample-radius" style="--sample: ${scaleVar('radius', entry.name)}" title="${esc(scaleVar('radius', entry.name))}"></span>`,
        inUseBadge(ctx.usage, scaleRef('radius', entry.name))
    ])).join('');
    return scaleSection('Radius', '', rows);
}

function buildBorderWidthSection(ctx) {
    const rows = ctx.foundation.borderWidth.map(entry => scaleRow([
        `<span class="fd-scale-name">${esc(entry.name)}</span>`,
        `<span class="fd-scale-value">${esc(entry.value)}</span>`,
        `<span class="fd-scale-value"></span>`,
        `<span class="fd-sample fd-sample-border-width" style="--sample: ${scaleVar('borderWidth', entry.name)}" title="${esc(scaleVar('borderWidth', entry.name))}"></span>`,
        inUseBadge(ctx.usage, scaleRef('borderWidth', entry.name))
    ])).join('');
    return scaleSection('Border width', '', rows);
}

function buildBorderStyleSection(ctx) {
    // Style samples need a visible width to show their pattern: the scale's
    // 2px step if it has one, else its second entry (first non-zero).
    const widths = ctx.foundation.borderWidth;
    const widthEntry = widths.find(e => e.px === 2) || widths.find(e => e.px > 0) || widths[0];
    const widthVar = widthEntry ? scaleVar('borderWidth', widthEntry.name) : 'medium';
    const rows = ctx.foundation.borderStyle.map(entry => scaleRow([
        `<span class="fd-scale-name">${esc(entry.name)}</span>`,
        `<span class="fd-scale-value">${esc(entry.value)}</span>`,
        `<span class="fd-scale-value"></span>`,
        `<span class="fd-sample fd-sample-border-style" style="--sample: ${scaleVar('borderStyle', entry.name)}; --sample-width: ${widthVar}" title="${esc(scaleVar('borderStyle', entry.name))}"></span>`,
        inUseBadge(ctx.usage, scaleRef('borderStyle', entry.name))
    ])).join('');
    return scaleSection('Border style', '', rows);
}

function shadowLayersLabel(entry) {
    const layers = entry.layers || [];
    if (!layers.length) return 'none';
    return layers.map(([x, y, blur, spread, alpha]) => `${x} ${y} ${blur} ${spread} / ${alpha}`).join('  +  ');
}

function buildShadowSection(ctx) {
    const rows = ctx.foundation.shadow.map(entry => scaleRow([
        `<span class="fd-scale-name">${esc(entry.name)}</span>`,
        `<span class="fd-scale-value" title="${esc(entry.value)}">${esc(shadowLayersLabel(entry))}</span>`,
        `<span class="fd-scale-value">${(entry.layers || []).length ? `${entry.layers.length} layer${entry.layers.length === 1 ? '' : 's'}` : ''}</span>`,
        `<span class="fd-sample fd-sample-shadow" style="--sample: ${scaleVar('shadow', entry.name)}" title="${esc(scaleVar('shadow', entry.name))}"></span>`,
        inUseBadge(ctx.usage, scaleRef('shadow', entry.name))
    ])).join('');
    return scaleSection('Shadow', 'Shadow steps are shapes; their color is the semantic shadow-color.', rows, 'fd-scale-shadow');
}

function buildFoundationPageHtml(ctx) {
    return `<div class="page fd-page">
  <header class="page-header">
    <h1 class="page-title">Foundation</h1>
    <p class="page-lead">${esc(ctx.foundation.label)} · the values available in the system. Read-mostly: the scales come from the source; the palette subset is the one thing chosen here.</p>
  </header>
  ${buildRampChips(ctx)}
  ${buildFamilyRows(ctx)}
  ${buildSemanticTable(ctx)}
  ${buildSpacingSection(ctx)}
  ${buildRadiusSection(ctx)}
  ${buildBorderWidthSection(ctx)}
  ${buildBorderStyleSection(ctx)}
  ${buildShadowSection(ctx)}
</div>`;
}

// --- Typography page ---

function typeVar(setKey, prop) {
    return `type-${setKey}-${prop}`;
}

// The rem a set's size/leading sits at: the stored var ("1.5rem") or the
// set's seed.
function typeRem(vars, set, prop) {
    const n = parseFloat(vars[typeVar(set.key, prop)]);
    return Number.isFinite(n) ? n : set[prop];
}

// `var(--font-sans)` -> { ref: 'sans', face: 'Inter' }; a bare stack -> { ref: null, face }.
function typeFamilyChain(vars, set) {
    const raw = vars[typeVar(set.key, 'family')] || `var(--font-${set.family})`;
    const m = raw.match(/^var\(--font-(sans|serif|mono)\)$/);
    const stack = m ? (vars[`font-${m[1]}`] || '') : raw;
    const face = stack.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
    return { raw, ref: m ? m[1] : null, face: face || '?' };
}

function setBadges(sets) {
    return sets.map(set => `<i class="type-badge" data-set="${esc(set.key)}" title="${esc(set.label)}"></i>`).join('');
}

function buildSizeRamp(ctx) {
    const vars = ctx.vars[ctx.mode] || {};
    const pairing = ctx.foundation.typeSizeLeading || [];
    const rows = ctx.foundation.typeSize.map((entry, i) => {
        const uses = ctx.typeSets.filter(set => {
            const on = scaleEntryForRem(ctx.source, 'typeSize', typeRem(vars, set, 'size'));
            return on && on.name === entry.name;
        });
        const lead = pairing[i] != null ? scaleEntryForRem(ctx.source, 'typeLeading', pairing[i]) : null;
        const leadStyle = lead ? `; --sample-leading: ${scaleVar('typeLeading', lead.name)}` : '';
        return `<div class="tp-specimen">
      <span class="tp-specimen-name">${esc(entry.name)}</span>
      <span class="tp-specimen-px">${esc(pxLabel(entry))}</span>
      <span class="tp-specimen-sample" style="--sample: ${scaleVar('typeSize', entry.name)}${leadStyle}">The quick brown fox</span>
      <span class="tp-specimen-uses">${setBadges(uses)}</span>
    </div>`;
    }).join('');
    return `<section class="tp-section">
  <h2 class="fd-heading">Size ramp</h2>
  <p class="page-muted">Every size a set may take. Badges mark the sets sitting on a step.</p>
  <div class="tp-ramp">${rows}</div>
</section>`;
}

function buildLeadingRamp(ctx) {
    const vars = ctx.vars[ctx.mode] || {};
    const rows = ctx.foundation.typeLeading.map(entry => {
        const uses = ctx.typeSets.filter(set => {
            const on = scaleEntryForRem(ctx.source, 'typeLeading', typeRem(vars, set, 'leading'));
            return on && on.name === entry.name;
        });
        return `<div class="tp-specimen">
      <span class="tp-specimen-name">${esc(entry.name)}</span>
      <span class="tp-specimen-px">${esc(pxLabel(entry))}</span>
      <span class="tp-leading-sample" style="--sample: ${scaleVar('typeLeading', entry.name)}">The quick brown fox<br>jumps over the lazy dog</span>
      <span class="tp-specimen-uses">${setBadges(uses)}</span>
    </div>`;
    }).join('');
    return `<section class="tp-section">
  <h2 class="fd-heading">Leading ramp</h2>
  <p class="page-muted">Line heights a set may take; each sample is two lines so the step shows as height.</p>
  <div class="tp-ramp">${rows}</div>
</section>`;
}

function onScaleLabel(ctx, kind, rem) {
    const entry = scaleEntryForRem(ctx.source, kind, rem);
    if (entry) return `<span class="tp-token">${esc(entry.name)}</span> <span class="tp-token-px">${esc(pxLabel(entry))}</span>`;
    return `<span class="fd-unlinked" title="Not on the ${esc(ctx.foundation.label)} scale">off-scale</span> <span class="tp-token-px">${esc(`${rem}rem`)}</span>`;
}

function buildTypeSetCards(ctx) {
    const vars = ctx.vars[ctx.mode] || {};
    const cards = ctx.typeSets.map(set => {
        const chain = typeFamilyChain(vars, set);
        const family = chain.ref
            ? `<code class="tp-raw">${esc(chain.raw)}</code> <span class="tp-arrow">→</span> <span class="tp-token">${esc(chain.face)}</span>`
            : `<span class="tp-token">${esc(chain.face)}</span> <span class="page-muted">(pinned face)</span>`;
        const weight = vars[typeVar(set.key, 'weight')] || set.weight;
        const tracking = vars[typeVar(set.key, 'tracking')] || set.tracking;
        return `<article class="tp-set-card">
      <header class="tp-set-head">
        <i class="type-badge" data-set="${esc(set.key)}"></i>
        <span class="tp-set-label">${esc(set.label)}</span>
        <span class="tp-set-chain">${esc(ctx.typeSetSummary(vars, set))}</span>
      </header>
      <dl class="tp-set-meta">
        <dt>family</dt><dd>${family}</dd>
        <dt>weight</dt><dd><span class="tp-token">${esc(weight)}</span></dd>
        <dt>size</dt><dd>${onScaleLabel(ctx, 'typeSize', typeRem(vars, set, 'size'))}</dd>
        <dt>leading</dt><dd>${onScaleLabel(ctx, 'typeLeading', typeRem(vars, set, 'leading'))}</dd>
        <dt>tracking</dt><dd><span class="tp-token">${esc(tracking)}</span></dd>
      </dl>
      <p class="type-set tp-set-specimen" data-set="${esc(set.key)}">The quick brown fox jumps over the lazy dog</p>
    </article>`;
    }).join('');
    return `<section class="tp-section">
  <h2 class="fd-heading">Type sets</h2>
  <p class="page-muted">Roles a designer assigns text to. A set's family points at a family token, so swapping Sans re-fonts every set that leans on it.</p>
  <div class="tp-sets">${cards}</div>
</section>`;
}

// The v1 "phone" article: every line set by one type set, with a gutter
// badge naming the set (painted from --type-<set>-abbr/-badge by pages.css).
function buildSampleArticle(ctx) {
    const badges = keys => `<span class="type-badges">${keys.map(k => `<i class="type-badge" data-set="${esc(k)}"></i>`).join('')}</span>`;
    const block = (set, html, extra = []) =>
        `<div class="type-block type-set" data-set="${esc(set)}">${badges([set, ...extra])}${html}</div>`;

    const legend = ctx.typeSets.map(set => `<div class="type-legend-row">
        <i class="type-badge" data-set="${esc(set.key)}"></i>
        <span class="type-legend-name">${esc(set.label)}</span>
        <span class="type-legend-meta" data-set="${esc(set.key)}"></span>
      </div>`).join('');

    return `<section class="tp-section">
  <h2 class="fd-heading">Sample article</h2>
  <div class="type-legend">${legend}</div>
  <div class="tp-screen">
    ${block('caption', `<p class="tp-muted tp-split"><span>Design Systems</span><span>6 min read</span></p>`)}
    ${block('display', `<h1>Type sets, not font sizes</h1>`)}
    ${block('caption', `<p class="tp-muted">Published 3 September &middot; by the design team</p>`)}
    ${block('body', `<p>A typography set is a role - display, heading, body, caption - with a family, weight, size, line height and tracking decided once. Screens then say <em>which role</em> a line plays and never repeat the numbers.</p>`)}
    ${block('heading', `<h2>Why roles beat sizes</h2>`)}
    ${block('body', `<p>When a page is built from text-lg here and text-sm there, nobody can say afterwards what "the caption size" is. A set names it, so the answer is the same in every screen and every export.</p>`)}
    ${block('subheading', `<h3>The chain: set &rarr; family token &rarr; face</h3>`)}
    ${block('body', `<p>Each set's family points at the theme's Sans, Serif or Mono token rather than a face. Swap Sans in the sidebar and every set that leans on it re-fonts at once - or pin a set to its own face when it should stand apart.</p>`)}
    ${block('code', `<pre class="tp-code"><code>--type-heading-family: var(--font-sans);
--type-heading-size: var(--font-size-2xl);
--type-heading-leading: var(--font-leading-8);</code></pre>`)}
    ${block('label', `<div class="tp-tip">
      <p class="tp-tip-title">Tip</p>
      <p class="type-set" data-set="body">Sizes and line heights snap to the active scale - Tailwind's text-xs&hellip;7xl or Atlassian's font.size.* - so a set can only ever land on a real token.</p>
    </div>`, ['body'])}
    ${block('heading', `<h2>What the reader sees</h2>`)}
    ${block('body', `<p>Display for the one line that owns the screen, heading and subheading to structure it, body for reading, label for controls, caption for metadata, code for the literal. Seven roles cover nearly every product screen.</p>`)}
    ${block('label', `<div class="tp-actions">
      <span class="tp-btn">Continue reading</span>
      <span class="tp-btn tp-btn-outline">Save</span>
    </div>`)}
    ${block('caption', `<p class="tp-muted">Saved to your library 2 min ago</p>`)}
  </div>
</section>`;
}

function buildTypographyPageHtml(ctx) {
    return `<div class="page tp-page">
  <header class="page-header">
    <h1 class="page-title">Typography</h1>
    <p class="page-lead">${esc(ctx.foundation.label)} size and leading ramps, the seven type sets, and an article to judge them in context.</p>
  </header>
  ${buildSizeRamp(ctx)}
  ${buildLeadingRamp(ctx)}
  ${buildTypeSetCards(ctx)}
  ${buildSampleArticle(ctx)}
</div>`;
}
