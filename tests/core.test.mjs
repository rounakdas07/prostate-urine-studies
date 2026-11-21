import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FIELDS,filterStudies,cleanSelection,comparisonRows,comparisonNotes,toCSV,toRIS,toBrief,parseURL,shareURL} from '../core.js';
const data=JSON.parse(await readFile(new URL('../data.json',import.meta.url),'utf8'));
const studies=data.studies;
const get=id=>studies.find(s=>s.id===id);

test('each record has a unique DOI, primary HTTPS source and field-level source locations',()=>{
  assert.equal(studies.length,12);assert.equal(new Set(studies.map(s=>s.id)).size,studies.length);assert.equal(new Set(studies.map(s=>s.doi)).size,studies.length);
  for(const s of studies){assert.match(s.doi,/^10\.\d{4,9}\//);assert.equal(new URL(s.url).protocol,'https:');assert.ok(s.locators.length>=2);assert.ok(s.total>0);for(const f of FIELDS)assert.ok(f[2](s)?.length,`${s.id}: ${f[0]}`);}
});
test('participant totals and evaluation labels retain important source distinctions',()=>{
  assert.equal(get('roine-2014').total,65);assert.match(get('roine-2014').population,/74 specimens/);
  assert.equal(get('aggio-2016').total,155);assert.match(get('aggio-2016').population,/131/);
  assert.equal(get('lima-2019').validationType,'Same-cohort holdout');assert.match(get('lima-2019').validation,/not a separately recruited/);
  assert.equal(get('piyarom-2026').validationType,'Model development');assert.equal(get('piyarom-2026').heldout,false);
});
test('combined query, assay and control filters narrow the same collection',()=>{
  assert.deepEqual(filterStudies(studies,{query:'37',method:'Electronic nose',controls:'Healthy controls'}).map(s=>s.id).sort(),['filianoti-2022','heers-2024']);
  assert.equal(filterStudies(studies,{query:'10.1002/pros.24692'})[0].id,'heers-2024');
  assert.equal(filterStudies(studies,{query:'no-such-study'}).length,0);
  assert.ok(filterStudies(studies,{preset:'clinical'}).every(s=>s.clinicalControls));
  assert.ok(filterStudies(studies,{preset:'heldout'}).every(s=>s.heldout));
});
test('selection sanitises unknown, duplicate and excess IDs without changing known order',()=>{
  const ids=studies.map(s=>s.id);assert.deepEqual(cleanSelection(['missing',ids[0],ids[0],...ids.slice(1)],studies),ids.slice(0,4));assert.deepEqual(cleanSelection(null,studies),[]);
});
test('comparison removes equal fields and surfaces extraction-specific interpretation notes',()=>{
  assert.equal(comparisonRows([get('heers-2024')],true).length,0);
  const pair=[get('heers-2024'),get('filianoti-2022')];
  assert.ok(comparisonRows(pair,true).some(r=>r.key==='storage'));assert.ok(!comparisonRows(pair,true).some(r=>r.key==='validationType'));
  assert.match(comparisonNotes(pair).join(' '),/fresh and frozen/);
  assert.match(comparisonNotes([get('lima-2019')]).join(' '),/same-cohort holdout/);
});
test('CSV contains UTF-8 marker, quotes multiline notes and neutralises formula-like notes',()=>{
  const csv=toCSV([get('heers-2024')],'=HYPERLINK("bad")');assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  const multiline=toCSV([get('heers-2024')],'line 1\nline 2, "quoted"');assert.ok(multiline.includes('"line 1\nline 2, ""quoted"""'));assert.ok(multiline.includes('https://onlinelibrary.wiley.com'));
});
test('brief exports complete comparison, private notes and original source locations',()=>{
  const brief=toBrief([get('heers-2024'),get('lima-2019')],'Check timing');assert.match(brief,/Check timing/);assert.match(brief,/Same-cohort holdout/);assert.match(brief,/10.1002\/pros.24692/);assert.match(brief,/Sources and extraction locations/);assert.match(brief,/not a diagnostic tool/);
});
test('shareable URLs restore selected studies and filters but never notes',()=>{
  const state={query:'midstream',method:'Electronic nose',selected:['heers-2024','filianoti-2022'],view:'compare',notes:'SECRET_NOTE'};
  const url=shareURL('https://example.org/urine/?notes=PRIVATE#hash',state);assert.ok(!url.includes('SECRET_NOTE'));assert.ok(!url.includes('PRIVATE'));assert.ok(!url.includes('notes'));
  const parsed=parseURL(new URL(url).search,studies);assert.equal(parsed.query,'midstream');assert.equal(parsed.method,'Electronic nose');assert.deepEqual(parsed.selected,state.selected);assert.equal(parsed.view,'compare');
});
test('RIS exports safe DOI-based discovery citations',()=>{
  const ris=toRIS([get('heers-2024')]);assert.match(ris,/TY  - JOUR/);assert.match(ris,/DO  - 10.1002\/pros.24692/);assert.match(ris,/first author only/);assert.match(ris,/ER  - /);
});
