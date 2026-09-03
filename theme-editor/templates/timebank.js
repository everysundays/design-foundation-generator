// Timebank preview template - a mobile "card design" gallery for the owner's
// Thai Time Bank PWA (~/Sites/timebank/web/app). Three phone frames render the
// real app shell (topbar + scrollable screen + 3-item bottom nav) with the
// home, feed and wallet pages' actual Thai copy and card shapes, followed by a
// "Pieces" section showing each shell/card piece in isolation with a caption.
//
// Mapping from the app's own tokens to the theme's semantic names:
//   --color-accent/--color-accent-fg -> primary/primary-foreground
//   --color-bg + border card          -> card/card-foreground + border
//   --color-muted                     -> muted-foreground
//   --color-error (ด่วน)              -> destructive
//   --radius (cards) / pill chips     -> rounded-lg / rounded-md
//   --touch 48px                      -> min-h-12 (56px nav -> min-h-14, 64px action -> min-h-16)
// Pure Tailwind utilities against the theme color names the iframe wrapper
// maps to CSS variables - no hex, no arbitrary values - so every sidebar
// control re-themes it live. Card-list containers carry `theme-grid-gap` so
// the Grid slider drives between-card gaps (see buildGapOverrideCss).
window.THEME_TEMPLATES = window.THEME_TEMPLATES || {};

