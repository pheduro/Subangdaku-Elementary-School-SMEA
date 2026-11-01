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


## Safeguards (what the page protects, and what it tells the teacher)

- **Saving is off until the saved entries have loaded.** If loading fails (no connection, server problem, a failed period switch), the page says so, hides the form and offers *Try again*. This stops a blank screen from being saved over earlier entries.
- **Only what the teacher removes is deleted.** The page sends an explicit `removed` list with each save, and `smea2_save` deletes only those reports (SQL in `db/smea2_save.sql`). Entries saved from another device in the meantime are kept. A page that does not send `removed` gets the old behaviour. When a teacher empties or renames a saved section, the page explains and asks them to confirm first.
- **Class record checks before any number is used.** Wrong grade, wrong term sheet, values above 100, a file with no calculated results, or a file that is not a class record stop the upload with an explanation. A different subject, or a file whose grade/subject cannot be read, needs a tick box. Rows the page could not find or read are listed.
- **The reader finds things by label.** The DATA SHEET grade, section, subject and school year are found by their labels (with the template's usual cells as a fallback). The TERM sheet's MPS blocks are found by their "MEAN PERCENTAGE SCORE" labels, and the male/female/total columns by their headers (with the template's usual columns as a fallback). "Where these numbers came from" shows the cells used.
- **Section names are matched after cleaning.** "GR. 5 - CUCUMBER", "5-Cucumber" and "Grade 5 Cucumber" all become "Cucumber". The page asks before treating a close name as a different section, blocks two entries that are the same section, and asks for confirmation when two names are very close.
- **Checked against the Division's blank class record** ("ECR FOR G1-G10 ENHANCED K TO 12 CURRICULUM UPDATED"): `DATA SHEET` holds Grade Level (L8), Name of Section (L9, which says `NAME OF SECTION` until filled in), Subject (L10) and School Year (F13); `TERM 1`, `TERM 2` and `TERM 3` have the same layout, with the five "MEAN PERCENTAGE SCORES" blocks, a MALE / FEMALE / TOTAL header row, and the MPS values under the three `MPS` cells (columns I, M, Q). A blank result there is an empty string, which the page treats as "not entered yet". The reader only looks at the header area of the DATA SHEET, never at the learner list below it.


## Results page switch

`../results.html` shows every teacher's name and MPS to anyone with the site link. It calls `smea2_public_board`, which returns nothing until the coordinator turns it on (Coordinator access, Settings, Results and Charts page). It returns names, sections and MPS only: no remarks, competencies or PINs. The switch is stored as `public_board` in `smea_settings` and set through `smea2_admin_set`. Each chart can be saved as a PNG or copied; "Save all 5 charts" downloads one PNG per assessment (WW, PT, ST 1, ST 2, TE) for the chosen learning area.
