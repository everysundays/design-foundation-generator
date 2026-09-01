// Color Palette preview - a raw swatch grid of every themeable variable, so
// every token can be visually sanity-checked in one glance.
window.THEME_TEMPLATES = window.THEME_TEMPLATES || {};
window.THEME_TEMPLATES['color-palette'] = `
<div class="p-8 max-w-5xl mx-auto">
  <h1 class="text-2xl font-bold mb-6">Color Palette</h1>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    ${[
      ['Background', 'bg-background', 'text-foreground', 'border border-border'],
      ['Foreground', 'bg-foreground', 'text-background', ''],
      ['Card', 'bg-card', 'text-card-foreground', 'border border-border'],
      ['Popover', 'bg-popover', 'text-popover-foreground', 'border border-border'],
      ['Primary', 'bg-primary', 'text-primary-foreground', ''],
      ['Secondary', 'bg-secondary', 'text-secondary-foreground', ''],
      ['Muted', 'bg-muted', 'text-muted-foreground', ''],
      ['Accent', 'bg-accent', 'text-accent-foreground', ''],
      ['Destructive', 'bg-destructive', 'text-destructive-foreground', ''],
      ['Border', 'bg-border', 'text-foreground', ''],
      ['Input', 'bg-input', 'text-foreground', ''],
      ['Ring', 'bg-ring', 'text-foreground', ''],
      ['Chart 1', 'bg-chart-1', 'text-white', ''],
      ['Chart 2', 'bg-chart-2', 'text-white', ''],
      ['Chart 3', 'bg-chart-3', 'text-white', ''],
      ['Chart 4', 'bg-chart-4', 'text-white', ''],
      ['Chart 5', 'bg-chart-5', 'text-white', ''],
      ['Sidebar', 'bg-sidebar', 'text-sidebar-foreground', 'border border-sidebar-border'],
      ['Sidebar Primary', 'bg-sidebar-primary', 'text-sidebar-primary-foreground', ''],
      ['Sidebar Accent', 'bg-sidebar-accent', 'text-sidebar-accent-foreground', '']
    ].map(([label, bg, text, extra]) => `
    <div class="rounded-lg ${bg} ${text} ${extra} p-4 h-24 flex flex-col justify-between shadow-sm">
      <span class="text-xs font-medium opacity-80">${label}</span>
    </div>`).join('')}
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
