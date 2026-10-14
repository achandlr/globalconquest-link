# Ferrule support and beta landing site

GitHub Pages serves this repository's `main` branch at
https://achandlr.github.io/globalconquest-link/ . The game source remains in the
separate GlobalConquest repository. This site is public; a direct URL and a
`noindex` tag do not restrict access.

## Privacy and support content

The single source for policy and support wording is
`GlobalConquest/src/app/config/legalContent.json`. It also supplies the app's
offline screens. Do not edit generated `legal/privacy.html` or `support.html`
prose independently.

Render the hosted pages from a verified game checkout:

```sh
node tools/render-legal-pages.mjs /absolute/path/to/GlobalConquest/src/app/config/legalContent.json
```

The generated files contain the input's SHA-256. Review the resulting diff and
check both pages at phone and desktop widths, including their links, before
publishing a reviewed PR to `main`. GitHub Pages deploys that merge; verify its
latest build succeeded and read the live pages back before reporting delivery.

`index.html` retains the existing TestFlight beta link. `legal/terms.html` is the
existing beta terms page; changing privacy or support does not change pricing,
App Store availability, or submit the app to Apple.
