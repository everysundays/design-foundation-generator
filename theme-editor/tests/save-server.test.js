// node tests/save-server.test.js  (run from theme-editor/, or anywhere: paths are absolute)
//
// Spawns save-server/server.js as a real child process (PORT + SYSTEMS_DIR
// pointed at a throwaway temp dir - never the repo's real systems/), then
// drives it over HTTP: the startup index rewrite, a POST writing a system
// and re-sorting the index, and the "index" name reservation. The Docker
// container other cards use bind-mounts server.js read-only and the MAIN
// checkout's systems/ dir - this test never touches either.

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const assert = require('assert');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const serverPath = path.join(root, 'save-server', 'server.js');

let passed = 0;
async function test(name, fn) {
    try { await fn(); passed++; console.log(`ok   ${name}`); }
    catch (err) { console.log(`FAIL ${name}\n     ${err.message}`); process.exitCode = 1; }
}

function readIndex(dir) {
    return JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
}

// A literal ".." path segment never reaches the server through fetch()/the
// WHATWG URL parser - both resolve dot-segments client-side, so
// `fetch(base + '/api/systems/..')` actually requests `/api/` and never
// exercises systemFilePath's own ".." check at all. Node's raw http.request
// sends whatever `path` it's given, unnormalized - the same as a plain curl
// or any client that isn't URL-parsing the string - so that's what this
// drives for the literal-".." case below.
function rawRequest(baseUrl, method, rawPath) {
    const url = new URL(baseUrl);
    return new Promise((resolve, reject) => {
        const req = http.request({ host: url.hostname, port: url.port, path: rawPath, method }, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        req.end();
    });
}

// Starts server.js against `dir` on a random high port; resolves once its
// startup log line appears (or rejects on early exit / a timeout), with a
// `.stop()` to kill it and a `.baseUrl`.
function startServer(dir) {
    const port = 40000 + Math.floor(Math.random() * 10000);
    const child = spawn(process.execPath, [serverPath], {
        env: { ...process.env, PORT: String(port), SYSTEMS_DIR: dir, ALLOWED_ORIGIN: 'http://localhost:4520' },
        stdio: ['ignore', 'pipe', 'pipe']
    });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });

    const ready = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`server did not start within 5s\n${stderr}`)), 5000);
        let stdout = '';
        child.stdout.on('data', (chunk) => {
            stdout += chunk;
            if (stdout.includes('listening')) { clearTimeout(timer); resolve(); }
        });
        child.once('exit', (code) => { clearTimeout(timer); reject(new Error(`server exited early (code ${code})\n${stderr}`)); });
    });

    return ready.then(() => ({
        baseUrl: `http://localhost:${port}`,
        async stop() {
            if (child.exitCode !== null) return;
            child.kill();
            await new Promise((resolve) => child.once('exit', resolve));
        }
    }));
}

