#!/usr/bin/env node
import fs from "node:fs";

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
    console.error("commit-msg check failed: commit message file not found");
    process.exit(1);
}

const raw = fs.readFileSync(file, "utf8");
const firstLine = raw
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);

if (!firstLine) {
    console.error("commit-msg check failed: empty commit message");
    process.exit(1);
}

// Allow merge/revert/fixup/squash commits unchanged.
if (
    firstLine.startsWith("Merge ") ||
    firstLine.startsWith("Revert ") ||
    firstLine.startsWith("fixup!") ||
    firstLine.startsWith("squash!")
) {
    process.exit(0);
}

const re = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\([a-z0-9._/-]+\))?(!)?: .+/i;
if (!re.test(firstLine)) {
    console.error("commit-msg check failed.");
    console.error(
        "Use Conventional Commits, e.g. `feat(calendar): add today highlight`."
    );
    process.exit(1);
}
