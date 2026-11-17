# H5P preview reader

Studio's preview uses `@missing-elements/h5p-offline-player`, the reader behind
https://h5p-offline-player.vercel.app/. It is installed locally, not embedded from
that site. `H5PRealPlayer` also supplies the element preview dialog.

- `buildH5p` generates a complete archive from the current draft and selected
  Course Presentation version. The reader receives it through its `file` property.
- The runtime and optional fallback library pack are served by Vite from the
  installed packages. No preview package is sent to the demo website.
- `refresh-libraries="off"` preserves the libraries bundled in our export,
  including custom rotation and popup patches. Only missing dependencies use the pack.
- Only archives reconstructed by our packager with curated local libraries reach
  this reader. Do not pass arbitrary uploaded archives directly to this instance.
- The reader uses its own Service Worker scope. HTTPS or localhost is required.
  The existing server player and simulation sources are retained but no longer
  offered as preview modes in Studio.
- xAPI activities and scores are shown for the current preview only. They are
  not saved as server attempts. Leaving the preview disconnects the reader and
  removes its listeners; reopening starts a fresh attempt.

Run `npm install`, then `npm run dev`. `npm run build` bundles the reader,
workers, runtime, fonts and library archives for production. The Vite dependency
exclusions preserve asset URLs during development.

The notices under `public/assets/` ship with the runtime in production. When
updating the reader dependencies, also refresh their license and notice files
from the corresponding installed packages (runtime `dist/LICENSE.txt` and
`dist/NOTICE.txt`, player `LICENSE` and `NOTICE.md`, library pack `libraries.txt`).
