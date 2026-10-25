# Subangdaku ES Term 1 Dashboard

SAPM results dashboard for Subangdaku Elementary School (South District, Schools Division of Mandaue City). It shows Term 1 Mean Percentage Scores for Grades 1 to 6 with charts, analysis by grade and learning area, key findings, interventions, an action plan and proposed targets.

No build step and no dependencies. It is plain HTML, CSS and JavaScript. The only outside request is the Google Fonts stylesheet; the page still works without it.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page structure |
| `styles.css` | Colors, layout, light and dark themes |
| `data.js` | The MPS scores (edit this when results change) |
| `app.js` | Charts, tables and the written analysis |
| `assets/logo.png`, `assets/facade.jpg` | School seal and building image |
| `data/mps-term1-subangdaku.csv` | The same scores as a spreadsheet-friendly CSV |

## Publish with GitHub Pages

1. Create a new repository and upload everything in this folder (keep the `assets` and `data` folders).
2. Open **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then save.
4. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

To preview on your computer, open `index.html` in a browser.

## Updating the scores

Edit `data.js`. Each row is `[learning area, WW, PT, ST 1, ST 2, TE, Overall]`, and `null` means no score. The charts, heatmaps and totals recalculate from it.

The written text (strengths, concerns, interventions, key findings, action plan and targets) is in `app.js`, mainly in the `GR`, `AREAS`, `F`, `PH` and targets sections. It quotes figures from the Term 1 data, so review it whenever `data.js` changes.

## Notes

- Averages are simple means of the learning-area rows, not weighted by learners.
- The 75 line is a reference benchmark for reading the charts, not an official proficiency level.
- Grade 4 and Grade 5 contain duplicate-looking rows (for example "Music and Arts" and "music and arts"), and two Grade 5 rows have no summative or exam scores. They are counted as they appear in the source files.
- The source files contain no learner names. Keep it that way if the repository is public.
