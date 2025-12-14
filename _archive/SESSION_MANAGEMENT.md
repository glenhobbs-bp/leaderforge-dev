# Session Management for LeaderForge Development

This document describes the session management tools created to prevent terminal session buildup and orphaned processes during development.

## Problem Solved

Previously, the development environment suffered from:
- **68+ orphaned terminal sessions** consuming system resources
- Multiple stale development processes fighting for ports
- Route conflicts from cached Next.js builds
- Difficulty tracking which services were running

## Tools Created

### 1. `cleanup-sessions.sh`
**Purpose**: Clean up orphaned terminal sessions and development processes

**Usage**:
```bash
./cleanup-sessions.sh
```

**What it does**:
- Preserves the current terminal session
- Kills all other orphaned shell sessions (zsh/bash)
- Terminates stale development processes (Next.js, LangGraph, TSX)
- Clears Next.js build cache to resolve route conflicts
- Reports before/after session counts

### 2. `start-dev.sh`
**Purpose**: Start the development environment cleanly

**Usage**:
```bash
./start-dev.sh
```

**What it does**:
- Runs cleanup first to ensure clean state
- Starts web development server (port 3000)
- Starts LangGraph server (port 8000)
- Tests both endpoints for responsiveness
- Saves process PIDs for easy cleanup
- Reports service status

### 3. `stop-dev.sh`
**Purpose**: Cleanly stop all development services

**Usage**:
```bash
./stop-dev.sh
```

**What it does**:
- Stops services using saved PIDs (graceful)
- Falls back to killing by process name if needed
- Removes PID files
- Verifies all processes are stopped

### 4. `monitor-sessions.sh`
**Purpose**: Monitor system state and provide status overview

**Usage**:
```bash
./monitor-sessions.sh
```

**What it shows**:
- Number of active shell sessions (warns if >3)
- Running development processes
- Port usage (3000, 8000)
- Service health status
- Quick command reference

## Best Practices

### Daily Development Workflow

1. **Start your day**:
   ```bash
   ./monitor-sessions.sh    # Check current state
   ./start-dev.sh          # Start clean environment
   ```

2. **During development**:
   ```bash
   ./monitor-sessions.sh    # Check periodically
   ```

3. **End your day**:
   ```bash
   ./stop-dev.sh           # Clean shutdown
   ```

### When Things Go Wrong

If you notice performance issues or port conflicts:

```bash
./cleanup-sessions.sh      # Nuclear cleanup
./start-dev.sh            # Fresh start
```

### Monitoring Session Buildup

Run this periodically to catch session buildup early:
```bash
./monitor-sessions.sh
```

The script will warn you if shell sessions exceed 3 (normal is 1-2).

## File Structure

```
leaderforge-dev/
├── cleanup-sessions.sh     # Session cleanup
├── start-dev.sh           # Development startup
├── stop-dev.sh            # Development shutdown
├── monitor-sessions.sh    # Status monitoring
├── .web-dev.pid          # Web server PID (auto-generated)
├── .langgraph-dev.pid    # LangGraph PID (auto-generated)
└── SESSION_MANAGEMENT.md  # This documentation
```

## Automated Prevention

The tools are designed to prevent session buildup automatically:

- **Cleanup before start**: `start-dev.sh` runs cleanup first
- **PID tracking**: Services are tracked for clean shutdown
- **Graceful termination**: Proper shutdown prevents orphaned processes
- **Cache clearing**: Prevents route conflicts from stale builds

## Troubleshooting

### "Port already in use" errors
```bash
./cleanup-sessions.sh
./start-dev.sh
```

### High CPU usage from terminal sessions
```bash
./monitor-sessions.sh     # Check session count
./cleanup-sessions.sh     # Clean up if needed
```

### Route conflicts in Next.js
The cleanup script automatically removes `.next` cache to resolve these.

### Services not responding
```bash
./stop-dev.sh
./start-dev.sh
```

## Integration with Git

PID files are automatically ignored in `.gitignore`:
```
# --- Development Session Management ---
*.pid
.web-dev.pid
.langgraph-dev.pid
```

This prevents accidentally committing process IDs to version control.