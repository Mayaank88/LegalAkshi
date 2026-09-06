# LegalAkshi 

LegalAkshi is a Vite + React application for checking
packaged-food labels and presenting compliance information in a simple
dashboard.

This guide explains how to download, configure, and run the project
locally on macOS, Windows, or Linux.

------------------------------------------------------------------------

## 1. Prerequisites

Before starting, install the following:

-   Git
-   Node.js
-   pnpm
-   VS Code (recommended)
-   A Clerk account/project if you want the login and signup
    functionality to work

### Recommended Node.js version

Use a current LTS version of Node.js. Node.js 20 LTS or newer is
recommended.

Check your installed versions:

``` bash
node -v
npm -v
git --version
```

Check pnpm:

``` bash
pnpm -v
```

If pnpm is not installed:

``` bash
npm install -g pnpm
```

------------------------------------------------------------------------

# 2. Clone the GitHub Repository

Open Terminal (macOS/Linux) or PowerShell/Git Bash (Windows).

Clone the repository:

``` bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
```

Replace the URL with this project's actual GitHub repository URL.

Move into the project:

``` bash
cd YOUR-REPOSITORY
```

Check that the project files are present:

``` bash
ls
```

On Windows PowerShell, you can use:

``` powershell
dir
```

------------------------------------------------------------------------

# 3. Open the Project in VS Code

From the project root:

``` bash
code .
```

If the `code` command is not available, open VS Code manually:

**VS Code → File → Open Folder → select the cloned repository**

Make sure you open the **repository root**, the folder containing files
such as:

``` text
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
artifacts/
lib/
scripts/
```

------------------------------------------------------------------------

# 4. Install Project Dependencies

From the repository root, run:

``` bash
pnpm install
```

This installs the dependencies for the entire pnpm workspace.

Do not manually install all packages listed in `package.json`.

If installation finishes successfully, you are ready to configure the
environment.

------------------------------------------------------------------------

# 5. Configure Clerk Authentication

The project uses Clerk for authentication.

The NutriCheck application expects a Clerk publishable key through:

``` text
VITE_CLERK_PUBLISHABLE_KEY
```

## Create the environment file

Create this file:

``` text
artifacts/nutricheck/.env
```

Add:

``` env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_CLERK_PUBLISHABLE_KEY
```

Replace:

``` text
pk_test_YOUR_CLERK_PUBLISHABLE_KEY
```

with the Publishable Key from your Clerk development application.

### Important

Do NOT put your Clerk Secret Key in this variable.

Do NOT commit `.env` to GitHub.

Your `.gitignore` should contain:

``` text
.env
.env.*
!.env.example
```

------------------------------------------------------------------------

# 6. Optional: Create an Example Environment File

To help other developers configure the project, create:

``` text
artifacts/nutricheck/.env.example
```

with:

``` env
VITE_CLERK_PUBLISHABLE_KEY=
```

Other developers can then copy it:

``` bash
cp artifacts/nutricheck/.env.example artifacts/nutricheck/.env
```

On Windows PowerShell:

``` powershell
Copy-Item artifacts/nutricheck/.env.example artifacts/nutricheck/.env
```

Then add their own Clerk Publishable Key.

------------------------------------------------------------------------

# 7. Run the NutriCheck Application

This repository is a pnpm workspace, so run the NutriCheck package from
the repository root.

Use:

``` bash
PORT=5174 BASE_PATH=/ pnpm --filter @workspace/nutricheck run dev
```

You should see output similar to:

``` text
VITE ... ready

Local:   http://localhost:5174/
Network: http://YOUR-IP:5174/
```

Open the Local URL in your browser:

``` text
http://localhost:5174
```

------------------------------------------------------------------------

# 8. Running on Windows

The environment-variable syntax used above is different on Windows.

### Windows PowerShell

Run:

``` powershell
$env:PORT="5174"
$env:BASE_PATH="/"
pnpm --filter @workspace/nutricheck run dev
```

Then open:

``` text
http://localhost:5174
```

### Windows Command Prompt

Run:

``` cmd
set PORT=5174
set BASE_PATH=/
pnpm --filter @workspace/nutricheck run dev
```

Then open:

``` text
http://localhost:5174
```

------------------------------------------------------------------------

# 9. Running on macOS / Linux

Use:

``` bash
PORT=5174 BASE_PATH=/ pnpm --filter @workspace/nutricheck run dev
```

Then open:

``` text
http://localhost:5174
```

------------------------------------------------------------------------

# 10. Useful Project Commands

All commands below should be run from the repository root.

## Start development server

macOS/Linux:

``` bash
PORT=5174 BASE_PATH=/ pnpm --filter @workspace/nutricheck run dev
```

Windows PowerShell:

``` powershell
$env:PORT="5174"
$env:BASE_PATH="/"
pnpm --filter @workspace/nutricheck run dev
```

## Build the application

``` bash
pnpm --filter @workspace/nutricheck run build
```

## Preview the production build

macOS/Linux:

``` bash
PORT=5174 BASE_PATH=/ pnpm --filter @workspace/nutricheck run serve
```

## Type-check the application

``` bash
pnpm --filter @workspace/nutricheck run typecheck
```

## Install dependencies again

If dependencies are missing or `node_modules` is deleted:

``` bash
pnpm install
```

------------------------------------------------------------------------

