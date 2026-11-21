export const MAX_SELECTED = 4;
export const UNKNOWN = 'Not extracted';
export const FIELDS = [
  ['participants','Participants', s => s.population],
  ['controls','Comparison group', s => s.controls],
  ['device','Test & device', s => s.device],
  ['collection','Collection', s => s.collection],
  ['storage','Storage', s => s.storage],
  ['preparation','Sample preparation', s => s.preparation],
  ['validationType','Evaluation design', s => s.validationType],
  ['validation','Validation details', s => s.validation],
  ['reference','Reference standard', s => s.reference],
  ['finding','Useful finding', s => s.finding],
  ['caveat','Interpretation limit', s => s.caveat],
  ['coverage','Extraction coverage', s => s.coverage]
];
const fold = value => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function filterStudies(studies, {query='',method='',controls='',validation='',sort='newest',preset=''}={}) {
  const terms=fold(query).trim().split(/\s+/).filter(Boolean);
  const result=studies.filter(s => (!method || s.methods.includes(method)) && (!controls || s.controlType===controls) && (!validation || s.validationType===validation)
    && (!preset || preset!=='clinical' || s.clinicalControls)
    && (!preset || preset!=='heldout' || s.heldout)
    && terms.every(t=>fold([s.author,s.title,s.year,s.doi,...s.methods,...FIELDS.map(f=>f[2](s)),...(s.keywords||[])].join(' ')).includes(t)));
  return result.sort((a,b)=>sort==='oldest'?a.year-b.year||a.author.localeCompare(b.author):sort==='participants'?(b.total??-1)-(a.total??-1)||b.year-a.year:sort==='author'?a.author.localeCompare(b.author)||b.year-a.year:b.year-a.year||a.author.localeCompare(b.author));
}
export function cleanSelection(ids,studies) {
  const known = new Set(studies.map(s=>s.id));
  return [...new Set(Array.isArray(ids)?ids:[])].filter(id=>known.has(id)).slice(0,MAX_SELECTED);
}
export function comparisonRows(studies,differencesOnly=false) {
  return FIELDS.map(([key,label,get])=>({key,label,values:studies.map(get),different:new Set(studies.map(get)).size>1})).filter(row=>!differencesOnly || row.different);
}
export function comparisonNotes(studies) {
  if(!studies.length) return [];
  const notes=[];
  const groups=[...new Set(studies.map(s=>s.controlType))];
  const evaluation=[...new Set(studies.map(s=>s.validationType))];
  if(groups.length>1) notes.push(`The comparison groups differ (${groups.join('; ')}). Check that each matches the population you want to study.`);
  if(evaluation.length>1) notes.push(`Evaluation designs differ (${evaluation.join('; ')}). Read the split and recruitment details before comparing results.`);
  if(studies.some(s=>s.validationType==='Same-cohort holdout')) notes.push('A same-cohort holdout tests a split of one recruited population. It does not establish performance in a newly recruited population.');
  if(studies.some(s=>s.id==='roine-2014')) notes.push('Roine has 65 people and 74 specimens, including repeat BPH specimens. Verify how repeat specimens were handled in the validation folds.');
  if(studies.some(s=>s.id==='aggio-2016')) notes.push('Aggio includes 155 people overall; 131 belong to the prostate-cancer versus non-cancer comparison.');
  if(studies.some(s=>s.id==='piyarom-2026')) notes.push('Piyarom combines normal and BPH controls, with marked age differences. Its reported combined model also includes PSA.');
  const immediate=studies.some(s=>s.storageClass==='Fresh');
  const frozen=studies.some(s=>s.storageClass==='Frozen');
  if(immediate&&frozen) notes.push('Both fresh and frozen-sample workflows are selected. Collection-to-analysis timing is a separate protocol decision, not an interchangeable detail.');
  const incomplete=studies.filter(s=>[s.collection,s.storage,s.preparation,s.reference].some(x=>!x||/not extracted/i.test(x)));
  if(incomplete.length) notes.push(`Extraction gaps remain for ${incomplete.map(s=>`${s.author} ${s.year}`).join(', ')}. Use the source links to complete those fields; a gap here is not proof of missing reporting.`);
  if(studies.length>1) notes.push('Do not add participant counts across these papers: overlap between cohorts has not been established.');
  return notes;
}
function cell(value) {
  let str=String(value??'');
  if(/^[\s]*[=+@-]/.test(str)||/^[\t\r]/.test(str)) str="'"+str;
  return '"'+str.replaceAll('"','""')+'"';
}
export function toCSV(studies,notes='') {
  const header=['Study','Title','Year','DOI','Participants (whole study)',...FIELDS.map(f=>f[1]),'Primary source','Source locations','Reviewed','Your notes'];
  const rows=studies.map(s=>[`${s.author} ${s.year}`,s.title,s.year,s.doi,s.total,...FIELDS.map(f=>f[2](s)),s.url,s.locators.join(' | '),'2026-11-21',notes]);
  return '\uFEFF'+[header,...rows].map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
export function toRIS(studies) {
  const line = value=>String(value??'').replace(/[\r\n]+/g,' ');
  return studies.map(s=>['TY  - JOUR',`TI  - ${line(s.title)}`,`AU  - ${line(s.author)}`,`PY  - ${s.year}`,`DO  - ${line(s.doi)}`,`UR  - ${line(s.url)}`,'N1  - Discovery citation: first author only. Resolve DOI to import complete author and journal metadata.','ER  - '].join('\r\n')).join('\r\n\r\n')+'\r\n';
}
const md = value=>String(value??'').replaceAll('|','\\|').replace(/\r?\n/g,' ');
export function toBrief(studies,notes='',date='2026-11-21') {
  const parts=['# Prostate urine studies — evidence comparison',`Prepared ${date} · Curated source records reviewed 2026-11-21.`,`Independent research tool by Rounak Das: https://rounakdas07.github.io/prostate-urine-studies/`,
    'For literature review and research planning. This is not a diagnostic tool, a validated sampling protocol, or a systematic review. Not extracted means unverified in this tool; it does not mean not reported.',
    '## Side-by-side methods',`| Field | ${studies.map(s=>md(`${s.author} ${s.year}`)).join(' | ')} |`,`| --- | ${studies.map(()=>'---').join(' | ')} |`,
    ...comparisonRows(studies).map(row=>`| ${row.label} | ${row.values.map(md).join(' | ')} |`),
    '\n## What to keep in mind',...comparisonNotes(studies).map(n=>`- ${n}`)];
  if(notes.trim()) parts.push('\n## Your notes',notes.trim());
  parts.push('\n## Sources and extraction locations');
  studies.forEach((s,i)=>parts.push(`\n${i+1}. **${s.author} (${s.year}). ${s.title}.** DOI: https://doi.org/${s.doi}`,`Primary source: ${s.url}`,`Coverage: ${s.coverage}`,`Locations: ${s.locators.join('; ')}`));
  parts.push('\nParticipant counts must not be summed as unique people across papers. Cross-study performance pooling and quality scoring were not performed.');
  return parts.join('\n\n')+'\n';
}
export function parseURL(search,studies) {
  const p=new URLSearchParams(search);
  const value=k=>(p.get(k)||'').slice(0,250);
  return {query:value('q'),method:value('method'),controls:value('controls'),validation:value('validation'),sort:['newest','oldest','participants','author'].includes(value('sort'))?value('sort'):'newest',preset:['clinical','heldout','electronic'].includes(value('preset'))?value('preset'):'',selected:cleanSelection((p.get('studies')||'').split(','),studies),view:p.get('view')==='compare'?'compare':'studies'};
}
export function shareURL(base,state) {
  const url=new URL(base);url.search='';url.hash='';
  for(const [key,value] of [['q',state.query],['method',state.method],['controls',state.controls],['validation',state.validation],['preset',state.preset]]) if(value)url.searchParams.set(key,value);
  if(state.sort&&state.sort!=='newest')url.searchParams.set('sort',state.sort);
  if(state.selected?.length)url.searchParams.set('studies',state.selected.join(','));
  if(state.view==='compare')url.searchParams.set('view','compare');
  return url.toString();
}
