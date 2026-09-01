// Application preview template - a generic analytics/finance SaaS app shell:
// a ticker strip, a price-chart card, a transactions list with tab filters,
// and a right-hand activity feed. All content (asset names, figures, people,
// copy) is invented for this mockup; avatars are initials-in-a-circle only.
// Pure Tailwind utilities against the semantic theme color names the iframe
// wrapper maps to CSS variables - never hardcoded hex - so it re-themes live.
window.THEME_TEMPLATES = window.THEME_TEMPLATES || {};
window.THEME_TEMPLATES['application'] = `
<div class="flex h-screen text-sm bg-background text-foreground">

  <!-- Left column: ticker + chart + transactions -->
  <div class="flex-1 min-w-0 flex flex-col overflow-y-auto">

    <!-- Ticker strip -->
    <div class="border-b border-border bg-card text-card-foreground">
      <div class="flex divide-x divide-border overflow-x-auto">
        ${[
          ['NVAR', 'Novara Materials', '182.44', '+1.82%', true],
          ['TALO', 'Talos Grid', '64.10', '-0.47%', false],
          ['QRNT', 'Quorent Labs', '311.09', '+2.35%', true],
          ['MYRA', 'Myra Logistics', '48.77', '+0.61%', true],
          ['ZEPH', 'Zephyr Marine', '97.52', '-1.14%', false]
        ].map(([sym, name, price, change, up]) => `
        <div class="px-5 py-3 min-w-[160px] shrink-0">
          <div class="flex items-center gap-2">
            <span class="font-semibold">${sym}</span>
            <span class="text-xs ${up ? 'text-chart-2' : 'text-destructive'} font-medium">${change}</span>
          </div>
          <div class="text-xs text-muted-foreground truncate">${name}</div>
          <div class="font-medium mt-0.5">$${price}</div>
        </div>`).join('')}
      </div>
    </div>

    <div class="p-6 flex flex-col gap-6">

      <!-- Price chart card -->
      <div class="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div class="p-5 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">NV</div>
              <div>
                <div class="font-semibold">Novara Materials</div>
                <div class="text-xs text-muted-foreground">NVAR &middot; Composite Index</div>
              </div>
            </div>
            <div class="mt-4 flex items-baseline gap-3">
              <span class="text-3xl font-bold tracking-tight">$182.44</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-chart-2 text-primary-foreground">+1.82%</span>
              <span class="text-xs text-muted-foreground">today</span>
            </div>
          </div>
          <div class="flex gap-1 bg-muted rounded-md p-0.5">
            <button class="px-3 py-1 rounded text-xs text-muted-foreground">1D</button>
            <button class="px-3 py-1 rounded text-xs text-muted-foreground">1W</button>
            <button class="px-3 py-1 rounded bg-background shadow-sm text-xs font-medium">1M</button>
            <button class="px-3 py-1 rounded text-xs text-muted-foreground">1Y</button>
            <button class="px-3 py-1 rounded text-xs text-muted-foreground">All</button>
          </div>
        </div>
        <div class="px-5">
          <svg class="w-full h-40 text-chart-1" viewBox="0 0 600 160" preserveAspectRatio="none">
            <path d="M0,120 L40,112 L80,118 L120,96 L160,104 L200,84 L240,92 L280,70 L320,78 L360,58 L400,66 L440,44 L480,54 L520,34 L560,42 L600,24 L600,160 L0,160 Z"
                  fill="currentColor" fill-opacity="0.12" stroke="none"/>
            <path d="M0,120 L40,112 L80,118 L120,96 L160,104 L200,84 L240,92 L280,70 L320,78 L360,58 L400,66 L440,44 L480,54 L520,34 L560,42 L600,24"
                  fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="600" cy="24" r="4" fill="currentColor"/>
          </svg>
          <div class="flex justify-between text-[10px] text-muted-foreground pb-3 pt-1">
            <span>Aug 3</span><span>Aug 10</span><span>Aug 17</span><span>Aug 24</span><span>Aug 31</span>
          </div>
        </div>
        <div class="grid grid-cols-2 divide-x divide-border border-t border-border">
          <div class="p-4 flex items-center justify-between">
            <span class="text-xs text-muted-foreground">Market Cap</span>
            <span class="font-medium">$41.7B</span>
          </div>
          <div class="p-4 flex items-center justify-between">
            <span class="text-xs text-muted-foreground">Volume (24h)</span>
            <span class="font-medium">6.2M</span>
          </div>
        </div>
      </div>

      <!-- Transactions card -->
      <div class="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div class="p-5 flex items-center justify-between flex-wrap gap-3 border-b border-border">
          <div>
            <div class="font-semibold">Transactions</div>
            <div class="text-xs text-muted-foreground">Recent account movements</div>
          </div>
          <div class="flex gap-1 bg-muted rounded-md p-0.5">
            <button class="px-3 py-1 rounded bg-background shadow-sm text-xs font-medium">Completed</button>
            <button class="px-3 py-1 rounded text-xs text-muted-foreground">Pending</button>
            <button class="px-3 py-1 rounded text-xs text-muted-foreground">Cancelled</button>
          </div>
        </div>
        <div class="divide-y divide-border">
          ${[
            ['B', 'Buy order &middot; QRNT', '12 shares at $308.90', '-$3,706.80', 'Aug 29', 'bg-primary text-primary-foreground'],
            ['D', 'Dividend &middot; MYRA', 'Quarterly payout', '+$86.20', 'Aug 27', 'bg-chart-2 text-primary-foreground'],
            ['S', 'Sell order &middot; ZEPH', '30 shares at $99.15', '+$2,974.50', 'Aug 25', 'bg-secondary text-secondary-foreground'],
            ['T', 'Transfer in', 'From linked savings', '+$1,500.00', 'Aug 22', 'bg-accent text-accent-foreground'],
            ['F', 'Platform fee', 'Monthly plan renewal', '-$14.00', 'Aug 20', 'bg-muted text-muted-foreground']
          ].map(([initial, title, subtitle, amount, date, chip]) => `
          <div class="px-5 py-3.5 flex items-center gap-3 hover:bg-muted/50">
            <div class="w-9 h-9 rounded-full ${chip} flex items-center justify-center text-xs font-bold shrink-0">${initial}</div>
            <div class="min-w-0 flex-1">
              <div class="font-medium truncate">${title}</div>
              <div class="text-xs text-muted-foreground truncate">${subtitle}</div>
            </div>
            <div class="text-right shrink-0">
              <div class="font-medium ${amount.startsWith('+') ? 'text-chart-2' : ''}">${amount}</div>
              <div class="text-xs text-muted-foreground">${date}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </div>
  </div>

  <!-- Right column: activity feed -->
  <div class="w-80 shrink-0 border-l border-border bg-sidebar text-sidebar-foreground flex flex-col">
    <div class="p-4 border-b border-sidebar-border">
      <div class="font-semibold mb-3">Activity</div>
      <input class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm" placeholder="Search activity" readonly>
      <div class="flex gap-1 bg-sidebar-accent/40 rounded-md p-0.5 mt-3">
        <button class="flex-1 px-2 py-1 rounded bg-sidebar-primary text-sidebar-primary-foreground text-xs font-medium">All</button>
        <button class="flex-1 px-2 py-1 rounded text-xs text-muted-foreground">Tasks</button>
        <button class="flex-1 px-2 py-1 rounded text-xs text-muted-foreground">Meetings</button>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto divide-y divide-sidebar-border">
      ${[
        ['RK', 'Rina Kovac', '8m ago', 'Rebalanced the growth portfolio and flagged two positions for review.', 'Portfolio', 'bg-chart-1'],
        ['DO', 'Dele Okafor', '32m ago', 'Approved the pending wire transfer to the settlement account.', 'Approval', 'bg-chart-3'],
        ['MT', 'Maren Thal', '1h ago', 'Scheduled the quarterly earnings walkthrough for Thursday.', 'Meeting', 'bg-chart-4'],
        ['JS', 'Jonas Sperling', '3h ago', 'Updated the risk limits on the ZEPH position after the drawdown alert.', 'Risk', 'bg-chart-5'],
        ['AP', 'Anya Petrov', 'Yesterday', 'Closed out the reconciliation task for the August statements.', 'Task', 'bg-chart-2'],
        ['LM', 'Luca Marchetti', 'Yesterday', 'Left a note on the QRNT buy order about lot sizing.', 'Comment', 'bg-chart-1']
      ].map(([initials, name, time, desc, tag, dot]) => `
      <div class="p-4 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full ${dot} text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">${initials}</div>
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline justify-between gap-2">
              <span class="font-medium truncate">${name}</span>
              <span class="text-[10px] text-muted-foreground shrink-0">${time}</span>
            </div>
            <p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">${desc}</p>
          </div>
        </div>
        <div class="mt-2 pl-12">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground">${tag}</span>
        </div>
      </div>`).join('')}
    </div>
    <div class="p-3 border-t border-sidebar-border">
      <button class="w-full px-3 py-2 rounded-btn bg-primary text-primary-foreground text-xs font-medium">View all activity</button>
    </div>
  </div>
</div>
`;
