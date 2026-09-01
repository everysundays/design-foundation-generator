// Dashboard preview template - a replica of shadcn's official "dashboard-01"
// block (sidebar nav, stat cards, area chart, tabbed data table), matching
// tweakcn's own Dashboard preview. Pure Tailwind utilities against the
// semantic color names the shell's iframe wrapper maps to CSS variables
// (bg-sidebar, bg-card, bg-chart-1, border-border, etc.) - never hardcoded
// hex, so the mockup re-themes automatically as tokens are edited.
window.THEME_TEMPLATES = window.THEME_TEMPLATES || {};
window.THEME_TEMPLATES['dashboard'] = `
<div class="flex h-screen text-sm bg-background text-foreground">

  <!-- Sidebar -->
  <div class="w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col">
    <div class="p-3">
      <a class="flex items-center gap-2 px-2 py-1.5 font-semibold">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7l3.5 8M12 7l-3.5 8M9.7 12.5h4.6"/></svg>
        <span>Acme Inc.</span>
      </a>
    </div>
    <nav class="px-3 flex flex-col gap-1">
      <button class="flex items-center gap-2 px-3 py-2 rounded-btn bg-primary text-primary-foreground font-medium shadow-sm">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>
        Quick Create
      </button>
      ${[
        ['Dashboard', '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'],
        ['Lifecycle', '<path d="M4 6h16M4 12h16M4 18h10"/>'],
        ['Analytics', '<path d="M4 20V10M10 20V4M16 20v-6M21 20H3"/>'],
        ['Projects', '<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>'],
        ['Team', '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5M16 8a3 3 0 110 5M21 20c0-2.4-1.5-4-3.7-4.7"/>']
      ].map(([label, icon]) => `
      <a class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon}</svg>
        ${label}
      </a>`).join('')}
    </nav>
    <div class="px-6 pt-5 pb-1 text-xs font-medium text-muted-foreground">Documents</div>
    <nav class="px-3 flex flex-col gap-1">
      ${[
        ['Data Library', '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'],
        ['Reports', '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>'],
        ['Word Assistant', '<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z"/><path d="M14 3v6h6"/>'],
        ['More', '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>']
      ].map(([label, icon]) => `
      <a class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon}</svg>
        ${label}
      </a>`).join('')}
    </nav>
    <nav class="mt-auto px-3 pb-2 flex flex-col gap-1">
      ${[
        ['Settings', '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>'],
        ['Get Help', '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>'],
        ['Search', '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>']
      ].map(([label, icon]) => `
      <a class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon}</svg>
        ${label}
      </a>`).join('')}
    </nav>
    <div class="p-3 border-t border-sidebar-border">
      <div class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer">
        <div class="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold shrink-0">CN</div>
        <div class="min-w-0 flex-1">
          <div class="font-semibold truncate leading-tight">shadcn</div>
          <div class="text-xs text-muted-foreground truncate leading-tight">m@example.com</div>
        </div>
        <svg class="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </div>
    </div>
  </div>

  <!-- Main -->
  <div class="flex-1 min-w-0 flex flex-col bg-background">
    <div class="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
      <button class="p-1.5 rounded-btn hover:bg-muted"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg></button>
      <div class="w-px h-4 bg-border"></div>
      <h1 class="font-medium">Documents</h1>
    </div>

    <div class="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col gap-4">

      <!-- Stat cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${[
          ['Total Revenue', '$1,250.00', '+12.5%', true, 'Trending up this month', 'Visitors for the last 6 months'],
          ['New Customers', '1,234', '-20%', false, 'Down 20% this period', 'Acquisition needs attention'],
          ['Active Accounts', '45,678', '+12.5%', true, 'Strong user retention', 'Engagement exceed targets']
        ].map(([label, value, delta, up, line1, line2]) => `
        <div class="rounded-xl border border-border bg-card text-card-foreground p-5 shadow-sm">
          <div class="flex items-start justify-between gap-2">
            <span class="text-sm text-muted-foreground">${label}</span>
            <span class="flex items-center gap-1 px-2 py-0.5 rounded-md border border-border text-xs font-medium">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${up ? '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>' : '<path d="M3 7l6 6 4-4 8 8M15 17h6v-6"/>'}</svg>
              ${delta}
            </span>
          </div>
          <div class="mt-1 text-2xl font-semibold tabular-nums">${value}</div>
          <div class="mt-3 flex items-center gap-1 text-sm font-medium">
            ${line1}
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${up ? '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>' : '<path d="M3 7l6 6 4-4 8 8M15 17h6v-6"/>'}</svg>
          </div>
          <div class="text-sm text-muted-foreground">${line2}</div>
        </div>`).join('')}
      </div>

      <!-- Total Visitors chart -->
      <div class="rounded-xl border border-border bg-card text-card-foreground p-5 shadow-sm">
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="font-semibold">Total Visitors</div>
            <div class="text-sm text-muted-foreground">Total for the last 3 months</div>
          </div>
          <button class="flex items-center gap-2 px-3 py-1.5 rounded-btn border border-input bg-background text-sm font-medium hover:bg-muted">
            Last 3 months
            <svg class="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>
        <div class="mt-4">
          <svg class="w-full h-56" viewBox="0 0 800 220" preserveAspectRatio="none">
            <g class="text-border" stroke="currentColor" stroke-width="1">
              <line x1="0" y1="55" x2="800" y2="55"/>
              <line x1="0" y1="110" x2="800" y2="110"/>
              <line x1="0" y1="165" x2="800" y2="165"/>
            </g>
            <path class="text-chart-2" fill="currentColor" fill-opacity="0.25"
              d="M0,120 L45,95 L90,130 L135,80 L180,105 L225,60 L270,90 L315,50 L360,85 L405,40 L450,75 L495,55 L540,95 L585,45 L630,70 L675,35 L720,65 L760,45 L800,60 L800,220 L0,220 Z"/>
            <path class="text-chart-2" fill="none" stroke="currentColor" stroke-width="2"
              d="M0,120 L45,95 L90,130 L135,80 L180,105 L225,60 L270,90 L315,50 L360,85 L405,40 L450,75 L495,55 L540,95 L585,45 L630,70 L675,35 L720,65 L760,45 L800,60"/>
            <path class="text-chart-1" fill="currentColor" fill-opacity="0.35"
              d="M0,175 L45,155 L90,180 L135,140 L180,160 L225,125 L270,150 L315,115 L360,145 L405,105 L450,135 L495,120 L540,155 L585,110 L630,135 L675,100 L720,130 L760,110 L800,125 L800,220 L0,220 Z"/>
            <path class="text-chart-1" fill="none" stroke="currentColor" stroke-width="2"
              d="M0,175 L45,155 L90,180 L135,140 L180,160 L225,125 L270,150 L315,115 L360,145 L405,105 L450,135 L495,120 L540,155 L585,110 L630,135 L675,100 L720,130 L760,110 L800,125"/>
          </svg>
          <div class="flex justify-between text-xs text-muted-foreground mt-2">
            ${['Jun 1', 'Jun 3', 'Jun 5', 'Jun 7', 'Jun 9', 'Jun 12', 'Jun 15', 'Jun 18', 'Jun 21'].map(d => `<span>${d}</span>`).join('')}
          </div>
        </div>
      </div>

      <!-- Tabbed data table -->
      <div>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1 bg-muted rounded-lg p-1 text-sm">
            <button class="px-3 py-1.5 rounded-btn bg-background shadow-sm font-medium">Outline</button>
            <button class="px-3 py-1.5 rounded-btn text-muted-foreground flex items-center gap-1.5">Past Performance <span class="px-1.5 rounded-full bg-muted-foreground/20 text-xs">3</span></button>
            <button class="px-3 py-1.5 rounded-btn text-muted-foreground flex items-center gap-1.5">Key Personnel <span class="px-1.5 rounded-full bg-muted-foreground/20 text-xs">2</span></button>
            <button class="px-3 py-1.5 rounded-btn text-muted-foreground">Focus Documents</button>
          </div>
          <button class="flex items-center gap-2 px-3 py-1.5 rounded-btn border border-input bg-background text-sm font-medium hover:bg-muted">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/></svg>
            Customize Columns
            <svg class="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>
        <div class="mt-3 rounded-lg border border-border overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/50 text-muted-foreground">
              <tr class="border-b border-border">
                <th class="w-8 px-3 py-2"></th>
                <th class="w-8 px-1 py-2"><span class="block w-4 h-4 rounded border border-input bg-background"></span></th>
                <th class="px-3 py-2 text-left font-medium">Header</th>
                <th class="px-3 py-2 text-left font-medium">Section Type</th>
                <th class="px-3 py-2 text-right font-medium">Target</th>
                <th class="px-3 py-2 text-right font-medium">Limit</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border bg-card text-card-foreground">
              ${[
                ['Cover page', 'Cover page', '18', '5'],
                ['Table of contents', 'Table of contents', '29', '24'],
                ['Executive summary', 'Narrative', '10', '13'],
                ['Technical approach', 'Narrative', '27', '23'],
                ['Design', 'Narrative', '2', '16'],
                ['Capabilities', 'Narrative', '20', '8']
              ].map(([header, type, target, limit]) => `
              <tr class="hover:bg-muted/50">
                <td class="px-3 py-2 text-muted-foreground"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="18" r="1.3"/></svg></td>
                <td class="px-1 py-2"><span class="block w-4 h-4 rounded border border-input bg-background"></span></td>
                <td class="px-3 py-2 font-medium whitespace-nowrap">${header}</td>
                <td class="px-3 py-2 whitespace-nowrap"><span class="px-2 py-0.5 rounded-md border border-border text-xs text-muted-foreground">${type}</span></td>
                <td class="px-3 py-2 text-right"><input class="w-16 px-2 py-1 rounded-md border border-input bg-background text-right text-sm" value="${target}" readonly></td>
                <td class="px-3 py-2 text-right"><input class="w-16 px-2 py-1 rounded-md border border-input bg-background text-right text-sm" value="${limit}" readonly></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</div>
`;