async function main() {
    // --- startup: rewrites index.json to every *.json minus itself, sorted ---
    await (async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'theme-editor-save-server-'));
        fs.writeFileSync(path.join(dir, 'a.json'), '{}');
        fs.writeFileSync(path.join(dir, 'b.json'), '{}');
        fs.writeFileSync(path.join(dir, 'd.json'), '{}');
        fs.writeFileSync(path.join(dir, 'notes.txt'), 'not a system');
        fs.writeFileSync(path.join(dir, 'index.json'), '["stale","garbage"]'); // must be overwritten, not merged

        const server = await startServer(dir);
        try {
            await test('index.json is rewritten at startup to every *.json minus itself, sorted', () => {
                assert.deepStrictEqual(readIndex(dir), ['a', 'b', 'd']);
            });

            let postedPath;
            await test('POST /api/systems/:name writes <name>.json (pretty-printed) and re-sorts index.json', async () => {
                const body = { source: 'tailwind', vars: { light: { primary: '#000' }, dark: {} } };
                const res = await fetch(`${server.baseUrl}/api/systems/c`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                assert.strictEqual(res.status, 200);
                const json = await res.json();
                assert.strictEqual(json.ok, true);
                postedPath = json.path;

                const written = fs.readFileSync(path.join(dir, 'c.json'), 'utf8');
                assert.strictEqual(written, JSON.stringify(body, null, 2) + '\n');
                // Inserted in sorted position (between b and d), not merely appended.
                assert.deepStrictEqual(readIndex(dir), ['a', 'b', 'c', 'd']);
            });

            await test("POST response's path names the file relative to the repo root", () => {
                assert.ok(postedPath, 'no path recorded from the previous POST');
                assert.ok(/c\.json$/.test(postedPath), `expected a path ending in c.json, got "${postedPath}"`);
            });

            await test('POST /api/systems/index is refused (reserved for the list itself) and index.json is untouched', async () => {
                const before = fs.readFileSync(path.join(dir, 'index.json'), 'utf8');
                const res = await fetch(`${server.baseUrl}/api/systems/index`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vars: { light: {}, dark: {} } })
                });
                assert.strictEqual(res.status, 400);
                assert.ok(!fs.existsSync(path.join(dir, 'index.json.json')), 'should not have written an "index" system file');
                assert.strictEqual(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'), before, 'index.json changed despite the refused write');
                assert.deepStrictEqual(readIndex(dir), ['a', 'b', 'c', 'd']);
            });
        } finally {
            await server.stop();
        }
    })();

    // --- a fresh dir with no *.json at all still gets a valid (empty) index ---
    await (async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'theme-editor-save-server-empty-'));
        const server = await startServer(dir);
        try {
            await test('an empty SYSTEMS_DIR starts up with index.json === []', () => {
                assert.deepStrictEqual(readIndex(dir), []);
            });
        } finally {
            await server.stop();
        }
    })();

    // --- DELETE /api/systems/:name ---
    await (async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'theme-editor-save-server-delete-'));
        fs.writeFileSync(path.join(dir, 'Foo.json'), '{}');
        fs.writeFileSync(path.join(dir, 'Bar.json'), '{}');

        const server = await startServer(dir);
        try {
            await test('DELETE /api/systems/:name removes the file and re-sorts index.json', async () => {
                const res = await fetch(`${server.baseUrl}/api/systems/Foo`, { method: 'DELETE' });
                assert.strictEqual(res.status, 200);
                const json = await res.json();
                assert.strictEqual(json.ok, true);
                assert.strictEqual(fs.existsSync(path.join(dir, 'Foo.json')), false, 'Foo.json should be gone');
                assert.strictEqual(fs.existsSync(path.join(dir, 'Bar.json')), true, 'Bar.json should be untouched');
                assert.deepStrictEqual(readIndex(dir), ['Bar']);
            });

            await test('DELETE of a name already gone returns 404 and leaves index.json unchanged', async () => {
                const before = fs.readFileSync(path.join(dir, 'index.json'), 'utf8');
                const res = await fetch(`${server.baseUrl}/api/systems/Missing`, { method: 'DELETE' });
                assert.strictEqual(res.status, 404);
                assert.strictEqual(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'), before);
            });

            await test('DELETE refuses a name with a path separator or ".." and removes nothing', async () => {
                const before = fs.readFileSync(path.join(dir, 'index.json'), 'utf8');
                const filesBefore = fs.readdirSync(dir).sort();

                // Encoded traversal attempts: no literal "/" in the request
                // line, so they reach systemFilePath's decode-then-check.
                for (const encoded of ['a%2Fb', '..%2Fx']) {
                    const res = await fetch(`${server.baseUrl}/api/systems/${encoded}`, { method: 'DELETE' });
                    assert.strictEqual(res.status, 400, `expected 400 for "${encoded}", got ${res.status}`);
                }
                // A literal ".." (see rawRequest's comment - fetch can't send this one).
                const dotdot = await rawRequest(server.baseUrl, 'DELETE', '/api/systems/..');
                assert.strictEqual(dotdot.status, 400, `expected 400 for literal "..", got ${dotdot.status}`);

                // A literal "/" makes it two path segments, which the route
                // itself doesn't match - 404, not 400, but still refused.
                const res = await fetch(`${server.baseUrl}/api/systems/a/b`, { method: 'DELETE' });
                assert.strictEqual(res.status, 404);

                assert.deepStrictEqual(fs.readdirSync(dir).sort(), filesBefore, 'no file should have been added or removed');
                assert.strictEqual(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'), before, 'index.json changed despite every refused delete');
            });

            await test('OPTIONS preflight for the systems route advertises DELETE and the allowed origin', async () => {
                const res = await fetch(`${server.baseUrl}/api/systems/x`, { method: 'OPTIONS' });
                assert.strictEqual(res.status, 204);
                assert.ok(/\bDELETE\b/.test(res.headers.get('access-control-allow-methods') || ''), 'Access-Control-Allow-Methods should list DELETE');
                assert.strictEqual(res.headers.get('access-control-allow-origin'), 'http://localhost:4520');
            });
        } finally {
            await server.stop();
        }
    })();

    console.log(`\n${passed} test group(s) passed${process.exitCode ? ', with failures' : ''}`);
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
