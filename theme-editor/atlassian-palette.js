// Atlassian Design System's color palette (fetched from the @atlaskit/tokens
// npm package's palettes-raw/palette.js codegen source - the same
// foundation-color grid ADS itself ships). Alternate source for the
// palette-grid color picker popover, switchable alongside Tailwind's.
//
// Family/shade order verified against that same source's "color.palette.<Name>"
// token names (each row below matched byte-for-byte against the real hex
// values under color.palette.<FAMILY><shade>), so every swatch's reference
// name here is the real @atlaskit token name, e.g. "Red500" or "Neutral0".
const ATLASSIAN_PALETTE_FAMILIES = ['Red', 'Orange', 'Yellow', 'Lime', 'Green', 'Teal', 'Blue', 'Purple', 'Magenta', 'Neutral'];
// Every family but Neutral uses this shade scale; Neutral has its own (13 steps, starting at 0).
const ATLASSIAN_DEFAULT_SHADES = [100, 200, 250, 300, 400, 500, 600, 700, 800, 850, 900, 1000];
const ATLASSIAN_NEUTRAL_SHADES = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200];

const ATLASSIAN_PALETTE_ROWS = [["#FFECEB","#FFD5D2","#FFB8B2","#FD9891","#F87168","#F15B50","#E2483D","#C9372C","#AE2E24","#872821","#5D1F1A","#42221F"],["#FFF5DB","#FCE4A6","#FBD779","#FBC828","#FCA700","#F68909","#E06C00","#BD5B00","#9E4C00","#7A3B00","#693200","#3A2C1F"],["#FEF7C8","#F5E989","#EFDD4E","#EED12B","#DDB30E","#CF9F02","#B38600","#946F00","#7F5F01","#614A05","#533F04","#332E1B"],["#EFFFD6","#D3F1A7","#BDE97C","#B3DF72","#94C748","#82B536","#6A9A23","#5B7F24","#4C6B1F","#3F5224","#37471F","#28311B"],["#DCFFF1","#BAF3DB","#97EDC9","#7EE2B8","#4BCE97","#2ABB7F","#22A06B","#1F845A","#216E4E","#19573D","#164B35","#1C3329"],["#E7F9FF","#C6EDFB","#B1E4F7","#9DD9EE","#6CC3E0","#42B2D7","#2898BD","#227D9B","#206A83","#1A5265","#164555","#1E3137"],["#E9F2FE","#CFE1FD","#ADCBFB","#8FB8F6","#669DF1","#4688EC","#357DE8","#1868DB","#1558BC","#144794","#123263","#1C2B42"],["#F8EEFE","#EED7FC","#E3BDFA","#D8A0F7","#C97CF4","#BF63F3","#AF59E1","#964AC0","#803FA5","#673286","#48245D","#35243F"],["#FFECF8","#FDD0EC","#FCB6E1","#F797D2","#E774BB","#DA62AC","#CD519D","#AE4787","#943D73","#77325B","#50253F","#3D2232"],["#FFFFFF","#F8F8F8","#F0F1F2","#DDDEE1","#B7B9BE","#8C8F97","#7D818A","#6B6E76","#505258","#3B3D42","#292A2E","#1E1F21","#000000"]];

// Reference name for every swatch above, e.g. ATLASSIAN_PALETTE_NAMES[0][5] === "Red500" -
// same [row][col] shape as ATLASSIAN_PALETTE_ROWS, so the two zip together directly.
const ATLASSIAN_PALETTE_NAMES = ATLASSIAN_PALETTE_FAMILIES.map(family =>
    (family === 'Neutral' ? ATLASSIAN_NEUTRAL_SHADES : ATLASSIAN_DEFAULT_SHADES).map(shade => `${family}${shade}`)
);
