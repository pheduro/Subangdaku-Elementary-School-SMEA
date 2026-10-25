# Subangdaku ES SMEA site, SY 2026–2027

Static site. No build step. Works on Vercel as-is (framework: "Other").

## Structure

| Path | What it is |
|---|---|
| `index.html` | Home: key numbers and links to every module |
| `sapm/` | **Term 1 SAPM dashboard** (its own HTML, CSS, JS and data) |
| `enrollment.html` | Learners per grade level |
| `literacy.html` | CRLA reading profile; PHIL-IRI placeholder |
| `nutrition.html` | Learners with poor nutrition |
| `outcomes.html` | LARDOs, dropouts, failures |
| `practices.html` | BLICs and promising practices |
| `slides.html` | Links to the Term 1 conference decks |
| `data/smea.js` | **All figures live here.** Edit this file to update any page |
| `assets/` | Shared styles, header/nav script |

## Term 1 SAPM module

The finished Term 1 dashboard lives in `sapm/` with its own files (`sapm/README.md`). It is linked from the home page and the top menu.

## Updating numbers for Term 2 and Term 3

Edit `data/smea.js`. Each section (enrollment, crla, lpn, outcomes, blics, practices, slides) is one block.
See `DATA-NOTES.md` for what was left out and why.