(function () {
  const ICONS = {
    feed: '<svg class="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    activities: '<svg class="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    wallet: '<svg class="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>'
  };

  // ---- shell pieces -------------------------------------------------------

  const statusBar = () => `
    <div class="flex items-center justify-between px-6 py-2 text-xs font-semibold bg-card text-card-foreground">
      <span>9:41</span>
      <span class="flex items-center gap-1.5">
        <svg class="w-4 h-3" viewBox="0 0 20 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="0.5"/><rect x="5" y="6" width="3" height="6" rx="0.5"/><rect x="10" y="3" width="3" height="9" rx="0.5"/><rect x="15" y="0" width="3" height="12" rx="0.5"/></svg>
        <svg class="w-6 h-3" viewBox="0 0 28 12" fill="none" stroke="currentColor" aria-hidden="true"><rect x="0.5" y="0.5" width="23" height="11" rx="2.5"/><rect x="2.5" y="2.5" width="17" height="7" rx="1" fill="currentColor" stroke="none"/><path d="M25.5 4v4" stroke-width="1.5" stroke-linecap="round"/></svg>
      </span>
    </div>`;

  const topbar = (title, withBack) => `
    <header class="flex items-center gap-2 px-4 py-2 min-h-12 border-b border-border bg-card text-card-foreground">
      ${withBack ? '<button class="text-2xl leading-none pr-2 min-h-12" aria-label="ย้อนกลับ">&lsaquo;</button>' : ''}
      <span class="font-semibold truncate">${title}</span>
    </header>`;

  const bottomNav = (active) => `
    <nav class="flex border-t border-border bg-card" aria-label="เมนูหลัก">
      ${[['home', 'หน้าแรก'], ['activities', 'กิจกรรม'], ['wallet', 'กระเป๋าเวลา']].map(([key, label]) => `
      <button class="flex-1 min-h-14 text-sm ${active === key ? 'text-card-foreground font-semibold' : 'text-muted-foreground'}">${label}</button>`).join('')}
    </nav>`;

  // ---- card pieces --------------------------------------------------------

  const balanceChip = (minutes) => `
    <span class="self-start inline-flex items-center px-4 py-1 rounded-md border border-border text-sm text-muted-foreground">แต้มเวลา: ${minutes} นาที</span>`;

  const primaryAction = (icon, title, sub) => `
    <button class="flex items-center gap-3 text-left p-4 min-h-16 rounded-lg bg-primary text-primary-foreground">
      ${icon}
      <span class="flex flex-col gap-1">
        <span class="font-semibold">${title}</span>
        <span class="text-sm opacity-80">${sub}</span>
      </span>
    </button>`;

  const todoRow = (label) => `
    <button class="flex items-center justify-between gap-2 text-left px-4 py-2 min-h-12 rounded-lg border border-border bg-card text-card-foreground">
      <span>${label}</span>
      <span class="text-sm text-muted-foreground whitespace-nowrap">ทำเลย &rsaquo;</span>
    </button>`;

  const todoCard = (items) => `
    <section class="flex flex-col gap-2 p-4 rounded-lg border border-dashed border-border bg-card text-card-foreground">
      <h2 class="font-medium">ยังเหลืออีก ${items.length} อย่าง</h2>
      <div class="flex flex-col gap-2">${items.map(todoRow).join('')}</div>
    </section>`;

  // home's .hm-hint is a solid border; feed's .feed2-hint is dashed
  const hintCard = (title, body, dashed) => `
    <section class="flex flex-col gap-1 p-4 rounded-lg border ${dashed ? 'border-dashed' : ''} border-border bg-card text-card-foreground">
      <h2 class="font-medium">${title}</h2>
      <p class="text-sm">${body}</p>
    </section>`;

  const tile = (title, sub) => `
    <button class="flex flex-col gap-1 text-left p-4 min-h-12 rounded-lg border border-border bg-card text-card-foreground">
      <span class="font-semibold">${title}</span>
      <span class="text-sm text-muted-foreground">${sub}</span>
    </button>`;

  const tag = (label, urgent) => urgent
    ? `<span class="px-2 py-0.5 rounded-md border border-destructive text-destructive text-sm font-semibold">${label}</span>`
    : `<span class="px-2 py-0.5 rounded-md border border-border text-muted-foreground text-sm">${label}</span>`;

  const bandLabel = (label) => `<span class="shrink-0 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-sm">${label}</span>`;

  const askCard = (r) => `
    <button class="flex flex-col gap-2 text-left p-4 rounded-lg border border-border bg-card text-card-foreground">
      <span class="flex items-center justify-between gap-2">
        <span class="font-semibold">${r.name}</span>
        ${bandLabel(r.band)}
      </span>
      <span class="text-sm">${r.text}</span>
      <span class="flex flex-wrap gap-2">
        ${tag(r.type)}
        ${r.urgent ? tag('ด่วน', true) : ''}
      </span>
    </button>`;

  const activityCard = (a) => `
    <article class="flex flex-col gap-1 text-left p-4 rounded-lg border border-border bg-card text-card-foreground">
      <span class="font-semibold">${a.emoji} ${a.title}</span>
      <span class="text-sm ${a.soon ? 'text-muted-foreground' : 'text-primary'}">${a.meta}</span>
      <p class="text-sm text-muted-foreground">${a.sub}</p>
    </article>`;

  const feedTabs = (labels, activeIndex) => `
    <div class="flex gap-2" role="tablist">
      ${labels.map((l, i) => `<button class="flex-1 min-h-12 p-2 rounded-lg border text-sm ${i === activeIndex ? 'border-primary bg-primary text-primary-foreground font-semibold' : 'border-border bg-card text-muted-foreground'}">${l}</button>`).join('')}
    </div>`;

  const btnPrimary = (label) => `
    <button class="w-full min-h-12 p-4 rounded-btn bg-primary text-primary-foreground font-medium">${label}</button>`;

  const walletBalance = (minutes) => `
    <section class="flex flex-col gap-1 p-6 rounded-lg bg-primary text-primary-foreground">
      <p class="opacity-80">แต้มเวลาของคุณ</p>
      <p class="text-5xl font-bold leading-tight">${minutes} นาที</p>
      <p class="text-sm opacity-80">ช่วยเพื่อนบ้าน 1 นาที = ได้แต้มเวลา 1 นาที</p>
    </section>`;

  // ---- data (real copy from the app's pages) ------------------------------

  const REQUESTS = [
    { name: 'พี่มิ้นท์', text: 'ช่วยดูแลแมวให้ 2 วันตอนไปต่างจังหวัดหน่อยได้ไหมคะ', type: 'ดูแล/เฝ้า', band: 'ใกล้มาก', urgent: true },
    { name: 'ลุงสมชาย', text: 'ขอแรงช่วยขนของขึ้นบ้านหน่อย หน้าฝนนี้หลังคาเริ่มรั่ว', type: 'ช่วยยกของ', band: 'ใกล้' },
    { name: 'คุณแนน', text: 'ซื้อของจากตลาดให้หน่อยได้ไหมคะ พรุ่งนี้หมอสั่งให้อยู่บ้าน', type: 'ไปซื้อของ/จ่ายตลาด', band: 'ละแวกเดียวกัน' }
  ];

  const NEIGHBOR = [
    { emoji: '🧁', title: 'ชวนทำขนมไทย', meta: 'เสาร์ 10:00 · ป้าอร', sub: 'นวดแป้งขนมตาลสูตรประจำบ้าน — แบ่งกันทำ แบ่งกันกิน' },
    { emoji: '🌱', title: 'เปลี่ยนสวนข้างบ้านเป็นแปลงผัก', meta: 'อาทิตย์ 08:30 · ลุงสมชาย', sub: 'มีต้นกล้าฟรีให้ ใครว่างมาช่วยขุดแปลงกัน' },
    { emoji: '🏘️', title: 'ตลาดนัดธนาคารเวลา', meta: 'มาเร็วๆ นี้', soon: true, sub: 'สมาชิกนำของมาแลกกันในราคาชั่วโมงเวลา' }
  ];

  const TODOS = ['ตั้งพื้นที่ละแวกบ้าน', 'เปิดการแจ้งเตือน'];

  const NEIGHBOR_TILES = [
    ['ทำโปสการ์ดแนะนำตัว', 'แนะนำตัวกับเพื่อนบ้านด้วยรูปและข้อความสั้นๆ'],
    ['ตั้งพื้นที่ละแวกบ้าน', 'ระบุพื้นที่คร่าวๆ เพื่อหาเพื่อนบ้านแถวบ้านคุณ'],
    ['เปิดการแจ้งเตือน', 'ให้เพื่อนบ้านติดต่อคุณถึงได้ ไม่พลาดการช่วยเหลือ']
  ];

  const WALLET_TILES = [
    ['ประวัติธุรกรรม', 'ดูแต้มเวลาเข้า-ออกและสถานะ'],
    ['ครอบครัวของคุณ', 'จัดการบัญชีครอบครัว'],
    ['ทักษะถึงปัจจุบัน', 'ความช่วยเหลือที่คุณให้เพื่อนบ้านได้'],
    ['ขอลบบัญชี / Link ThaID', 'จัดการบัญชีและยืนยันตัวตน'],
    ['แต้มเวลาและความช่วยเหลือ', 'แต้มเวลาเอาไว้ใช้ทำอะไรได้']
  ];

  // ---- phone frames -------------------------------------------------------

  const phone = (label, title, withBack, active, screenHtml) => `
    <figure class="flex flex-col gap-2 m-0 shrink-0">
      <div class="tb-phone flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-lg">
        ${statusBar()}
        ${topbar(title, withBack)}
        <main class="tb-screen theme-grid-gap flex-1 overflow-y-auto flex flex-col gap-6 px-4 py-6 bg-background text-foreground">
          ${screenHtml}
        </main>
        ${bottomNav(active)}
      </div>
      <figcaption class="text-sm text-muted-foreground text-center">${label}</figcaption>
    </figure>`;

  const homeScreen = `
    <header class="flex flex-col gap-2">
      <h1 class="text-4xl leading-tight">สวัสดี สมศรี</h1>
      <p class="text-sm text-muted-foreground">ธนาคารเวลา — เพื่อนบ้านช่วยเพื่อนบ้าน</p>
      <div class="flex mt-2">${balanceChip(120)}</div>
    </header>
    <nav class="theme-grid-gap flex flex-col gap-3" aria-label="เมนูหลัก">
      ${primaryAction(ICONS.feed, 'ขอความช่วยเหลือ', 'ขอด่วนหรือขอเล็กน้อย ให้เพื่อนบ้านช่วย')}
      ${primaryAction(ICONS.activities, 'กิจกรรม', 'รวมตัวกันทำอะไรสนุกๆ ในละแวก')}
      ${primaryAction(ICONS.wallet, 'กระเป๋าเวลา', 'ดูชั่วโมงเวลาที่สะสมไว้')}
    </nav>
    ${todoCard(TODOS)}
    ${hintCard('เราอยากมีเพื่อนบ้านดีๆ', 'การขอความช่วยเหลือเพื่อนบ้าน ทำได้ทั้งเรื่องด่วนและเรื่องเล็กน้อย')}
    <section>
      <h2 class="text-xl mb-2">ทำความรู้จักเพื่อนบ้าน</h2>
      <div class="theme-grid-gap flex flex-col gap-3">
        ${NEIGHBOR_TILES.map(([t, s]) => tile(t, s)).join('')}
      </div>
    </section>`;

  const feedScreen = `
    ${feedTabs(['ขอความช่วยเหลือ', 'กิจกรรมเพื่อนบ้าน', 'กิจกรรมส่วนกลาง'], 0)}
    <div class="flex gap-2" role="navigation" aria-label="กิจกรรมระหว่างเพื่อนบ้าน">
      ${['ขอความช่วยเหลือ', 'แชท', 'ตลาดเช้า'].map(l => `<button class="flex-1 min-h-11 p-1 rounded-lg border border-border bg-card text-card-foreground text-sm">${l}</button>`).join('')}
    </div>
    ${hintCard('ขอเลย ไม่ต้องรอให้ด่วน', 'ขอเรื่องเล็กๆ น้อยๆ ก่อน เพื่อนบ้านยินดีช่วยเสมอ', true)}
    <div class="theme-grid-gap flex flex-col gap-4">
      ${REQUESTS.map(askCard).join('')}
    </div>
    ${btnPrimary('ขอความช่วยเหลือ')}
    <h2 class="text-xl">กิจกรรมเพื่อนบ้าน</h2>
    <div class="theme-grid-gap flex flex-col gap-4">
      ${NEIGHBOR.map(activityCard).join('')}
    </div>`;

  const walletScreen = `
    ${walletBalance('1,240')}
    <section class="flex flex-col gap-2 p-4 rounded-lg border border-border bg-card text-card-foreground">
      <h2 class="text-xl font-semibold">แต้มเวลาเอาไว้ใช้ทำอะไรได้</h2>
      <p>สะสมแต้มเวลาไว้ขอความช่วยเหลือคืนจากเพื่อนบ้านในเรื่องที่คุณต้องการ</p>
      <button class="self-start min-h-12 text-primary underline underline-offset-4">ดูวิธีใช้แต้มเวลาเพิ่มเติม &rsaquo;</button>
    </section>
    <nav class="theme-grid-gap flex flex-col gap-4" aria-label="เมนูกระเป๋าเวลา">
      ${WALLET_TILES.map(([t, s]) => tile(t, s)).join('')}
    </nav>`;

  // ---- pieces gallery -----------------------------------------------------

  const piece = (caption, html) => `
    <figure class="flex flex-col gap-2 m-0">
      <figcaption class="text-xs font-medium uppercase tracking-wide text-muted-foreground">${caption}</figcaption>
      <div class="flex flex-col gap-3 p-4 rounded-lg border border-dashed border-border bg-background">${html}</div>
    </figure>`;

  const PIECES = [
    ['Top bar (without back / with back)', `
      <div class="flex flex-col gap-3 rounded-lg overflow-hidden border border-border">${topbar('Thai Time Bank', false)}</div>
      <div class="flex flex-col gap-3 rounded-lg overflow-hidden border border-border">${topbar('ขอความช่วยเหลือ', true)}</div>`],
    ['Bottom nav (active หน้าแรก)', `<div class="rounded-lg overflow-hidden border border-border">${bottomNav('home')}</div>`],
    ['Ask card (feed2-card, urgent)', askCard(REQUESTS[0])],
    ['Ask card (feed2-card)', askCard(REQUESTS[1])],
    ['Activity card (feed2-act)', activityCard(NEIGHBOR[0])],
    ['Activity card (มาเร็วๆ นี้)', activityCard(NEIGHBOR[2])],
    ['Primary action card (hm-primary)', `<div class="flex flex-col gap-3">${primaryAction(ICONS.feed, 'ขอความช่วยเหลือ', 'ขอด่วนหรือขอเล็กน้อย ให้เพื่อนบ้านช่วย')}</div>`],
    ['Todo card (hm-todo)', todoCard(TODOS)],
    ['Balance chip (hm-chip)', `<div class="flex">${balanceChip(120)}</div>`],
    ['Wallet balance (wlt-balance)', walletBalance('1,240')],
    ['Menu tile (home-tile / wlt-tile)', `<div class="flex flex-col gap-3">${tile('ประวัติธุรกรรม', 'ดูแต้มเวลาเข้า-ออกและสถานะ')}</div>`],
    ['Tags & badges (feed2-tag, ด่วน, feed2-band)', `
      <div class="flex flex-wrap items-center gap-2">
        ${tag('ดูแล/เฝ้า')}
        ${tag('ช่วยยกของ')}
        ${tag('ด่วน', true)}
        ${bandLabel('ใกล้มาก')}
        ${bandLabel('ใกล้')}
        ${bandLabel('ละแวกเดียวกัน')}
      </div>`],
    ['Feed tabs (feed2-tab)', feedTabs(['ขอความช่วยเหลือ', 'กิจกรรมเพื่อนบ้าน', 'กิจกรรมส่วนกลาง'], 0)],
    ['Primary button (btn-primary, full width, 48px min)', btnPrimary('ขอความช่วยเหลือ')]
  ];

  window.THEME_TEMPLATES['timebank'] = `
<style>
  /* Phone frame size and scrollbar hiding are the only things Tailwind
     utilities can't express here (no arbitrary values allowed). */
  .tb-phone { width: 390px; height: 780px; }
  .tb-screen { scrollbar-width: none; }
  .tb-screen::-webkit-scrollbar { display: none; }
</style>
<div class="p-6 min-h-screen bg-background text-foreground font-sans">

  <header class="mb-6">
    <h1 class="text-2xl font-semibold">Thai Time Bank</h1>
    <p class="text-sm text-muted-foreground mt-1">ธนาคารเวลา — mobile PWA shell &amp; cards. Frames use the app's real Thai copy; every piece is styled with theme utilities only.</p>
  </header>

  <!-- Phone frames -->
  <section class="theme-grid-gap flex flex-wrap items-start gap-6">
    ${phone('หน้าแรก (home)', 'Thai Time Bank', false, 'home', homeScreen)}
    ${phone('กิจกรรม / Feed', 'ขอความช่วยเหลือ', true, 'activities', feedScreen)}
    ${phone('กระเป๋าเวลา (wallet)', 'กระเป๋าเวลา', false, 'wallet', walletScreen)}
  </section>

  <!-- Pieces -->
  <section class="mt-10">
    <h2 class="text-lg font-semibold">Pieces</h2>
    <p class="text-sm text-muted-foreground mt-1 mb-4">Each shell and card piece in isolation.</p>
    <div class="theme-grid-gap grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
      ${PIECES.map(([caption, html]) => piece(caption, html)).join('')}
    </div>
  </section>
</div>
`;
})();
