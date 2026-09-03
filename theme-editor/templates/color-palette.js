// Color Palette preview - every semantic color token as a card: the swatch,
// its semantic name, and the palette token it's linked to (e.g. "tailwind
// neutral-900"), so the whole var-to-token mapping can be audited in one
// glance. The linked name is NOT baked into this markup - it's read from
// the `--link-<key>` CSS string vars cssVarBlockFor injects into the
// preview's :root (see its comment for why a CSS var and not a script
// global): that block is patched live on every pick and swapped whole on a
// light/dark switch, so the label here tracks the sidebar without this
// template ever reloading. Labels sit BELOW the swatch in the page's own
// foreground color, so no swatch needs a hardcoded contrast color (the old
// `text-white` on the chart tiles was the one loose, non-token color in the
// templates).
window.THEME_TEMPLATES = window.THEME_TEMPLATES || {};
window.THEME_TEMPLATES['color-palette'] = `
<style>
  /* Each .token-link carries its own --link-<key> as --l (set inline on the
     element), so one rule serves all 33 cards. "unlinked" is the literal
     string cssVarBlockFor emits for a color with no palette link, so it
     shows up here as that word - the sidebar's summary line is where the
     count/amber flag lives. */
  .token-link::after { content: var(--l); }
  .token-link-mode::after { content: var(--link-mode); }
</style>
<div class="p-8 max-w-5xl mx-auto">
  <div class="flex items-baseline justify-between mb-6">
    <h1 class="text-2xl font-bold">Color Palette</h1>
    <span class="text-xs text-muted-foreground">Semantic token &rarr; linked palette token (<span class="token-link-mode font-mono"></span> mode)</span>
  </div>
  ${[
    ['Base', [['background', 'Background'], ['foreground', 'Foreground']]],
    ['Card', [['card', 'Card'], ['card-foreground', 'Card Foreground']]],
    ['Popover', [['popover', 'Popover'], ['popover-foreground', 'Popover Foreground']]],
    ['Primary', [['primary', 'Primary'], ['primary-foreground', 'Primary Foreground']]],
    ['Secondary', [['secondary', 'Secondary'], ['secondary-foreground', 'Secondary Foreground']]],
    ['Muted', [['muted', 'Muted'], ['muted-foreground', 'Muted Foreground']]],
    ['Accent', [['accent', 'Accent'], ['accent-foreground', 'Accent Foreground']]],
    ['Destructive', [['destructive', 'Destructive'], ['destructive-foreground', 'Destructive Foreground']]],
    ['Border & Input', [['border', 'Border'], ['input', 'Input'], ['ring', 'Ring']]],
    ['Chart', [['chart-1', 'Chart 1'], ['chart-2', 'Chart 2'], ['chart-3', 'Chart 3'], ['chart-4', 'Chart 4'], ['chart-5', 'Chart 5']]],
    ['Sidebar', [
      ['sidebar', 'Sidebar'], ['sidebar-foreground', 'Sidebar Foreground'],
      ['sidebar-primary', 'Sidebar Primary'], ['sidebar-primary-foreground', 'Sidebar Primary Foreground'],
      ['sidebar-accent', 'Sidebar Accent'], ['sidebar-accent-foreground', 'Sidebar Accent Foreground'],
      ['sidebar-border', 'Sidebar Border'], ['sidebar-ring', 'Sidebar Ring']
    ]]
  ].map(([groupLabel, tokens]) => `
  <h2 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-2">${groupLabel}</h2>
  <div class="theme-grid-gap grid grid-cols-2 md:grid-cols-4 gap-4">
    ${tokens.map(([key, label]) => `
    <div class="rounded-lg border border-border bg-card text-card-foreground p-3 flex flex-col gap-2 shadow-sm">
      <div class="h-12 rounded-md border border-border bg-${key}"></div>
      <div class="flex flex-col">
        <span class="text-sm font-medium">${label}</span>
        <span class="text-xs text-muted-foreground font-mono token-link" style="--l: var(--link-${key})"></span>
      </div>
    </div>`).join('')}
  </div>`).join('')}
  <!-- shadow-color is themed like every color above but lives in the
       Element tab; listed here so the audit view covers all 33 links. -->
  <h2 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-2">Shadow</h2>
  <div class="theme-grid-gap grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="rounded-lg border border-border bg-card text-card-foreground p-3 flex flex-col gap-2 shadow-sm">
      <div class="h-12 rounded-md border border-border" style="background: var(--shadow-color)"></div>
      <div class="flex flex-col">
        <span class="text-sm font-medium">Shadow Color</span>
        <span class="text-xs text-muted-foreground font-mono token-link" style="--l: var(--link-shadow-color)"></span>
      </div>
    </div>
  </div>

  <h2 class="text-lg font-semibold mt-8 mb-3">Buttons</h2>
  <div class="flex flex-wrap gap-3">
    <button class="px-4 py-2 rounded-btn bg-primary text-primary-foreground font-medium">Primary</button>
    <button class="px-4 py-2 rounded-btn bg-secondary text-secondary-foreground font-medium">Secondary</button>
    <button class="px-4 py-2 rounded-btn bg-destructive text-destructive-foreground font-medium">Destructive</button>
    <button class="px-4 py-2 rounded-btn border border-input bg-background font-medium">Outline</button>
    <button class="px-4 py-2 rounded-btn hover:bg-accent hover:text-accent-foreground font-medium">Ghost</button>
  </div>

  <h2 class="text-lg font-semibold mt-8 mb-3">Badges</h2>
  <div class="flex flex-wrap gap-2">
    <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">Primary</span>
    <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">Secondary</span>
    <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive text-destructive-foreground">Destructive</span>
    <span class="px-2.5 py-0.5 rounded-full text-xs font-medium border border-border">Outline</span>
  </div>

  <h2 class="text-lg font-semibold mt-8 mb-3">Card</h2>
  <div class="rounded-lg border border-border bg-card text-card-foreground p-5 max-w-sm shadow-sm">
    <div class="font-semibold mb-1">Card title</div>
    <p class="text-sm text-muted-foreground">Supporting body copy, styled entirely from the active theme's tokens.</p>
  </div>
</div>
`;
