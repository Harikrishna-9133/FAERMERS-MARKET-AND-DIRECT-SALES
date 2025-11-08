Farmers' Market — Static site

This project is a small static website (HTML/CSS/JS) for a farmer-customer marketplace.

This README contains quick, copy-paste deployment steps so you can get a public URL fast.

Options (pick one):

1) GitHub Pages (free, simple)
   - Create a GitHub repository and push this folder.
   - Enable GitHub Pages from the repository Settings → Pages and choose branch `main` (or `gh-pages` via action).

   Quick commands (PowerShell):

   # initialize git, commit and create remote (replace <OWNER> and <REPO>)
   git init
   git add -A
   git commit -m "Initial site"
   gh repo create <OWNER>/<REPO> --public --source=. --remote=origin --push

   After repo creation go to Settings → Pages and select Branch: main (root) and save. Visit the URL shown (https://<OWNER>.github.io/<REPO>/).

   If you prefer automatic publishing via GitHub Actions, see the included workflow `.github/workflows/gh-pages.yml` (it publishes on push to `main`).

2) Netlify (drag & drop or CLI)
   - Easiest: go to https://app.netlify.com/drop and drag the project folder — Netlify will host and give you a public URL.
   - CLI:
     npm i -g netlify-cli
     netlify deploy --dir=. --prod

   See `netlify.toml` (included) for simple deploy settings.

3) Vercel (fast, free for hobby)
   - Install Vercel CLI and deploy:
     npm i -g vercel
     vercel --prod

Local testing

- Quick HTTP server (PowerShell):
  python -m http.server 8000
  # then open http://localhost:8000 in your browser

Notes about Firebase Auth

If you use Google Sign-in you must run the site from an authorized origin (not file://). Add `localhost` to Authorized domains in Firebase Console → Authentication → Settings and enable the Google provider.

Files added to help deploy:
- .github/workflows/gh-pages.yml — GitHub Action that deploys the repo to GitHub Pages on push to `main`.
- netlify.toml — Netlify configuration (optional).

If you want, I can:
- Create the Git repository here and attempt to create a GitHub repo using the GitHub CLI (requires you to authenticate the CLI locally). I can output the exact commands to run.
- Deploy immediately to Netlify using the Netlify CLI (requires you to login locally).

Which option do you want me to prepare commands for and/or run now? (GitHub Pages, Netlify, Vercel, or a local server)