# 11. If Port 5174 Is Already in Use

The project uses the `PORT` environment variable.

You can choose another available port.

For example:

``` bash
PORT=5175 BASE_PATH=/ pnpm --filter @workspace/nutricheck run dev
```

Then open:

``` text
http://localhost:5175
```

On Windows PowerShell:

``` powershell
$env:PORT="5175"
$env:BASE_PATH="/"
pnpm --filter @workspace/nutricheck run dev
```

------------------------------------------------------------------------

# 12. Common Problems

## Problem: `pnpm: command not found`

Install pnpm:

``` bash
npm install -g pnpm
```

Then check:

``` bash
pnpm -v
```

------------------------------------------------------------------------

## Problem: `node: command not found`

Install Node.js from the official Node.js website or install it using a
Node version manager such as nvm.

After installation, restart your terminal and check:

``` bash
node -v
```

------------------------------------------------------------------------

## Problem: `Missing VITE_CLERK_PUBLISHABLE_KEY in .env file`

Make sure this file exists:

``` text
artifacts/nutricheck/.env
```

and contains:

``` env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
```

Then restart the Vite server.

Environment variables are loaded when Vite starts, so changing `.env`
while the server is running requires a restart.

------------------------------------------------------------------------

## Problem: Clerk tries to load from `clerk.localhost`

The local version of the application should use the normal Clerk
configuration.

Make sure the NutriCheck `App.tsx` does NOT force a Replit-specific
Clerk proxy when running locally.

The local Clerk provider should use the publishable key, for example:

``` tsx
<ClerkProvider
  publishableKey={clerkPubKey}
  appearance={clerkAppearance}
>
```

Do not configure a `clerk.localhost` proxy unless your deployment
environment specifically provides one.

------------------------------------------------------------------------

## Problem: `PORT environment variable is required`

The NutriCheck Vite configuration requires `PORT`.

Use:

``` bash
PORT=5174 BASE_PATH=/ pnpm --filter @workspace/nutricheck run dev
```

------------------------------------------------------------------------

## Problem: `BASE_PATH environment variable is required`

The application also requires `BASE_PATH`.

Use:

``` bash
PORT=5174 BASE_PATH=/ pnpm --filter @workspace/nutricheck run dev
```

------------------------------------------------------------------------

## Problem: Changes are not appearing

Try:

1.  Stop the development server with `Ctrl + C`.
2.  Start it again.
3.  Refresh the browser.

If dependencies are the problem:

``` bash
pnpm install
```

Then restart the development server.

------------------------------------------------------------------------

# 13. Recommended First-Time Setup

For a new developer, the complete setup on macOS/Linux is:

``` bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
cd YOUR-REPOSITORY
pnpm install
```

Create:

``` text
artifacts/nutricheck/.env
```

Add:

``` env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_CLERK_PUBLISHABLE_KEY
```

Then start:

``` bash
PORT=5174 BASE_PATH=/ pnpm --filter @workspace/nutricheck run dev
```

Open:

``` text
http://localhost:5174
```

------------------------------------------------------------------------

# 14. Project Structure

The important parts of the repository are organized approximately like
this:

``` text
repository/
│
├── artifacts/
│   ├── nutricheck/
│   │   ├── src/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── .env
│   │
│   └── mockup-sandbox/
│
├── lib/
├── scripts/
├── attached_assets/
│
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
└── README.md
```

The main application is:

``` text
artifacts/nutricheck/
```

The root of the repository is used to manage the pnpm workspace.

------------------------------------------------------------------------

# 15. Git Workflow for Developers

After making changes:

Check the changed files:

``` bash
git status
```

Add your changes:

``` bash
git add .
```

Commit:

``` bash
git commit -m "Describe your changes"
```

Push:

``` bash
git push
```

To get the latest changes from GitHub:

``` bash
git pull
```

If dependencies changed after pulling:

``` bash
pnpm install
```

------------------------------------------------------------------------

# 16. Security

Never commit secrets or private credentials to GitHub.

Do NOT commit:

``` text
.env
.env.local
```

Do NOT expose:

``` text
CLERK_SECRET_KEY
```

or any other private API credentials.

Only the Clerk Publishable Key should be used in the Vite frontend
environment.

If a secret is accidentally committed, revoke/rotate it immediately.

------------------------------------------------------------------------

# 17. Quick Start

If everything is already installed and configured:

### macOS / Linux

``` bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
cd YOUR-REPOSITORY
pnpm install
```

Create:

``` text
artifacts/nutricheck/.env
```

Add:

``` env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_CLERK_PUBLISHABLE_KEY
```

Start:

``` bash
PORT=5174 BASE_PATH=/ pnpm --filter @workspace/nutricheck run dev
```

Visit:

``` text
http://localhost:5174
```

### Windows PowerShell

``` powershell
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
cd YOUR-REPOSITORY
pnpm install
```

Create:

``` text
artifacts/nutricheck/.env
```

Add:

``` env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_CLERK_PUBLISHABLE_KEY
```

Start:

``` powershell
$env:PORT="5174"
$env:BASE_PATH="/"
pnpm --filter @workspace/nutricheck run dev
```

Visit:

``` text
http://localhost:5174
```

------------------------------------------------------------------------

## License

Add the project's license information here.

## Authors

Add the project authors/team information here.
