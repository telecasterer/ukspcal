#!/usr/bin/env node
import { execSync } from "node:child_process";

function run(cmd) {
    execSync(cmd, { stdio: "inherit" });
}

run("git config core.hooksPath .githooks");
run("chmod +x .githooks/commit-msg");
console.log("Git hooks installed. core.hooksPath=.githooks");
