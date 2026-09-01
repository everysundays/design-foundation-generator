// Vendored, trimmed subset of shadcn/registry/tweakcn-themes.json (42 tweakcn
// themes) - the light-mode cssVars this generator can actually use, mapped
// onto the 6 M3 seed-color slots. See shadcn/README.md for the mapping
// rationale (why muted-foreground, not muted, for Neutral Variant).
//
// Colors are left as raw oklch() strings; cssColorToHex() (scripts.js)
// resolves them at load time via the browser's own CSS parser - the same
// code path DESIGN.md imports already use, so no separate OKLCH conversion
// is needed here.
const tweakcnPresets = [
  { name: "modern-minimal", title: "Modern Minimal", colors: {
      "Primary": "oklch(0.6231 0.1880 259.8145)",
      "Secondary": "oklch(0.9670 0.0029 264.5419)",
      "Tertiary": "oklch(0.9514 0.0250 236.8242)",
      "Error": "oklch(0.6368 0.2078 25.3313)",
      "Neutral": "oklch(0.3211 0 0)",
      "Neutral Variant": "oklch(0.5510 0.0234 264.3637)"
  } },
  { name: "violet-bloom", title: "Violet Bloom", colors: {
      "Primary": "oklch(0.5393 0.2713 286.7462)",
      "Secondary": "oklch(0.9540 0.0063 255.4755)",
      "Tertiary": "oklch(0.9393 0.0288 266.3680)",
      "Error": "oklch(0.6290 0.1902 23.0704)",
      "Neutral": "oklch(0 0 0)",
      "Neutral Variant": "oklch(0.4386 0 0)"
  } },
  { name: "t3-chat", title: "T3 Chat", colors: {
      "Primary": "oklch(0.5316 0.1409 355.1999)",
      "Secondary": "oklch(0.8696 0.0675 334.8991)",
      "Tertiary": "oklch(0.8696 0.0675 334.8991)",
      "Error": "oklch(0.5248 0.1368 20.8317)",
      "Neutral": "oklch(0.3257 0.1161 325.0372)",
      "Neutral Variant": "oklch(0.4924 0.1244 324.4523)"
  } },
  { name: "twitter", title: "Twitter", colors: {
      "Primary": "oklch(0.6723 0.1606 244.9955)",
      "Secondary": "oklch(0.1884 0.0128 248.5103)",
      "Tertiary": "oklch(0.9392 0.0166 250.8453)",
      "Error": "oklch(0.6188 0.2376 25.7658)",
      "Neutral": "oklch(0.1884 0.0128 248.5103)",
      "Neutral Variant": "oklch(0.1884 0.0128 248.5103)"
  } },
  { name: "mocha-mousse", title: "Mocha Mousse", colors: {
      "Primary": "oklch(0.6083 0.0623 44.3588)",
      "Secondary": "oklch(0.7473 0.0387 80.5476)",
      "Tertiary": "oklch(0.8502 0.0389 49.0874)",
      "Error": "oklch(0.2225 0.0098 52.9636)",
      "Neutral": "oklch(0.4063 0.0255 40.3627)",
      "Neutral Variant": "oklch(0.5416 0.0512 37.2132)"
  } },
  { name: "bubblegum", title: "Bubblegum", colors: {
      "Primary": "oklch(0.6209 0.1801 348.1385)",
      "Secondary": "oklch(0.8095 0.0694 198.1863)",
      "Tertiary": "oklch(0.9195 0.0801 87.6670)",
      "Error": "oklch(0.7091 0.1697 21.9551)",
      "Neutral": "oklch(0.4712 0 0)",
      "Neutral Variant": "oklch(0.5795 0 0)"
  } },
  { name: "amethyst-haze", title: "Amethyst Haze", colors: {
      "Primary": "oklch(0.6104 0.0767 299.7335)",
      "Secondary": "oklch(0.8957 0.0265 300.2416)",
      "Tertiary": "oklch(0.7889 0.0802 359.9375)",
      "Error": "oklch(0.6332 0.1578 22.6734)",
      "Neutral": "oklch(0.3651 0.0325 287.0807)",
      "Neutral Variant": "oklch(0.5288 0.0375 290.7895)"
  } },
  { name: "notebook", title: "Notebook", colors: {
      "Primary": "oklch(0.4891 0 0)",
      "Secondary": "oklch(0.9006 0 0)",
      "Tertiary": "oklch(0.9354 0.0456 94.8549)",
      "Error": "oklch(0.6627 0.0978 20.0041)",
      "Neutral": "oklch(0.3485 0 0)",
      "Neutral Variant": "oklch(0.4313 0 0)"
  } },
  { name: "doom-64", title: "Doom 64", colors: {
      "Primary": "oklch(0.5016 0.1887 27.4816)",
      "Secondary": "oklch(0.4955 0.0896 126.1858)",
      "Tertiary": "oklch(0.5880 0.0993 245.7394)",
      "Error": "oklch(0.7076 0.1975 46.4558)",
      "Neutral": "oklch(0.2393 0 0)",
      "Neutral Variant": "oklch(0.4091 0 0)"
  } },
  { name: "catppuccin", title: "Catppuccin", colors: {
      "Primary": "oklch(0.5547 0.2503 297.0156)",
      "Secondary": "oklch(0.8575 0.0145 268.4756)",
      "Tertiary": "oklch(0.6820 0.1448 235.3822)",
      "Error": "oklch(0.5505 0.2155 19.8095)",
      "Neutral": "oklch(0.4355 0.0430 279.3250)",
      "Neutral Variant": "oklch(0.5471 0.0343 279.0837)"
  } },
  { name: "graphite", title: "Graphite", colors: {
      "Primary": "oklch(0.4891 0 0)",
      "Secondary": "oklch(0.9067 0 0)",
      "Tertiary": "oklch(0.8078 0 0)",
      "Error": "oklch(0.5594 0.1900 25.8625)",
      "Neutral": "oklch(0.3211 0 0)",
      "Neutral Variant": "oklch(0.5103 0 0)"
  } },
  { name: "perpetuity", title: "Perpetuity", colors: {
      "Primary": "oklch(0.5624 0.0947 203.2755)",
      "Secondary": "oklch(0.9244 0.0181 196.8450)",
      "Tertiary": "oklch(0.9021 0.0297 201.8915)",
      "Error": "oklch(0.5732 0.1901 25.5409)",
      "Neutral": "oklch(0.3772 0.0619 212.6640)",
      "Neutral Variant": "oklch(0.5428 0.0594 201.5662)"
  } },
  { name: "kodama-grove", title: "Kodama Grove", colors: {
      "Primary": "oklch(0.6657 0.1050 118.9078)",
      "Secondary": "oklch(0.8532 0.0631 91.1493)",
      "Tertiary": "oklch(0.8361 0.0713 90.3269)",
      "Error": "oklch(0.7136 0.0981 29.9827)",
      "Neutral": "oklch(0.4265 0.0310 59.2153)",
      "Neutral Variant": "oklch(0.5761 0.0259 60.9323)"
  } },
  { name: "cosmic-night", title: "Cosmic Night", colors: {
      "Primary": "oklch(0.5417 0.1790 288.0332)",
      "Secondary": "oklch(0.9174 0.0435 292.6901)",
      "Tertiary": "oklch(0.9221 0.0373 262.1410)",
      "Error": "oklch(0.6861 0.2061 14.9941)",
      "Neutral": "oklch(0.3015 0.0572 282.4176)",
      "Neutral Variant": "oklch(0.5426 0.0465 284.7435)"
  } },
  { name: "tangerine", title: "Tangerine", colors: {
      "Primary": "oklch(0.6397 0.1720 36.4421)",
      "Secondary": "oklch(0.9670 0.0029 264.5419)",
      "Tertiary": "oklch(0.9119 0.0222 243.8174)",
      "Error": "oklch(0.6368 0.2078 25.3313)",
      "Neutral": "oklch(0.3211 0 0)",
      "Neutral Variant": "oklch(0.5510 0.0234 264.3637)"
  } },
  { name: "quantum-rose", title: "Quantum Rose", colors: {
      "Primary": "oklch(0.6002 0.2414 0.1348)",
      "Secondary": "oklch(0.9230 0.0701 326.1273)",
      "Tertiary": "oklch(0.8766 0.0828 344.8849)",
      "Error": "oklch(0.5831 0.1911 6.3410)",
      "Neutral": "oklch(0.4426 0.1653 352.3762)",
      "Neutral Variant": "oklch(0.5740 0.1732 352.0544)"
  } },
  { name: "nature", title: "Nature", colors: {
      "Primary": "oklch(0.5234 0.1347 144.1672)",
      "Secondary": "oklch(0.9571 0.0210 147.6360)",
      "Tertiary": "oklch(0.8952 0.0504 146.0366)",
      "Error": "oklch(0.5386 0.1937 26.7249)",
      "Neutral": "oklch(0.3000 0.0358 30.2042)",
      "Neutral Variant": "oklch(0.4495 0.0486 39.2110)"
  } },
  { name: "bold-tech", title: "Bold Tech", colors: {
      "Primary": "oklch(0.6056 0.2189 292.7172)",
      "Secondary": "oklch(0.9618 0.0202 295.1913)",
      "Tertiary": "oklch(0.9319 0.0316 255.5855)",
      "Error": "oklch(0.6368 0.2078 25.3313)",
      "Neutral": "oklch(0.3588 0.1354 278.6973)",
      "Neutral Variant": "oklch(0.5413 0.2466 293.0090)"
  } },
  { name: "elegant-luxury", title: "Elegant Luxury", colors: {
      "Primary": "oklch(0.4650 0.1470 24.9381)",
      "Secondary": "oklch(0.9625 0.0385 89.0943)",
      "Tertiary": "oklch(0.9619 0.0580 95.6174)",
      "Error": "oklch(0.4437 0.1613 26.8994)",
      "Neutral": "oklch(0.2178 0 0)",
      "Neutral Variant": "oklch(0.4444 0.0096 73.6390)"
  } },
  { name: "amber-minimal", title: "Amber Minimal", colors: {
      "Primary": "oklch(0.7686 0.1647 70.0804)",
      "Secondary": "oklch(0.9670 0.0029 264.5419)",
      "Tertiary": "oklch(0.9869 0.0214 95.2774)",
      "Error": "oklch(0.6368 0.2078 25.3313)",
      "Neutral": "oklch(0.2686 0 0)",
      "Neutral Variant": "oklch(0.5510 0.0234 264.3637)"
  } },
  { name: "supabase", title: "Supabase", colors: {
      "Primary": "oklch(0.8348 0.1302 160.9080)",
      "Secondary": "oklch(0.9940 0 0)",
      "Tertiary": "oklch(0.9461 0 0)",
      "Error": "oklch(0.5523 0.1927 32.7272)",
      "Neutral": "oklch(0.2046 0 0)",
      "Neutral Variant": "oklch(0.2435 0 0)"
  } },
  { name: "neo-brutalism", title: "Neo Brutalism", colors: {
      "Primary": "oklch(0.6489 0.2370 26.9728)",
      "Secondary": "oklch(0.9680 0.2110 109.7692)",
      "Tertiary": "oklch(0.5635 0.2408 260.8178)",
      "Error": "oklch(0 0 0)",
      "Neutral": "oklch(0 0 0)",
      "Neutral Variant": "oklch(0.3211 0 0)"
  } },
  { name: "solar-dusk", title: "Solar Dusk", colors: {
      "Primary": "oklch(0.5553 0.1455 48.9975)",
      "Secondary": "oklch(0.8276 0.0752 74.4400)",
      "Tertiary": "oklch(0.9000 0.0500 74.9889)",
      "Error": "oklch(0.4437 0.1613 26.8994)",
      "Neutral": "oklch(0.3660 0.0251 49.6085)",
      "Neutral Variant": "oklch(0.5534 0.0116 58.0708)"
  } },
  { name: "claymorphism", title: "Claymorphism", colors: {
      "Primary": "oklch(0.5854 0.2041 277.1173)",
      "Secondary": "oklch(0.8687 0.0043 56.3660)",
      "Tertiary": "oklch(0.9376 0.0260 321.9388)",
      "Error": "oklch(0.6368 0.2078 25.3313)",
      "Neutral": "oklch(0.2795 0.0368 260.0310)",
      "Neutral Variant": "oklch(0.5510 0.0234 264.3637)"
  } },
  { name: "cyberpunk", title: "Cyberpunk", colors: {
      "Primary": "oklch(0.6726 0.2904 341.4084)",
      "Secondary": "oklch(0.9595 0.0200 286.0164)",
      "Tertiary": "oklch(0.8903 0.1739 171.2690)",
      "Error": "oklch(0.6535 0.2348 34.0370)",
      "Neutral": "oklch(0.1649 0.0352 281.8285)",
      "Neutral Variant": "oklch(0.1649 0.0352 281.8285)"
  } },
  { name: "pastel-dreams", title: "Pastel Dreams", colors: {
      "Primary": "oklch(0.7090 0.1592 293.5412)",
      "Secondary": "oklch(0.9073 0.0530 306.0902)",
      "Tertiary": "oklch(0.9376 0.0260 321.9388)",
      "Error": "oklch(0.8077 0.1035 19.5706)",
      "Neutral": "oklch(0.3729 0.0306 259.7328)",
      "Neutral Variant": "oklch(0.5510 0.0234 264.3637)"
  } },
  { name: "clean-slate", title: "Clean Slate", colors: {
      "Primary": "oklch(0.5854 0.2041 277.1173)",
      "Secondary": "oklch(0.9276 0.0058 264.5313)",
      "Tertiary": "oklch(0.9299 0.0334 272.7879)",
      "Error": "oklch(0.6368 0.2078 25.3313)",
      "Neutral": "oklch(0.2795 0.0368 260.0310)",
      "Neutral Variant": "oklch(0.5510 0.0234 264.3637)"
  } },
  { name: "caffeine", title: "Caffeine", colors: {
      "Primary": "oklch(0.4341 0.0392 41.9938)",
      "Secondary": "oklch(0.9200 0.0651 74.3695)",
      "Tertiary": "oklch(0.9310 0 0)",
      "Error": "oklch(0.6271 0.1936 33.3390)",
      "Neutral": "oklch(0.2435 0 0)",
      "Neutral Variant": "oklch(0.5032 0 0)"
  } },
  { name: "ocean-breeze", title: "Ocean Breeze", colors: {
      "Primary": "oklch(0.7227 0.1920 149.5793)",
      "Secondary": "oklch(0.9514 0.0250 236.8242)",
      "Tertiary": "oklch(0.9505 0.0507 163.0508)",
      "Error": "oklch(0.6368 0.2078 25.3313)",
      "Neutral": "oklch(0.3729 0.0306 259.7328)",
      "Neutral Variant": "oklch(0.5510 0.0234 264.3637)"
  } },
  { name: "retro-arcade", title: "Retro Arcade", colors: {
      "Primary": "oklch(0.5924 0.2025 355.8943)",
      "Secondary": "oklch(0.6437 0.1019 187.3840)",
      "Tertiary": "oklch(0.5808 0.1732 39.5003)",
      "Error": "oklch(0.5863 0.2064 27.1172)",
      "Neutral": "oklch(0.3092 0.0518 219.6516)",
      "Neutral Variant": "oklch(0.3092 0.0518 219.6516)"
  } },
  { name: "midnight-bloom", title: "Midnight Bloom", colors: {
      "Primary": "oklch(0.5676 0.2021 283.0838)",
      "Secondary": "oklch(0.8214 0.0720 249.3482)",
      "Tertiary": "oklch(0.6475 0.0642 117.4260)",
      "Error": "oklch(0.6368 0.2078 25.3313)",
      "Neutral": "oklch(0.3211 0 0)",
      "Neutral Variant": "oklch(0.5382 0 0)"
  } },
  { name: "candyland", title: "Candyland", colors: {
      "Primary": "oklch(0.8677 0.0735 7.0855)",
      "Secondary": "oklch(0.8148 0.0819 225.7537)",
      "Tertiary": "oklch(0.9680 0.2110 109.7692)",
      "Error": "oklch(0.6368 0.2078 25.3313)",
      "Neutral": "oklch(0.3211 0 0)",
      "Neutral Variant": "oklch(0.5382 0 0)"
  } },
  { name: "northern-lights", title: "Northern Lights", colors: {
      "Primary": "oklch(0.6487 0.1538 150.3071)",
      "Secondary": "oklch(0.6746 0.1414 261.3380)",
      "Tertiary": "oklch(0.8269 0.1080 211.9627)",
      "Error": "oklch(0.6368 0.2078 25.3313)",
      "Neutral": "oklch(0.3211 0 0)",
      "Neutral Variant": "oklch(0.5382 0 0)"
  } },
  { name: "vintage-paper", title: "Vintage Paper", colors: {
      "Primary": "oklch(0.6180 0.0778 65.5444)",
      "Secondary": "oklch(0.8846 0.0302 85.5655)",
      "Tertiary": "oklch(0.8348 0.0426 88.8064)",
      "Error": "oklch(0.5471 0.1438 32.9149)",
      "Neutral": "oklch(0.3760 0.0225 64.3434)",
      "Neutral Variant": "oklch(0.5391 0.0387 71.1655)"
  } },
  { name: "sunset-horizon", title: "Sunset Horizon", colors: {
      "Primary": "oklch(0.7357 0.1641 34.7091)",
      "Secondary": "oklch(0.9596 0.0200 28.9029)",
      "Tertiary": "oklch(0.8278 0.1131 57.9984)",
      "Error": "oklch(0.6122 0.2082 22.2410)",
      "Neutral": "oklch(0.3353 0.0132 2.7676)",
      "Neutral Variant": "oklch(0.5534 0.0116 58.0708)"
  } },
  { name: "starry-night", title: "Starry Night", colors: {
      "Primary": "oklch(0.4815 0.1178 263.3758)",
      "Secondary": "oklch(0.8567 0.1164 81.0092)",
      "Tertiary": "oklch(0.6896 0.0714 234.0387)",
      "Error": "oklch(0.2611 0.0376 322.5267)",
      "Neutral": "oklch(0.2558 0.0433 268.0662)",
      "Neutral Variant": "oklch(0.4815 0.1178 263.3758)"
  } },
  { name: "claude", title: "Claude", colors: {
      "Primary": "oklch(0.6171 0.1375 39.0427)",
      "Secondary": "oklch(0.9245 0.0138 92.9892)",
      "Tertiary": "oklch(0.9245 0.0138 92.9892)",
      "Error": "oklch(0.1908 0.0020 106.5859)",
      "Neutral": "oklch(0.3438 0.0269 95.7226)",
      "Neutral Variant": "oklch(0.6059 0.0075 97.4233)"
  } },
  { name: "vercel", title: "Vercel", colors: {
      "Primary": "oklch(0 0 0)",
      "Secondary": "oklch(0.9400 0 0)",
      "Tertiary": "oklch(0.9400 0 0)",
      "Error": "oklch(0.6300 0.1900 23.0300)",
      "Neutral": "oklch(0 0 0)",
      "Neutral Variant": "oklch(0.4400 0 0)"
  } },
  { name: "darkmatter", title: "Darkmatter", colors: {
      "Primary": "oklch(0.6716 0.1368 48.5130)",
      "Secondary": "oklch(0.5360 0.0398 196.0280)",
      "Tertiary": "oklch(0.9491 0 0)",
      "Error": "oklch(0.6368 0.2078 25.3313)",
      "Neutral": "oklch(0.2101 0.0318 264.6645)",
      "Neutral Variant": "oklch(0.5510 0.0234 264.3637)"
  } },
  { name: "mono", title: "Mono", colors: {
      "Primary": "oklch(0.5555 0 0)",
      "Secondary": "oklch(0.9702 0 0)",
      "Tertiary": "oklch(0.9702 0 0)",
      "Error": "oklch(0.5830 0.2387 28.4765)",
      "Neutral": "oklch(0.1448 0 0)",
      "Neutral Variant": "oklch(0.5486 0 0)"
  } },
  { name: "soft-pop", title: "Soft Pop", colors: {
      "Primary": "oklch(0.5106 0.2301 276.9656)",
      "Secondary": "oklch(0.7038 0.1230 182.5025)",
      "Tertiary": "oklch(0.7686 0.1647 70.0804)",
      "Error": "oklch(0.6368 0.2078 25.3313)",
      "Neutral": "oklch(0 0 0)",
      "Neutral Variant": "oklch(0.3211 0 0)"
  } },
  { name: "sage-garden", title: "Sage Garden", colors: {
      "Primary": "oklch(0.6333 0.0309 154.9039)",
      "Secondary": "oklch(0.8596 0.0291 119.9919)",
      "Tertiary": "oklch(0.8242 0.0221 136.6092)",
      "Error": "oklch(0.5624 0.1743 26.1433)",
      "Neutral": "oklch(0.2417 0.0298 269.8827)",
      "Neutral Variant": "oklch(0.5510 0.0234 264.3637)"
  } }
];
