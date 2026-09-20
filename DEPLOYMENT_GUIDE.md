# AyuraNex Clinical Platform: GitHub Hosting & Deployment Guide

This repository contains the complete production-ready code for **AyuraNex CTMS & National Pharmacovigilance Centre (NPvCC)**.

The project is pre-configured with:
- **`base: './'`** in `vite.config.ts` (enables universal relative asset resolution on GitHub Pages)
- **`.github/workflows/deploy.yml`** (automated CI/CD build & deploy via GitHub Actions)
- **Pre-built production bundle** in the `dist/` folder

---

## Method 1: Automatic Deployment with GitHub Pages (Recommended)

### Step 1: Create a Repository on GitHub
1. Open [github.com](https://github.com) and sign in.
2. Click the **`+`** icon in the top-right and select **New repository**.
3. Name your repository (e.g., `ayuranex-ctms` or `vedavision`).
4. Set visibility to **Public** (required for free GitHub Pages).
5. Leave "Add a README", ".gitignore", and "license" unchecked (the project already has them).
6. Click **Create repository**.

### Step 2: Initialize Git and Push Your Project
Open PowerShell or your terminal in this project folder and run:

```bash
# 1. Initialize local git repository
git init

# 2. Stage all project files
git add .

# 3. Create your initial commit
git commit -m "feat: complete AyuraNex CTMS clinical platform prototype"

# 4. Set default branch to main
git branch -M main

# 5. Link your GitHub remote repository (replace with your GitHub username and repo name)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git

# 6. Push code to GitHub
git push -u origin main
```

### Step 3: Enable GitHub Pages in Repository Settings
1. On your GitHub repository page, click **Settings** (top navigation bar).
2. On the left sidebar, click **Pages**.
3. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions** from the dropdown.
4. That's it! GitHub Actions will automatically detect `.github/workflows/deploy.yml`, run `npm run build`, and deploy your live site.
5. In ~1-2 minutes, your live site URL will be:
   `https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPO_NAME>/`

---

## Method 2: Instant 1-Click Drag-and-Drop (Vercel / Netlify)

If you need a live HTTPS link in under 10 seconds without running terminal commands:

1. Open [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop the **`dist`** folder directly into the browser window.
3. Your site is instantly live with a public HTTPS URL (e.g., `https://ayuranex-clinical.netlify.app`).

---

## Method 3: Local Development

To continue running or editing the project locally:

```bash
# 1. Install dependencies
npm install

# 2. Start Vite local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.
