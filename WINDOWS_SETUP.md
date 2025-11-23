# Windows Setup Guide for ResumeRank

If you're getting esbuild errors on Windows with Node.js 24, follow these steps:

## Option 1: Downgrade Node.js to 20.11.6 (Recommended)

This is the easiest and most stable solution:

1. Uninstall Node.js 24 from your system
2. Download Node.js 20.11.6 LTS from https://nodejs.org/en/download/
3. Install it
4. Run:
   ```bash
   npm run dev
   ```

Node 20.11.6 has no Windows compatibility issues and is a stable LTS release.

## Option 2: Environment Variable Fix

Set this environment variable before running the app:

```bash
# On Windows Command Prompt:
set NODE_OPTIONS=--max-old-space-size=4096

# Or on Windows PowerShell:
$env:NODE_OPTIONS="--max-old-space-size=4096"

# Then run:
npm run dev
```

## Option 2: Create a .env File

Create a file named `.env.local` in your project root with these settings:

```
NODE_ENV=development
NODE_OPTIONS=--max-old-space-size=4096
```

## Option 3: Use yarn instead of npm

If npm continues to have issues:

```bash
npm install -g yarn
yarn install
yarn dev
```

## Option 4: Downgrade to Node.js v22 or v20

If the environment variable fixes don't work, downgrade to Node.js v22 or v20 LTS:

1. Uninstall Node.js 24
2. Download Node.js v22 LTS from https://nodejs.org/
3. Install and run `npm run dev`

## Troubleshooting

If you still see "The service was stopped" error:

1. **Kill existing Node processes:**
   ```bash
   # Command Prompt:
   taskkill /F /IM node.exe
   
   # PowerShell:
   Get-Process node | Stop-Process -Force
   ```

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   rm -r node_modules package-lock.json
   npm install
   npm run dev
   ```

3. **Increase memory limit even more:**
   ```bash
   set NODE_OPTIONS=--max-old-space-size=8192
   npm run dev
   ```

## What's the issue?

Windows with Node.js 24 has known compatibility issues with esbuild (used by Vite for development). These fixes increase memory allocation and improve process handling on Windows.

## Still having issues?

Contact support or check the error logs by running:
```bash
npm run dev 2>&1 | tee error.log
```

Then share the `error.log` file for troubleshooting.
