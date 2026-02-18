# bst236_hw1

A simple portfolio site built for Homework 1: *Code with AI*.  The repo contains all source code for three deliverables:

1. **Homepage for a coding blog** hosted on GitHub Pages (
   [`index.html`](index.html)).
2. **Valentine‑themed Pac‑Man game** playable in the browser
   ([`pacman/`](pacman/)).
3. **Auto‑updating arXiv feed** with a nightly GitHub Actions workflow
   ([`arxiv/`](arxiv/) plus `.github/workflows/update_arxiv.yml`).

Use the link below to preview the live site:

> https://joycests.github.io/bst236_hw1/

---

## Quick links

- [Homepage](https://joycests.github.io/bst236_hw1/)
- [Valentine Pac‑Man game](https://joycests.github.io/bst236_hw1/pacman/)
- [arXiv paper feed](https://joycests.github.io/bst236_hw1/arxiv/)


---

## 1. Problem 1 – Coding blog homepage 🏠

The site is a minimal HTML/CSS page that acts as a container for future
assignments.  I designed it to be easy to extend: new projects can simply be
added as subdirectories and linked from the navigation bar.  The CSS in
`assets/style.css` keeps the layout responsive and lightweight.

The homepage includes:

* Title, subtitle and brief description.
* Navigation bar with links to the game and arXiv feed (required by the
  assignment) plus a link back to the repo.
* Placeholder sections for "About", "Projects" and "Next" so I can add more
  content later.
* A dynamic footer that displays the current year.

### Using AI Copilot during development

I treated the homepage as a tiny web project and relied on ChatGPT/CoPilot to
bootstrap the HTML and CSS.  My workflow looked like this:

1. Prompt: _"Help me write a minimal responsive homepage for a coding blog
   with a header, nav, and three cards. Use plain HTML/CSS."_  
   *CoPilot generated a working skeleton and I iterated on the markup.*
2. Prompt: _"Add a dynamic footer that shows the current year with JavaScript."
   *I got the one‑liner script.*
3. I asked follow‑ups for styling hints (e.g. flexbox grid, color scheme) and
   copied the resulting CSS into `assets/style.css`.

> **AI tools used:** ChatGPT / GitHub Copilot inside VS Code.

> **Prompt design:** Start with a high‑level description, then request
> incremental features and style adjustments.  Storing the final prompts in the
> report helped reproduce the page later.

---

## 2. Problem 2 – Valentine’s Pac‑Man 💘

The game lives under the `pacman/` directory and consists of three files:
`index.html`, `pacman.css`, and `game.js`.  The mechanics satisfy all core
requirements:

* **Classic maze** with pellets and ghosts.  The maze is defined programmatically
  in `game.js` so it can be tweaked easily.
* **Valentine’s power‑up (rose)** appears randomly.  When Pac‑Man eats it he
  becomes powered for 5 seconds and begins shooting hearts in his current
direction.
* **Heart projectiles** travel across the grid, bounce off walls, and eliminate
  ghosts on contact.  Ghosts respawn at their spawn points.
* Game state includes score, lives, power status, and win/lose overlays.

Additional touches: emojis for characters (🤼, 🌹, 💕), a HUD showing score/lives
and simple keyboard controls (arrow keys / WASD).  Restart is triggered with
`R`.

### AI‑assisted development

For this problem I used Copilot CLI to scaffold the JavaScript game loop and
AI prompts to debug behavior:

* _"Generate a simple Pac‑Man style game in JavaScript using canvas. Include a
  20×20 grid, pellets, ghosts that chase the player, and basic movement."_
  – gave me a starting point.
* I then asked for rose power‑up logic and heart projectiles separately.
* When the ghosts were getting stuck in walls, I prompted: _"Fix the ghost
  pathfinding so they don't walk through walls; use manhattan distance to
  chase the player."_  Copilot produced the `pickGhostDir` helper.
* Styling hints for the HUD and game layout were obtained by supplying small
  CSS descriptions.

I iterated with the implicit "have the agent run my tests" pattern: make a
change, refresh the page, then ask Copilot why something isn't working.  The
agent occasionally hallucinated nonexistent variables, so I had to correct a
few lines manually, which was a good reminder to review generated code.

> **AI tools used:** GitHub Copilot / ChatGPT, Copilot CLI for batch generation.

> **Prompt design:** Break down the game features into small tasks and ask for
> code snippets one at a time.  Confirm understanding by describing the current
> game state when debugging.

---

## 3. Problem 3 – Auto‑updating arXiv paper feed 📄

The `arxiv/` directory contains an HTML page that reads `papers.json` and
renders a card for each paper.  The JSON is produced by `scripts/fetch_arxiv.py`,
which queries the arXiv API using `feedparser` and writes the output.  The
GitHub Actions workflow `.github/workflows/update_arxiv.yml` runs the script
nightly (2 AM UTC) and commits any changes to the repository, ensuring the
webpage stays current.

Key components:

* **`scripts/fetch_arxiv.py`** – Python script with a `fetch_arxiv_papers`
  function and a CLI entry point.  A query argument can be passed from the
  workflow or command line; the default is `machine learning`.
* **`arxiv/index.html`** – Vanilla JS that fetches `papers.json` (with a
  cache‑busting timestamp) and populates the DOM.  It shows title, authors,
  abstract, links and published date.
* **Styling** in `arxiv/arxiv.css` produces a dark‑mode card layout.
* **`papers.json`** – sample output already committed.  The workflow updates
  this file automatically.

### Copilot CLI & agentic workflow

This problem was meant to practice Copilot CLI.  My workflow: 

1. Run `copilot init` (not shown in repo) to create an agent configuration that
   knows how to read/write files, run python, and commit changes.
2. Start with a planning prompt:
   
```text
Plan a small project that fetches arXiv papers by keyword, stores the results
in JSON, and renders them in a webpage. Include an auto‑update GitHub Actions
workflow. Outline the files and commands needed.
```

   Copilot generated a TODO list and rough file structure (`scripts/fetch_arxiv.py`,
   `arxiv/index.html`, workflow YAML). I then asked it to implement each file in
   sequence, reviewing and tweaking the output.
3. When the JSON structure didn't match the front‑end, I simply edited the Python
   script and asked Copilot to regenerate the save logic.  The CLI made it easy
   to test locally before committing.
4. Finally, I added the workflow YAML and used `copilot run` to simulate the
   nightly job; the agent committed the updated `papers.json` for me.

> **AI tools used:** Copilot CLI (planning + code generation), ChatGPT for API
> research.

> **Prompt design:** Use high‑level planning prompts first, then ask for
> complete file contents.  When debugging, paste snippets of the current code
> and describe the issue.

---

## Running the project locally

The easiest way to see the site live is to push this repository to GitHub and
enable **GitHub Pages** (Settings → Pages → Source = `main` branch, `/ (root)`).
After a minute the pages will be available at
`https://<your‑username>.github.io/<repo‑name>/`.  I used
`https://joycests.github.io/bst236_hw1/` for my version of the assignment.


```bash
# view homepage
open index.html

# play the game
open pacman/index.html

# view arXiv feed (make sure papers.json is present)
open arxiv/index.html
```

To update the paper list manually:

```bash
pip install feedparser
python scripts/fetch_arxiv.py "deep learning"
```

The GitHub Action will run automatically every night if the repo is hosted on
GitHub with Actions enabled.

---

## Notes & future work

* I may add more blog posts under `/posts/` and link them from the homepage.
* The Pac‑Man game could be extended with sound effects and mobile touch
controls.  Copilot can be used to scaffold those features too.
* The arXiv feed currently fetches 100 papers; the workflow could accept a
  keyword parameter or use environment variables.

---

### Acknowledgements

This assignment was completed with the assistance of GitHub Copilot and
OpenAI's ChatGPT.  The agentic programming paradigm taught in class made it
fast to iterate and keep my repository organized.  Hopefully this report helps
others learn the same techniques!
