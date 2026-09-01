// Typography preview - a single-column type-scale showcase proving every
// heading step, font family (sans/serif/mono), and weight the active theme
// defines. Pure Tailwind utilities against the semantic theme tokens
// (text-foreground, text-muted-foreground, border-primary, bg-muted, etc.) -
// never hardcoded hex - so it re-themes and re-fonts automatically when the
// sidebar changes colors or font families.
window.THEME_TEMPLATES = window.THEME_TEMPLATES || {};
window.THEME_TEMPLATES['typography'] = `
<div class="p-8 max-w-2xl mx-auto bg-background text-foreground">
  <div class="space-y-10">

    <header>
      <p class="text-xs text-muted-foreground font-semibold tracking-wide uppercase mb-2">Typography</p>
      <h1 class="font-sans text-5xl font-bold tracking-tight">Type Scale</h1>
      <p class="mt-3 text-muted-foreground">Every heading step, family, and weight in the active theme, on one page.</p>
    </header>

    <section>
      <p class="text-xs text-muted-foreground font-semibold tracking-wide uppercase mb-4">Heading scale &middot; font-sans</p>
      <div class="space-y-4 font-sans">
        ${[
          ['h1', 'text-4xl font-bold'],
          ['h2', 'text-3xl font-bold'],
          ['h3', 'text-2xl font-semibold'],
          ['h4', 'text-xl font-semibold'],
          ['h5', 'text-lg font-medium'],
          ['h6', 'text-base font-medium']
        ].map(([tag, cls]) => `
        <div class="flex items-baseline gap-4">
          <span class="w-8 shrink-0 font-mono text-xs text-muted-foreground">${tag}</span>
          <${tag} class="${cls}">The quick brown fox jumps over the lazy dog</${tag}>
        </div>`).join('')}
      </div>
    </section>

    <section>
      <p class="text-xs text-muted-foreground font-semibold tracking-wide uppercase mb-4">Serif</p>
      <p class="font-serif text-2xl">The quick brown fox jumps over the lazy dog</p>
      <p class="font-serif mt-3 leading-relaxed">Grumpy wizards make toxic brew for the evil queen and jack, set in the theme's serif face at body size.</p>
    </section>

    <section>
      <p class="text-xs text-muted-foreground font-semibold tracking-wide uppercase mb-4">Monospace</p>
      <pre class="font-mono text-sm bg-muted text-foreground rounded-md p-4 overflow-x-auto"><code>const theme = createTheme({ radius: '0.5rem', font: 'sans' });</code></pre>
    </section>

    <section>
      <p class="text-xs text-muted-foreground font-semibold tracking-wide uppercase mb-4">Body</p>
      <p class="leading-relaxed">Design tokens turn a theme into a single source of truth. Change one variable in the sidebar and every surface on this page - headings, cards, code blocks - updates in the same instant. That is the whole point of a semantic palette.</p>
      <p class="mt-2 text-sm text-muted-foreground">A muted caption line, one size down from body text.</p>
    </section>

    <section>
      <p class="text-xs text-muted-foreground font-semibold tracking-wide uppercase mb-4">Blockquote</p>
      <blockquote class="border-l-4 border-primary pl-4 italic text-muted-foreground">
        Typography is the craft of endowing human language with a durable visual form.
      </blockquote>
    </section>

    <section>
      <p class="text-xs text-muted-foreground font-semibold tracking-wide uppercase mb-4">Inline code</p>
      <p class="leading-relaxed">Install the tokens with <code class="bg-muted px-1.5 py-0.5 rounded font-mono text-sm">npm install @acme/tokens</code> and import them anywhere in the app.</p>
    </section>

    <section>
      <p class="text-xs text-muted-foreground font-semibold tracking-wide uppercase mb-4">Weights</p>
      <div class="flex flex-wrap gap-8">
        ${[
          ['font-normal', 'Normal'],
          ['font-medium', 'Medium'],
          ['font-semibold', 'Semibold'],
          ['font-bold', 'Bold']
        ].map(([cls, label]) => `
        <div>
          <div class="${cls} text-2xl">Aa</div>
          <div class="text-xs text-muted-foreground mt-1">${label}</div>
        </div>`).join('')}
      </div>
    </section>

  </div>
</div>
`;
