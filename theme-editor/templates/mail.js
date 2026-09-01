// Mail preview template - a 3-pane email client mockup (folder list / message
// list / reading pane), matching the shape of tweakcn's own ?p=mail preview.
// Pure Tailwind utility classes against the semantic color names the shell's
// iframe wrapper maps to CSS variables (bg-primary, text-muted-foreground,
// border-border, etc.) - never hardcoded hex, so it re-themes automatically.
window.THEME_TEMPLATES = window.THEME_TEMPLATES || {};
window.THEME_TEMPLATES['mail'] = `
<div class="flex h-screen text-sm">
  <div class="w-64 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground flex flex-col">
    <div class="p-3 border-b border-sidebar-border">
      <button class="w-full flex items-center justify-between px-3 py-2 rounded-btn bg-sidebar-accent text-sidebar-accent-foreground font-medium">
        <span>Alicia Koch</span>
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </button>
    </div>
    <nav class="p-2 flex flex-col gap-0.5">
      <a class="flex items-center justify-between px-3 py-2 rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-medium">
        <span>Inbox</span><span>128</span>
      </a>
      <a class="flex items-center px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Drafts <span class="ml-auto text-muted-foreground">9</span></a>
      <a class="flex items-center px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Sent</a>
      <a class="flex items-center px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Junk <span class="ml-auto text-muted-foreground">23</span></a>
      <a class="flex items-center px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Trash</a>
      <a class="flex items-center px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Archive</a>
    </nav>
    <nav class="p-2 flex flex-col gap-0.5 border-t border-sidebar-border">
      <a class="flex items-center px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Social <span class="ml-auto text-muted-foreground">972</span></a>
      <a class="flex items-center px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Updates <span class="ml-auto text-muted-foreground">342</span></a>
      <a class="flex items-center px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Forums <span class="ml-auto text-muted-foreground">128</span></a>
      <a class="flex items-center px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Shopping <span class="ml-auto text-muted-foreground">8</span></a>
      <a class="flex items-center px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Promotions <span class="ml-auto text-muted-foreground">21</span></a>
    </nav>
  </div>

  <div class="w-96 shrink-0 border-r border-border bg-background flex flex-col">
    <div class="p-4 border-b border-border flex items-center justify-between">
      <h1 class="text-lg font-bold">Inbox</h1>
      <div class="flex gap-1 bg-muted rounded-md p-0.5">
        <button class="px-2 py-1 rounded bg-background shadow-sm text-xs font-medium">All mail</button>
        <button class="px-2 py-1 rounded text-xs text-muted-foreground">Unread</button>
      </div>
    </div>
    <div class="p-3 border-b border-border">
      <input class="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" placeholder="Search" readonly>
    </div>
    <div class="flex-1 overflow-y-auto divide-y divide-border">
      ${[
        ['William Smith', 'Meeting Tomorrow', "Hi, let's have a meeting tomorrow to discuss the project.", ['meeting', 'work', 'important'], true],
        ['Alice Smith', 'Re: Project Update', 'Thank you for the project update. It looks great!', ['work', 'important'], false],
        ['Bob Johnson', 'Weekend Plans', 'Any plans for the weekend? I was thinking of hiking.', ['personal'], false],
        ['Emily Davis', 'Re: Question about Budget', 'I have a question about the budget for the project.', ['work', 'budget'], false],
        ['Michael Wilson', 'Important Announcement', 'I have an important announcement to make.', ['important'], false]
      ].map(([name, subject, body, tags, active]) => `
      <div class="p-4 cursor-pointer ${active ? 'bg-accent/10 border-l-2 border-l-primary' : 'hover:bg-muted/50'}">
        <div class="flex justify-between items-baseline">
          <span class="font-semibold">${name}</span>
          <span class="text-xs text-muted-foreground">3 years ago</span>
        </div>
        <div class="font-medium text-sm mt-0.5">${subject}</div>
        <p class="text-xs text-muted-foreground mt-1 line-clamp-2">${body}</p>
        <div class="flex gap-1 mt-2">
          ${tags.map((t, i) => `<span class="px-2 py-0.5 rounded-full text-[10px] ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}">${t}</span>`).join('')}
        </div>
      </div>`).join('')}
    </div>
  </div>

  <div class="flex-1 bg-background flex flex-col">
    <div class="p-4 border-b border-border flex items-center gap-2">
      <button class="p-2 rounded-btn hover:bg-muted"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/></svg></button>
      <button class="p-2 rounded-btn hover:bg-muted"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>
      <button class="p-2 rounded-btn text-destructive hover:bg-destructive/10"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>
    </div>
    <div class="p-6 border-b border-border">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">WS</div>
        <div>
          <div class="font-semibold">William Smith</div>
          <div class="text-xs text-muted-foreground">Reply-To: williamsmith@example.com</div>
        </div>
      </div>
      <p class="mt-4 text-sm leading-relaxed">Hi, let's have a meeting tomorrow to discuss the project. I've been reviewing the details and have some ideas I'd like to share. It's crucial that we ensure the project's success.</p>
      <p class="mt-4 text-sm leading-relaxed">Please come prepared with any questions or insights you may have for our meeting!</p>
      <p class="mt-4 text-sm">Best regards,<br>William</p>
    </div>
    <div class="mt-auto p-4">
      <textarea class="w-full rounded-md border border-input bg-background p-3 text-sm" rows="3" placeholder="Reply William Smith..." readonly></textarea>
    </div>
  </div>
</div>
`;
