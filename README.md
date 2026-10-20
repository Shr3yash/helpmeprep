# helpmeprep

My interview prep notes: system design, low-level design, and DSA (in C++), plus prep plans for a couple of company loops. Live at https://shr3yash.github.io/helpmeprep/.

It's a static Astro site. Each page is a markdown file under `src/content/pages/`, with a short quiz in the frontmatter. Progress and quiz scores are saved in your browser's localStorage, nothing else.

I used AI tools to help draft some of the notes, then edited them myself.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:4321/helpmeprep/.

Search (Pagefind) only works on a build:

```bash
npm run build
npm run preview
```

It deploys to GitHub Pages from `.github/workflows/pages.yml` on every push to `main`.
