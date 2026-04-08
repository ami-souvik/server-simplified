# Shmart Roadmap & Tasks

This document tracks the pending features and improvements for **Shmart**, the Terminal AI Assistant.

---

## 🚀 High Priority

### 1. Unified Local & Remote Compatibility (Native Execution Mode)

**Problem:** Currently, Shmart is designed as a client-side agent that connects to remote servers via SSH. If a user installs Shmart directly on the server they want to manage, it still tries to "SSH into itself" or requires complex SSH configuration.

**Goal:** Implement a "Native Mode" where Shmart can be deployed directly onto a server and execute commands locally using Node.js `child_process` (like `spawn` or `exec`), bypassing the SSH layer.

**Key Requirements:**

- **Environment Detection:** Add a `MODE` or `EXECUTION_STRATEGY` environment variable (e.g., `MODE=native` or `MODE=ssh`).
- **Local Executor Service:** Create a `LocalService` that mirrors the `SSHService` interface but runs commands on the local shell.
- **Dynamic Routing:** Update API routes to choose between `LocalService` and `SSHService` based on configuration.
- **Security Protocols:** Add mandatory authentication (e.g., OAuth or simple Auth Secret) since Native Mode exposes the server's local shell to a public web interface.
- **Docker Optimization:** Ensure the Docker configuration supports mapping the host shell/filesystem if needed, or simply runs as a standalone server management tool.

---

## 🛠️ Performance & UX

- [ ] **Terminal Emulation Improvements:** Enhance `TerminalOutput.tsx` to support real-time streaming of stdout/stderr even for long-running processes.
- [ ] **Context Window Optimization:** Implement better slicing/summarization of long terminal outputs to prevent LLM context overflow.
- [ ] **Multi-Session Support:** Allow users to switch between multiple saved SSH profiles or local server instances.

---

## 🧪 DevOps & Deployment

- [ ] **Automated Migrations:** Ensure `drizzle-kit push` or equivalent runs on container startup for seamless DB updates.
- [ ] **Health Checks:** Implement `/api/health` for monitoring container status in production.
