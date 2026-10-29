# Teacher data entry

Teachers sign in with a Teacher ID and PIN, enter the class MPS (WW, PT, ST 1, ST 2, TE) and the least-learned competencies for each learning area, and save. The coordinator signs in with a separate PIN to see who has submitted, view all entries and download them as CSV.

Plain HTML, CSS and JS. No build step.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page structure |
| `entry.css` | Styles, light and dark themes |
| `entry.js` | Sign-in, entry form, class record reader, coordinator view |

## Where the data lives

A Supabase project (URL and publishable key are at the top of `entry.js`; the publishable key is meant to be public). Tables are prefixed `smea_` and have row-level security on with no direct access: the page can only call PIN-checked database functions, so a teacher can only read or write their own rows, and only while a period is open.

## Class record reader

"Fill from your class record" reads the Electronic Class Record in the browser (SheetJS from cdnjs). It looks at the `DATA SHEET` (grade, subject, section, school year) and the chosen `TERM` sheet's MPS blocks only. The file is never uploaded and learner names are never read.

## Privacy

- Do not commit PIN lists, teacher rosters or exported CSVs to this repository. It is public.
- The page shows no teacher names before sign-in. Names appear only after sign-in (own name) and in the PIN-protected coordinator view.
- Keep learner names out of every file here.


## Division SAPM format (v2)

- Reports are per **teacher, learning area and section**, with **male and female MPS** for Written Works, Performance Tasks, Summative Test 1, Summative Test 2 and Term Examination. Average MPS is the mean of male and female.
- **Least-learned competencies**: three ranked rows for each of Summative Test 1, Summative Test 2 and Term Exam, with competency, intervention, timeline and status. Competency choices come from the Budget of Work (`competencies.json`, extracted from the BOW PDFs by grade, learning area and term); **Other** accepts free text.
- **SAPM-report CSV** (teacher and coordinator): same 23 columns as the Division template (`SAPM-report-template.csv`).
- **Display board** (coordinator PIN only): grade-by-grade monitoring tables shaded against 75, with an `.xlsx` download laid out like the monitoring workbook.
- Database: `smea2_reports`, `smea2_llc`, `smea2_areas`, `smea_periods.term`; RPCs `smea2_login`, `smea2_load`, `smea2_save`, `smea2_admin_overview`, `smea2_admin_set`.
- Class record reader now also reads the section (DATA SHEET L9) and male (col I), female (col M) and total (col Q) MPS.
- `competencies.json` is public curriculum data. Teacher names and scores are never stored in this repository.
