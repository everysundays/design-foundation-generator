// Typography preview - a mobile-ish reading screen where every line is set
// by one of the theme's typography SETS (--type-<set>-family/size/leading/
// weight/tracking, see TYPE_SETS in scripts.js), never by a raw text-* size.
// Each block carries a circular badge in the left gutter naming the set it
// uses (the token-generator "typography-name" idea) and a legend at the top
// maps badge -> set -> resolved family / size token / line-height.
//
// The badge glyph, color and legend text all come from preview-only vars
// scripts.js emits into <style id="type-meta"> (--type-<set>-abbr/-badge/
// -meta) and are painted with `content: var(...)`, so this template holds
// no copy of TYPE_SETS' identity data - the sidebar and this page can't
// disagree. Badge/legend chrome is styled in the <style> below because the
// iframe has no styles.css; theme colors still go through Tailwind's
// semantic utilities (bg-card, text-muted-foreground, ...) like every
// other template.
window.THEME_TEMPLATES = window.THEME_TEMPLATES || {};
window.THEME_TEMPLATES['typography'] = (() => {
  // Only the keys and human labels - which sets exist is scripts.js's
  // TYPE_SETS; this is the order the legend lists them in.
  const SETS = [
    ['display', 'Display'], ['heading', 'Heading'], ['subheading', 'Subheading'],
    ['body', 'Body'], ['label', 'Label'], ['caption', 'Caption'], ['code', 'Code']
  ];

  const setCss = SETS.map(([k]) => `
  .type-set[data-set="${k}"] {
    --_leading: var(--type-${k}-leading);
    font-family: var(--type-${k}-family);
    font-size: var(--type-${k}-size);
    line-height: var(--type-${k}-leading);
    font-weight: var(--type-${k}-weight);
    letter-spacing: var(--type-${k}-tracking, 0);
  }
  .type-badge[data-set="${k}"] { background: var(--type-${k}-badge, #888); }
  .type-badge[data-set="${k}"]::before { content: var(--type-${k}-abbr, "?"); }
  .type-legend-meta[data-set="${k}"]::before { content: var(--type-${k}-meta, ""); }`).join('');

  const badges = (sets) => `<span class="type-badges">${sets.map(s => `<i class="type-badge" data-set="${s}"></i>`).join('')}</span>`;

  // A gutter-badged block set in `set`. `extra` lists further sets used by
  // children inside the block (each child then carries its own .type-set),
  // shown as additional badges - primary badge nearest the text.
  const block = (set, html, { extra = [], cls = '' } = {}) =>
    `<div class="type-block type-set ${cls}" data-set="${set}">${badges([set, ...extra])}${html}</div>`;

  const legend = SETS.map(([k, label]) => `
      <div class="type-legend-row">
        <i class="type-badge" data-set="${k}"></i>
        <span class="type-legend-name">${label}</span>
        <span class="type-legend-meta text-muted-foreground" data-set="${k}"></span>
      </div>`).join('');

  return `
<style>
  .type-page { padding: 2rem 1.5rem 3rem; max-width: 44rem; margin: 0 auto; }
  .type-legend {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr));
    gap: 0.5rem 1.5rem;
  }
  .type-legend-row { display: flex; align-items: center; gap: 0.5rem; font-size: 12px; line-height: 1.25rem; min-width: 0; }
  .type-legend-name { font-weight: 600; min-width: 5.5rem; }
  .type-legend-meta { font-family: ui-monospace, monospace; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .type-badge {
    display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 9999px; flex-shrink: 0;
    color: #fff; font: 700 10px/1 ui-sans-serif, system-ui, sans-serif;
    font-style: normal; letter-spacing: 0;
  }

  /* The "phone": a fixed-width screen pushed right by --gutter so the
     badges have room to sit outside its frame. */
  .type-screen { --gutter: 4.25rem; margin-left: var(--gutter); max-width: 24rem; }
  .type-block { position: relative; }
  /* Badges hang left of the block's box: past its own left edge, the
     screen's padding (1.25rem) and a 0.75rem breathing gap. Centered on the
     block's first line via the set's own leading. */
  .type-badges {
    position: absolute;
    right: calc(100% + 1.25rem + 0.75rem);
    top: calc((var(--_leading, 1.5rem) - 22px) / 2);
    display: flex; flex-direction: row-reverse; gap: 4px;
  }
  ${setCss}
</style>

<div class="type-page bg-background text-foreground">

  <header class="mb-8">
    <p class="text-xs text-muted-foreground font-semibold tracking-wide uppercase mb-2">Typography sets</p>
    <div class="type-legend">${legend}</div>
  </header>

  <div class="type-screen bg-card text-card-foreground border border-border rounded-2xl shadow-sm px-5 pt-5 pb-6 space-y-5">

    ${block('caption', `<p class="text-muted-foreground flex justify-between"><span>Design Systems</span><span>6 min read</span></p>`)}

    ${block('display', `<h1>Type sets, not font sizes</h1>`)}

    ${block('caption', `<p class="text-muted-foreground">Published 3 September &middot; by the design team</p>`)}

    ${block('body', `<p>A typography set is a role - display, heading, body, caption - with a family, weight, size, line height and tracking decided once. Screens then say <em>which role</em> a line plays and never repeat the numbers.</p>`)}

    ${block('heading', `<h2>Why roles beat sizes</h2>`)}

    ${block('body', `<p>When a page is built from text-lg here and text-sm there, nobody can say afterwards what "the caption size" is. A set names it, so the answer is the same in every screen and every export.</p>`)}

    ${block('subheading', `<h3>The chain: set &rarr; family token &rarr; face</h3>`)}

    ${block('body', `<p>Each set's family points at the theme's Sans, Serif or Mono token rather than a face. Swap Sans in the sidebar and every set that leans on it re-fonts at once - or pin a set to its own face when it should stand apart.</p>`)}

    ${block('code', `<pre class="type-set bg-muted text-foreground rounded-md p-3 overflow-x-auto" data-set="code"><code>--type-heading-family: var(--font-sans);
--type-heading-size: 1.5rem;   /* 2xl */
--type-heading-leading: 2rem;  /* leading-8 */</code></pre>`)}

    ${block('label', `<div class="rounded-lg border border-border bg-background p-3 space-y-1">
      <p class="text-primary uppercase tracking-wide">Tip</p>
      <p class="type-set" data-set="body">Sizes and line heights snap to the active scale - Tailwind's text-xs&hellip;7xl or Atlassian's font.size.* - so a set can only ever land on a real token.</p>
    </div>`, { extra: ['body'] })}

    ${block('heading', `<h2>What the reader sees</h2>`)}

    ${block('body', `<p>Display for the one line that owns the screen, heading and subheading to structure it, body for reading, label for controls, caption for metadata, code for the literal. Seven roles cover nearly every product screen.</p>`)}

    ${block('label', `<div class="flex items-center gap-3">
      <button class="bg-primary text-primary-foreground rounded-btn px-4 py-2">Continue reading</button>
      <button class="border border-border rounded-btn px-4 py-2">Save</button>
    </div>`)}

    ${block('caption', `<p class="text-muted-foreground">Saved to your library 2 min ago</p>`)}

  </div>
</div>
`;
})();
