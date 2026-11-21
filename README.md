# Prostate urine studies

[Open the tool](https://rounakdas07.github.io/prostate-urine-studies/)

Compare the methods behind published urine-based prostate-cancer tests, then export a sourced evidence brief. Built by **Rounak Das**, a Nottingham medical student, as an independent prototype for Anemo Labs.

## Start in one click

Choose **Try a 3-study comparison** to see Taverna 2022, Filianoti 2022 and Heers 2024 side by side. Their workflows differ in collection, frozen versus immediate analysis, headspace preparation, control populations and evaluation design.

Alternatively, search the 12-paper collection, tick up to four studies and choose **Compare selected**. Filter by assay, comparison group or evaluation design. Quick filters surface electronic noses, biopsy/BPH controls and held-out testing.

## What you can take away

- A Markdown evidence brief containing the full comparison, interpretation prompts, private notes and linked references.
- An Excel-compatible UTF-8 CSV of filtered results or the selected comparison.
- A printable comparison with source references; use the browser's Save as PDF option.
- A RIS file with titles, DOIs, source URLs and first authors. These are discovery citations: resolve the DOI in your reference manager for complete author and journal metadata.
- A shareable link that opens the same selected studies. Notes are never put in the link.

## Evidence integrity

This is a curated starting collection of primary clinical and laboratory-methods studies, **not a systematic review, clinical diagnostic tool or validated sampling protocol**. Source records were reviewed on **21 November 2026**. Original papers remain authoritative. See [SOURCES.md](SOURCES.md) for coverage and source-section locators.

- Participant and specimen counts are distinct. Roine includes repeat BPH specimens; Aggio includes a separate bladder-cancer subgroup.
- A same-cohort holdout is distinguished from an additional test cohort and from cross-validation. Blinding by itself does not establish independent recruitment.
- Extraction gaps are labelled **Not extracted**, not “not reported”. Some records use primary abstracts or indexed methods sections rather than a complete paper.
- Protocol comparisons and validation labels are editorial extractions, not a formal quality score or risk-of-bias instrument.
- No diagnostic accuracy league table, pooled accuracy, inferred patient-level results or prediction of Anemo's performance is generated.
- Cohort overlap across papers is unresolved; the app does not sum participants across publications.
- Deterministic comparison notes flag differences in the curated fields; they do not recommend a trial design or replace reading the papers.

## Privacy and implementation

Buildless HTML, CSS and JavaScript with no external libraries, accounts, analytics, model, backend or API key. The app fetches its bundled `data.json` once. Searches, comparisons and exports run in the browser. Selections and optional notes are kept in localStorage. Storage failure leaves the current session usable and prompts exporting. There is no automatic literature refresh; the PubMed link opens a current search.

The public prototype contains no patient-level data. It has no affiliation with or endorsement from Anemo Labs. Article copyright and data rights remain with the original authors and publishers.

## Development and verification

```sh
npm test
npm run build
```

The build copies the app into `dist/`; no installation is required. Core checks cover combined filters, comparison semantics, participant/sample distinctions, selection limits, CSV safety and encoding, sourced export content, RIS, and URL privacy. Manual browser checks cover desktop and phone layouts, filters, selection, source details, comparison, exports and persisted notes.

Deploy the source app files to the repository's `urine/` directory. GitHub Pages serves that path. The `.openai/hosting.json` file is only local preview configuration and is not deployed to GitHub.
