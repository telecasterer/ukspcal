#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";

const RELEASE_NOTES_PATH = "RELEASE_NOTES.md";
const SEMVER_TAG_RE = /^v\d+\.\d+\.\d+$/;
const CONVENTIONAL_RE = /^([a-z]+)(\([^)]+\))?(!)?:\s+(.+)$/i;

function run(cmd) {
    return execSync(cmd, { encoding: "utf8" }).trim();
}

function runQuiet(cmd) {
    try {
        return run(cmd);
    } catch {
        return "";
    }
}

function hasChanges() {
    return runQuiet("git status --porcelain").length > 0;
}

function getLatestReleaseTag() {
    const tags = runQuiet("git tag --list --sort=-v:refname");
    if (!tags) return null;
    const firstSemverTag = tags
        .split("\n")
        .map((t) => t.trim())
        .find((t) => SEMVER_TAG_RE.test(t));
    return firstSemverTag ?? null;
}

function getCommitsSince(tag) {
    const range = tag ? `${tag}..HEAD` : "HEAD";
    const output = runQuiet(
        `git log ${range} --date=short --pretty=format:%H%x09%ad%x09%s`
    );
    if (!output) return [];
    return output
        .split("\n")
        .map((line) => {
            const [hash, date, subject] = line.split("\t");
            return { hash, date, subject };
        })
        .filter((c) => c.hash && c.subject);
}

function classifyCommit(subject) {
    const m = subject.match(CONVENTIONAL_RE);
    if (!m) {
        return {
            type: "other",
            description: subject,
            breaking: false,
            conventional: false,
        };
    }
    const [, rawType, , bang, rawDesc] = m;
    const type = rawType.toLowerCase();
    return {
        type,
        description: rawDesc.trim(),
        breaking: Boolean(bang),
        conventional: true,
    };
}

function inferBump(commits) {
    let hasMajor = false;
    let hasMinor = false;
    let hasPatch = false;

    for (const c of commits) {
        const parsed = classifyCommit(c.subject);
        if (parsed.breaking) hasMajor = true;
        if (parsed.type === "feat") hasMinor = true;
        if (
            ["fix", "perf", "refactor", "revert", "build", "ci"].includes(
                parsed.type
            )
        ) {
            hasPatch = true;
        }
        if (!parsed.conventional) {
            hasPatch = true;
        }
    }

    if (hasMajor) return "major";
    if (hasMinor) return "minor";
    if (hasPatch) return "patch";
    return "patch";
}

function bumpVersion(currentVersion, bumpType) {
    const m = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!m) {
        throw new Error(
            `Current version "${currentVersion}" is not semver x.y.z`
        );
    }
    let major = Number(m[1]);
    let minor = Number(m[2]);
    let patch = Number(m[3]);
    if (bumpType === "major") {
        major += 1;
        minor = 0;
        patch = 0;
    } else if (bumpType === "minor") {
        minor += 1;
        patch = 0;
    } else {
        patch += 1;
    }
    return `${major}.${minor}.${patch}`;
}

function updateReleaseNotes(nextVersion, commits) {
    if (!fs.existsSync(RELEASE_NOTES_PATH)) {
        throw new Error(`${RELEASE_NOTES_PATH} not found`);
    }

    const notes = fs.readFileSync(RELEASE_NOTES_PATH, "utf8");
    const today = new Date().toISOString().slice(0, 10);
    const heading = `## ${today} (v${nextVersion})`;
    if (notes.includes(heading)) {
        throw new Error(`Release notes already contain section: ${heading}`);
    }

    const grouped = new Map([
        ["Features", []],
        ["Fixes", []],
        ["Performance", []],
        ["Refactors", []],
        ["Documentation", []],
        ["Tests", []],
        ["Build & CI", []],
        ["Chores", []],
        ["Other", []],
    ]);

    for (const c of commits) {
        const parsed = classifyCommit(c.subject);
        const short = c.hash.slice(0, 7);
        const line = `- ${parsed.description} (${short})`;
        if (parsed.breaking) {
            grouped.get("Features").push(`${line} [breaking]`);
            continue;
        }
        if (parsed.type === "feat") grouped.get("Features").push(line);
        else if (parsed.type === "fix" || parsed.type === "revert")
            grouped.get("Fixes").push(line);
        else if (parsed.type === "perf") grouped.get("Performance").push(line);
        else if (parsed.type === "refactor") grouped.get("Refactors").push(line);
        else if (parsed.type === "docs")
            grouped.get("Documentation").push(line);
        else if (parsed.type === "test") grouped.get("Tests").push(line);
        else if (parsed.type === "build" || parsed.type === "ci")
            grouped.get("Build & CI").push(line);
        else if (parsed.type === "chore") grouped.get("Chores").push(line);
        else grouped.get("Other").push(line);
    }

    const bodyParts = [];
    for (const [name, lines] of grouped) {
        if (!lines.length) continue;
        bodyParts.push(`### ${name}`, "", ...lines, "");
    }
    if (!bodyParts.length) {
        bodyParts.push("### Other", "", "- Maintenance updates", "");
    }

    const newSection = [heading, "", ...bodyParts].join("\n");

    const marker = "## ";
    const markerIndex = notes.indexOf(marker);
    const updated =
        markerIndex === -1
            ? `${notes.trimEnd()}\n\n${newSection}\n`
            : `${notes.slice(0, markerIndex)}${newSection}\n${notes.slice(markerIndex)}`;

    fs.writeFileSync(RELEASE_NOTES_PATH, updated, "utf8");
}

function getPackageVersion() {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
    return String(pkg.version ?? "");
}

function updatePackageVersion(nextVersion) {
    run(`npm version --no-git-tag-version ${nextVersion}`);
}

function main() {
    const args = new Set(process.argv.slice(2));
    const doCommit = args.has("--commit");
    const doTag = args.has("--tag");

    if (hasChanges()) {
        throw new Error(
            "Working tree is not clean. Commit/stash changes before running release."
        );
    }

    const lastTag = getLatestReleaseTag();
    const commits = getCommitsSince(lastTag);
    if (!commits.length) {
        console.log("No commits found since last release tag. Nothing to do.");
        return;
    }

    const bump = inferBump(commits);
    const currentVersion = getPackageVersion();
    const nextVersion = bumpVersion(currentVersion, bump);

    updatePackageVersion(nextVersion);
    updateReleaseNotes(nextVersion, commits);

    run("git add package.json package-lock.json RELEASE_NOTES.md");

    if (doCommit) {
        run(`git commit -m "chore(release): v${nextVersion}"`);
    }
    if (doTag) {
        run(`git tag -a v${nextVersion} -m "v${nextVersion}"`);
    }

    console.log(`Release prepared: v${nextVersion}`);
    console.log(`Bump: ${bump}`);
    console.log(`Commits included: ${commits.length}`);
    if (!doCommit) {
        console.log("Staged changes are ready. Commit them when you are ready.");
    }
    if (!doTag) {
        console.log("Tag not created. Use --tag to create an annotated tag.");
    }
}

try {
    main();
} catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`release failed: ${message}`);
    process.exit(1);
}
