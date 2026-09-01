// Marketing preview template - an original SaaS landing-page hero mockup:
// top nav (logo + links + auth buttons), centered hero (announcement pill,
// two-line headline, supporting copy, CTAs), and a decorative gradient
// placeholder visual built purely from theme tokens (no images/videos).
// All copy and the product name ("Fernline") are invented for this preview.
// Pure Tailwind utilities against the semantic color names the shell's iframe
// wrapper maps to CSS variables - never hardcoded hex, so it re-themes live.
window.THEME_TEMPLATES = window.THEME_TEMPLATES || {};
window.THEME_TEMPLATES['marketing'] = `
<div class="bg-background text-foreground min-h-screen">

  <header class="border-b border-border">
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 3v18M12 8c-3 0-6-1.5-7-4 3 0 6 1 7 4zM12 13c3 0 6-1.5 7-4-3 0-6 1-7 4zM12 18c-3 0-6-1.5-7-4 3 0 6 1 7 4z"/></svg>
        </div>
        <span class="font-bold text-lg tracking-tight">Fernline</span>
      </div>
      <nav class="hidden md:flex items-center gap-1 text-sm">
        <a class="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer">Products</a>
        <a class="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer">Solutions</a>
        <a class="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer">Pricing</a>
        <a class="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer">Company</a>
      </nav>
      <div class="flex items-center gap-2 text-sm">
        <button class="px-4 py-2 rounded-btn font-medium hover:bg-muted">Login</button>
        <button class="px-4 py-2 rounded-btn bg-primary text-primary-foreground font-medium shadow-sm">Get started</button>
      </div>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-6">
    <section class="pt-20 pb-14 flex flex-col items-center text-center">
      <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted text-xs font-medium">
        <span class="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">New</span>
        <span class="text-muted-foreground">Fernline Pulse alerts are now generally available</span>
        <svg class="w-3 h-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </span>

      <h1 class="mt-8 text-4xl md:text-6xl font-bold tracking-tight leading-tight">
        Turn scattered signals<br class="hidden md:block">
        into one clear roadmap
      </h1>

      <p class="mt-6 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
        Fernline gathers feedback, usage trends, and support themes into a single
        workspace, so your team decides what to build next in minutes, not meetings.
      </p>

      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button class="px-6 py-3 rounded-btn bg-primary text-primary-foreground font-semibold shadow-sm">Start free trial</button>
        <button class="px-6 py-3 rounded-btn border border-input bg-background font-semibold hover:bg-muted">Watch the tour</button>
      </div>
      <p class="mt-3 text-xs text-muted-foreground">Free for 14 days. No credit card required.</p>
    </section>

    <section class="pb-20">
      <div class="relative rounded-xl border border-border bg-gradient-to-br from-primary/20 via-accent/15 to-chart-2/20 overflow-hidden shadow-sm">
        <div class="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-primary/30 blur-3xl"></div>
        <div class="absolute -bottom-20 -right-10 w-80 h-80 rounded-full bg-accent/30 blur-3xl"></div>

        <div class="relative px-6 pt-10 md:px-16 md:pt-14">
          <div class="max-w-3xl mx-auto rounded-t-lg border border-b-0 border-border bg-card text-card-foreground shadow-lg">
            <div class="flex items-center gap-1.5 px-4 py-3 border-b border-border">
              <span class="w-2.5 h-2.5 rounded-full bg-muted"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-muted"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-muted"></span>
              <div class="ml-3 flex-1 h-5 rounded-sm bg-muted max-w-xs"></div>
            </div>
            <div class="p-5 grid grid-cols-3 gap-4">
              <div class="col-span-2 rounded-md border border-border p-4">
                <div class="h-3 w-24 rounded-sm bg-muted"></div>
                <div class="mt-4 flex items-end gap-2 h-24">
                  <div class="flex-1 rounded-sm bg-chart-1 h-1/3"></div>
                  <div class="flex-1 rounded-sm bg-chart-2 h-1/2"></div>
                  <div class="flex-1 rounded-sm bg-chart-3 h-2/3"></div>
                  <div class="flex-1 rounded-sm bg-chart-4 h-1/2"></div>
                  <div class="flex-1 rounded-sm bg-chart-5 h-full"></div>
                  <div class="flex-1 rounded-sm bg-chart-1 h-3/4"></div>
                </div>
              </div>
              <div class="flex flex-col gap-4">
                <div class="flex-1 rounded-md border border-border p-4">
                  <div class="h-3 w-16 rounded-sm bg-muted"></div>
                  <div class="mt-3 h-5 w-12 rounded-sm bg-primary"></div>
                </div>
                <div class="flex-1 rounded-md border border-border p-4">
                  <div class="h-3 w-16 rounded-sm bg-muted"></div>
                  <div class="mt-3 h-5 w-12 rounded-sm bg-accent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</div>
`;
