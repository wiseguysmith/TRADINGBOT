# Starting SIM Mode on Ubuntu/Linux

## Quick Start

**If you're on Ubuntu (native Linux):**

```bash
# 1. Find your project directory
cd ~/code/AI-Trading-Bot
# OR wherever you cloned/downloaded the project

# 2. Make sure you're in the project root
ls -la package.json

# 3. Start SIM mode
npm run paper-trading
```

## If You're Using WSL (Windows Subsystem for Linux)

**The project is on Windows, accessed via WSL:**

```bash
# Navigate to Windows path in WSL
cd /mnt/c/Users/18593/AI-Trading-Bot

# Start SIM mode
npm run paper-trading
```

## Finding Your Project

**If you don't know where the project is:**

```bash
# Search for package.json
find ~ -name "package.json" -path "*AI-Trading-Bot*" 2>/dev/null

# Or check common locations
ls -la ~/code/AI-Trading-Bot
ls -la ~/projects/AI-Trading-Bot
ls -la /mnt/c/Users/18593/AI-Trading-Bot  # If WSL
```

## Prerequisites

**Make sure Node.js and npm are installed:**

```bash
node --version
npm --version
```

**If not installed:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or use nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
```

## Two Terminals Needed

**Terminal 1 - Next.js Dev Server:**
```bash
cd /path/to/AI-Trading-Bot
npm run dev
```

**Terminal 2 - SIM Mode:**
```bash
cd /path/to/AI-Trading-Bot
npm run paper-trading
```

## Verify It's Working

**Check API:**
```bash
curl http://localhost:3000/api/observability/simulation-status
```

**Check Dashboard:**
Open browser: `http://localhost:3000/operator/simulation`

## Common Issues

**"npm: command not found":**
- Install Node.js (see Prerequisites above)

**"Cannot find module":**
- Run: `npm install`

**"Permission denied":**
- Don't use `sudo` for npm commands
- Fix permissions: `sudo chown -R $USER:$USER ~/.npm`

**"Port 3000 already in use":**
- Next.js is already running (good!)
- Just start SIM mode in another terminal
