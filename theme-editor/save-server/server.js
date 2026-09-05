// Local save-server for theme-editor's "Save to repo" button (see
// scripts.js's SAVE_SERVER_URL / saveToRepoButton). Dependency-free (Node's
// built-in http/fs only) - writes a saved system as JSON to
// theme-editor/systems/<name>.json, so it lands in the repo instead of only
// living in the browser's localStorage. Run via `docker compose up` here, or
// directly with `node server.js`.
//
// Two endpoints, both /api/systems/:name:
//   POST   body = the same shape scripts.js's buildSystemSnapshot() produces
//          ({source, palette, vars, tokenLinks, components, customScale}) -
//          writes/overwrites <name>.json.
//   DELETE removes <name>.json (404 when it's already gone; the caller,
//          scripts.js's deleteRepoSystem, treats 2xx and 404 alike as "gone").
// Both re-run writeIndex() on success so systems/index.json - what the
// picker's Repo group actually reads (see scripts.js:loadRepoSystems), over
// the static file server, not this one - stays in sync.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4521;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:4520';
// Overridable so tests can point a spawned server at a throwaway temp dir
// instead of the real repo; unset in docker-compose.yml, so the container
// (which bind-mounts ../systems at /systems) is unaffected.
const SYSTEMS_DIR = process.env.SYSTEMS_DIR || path.join(__dirname, '..', 'systems');
const MAX_BODY_BYTES = 5 * 1024 * 1024;

fs.mkdirSync(SYSTEMS_DIR, { recursive: true });

function withCors(res) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, body) {
    const text = JSON.stringify(body);
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(text) });
    res.end(text);
}

// "Feynman" -> "Feynman.json" inside SYSTEMS_DIR, never outside it - rejects
// anything containing a path separator or "..", then double-checks the
// resolved path is still a direct child of SYSTEMS_DIR. "index" (any case)
// is reserved for index.json itself, so a POST can never overwrite the list.
function systemFilePath(rawName) {
    const name = decodeURIComponent(rawName || '').trim();
    if (!name || /[\\/]/.test(name) || name.includes('..')) return null;
    if (name.toLowerCase() === 'index') return null;
    const filePath = path.join(SYSTEMS_DIR, `${name}.json`);
    if (path.dirname(filePath) !== SYSTEMS_DIR) return null;
    return filePath;
}

// The Design system picker's Repo group (theme-editor/systems.js:listSystems)
// reads this directly off the static file server - every *.json in
// SYSTEMS_DIR except itself, name sorted alphabetically (localeCompare, so
// "Zed" sorts with the Zs, not before "a" on raw code-unit order). Rewritten
// at startup (so a JSON file copied in by hand and picked up by a restart
// appears) and after every successful write below.
function writeIndex() {
    const names = fs.readdirSync(SYSTEMS_DIR)
        .filter(f => /\.json$/i.test(f) && f.toLowerCase() !== 'index.json')
        .map(f => f.replace(/\.json$/i, ''))
        .sort((a, b) => a.localeCompare(b));
    fs.writeFileSync(path.join(SYSTEMS_DIR, 'index.json'), JSON.stringify(names, null, 2) + '\n');
    return names;
}

writeIndex();

function readBody(req) {
    return new Promise((resolve, reject) => {
        let size = 0;
        const chunks = [];
        req.on('data', (chunk) => {
            size += chunk.length;
            if (size > MAX_BODY_BYTES) { reject(new Error('Body too large')); req.destroy(); return; }
            chunks.push(chunk);
        });
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    withCors(res);
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // Name validation runs before the method check (and so applies to POST
    // and DELETE alike): an invalid name is refused no matter what the
    // caller was trying to do to it.
    const match = /^\/api\/systems\/([^/]+)$/.exec(req.url.split('?')[0]);
    if (!match) { sendJson(res, 404, { error: 'Not found' }); return; }

    const filePath = systemFilePath(match[1]);
    if (!filePath) { sendJson(res, 400, { error: 'Invalid system name' }); return; }

    if (req.method === 'POST') {
        let raw;
        try { raw = await readBody(req); } catch (e) { sendJson(res, 413, { error: e.message }); return; }

        let system;
        try { system = JSON.parse(raw); } catch (e) { sendJson(res, 400, { error: 'Body is not valid JSON' }); return; }

        try {
            fs.writeFileSync(filePath, JSON.stringify(system, null, 2) + '\n');
            writeIndex();
        } catch (e) {
            console.error('Write failed:', e);
            sendJson(res, 500, { error: 'Could not write file' });
            return;
        }

        console.log(`Saved ${path.relative(process.cwd(), filePath)}`);
        sendJson(res, 200, { ok: true, path: path.relative(path.join(__dirname, '..', '..'), filePath) });
        return;
    }

    if (req.method === 'DELETE') {
        try {
            fs.unlinkSync(filePath);
        } catch (e) {
            if (e.code === 'ENOENT') { sendJson(res, 404, { error: 'Not found' }); return; }
            console.error('Delete failed:', e);
            sendJson(res, 500, { error: 'Could not delete file' });
            return;
        }
        writeIndex();
        console.log(`Deleted ${path.relative(process.cwd(), filePath)}`);
        sendJson(res, 200, { ok: true, path: path.relative(path.join(__dirname, '..', '..'), filePath) });
        return;
    }

    sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
    console.log(`theme-editor save-server listening on http://localhost:${PORT}`);
    console.log(`Writing systems into ${SYSTEMS_DIR}`);
    console.log(`Allowing requests from ${ALLOWED_ORIGIN}`);
});
