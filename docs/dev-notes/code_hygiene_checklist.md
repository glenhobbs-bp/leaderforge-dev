# Code Hygiene & Dependency Checklist for Production

## Overview

This document outlines essential code hygiene and dependency management actions to take before deploying to production. It also covers how to clean up failed or duplicate package installs, especially in a monorepo.

---

## 1. Dependency Hygiene

- **Remove unused dependencies** from all `package.json` files.
- **Run `pnpm prune`** to remove extraneous packages from `node_modules`.
- **Run `pnpm dedupe`** to minimize duplicate packages.
- **Run `pnpm audit`** and review vulnerabilities. Only use `--force` if you are prepared for breaking changes and have tested thoroughly.
- **Update dependencies** regularly, but test after each update.
- **Align versions** of shared dependencies (e.g., React) across all packages in the monorepo.
- **Check for duplicate or failed installs** (see below).

---

## 2. Cleaning Up Failed or Duplicate Installs

- **Search for duplicate package folders:**
  - Use `find . -name "@copilotkit*"` or similar to locate all instances.
  - Remove any unused or orphaned directories (especially in subfolders or old test projects).
- **Remove old or failed install artifacts:**
  - Delete any unused `node_modules` folders in subdirectories (e.g., `apps/web/app/copilotkit/node_modules`).
  - Remove any `.next`, `.turbo`, or other build artifacts in subprojects.
- **Check all `package.json` files** for unwanted or duplicate dependencies.
- **Delete unused CopilotKit scaffolding:**
  - If you have multiple CopilotKit setups, keep only the one you use and delete the rest.
- **Reinstall cleanly:**
  - From the monorepo root, run:
    ```sh
    rm -rf node_modules pnpm-lock.yaml
    pnpm install
    ```

---

## 3. General Code Hygiene

- **Remove unused files, components, and scripts.**
- **Lint and format code** using your standard tools (e.g., ESLint, Prettier).
- **Run all tests** and ensure they pass.
- **Document any manual steps** needed for setup or deployment.
- **Review environment variables** and secrets—never commit secrets to the repo.

---

## 4. Before Production Release

- **Run a full build and test cycle.**
- **Check for any warnings or errors in the build output.**
- **Review all open issues and TODOs.**
- **Tag and document the release.**

---

## References

- [pnpm docs](https://pnpm.io/)
- [CopilotKit docs](https://docs.copilotkit.ai/)
- [Husky docs](https://typicode.github.io/husky/#/)
