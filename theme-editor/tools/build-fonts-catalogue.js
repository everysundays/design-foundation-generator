// Regenerates ../fonts-catalogue.js from Google's own metadata feed.
//
// The feed (https://fonts.google.com/metadata/fonts) has no
// Access-Control-Allow-Origin header, so the browser can never fetch it
// directly (verified) - this is why the catalogue ships as a committed
// snapshot instead of a live lookup. Re-run this whenever the picker needs
// fonts newer than the snapshot's date (see the comment atop the generated
// file):
//
//   node tools/build-fonts-catalogue.js
//
// Dependency-free on purpose (Node's built-in https/fs only, same as
// save-server/server.js) - run directly with `node`, no npm install.

const https = require('https');
const fs = require('fs');
const path = require('path');

const FEED_URL = 'https://fonts.google.com/metadata/fonts';
const OUT_FILE = path.join(__dirname, '..', 'fonts-catalogue.js');

// "Sans Serif" -> "sans-serif" (the lowercase, hyphenated form fonts.js and
// the picker's category tag both expect).
function normalizeCategory(category) {
    return String(category || '').trim().toLowerCase().replace(/\s+/g, '-');
}

// Object.keys(fonts) is weight strings, italics marked with a trailing "i"
// ("400", "400i", ...) - fold italics into their upright weight, dedupe,
// ascending. The picker never requests italics (DoD is weight-only), so the
// distinction itself is dropped here rather than carried through unused.
function weightsOf(fonts) {
    const set = new Set();
    Object.keys(fonts || {}).forEach(key => {
        const n = parseInt(key, 10);
        if (Number.isFinite(n)) set.add(n);
    });
    return [...set].sort((a, b) => a - b);
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'accept': 'application/json' } }, (res) => {
            if (res.statusCode !== 200) {
                res.resume();
                reject(new Error(`GET ${url} -> HTTP ${res.statusCode}`));
                return;
            }
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => {
                let body = Buffer.concat(chunks).toString('utf8');
                // Some Google JSON feeds prefix an anti-hijacking guard;
                // strip it if present (this one hasn't shipped one in
                // practice, but a bare JSON.parse would throw if it ever did).
                body = body.replace(/^\)\]\}'\n?/, '');
                try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

async function main() {
    const data = await fetchJson(FEED_URL);
    const list = Array.isArray(data.familyMetadataList) ? data.familyMetadataList : [];
    if (!list.length) throw new Error('familyMetadataList is empty - feed shape may have changed');

    const rows = list
        .map(entry => {
            const row = [entry.family, normalizeCategory(entry.category), weightsOf(entry.fonts)];
            const axes = (entry.axes || []).map(a => a.tag).filter(Boolean).sort();
            if (axes.length) row.push(axes);
            return row;
        })
        // localeCompare (not a plain < / >) so "ADLaM Display" files next to
        // "Adamina" the way a person reading the list expects, instead of
        // every all-caps prefix clumping ahead of mixed-case names by raw
        // code-point order. fonts.js's own searchCatalogue re-sorts its
        // results the same way regardless of this file's row order - this is
        // purely for a human skimming the committed snapshot.
        .sort((a, b) => a[0].localeCompare(b[0]));

    const date = new Date().toISOString().slice(0, 10);
    const body = rows.map(row => `  ${JSON.stringify(row)}`).join(',\n');
    const out = `// fonts-catalogue.js - Google Fonts catalogue snapshot (generated from\n` +
        `// ${FEED_URL} on ${date}). Plain browser global.\n` +
        `// Each row: [family, category, weights[, variableAxes]]. weights are the static\n` +
        `// weights the family ships (italics folded in); variable families also list axes.\n` +
        `// Regenerate: node tools/build-fonts-catalogue.js\n` +
        `const GOOGLE_FONTS_CATALOGUE = [\n${body}\n];\n`;

    fs.writeFileSync(OUT_FILE, out);
    console.log(`Wrote ${rows.length} families to ${path.relative(process.cwd(), OUT_FILE)}`);
}

main().catch(e => { console.error(e); process.exit(1); });
