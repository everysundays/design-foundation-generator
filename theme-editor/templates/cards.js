// Cards preview template - a responsive grid of small dashboard-style demo
// cards (stat + sparkline, calendar, goal stepper, subscription form, line
// chart, payments table), matching the shape of tweakcn's own ?p=cards
// preview. Pure Tailwind utility classes against the semantic color names the
// shell's iframe wrapper maps to CSS variables - never hardcoded hex, so it
// re-themes automatically. Charts are plain inline SVG, controls are static.
window.THEME_TEMPLATES = window.THEME_TEMPLATES || {};
window.THEME_TEMPLATES['cards'] = `
<div class="p-6 bg-background min-h-screen text-foreground">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

    <!-- Column 1: Total Revenue + Upgrade form -->
    <div class="flex flex-col gap-4">

      <!-- Total Revenue -->
      <div class="rounded-xl border border-border bg-card text-card-foreground p-6 shadow-sm">
        <div class="text-sm text-muted-foreground">Total Revenue</div>
        <div class="text-3xl font-bold mt-1">$15,231.89</div>
        <div class="text-xs text-muted-foreground mt-1">+20.1% from last month</div>
        <svg class="w-full h-16 mt-4 text-primary" viewBox="0 0 200 60" fill="none" preserveAspectRatio="none">
          <path d="M0 45 C 20 42, 35 30, 55 32 S 90 48, 110 40 S 150 12, 170 15 S 195 25, 200 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>

      <!-- Upgrade your subscription -->
      <div class="rounded-xl border border-border bg-card text-card-foreground p-6 shadow-sm">
        <div class="text-lg font-semibold">Upgrade your subscription</div>
        <p class="text-sm text-muted-foreground mt-1">You are currently on the free plan. Upgrade to the pro plan to get access to all features.</p>

        <div class="grid grid-cols-2 gap-3 mt-5">
          <div>
            <label class="text-sm font-medium">Name</label>
            <input class="mt-1.5 w-full px-3 py-2 rounded-md border border-input bg-background text-sm" value="Evil Rabbit" readonly>
          </div>
          <div>
            <label class="text-sm font-medium">Email</label>
            <input class="mt-1.5 w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-muted-foreground" placeholder="example@acme.com" readonly>
          </div>
        </div>

        <div class="mt-4">
          <label class="text-sm font-medium">Card Number</label>
          <div class="grid grid-cols-[2fr_1fr_1fr] gap-3 mt-1.5">
            <input class="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-muted-foreground" placeholder="1234 1234 1234 1234" readonly>
            <input class="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-muted-foreground" placeholder="MM/YY" readonly>
            <input class="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-muted-foreground" placeholder="CVC" readonly>
          </div>
        </div>

        <div class="mt-4">
          <div class="text-sm font-medium">Plan</div>
          <div class="text-sm text-muted-foreground mt-0.5">Select the plan that best fits your needs.</div>
          <div class="grid grid-cols-2 gap-3 mt-3">
            <div class="rounded-md border border-primary bg-muted/40 p-3 flex gap-2 cursor-pointer">
              <span class="mt-0.5 w-4 h-4 shrink-0 rounded-full border border-primary flex items-center justify-center"><span class="w-2 h-2 rounded-full bg-primary"></span></span>
              <span>
                <span class="block text-sm font-medium">Starter Plan</span>
                <span class="block text-xs text-muted-foreground mt-0.5">Perfect for small businesses.</span>
              </span>
            </div>
            <div class="rounded-md border border-input p-3 flex gap-2 cursor-pointer">
              <span class="mt-0.5 w-4 h-4 shrink-0 rounded-full border border-input"></span>
              <span>
                <span class="block text-sm font-medium">Pro Plan</span>
                <span class="block text-xs text-muted-foreground mt-0.5">More features and storage.</span>
              </span>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <label class="text-sm font-medium">Notes</label>
          <textarea class="mt-1.5 w-full rounded-md border border-input bg-background p-3 text-sm text-muted-foreground" rows="3" placeholder="Enter notes" readonly></textarea>
        </div>

        <div class="mt-4 flex flex-col gap-2.5">
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded-sm border border-input"></span>
            <span class="text-sm">I agree to the terms and conditions</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded-sm bg-primary text-primary-foreground flex items-center justify-center">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
            </span>
            <span class="text-sm">Allow us to send you emails</span>
          </div>
        </div>

        <div class="mt-5 flex justify-between">
          <button class="px-4 py-2 rounded-btn border border-input bg-background text-sm font-medium">Cancel</button>
          <button class="px-4 py-2 rounded-btn bg-primary text-primary-foreground text-sm font-medium">Upgrade</button>
        </div>
      </div>
    </div>

    <!-- Columns 2-3 -->
    <div class="md:col-span-2 flex flex-col gap-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

        <!-- Calendar -->
        <div class="rounded-xl border border-border bg-card text-card-foreground p-4 shadow-sm">
          <div class="flex items-center justify-between px-1">
            <button class="p-1.5 rounded-btn border border-input"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>
            <div class="text-sm font-medium">June 2025</div>
            <button class="p-1.5 rounded-btn border border-input"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></button>
          </div>
          <div class="grid grid-cols-7 gap-y-1 mt-3 text-center text-xs">
            ${['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => `<div class="text-muted-foreground font-medium py-1">${d}</div>`).join('')}
            ${[
              [1, ''], [2, ''], [3, ''], [4, ''], [5, 'sel'], [6, 'range'], [7, 'range'],
              [8, 'range'], [9, 'range'], [10, 'range'], [11, 'range'], [12, 'range'], [13, 'sel'], [14, ''],
              [15, ''], [16, ''], [17, ''], [18, ''], [19, ''], [20, ''], [21, ''],
              [22, ''], [23, ''], [24, ''], [25, ''], [26, ''], [27, ''], [28, ''],
              [29, ''], [30, ''], [1, 'out'], [2, 'out'], [3, 'out'], [4, 'out'], [5, 'out']
            ].map(([day, state]) => `
            <div class="flex justify-center">
              <span class="w-8 h-8 flex items-center justify-center rounded-md ${
                state === 'sel' ? 'bg-primary text-primary-foreground font-medium' :
                state === 'range' ? 'bg-accent text-accent-foreground' :
                state === 'out' ? 'text-muted-foreground/50' : ''
              }">${day}</span>
            </div>`).join('')}
          </div>
        </div>

        <!-- Move Goal -->
        <div class="rounded-xl border border-border bg-card text-card-foreground p-6 shadow-sm">
          <div class="text-lg font-semibold">Move Goal</div>
          <div class="text-sm text-muted-foreground mt-0.5">Set your daily activity goal.</div>
          <div class="flex items-center justify-center gap-4 mt-6">
            <button class="w-8 h-8 shrink-0 rounded-full border border-input flex items-center justify-center">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
            </button>
            <div class="text-center">
              <div class="text-4xl font-bold tracking-tight">350</div>
              <div class="text-[10px] uppercase text-muted-foreground tracking-wide">Calories/day</div>
            </div>
            <button class="w-8 h-8 shrink-0 rounded-full border border-input flex items-center justify-center">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
          <div class="flex items-end justify-between gap-1 h-20 mt-6">
            ${[62, 45, 30, 48, 28, 42, 26, 38, 55, 32, 44, 24, 66].map(h => `<div class="flex-1 rounded-sm bg-primary" style="height:${h}%"></div>`).join('')}
          </div>
          <button class="mt-6 w-full px-4 py-2 rounded-btn bg-secondary text-secondary-foreground text-sm font-medium">Set Goal</button>
        </div>
      </div>

      <!-- Exercise Minutes -->
      <div class="rounded-xl border border-border bg-card text-card-foreground p-6 shadow-sm">
        <div class="text-lg font-semibold">Exercise Minutes</div>
        <div class="text-sm text-muted-foreground mt-0.5">Your exercise minutes are ahead of where you normally are.</div>
        <svg class="w-full h-44 mt-4" viewBox="0 0 700 160" fill="none" preserveAspectRatio="none">
          <g class="text-border" stroke="currentColor" stroke-width="1">
            <line x1="0" y1="20" x2="700" y2="20"/>
            <line x1="0" y1="55" x2="700" y2="55"/>
            <line x1="0" y1="90" x2="700" y2="90"/>
            <line x1="0" y1="125" x2="700" y2="125"/>
          </g>
          <path class="text-primary/40" d="M20 100 C 120 92, 220 105, 320 98 S 520 80, 680 88" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path class="text-primary" d="M20 110 C 90 128, 130 132, 170 120 S 250 60, 320 70 S 480 110, 560 95 S 660 45, 680 40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <circle class="text-primary" cx="320" cy="70" r="4" fill="currentColor"/>
        </svg>
        <div class="flex justify-between text-xs text-muted-foreground mt-2 px-1">
          ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<span>${d}</span>`).join('')}
        </div>
      </div>

      <!-- Payments -->
      <div class="rounded-xl border border-border bg-card text-card-foreground p-6 shadow-sm">
        <div class="text-lg font-semibold">Payments</div>
        <div class="text-sm text-muted-foreground mt-0.5">Manage your payments.</div>
        <div class="mt-4 rounded-md border border-border overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-muted-foreground">
                <th class="w-10 p-3"><span class="block w-4 h-4 rounded-sm border border-input"></span></th>
                <th class="p-3 text-left font-medium">Status</th>
                <th class="p-3 text-left font-medium">Email</th>
                <th class="p-3 text-right font-medium">Amount</th>
                <th class="w-10 p-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              ${[
                ['Success', 'ken99@example.com', '$316.00'],
                ['Success', 'abe45@example.com', '$242.00'],
                ['Processing', 'monserrat44@example.com', '$837.00'],
                ['Success', 'silas22@example.com', '$874.00']
              ].map(([status, email, amount]) => `
              <tr class="hover:bg-muted/50">
                <td class="p-3"><span class="block w-4 h-4 rounded-sm border border-input"></span></td>
                <td class="p-3">${status}</td>
                <td class="p-3">${email}</td>
                <td class="p-3 text-right">${amount}</td>
                <td class="p-3 text-muted-foreground">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>
`;
