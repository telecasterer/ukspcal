// Fails the build if the generated service worker would not start.
//
// Workbox throws `add-to-cache-list-conflicting-entries` when one URL is precached
// twice with different revisions. That error happens while sw.js is evaluated, so the
// new service worker never installs and users already on an older version never update.
import fs from "node:fs";
import path from "node:path";

const swPath = path.resolve(process.argv[2] ?? ".svelte-kit/output/client/sw.js");
if (!fs.existsSync(swPath)) {
    console.error(`check-sw: ${swPath} not found; was the service worker generated?`);
    process.exit(1);
}

const source = fs.readFileSync(swPath, "utf8");
const entries = [...source.matchAll(/\{url:`([^`]*)`,revision:(`[^`]*`|null)\}/g)].map((m) => ({
    url: m[1],
    revision: m[2],
}));

if (entries.length === 0) {
    console.error("check-sw: no precache entries found in sw.js");
    process.exit(1);
}

const revisionsByUrl = new Map();
for (const { url, revision } of entries) {
    if (!revisionsByUrl.has(url)) revisionsByUrl.set(url, new Set());
    revisionsByUrl.get(url).add(revision);
}

const conflicts = [...revisionsByUrl].filter(([, revisions]) => revisions.size > 1);
if (conflicts.length > 0) {
    console.error("check-sw: precache URLs listed with conflicting revisions:");
    for (const [url, revisions] of conflicts)
        console.error(`  ${url}: ${[...revisions].join(", ")}`);
    process.exit(1);
}

console.log(`check-sw: ok (${revisionsByUrl.size} precache URLs, no conflicts)`);
