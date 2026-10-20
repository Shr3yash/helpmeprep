import { defineConfig } from "astro/config";

// GitHub Pages project site: https://<user>.github.io/helpmeprep/
// Override with BASE_PATH=/ if you ever serve from a domain root.
const base = process.env.BASE_PATH || "/helpmeprep";

export default defineConfig({
  site: "https://shr3yash.github.io",
  base,
  // "ignore" so Pagefind's directory URLs (/notes/) and the sidebar's slash-less URLs both resolve.
  trailingSlash: "ignore",
  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false,
    },
  },
});
