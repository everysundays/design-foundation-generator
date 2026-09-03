// Overview preview template - a single page collecting many UI components
// across their variants (buttons, badges, form controls, alerts, avatars,
// tabs, popover/tooltip, a table, progress, chart swatches, sidebar) so
// every semantic token's effect can be checked in one glance instead of
// switching between the other preview tabs. Complements the "Color
// Palette" tab (raw token swatches) rather than duplicating it - this page
// is about components built FROM those tokens and their variations, not
// the tokens themselves.
window.THEME_TEMPLATES = window.THEME_TEMPLATES || {};
window.THEME_TEMPLATES['overview'] = `
<div class="p-8 max-w-5xl mx-auto bg-background text-foreground">
  <h1 class="text-2xl font-bold mb-1">Overview</h1>
  <p class="text-sm text-muted-foreground mb-8">Every component, across its variants, on the active theme.</p>

  <!-- Buttons - real hover:/active: states on each one, not separate
       pre-rendered "what hover looks like" copies, so pointing at / pressing
       any button here shows its actual live transition. -->
  <h2 class="text-lg font-semibold mb-1">Buttons</h2>
  <p class="text-xs text-muted-foreground mb-3">Hover and click any of these - the color change is live.</p>
  <div class="flex flex-wrap items-center gap-3">
    <button class="px-4 py-2 rounded-btn bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90 active:bg-primary/80">Primary</button>
    <button class="px-4 py-2 rounded-btn bg-secondary text-secondary-foreground text-sm font-medium transition-colors hover:bg-secondary/80 active:bg-secondary/70">Secondary</button>
    <button class="px-4 py-2 rounded-btn bg-destructive text-destructive-foreground text-sm font-medium transition-colors hover:bg-destructive/90 active:bg-destructive/80">Destructive</button>
    <button class="px-4 py-2 rounded-btn border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground active:bg-accent/70">Outline</button>
    <button class="px-4 py-2 rounded-btn text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground active:bg-accent/70">Ghost</button>
    <button class="px-4 py-2 rounded-btn text-primary text-sm font-medium underline-offset-4 transition-colors hover:underline active:opacity-70">Link</button>
    <button class="px-4 py-2 rounded-btn bg-primary text-primary-foreground text-sm font-medium opacity-50 pointer-events-none cursor-not-allowed">Disabled</button>
    <button class="px-4 py-2 rounded-btn border border-input bg-background text-sm font-medium opacity-50 pointer-events-none cursor-not-allowed">Disabled Outline</button>
  </div>

  <!-- Badges -->
  <h2 class="text-lg font-semibold mt-8 mb-3">Badges</h2>
  <div class="flex flex-wrap gap-2">
    <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">Primary</span>
    <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">Secondary</span>
    <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive text-destructive-foreground">Destructive</span>
    <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">Accent</span>
    <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">Muted</span>
    <span class="px-2.5 py-0.5 rounded-full text-xs font-medium border border-border">Outline</span>
  </div>

  <!-- Form controls - the Default input is a real, typable field (hover it,
       click into it) rather than a separate static "Focused" clone; the
       checkbox/radio/switch below are real inputs too (sr-only + a styled
       label), toggled via peer-checked, so clicking them actually flips the
       state instead of showing two fixed "Checked"/"Unchecked" copies. -->
  <h2 class="text-lg font-semibold mt-8 mb-1">Form Controls</h2>
  <p class="text-xs text-muted-foreground mb-3">Real inputs - hover, focus, and click to see the live states.</p>
  <div class="theme-grid-gap grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
    <div>
      <label class="text-sm font-medium">Default</label>
      <input class="mt-1.5 w-full px-3 py-2 rounded-md border border-input bg-background text-sm transition-colors hover:border-ring/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring" placeholder="Type here">
    </div>
    <div>
      <label class="text-sm font-medium">Invalid</label>
      <input class="mt-1.5 w-full px-3 py-2 rounded-md border border-destructive bg-background text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-destructive" value="Invalid value">
    </div>
    <div>
      <label class="text-sm font-medium">Disabled</label>
      <input class="mt-1.5 w-full px-3 py-2 rounded-md border border-input bg-muted text-sm text-muted-foreground opacity-70 cursor-not-allowed" value="Disabled" disabled>
    </div>
  </div>

  <div class="flex flex-wrap items-center gap-6 mt-4">
    <label class="group flex items-center gap-2 text-sm cursor-pointer select-none">
      <input type="checkbox" class="peer sr-only" checked>
      <span class="w-4 h-4 rounded-sm border border-input flex items-center justify-center transition-colors group-hover:border-ring peer-checked:bg-primary peer-checked:border-primary peer-checked:[&>svg]:opacity-100">
        <svg class="w-3 h-3 text-primary-foreground opacity-0 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
      </span>
      Checkbox
    </label>
    <label class="group flex items-center gap-2 text-sm cursor-pointer select-none">
      <input type="radio" name="ov-radio" class="peer sr-only" checked>
      <span class="w-4 h-4 shrink-0 rounded-full border border-input flex items-center justify-center transition-colors group-hover:border-ring peer-checked:border-primary peer-checked:[&>span]:bg-primary">
        <span class="w-2 h-2 rounded-full bg-transparent transition-colors"></span>
      </span>
      Radio A
    </label>
    <label class="group flex items-center gap-2 text-sm cursor-pointer select-none">
      <input type="radio" name="ov-radio" class="peer sr-only">
      <span class="w-4 h-4 shrink-0 rounded-full border border-input flex items-center justify-center transition-colors group-hover:border-ring peer-checked:border-primary peer-checked:[&>span]:bg-primary">
        <span class="w-2 h-2 rounded-full bg-transparent transition-colors"></span>
      </span>
      Radio B
    </label>
    <label class="group flex items-center gap-2 text-sm cursor-pointer select-none">
      <input type="checkbox" class="peer sr-only" checked>
      <span class="w-9 h-5 rounded-full bg-input p-0.5 flex items-center transition-colors group-hover:bg-input/70 peer-checked:bg-primary peer-checked:justify-end peer-checked:group-hover:bg-primary/90">
        <span class="w-4 h-4 rounded-full bg-background"></span>
      </span>
      Switch
    </label>
  </div>

  <!-- Alerts -->
  <h2 class="text-lg font-semibold mt-8 mb-3">Alerts</h2>
  <div class="theme-grid-gap flex flex-col gap-3 max-w-2xl">
    <div class="rounded-lg border border-border bg-card text-card-foreground p-4 text-sm">
      <div class="font-medium">Heads up</div>
      <div class="text-muted-foreground mt-0.5">A neutral, informational message using card colors.</div>
    </div>
    <div class="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive p-4 text-sm">
      <div class="font-medium">Something went wrong</div>
      <div class="mt-0.5 opacity-90">A destructive-tinted message using the destructive token at low opacity.</div>
    </div>
  </div>

  <!-- Avatars -->
  <h2 class="text-lg font-semibold mt-8 mb-3">Avatars</h2>
  <div class="flex items-center gap-3">
    <span class="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">AB</span>
    <span class="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-medium">CD</span>
    <span class="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">EF</span>
    <span class="w-10 h-10 rounded-full border border-border bg-background text-foreground flex items-center justify-center text-sm font-medium">GH</span>
  </div>

  <!-- Tabs -->
  <h2 class="text-lg font-semibold mt-8 mb-3">Tabs</h2>
  <div class="inline-flex rounded-lg bg-muted p-1 gap-1">
    <span class="px-3 py-1.5 rounded-md bg-background text-foreground text-sm font-medium shadow-sm">Account</span>
    <span class="px-3 py-1.5 rounded-md text-muted-foreground text-sm font-medium">Password</span>
    <span class="px-3 py-1.5 rounded-md text-muted-foreground text-sm font-medium">Team</span>
  </div>

  <!-- Popover & Tooltip -->
  <h2 class="text-lg font-semibold mt-8 mb-3">Popover &amp; Tooltip</h2>
  <div class="theme-grid-gap flex items-start gap-6">
    <div class="rounded-lg border border-border bg-popover text-popover-foreground p-4 shadow-sm text-sm max-w-xs">
      <div class="font-medium mb-1">Popover title</div>
      <div class="text-muted-foreground">Floating panel content, styled from the popover tokens.</div>
    </div>
    <span class="px-2 py-1 rounded-md bg-foreground text-background text-xs">Tooltip text</span>
  </div>

  <!-- Table -->
  <h2 class="text-lg font-semibold mt-8 mb-3">Table</h2>
  <div class="rounded-md border border-border overflow-x-auto max-w-2xl">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-border text-muted-foreground">
          <th class="p-3 text-left font-medium">Status</th>
          <th class="p-3 text-left font-medium">Email</th>
          <th class="p-3 text-right font-medium">Amount</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        <tr class="hover:bg-muted/50">
          <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs bg-primary text-primary-foreground">Success</span></td>
          <td class="p-3">ken99@example.com</td>
          <td class="p-3 text-right">$316.00</td>
        </tr>
        <tr class="hover:bg-muted/50">
          <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">Processing</span></td>
          <td class="p-3">monserrat44@example.com</td>
          <td class="p-3 text-right">$837.00</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Progress -->
  <h2 class="text-lg font-semibold mt-8 mb-3">Progress</h2>
  <div class="max-w-md h-2 rounded-full bg-muted overflow-hidden">
    <div class="h-full w-2/3 rounded-full bg-primary"></div>
  </div>

  <!-- Chart colors -->
  <h2 class="text-lg font-semibold mt-8 mb-3">Chart Colors</h2>
  <div class="flex items-end gap-3 h-24">
    ${[['chart-1', 70], ['chart-2', 50], ['chart-3', 85], ['chart-4', 40], ['chart-5', 60]].map(([key, h]) => `
    <div class="flex flex-col items-center gap-1.5">
      <div class="w-8 rounded-t-sm bg-${key}" style="height:${Math.round(h * 0.96)}px"></div>
      <span class="text-[10px] text-muted-foreground">${key}</span>
    </div>`).join('')}
  </div>

  <!-- Sidebar -->
  <h2 class="text-lg font-semibold mt-8 mb-3">Sidebar</h2>
  <div class="rounded-lg border border-sidebar-border bg-sidebar text-sidebar-foreground p-3 max-w-xs">
    <div class="px-2 py-1.5 rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium mb-1">Dashboard</div>
    <div class="px-2 py-1.5 rounded-md bg-sidebar-accent text-sidebar-accent-foreground text-sm mb-1">Projects</div>
    <div class="px-2 py-1.5 rounded-md text-sm">Settings</div>
  </div>
</div>
`;
