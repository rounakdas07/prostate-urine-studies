import {MAX_SELECTED,FIELDS,filterStudies,cleanSelection,comparisonRows,comparisonNotes,toCSV,toRIS,toBrief,parseURL,shareURL} from './core.js';
const $=id=>document.getElementById(id);
const escape=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let catalogue,studies=[],state={query:'',method:'',controls:'',validation:'',sort:'newest',preset:'',selected:[],view:'studies'},visible=[],toastTimer,dialogId,notes='';
const STORE='urine-evidence-v1';
function toast(message){$('toast').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').textContent='',4500);}
function save(){try{localStorage.setItem(STORE,JSON.stringify({selected:state.selected,notes}));$('storage-status').textContent='Saved in this browser.';}catch{$('storage-status').textContent='Browser storage unavailable. Download your brief before closing this page.';}}
function urlUpdate(){history.replaceState(null,'',shareURL(location.href,state));}
function pick(id){const fromCheckbox=document.activeElement?.matches('input[data-pick]');if(state.selected.includes(id))state.selected=state.selected.filter(x=>x!==id);else if(state.selected.length<MAX_SELECTED)state.selected.push(id);else{toast('Choose up to 4 studies. Remove one to add another.');renderList();if(fromCheckbox)document.querySelector(`input[data-pick="${id}"]`)?.focus({preventScroll:true});return;}save();render();if($('study-dialog').open)renderDialog(dialogId);if(fromCheckbox)document.querySelector(`input[data-pick="${id}"]`)?.focus({preventScroll:true});}
function changeView(view){state.view=view;render();$('workspace').focus({preventScroll:true});window.scrollTo({top:$('workspace').getBoundingClientRect().top+scrollY-80,behavior:'smooth'});}
function example(){state.selected=['taverna-2022','filianoti-2022','heers-2024'].filter(id=>studies.some(s=>s.id===id));state.view='compare';save();render();$('workspace').focus({preventScroll:true});window.scrollTo({top:$('workspace').getBoundingClientRect().top+scrollY-80,behavior:'smooth'});}
function selectedStudies(){return state.selected.map(id=>studies.find(s=>s.id===id)).filter(Boolean);}
function selectOptions(id,values){$(id).insertAdjacentHTML('beforeend',[...new Set(values)].sort().map(v=>`<option value="${escape(v)}">${escape(v)}</option>`).join(''));}
function syncInputs(){for(const [id,key]of[['search','query'],['method','method'],['controls','controls'],['validation','validation'],['sort','sort']]){$(id).value=state[key];if($(id).tagName==='SELECT'&&$(id).value!==state[key])state[key]='';}}
function resetFilters(){Object.assign(state,{query:'',method:'',controls:'',validation:'',preset:''});syncInputs();render();}
function renderList(){
  visible=filterStudies(studies,state);
  $('result-count').textContent=`${visible.length} of ${studies.length} studies`;
  $('export-results').disabled=!visible.length;
  $('empty').hidden=!!visible.length;
  document.querySelector('.table-wrap').hidden=!visible.length;
  $('study-rows').innerHTML=visible.map(s=>{const selected=state.selected.includes(s.id);return `<tr class="${selected?'selected':''}"><td><label class="study-pick"><input type="checkbox" data-pick="${s.id}" aria-label="Select ${escape(s.author)} ${s.year}" ${selected?'checked':''}></label></td><td><button class="study-link" data-open="${s.id}">${escape(s.author)} ${s.year}</button><span class="study-title">${escape(s.title)}</span></td><td data-label="Participants"><span class="cell-main">${s.total??'—'} people${s.id==='aggio-2016'?' overall':''}</span><span class="cell-sub">${escape(s.populationShort)}</span></td><td data-label="Test"><span class="cell-main">${escape(s.methods.join(' + '))}</span><span class="cell-sub">${escape(s.deviceShort)}</span></td><td data-label="Sample"><span class="cell-main">${escape(s.collectionShort)}</span><span class="cell-sub">${escape(s.storageShort)}</span></td><td data-label="Evaluation"><span class="cell-main">${escape(s.validationType)}</span><span class="cell-sub">${escape(s.validationShort)}</span></td><td><a class="source-link" href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">Read paper</a><span class="source-basis">${escape(s.coverageShort)}</span></td></tr>`;}).join('');
  const selection=selectedStudies();
  $('selection-bar').hidden=!selection.length;
  $('selection-summary').textContent=`${selection.length} selected${selection.length?' · '+selection.map(s=>s.author).join(', '):''}`;
  $('compare-now').textContent=`Compare ${selection.length} ${selection.length===1?'study':'studies'}`;
  document.querySelectorAll('[data-preset]').forEach(button=>button.setAttribute('aria-pressed',String(state.preset===button.dataset.preset)));
}
function renderComparison(){
  const selected=selectedStudies();
  $('compare-empty').hidden=!!selected.length;
  $('comparison-content').hidden=!selected.length;
  if(!selected.length)return;
  const rows=comparisonRows(selected,$('differences-only').checked);
  $('comparison-table').innerHTML=`<table class="comparison-table" style="--study-count:${selected.length};width:${170+selected.length*265}px;min-width:100%"><caption class="sr-only">Comparison of ${selected.map(s=>`${s.author} ${s.year}`).join(', ')}</caption><thead><tr><th scope="col">Method / evidence</th>${selected.map(s=>`<th scope="col" class="study-column">${escape(s.author)} ${s.year}<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">Read original paper</a><button class="remove-study" data-pick="${s.id}" aria-label="Remove ${escape(s.author)} ${s.year}">Remove from comparison</button></th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr class="${row.different?'row-different':''}"><th scope="row">${row.label}</th>${row.values.map(v=>`<td>${escape(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>${rows.length?'':'<p class="table-help">No differing rows. Add another study to compare methods.</p>'}`;
  $('comparison-checks').innerHTML=comparisonNotes(selected).map(text=>`<li>${escape(text)}</li>`).join('');
  $('print-sources')?.remove();
  const print=document.createElement('div');print.id='print-sources';print.hidden=true;
  print.innerHTML=`${notes.trim()?`<h3>Your notes</h3><p class="print-notes">${escape(notes)}</p>`:''}<h3>Sources · reviewed 21 November 2026</h3><ol>${selected.map(s=>`<li>${escape(s.author)} (${s.year}). ${escape(s.title)}. ${escape(s.url)}<br>Extraction: ${escape(s.coverage)}. ${escape(s.locators.join('; '))}</li>`).join('')}</ol><p>Research planning only. Curated collection, not a systematic review. Not extracted means unverified here, not necessarily unreported. Built by Rounak Das.</p>`;
  $('comparison-content').append(print);
}
function render(){
  $('studies-view').hidden=state.view!=='studies';$('compare-view').hidden=state.view!=='compare';
  $('studies-tab').toggleAttribute('aria-current',state.view==='studies');$('compare-tab').toggleAttribute('aria-current',state.view==='compare');
  if(state.view==='studies')$('studies-tab').setAttribute('aria-current','page');else $('compare-tab').setAttribute('aria-current','page');
  $('total-count').textContent=studies.length;$('selected-count').textContent=state.selected.length;
  renderList();renderComparison();urlUpdate();
}
function renderDialog(id){
  const s=studies.find(s=>s.id===id);if(!s)return;dialogId=id;
  $('dialog-citation').textContent=`${s.author} ${s.year}`;
  $('dialog-body').innerHTML=`<h2 id="dialog-title">${escape(s.title)}</h2><div class="detail-meta"><span>${escape(s.coverage)}</span><span>DOI: ${escape(s.doi)}</span></div><dl class="detail-fields">${FIELDS.map(([key,label,get])=>`<div><dt>${label}</dt><dd>${escape(get(s))}</dd></div>`).join('')}</dl><section class="source-register"><h3>Where to verify these fields</h3><ul>${s.locators.map(l=>`<li>${escape(l)}</li>`).join('')}</ul><p>Reviewed 21 November 2026. Not extracted means not verified in this tool.</p></section><div class="detail-actions"><button class="primary" data-pick="${s.id}">${state.selected.includes(s.id)?'Remove from comparison':'Add to comparison'}</button><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">Read primary source</a><a href="https://doi.org/${escape(s.doi)}" target="_blank" rel="noopener noreferrer">DOI link</a></div>`;
}
function openStudy(id){renderDialog(id);$('study-dialog').showModal();}
function download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);toast(`Downloaded ${name}`);}
function setup(){
  $('filters-toggle').onclick=()=>{const open=document.querySelector('.filters').classList.toggle('filters-open');$('filters-toggle').setAttribute('aria-expanded',String(open));$('filters-toggle').textContent=open?'Hide filters':'More filters';};
  for(const [id,key]of[['search','query'],['method','method'],['controls','controls'],['validation','validation'],['sort','sort']])$(id).addEventListener(id==='search'?'input':'change',()=>{state[key]=$(id).value;if(id!=='sort'&&id!=='search'){state.preset='';}render();});
  document.addEventListener('click',e=>{const pickButton=e.target.closest('button[data-pick]');if(pickButton){pick(pickButton.dataset.pick);return;}const open=e.target.closest('[data-open]');if(open){openStudy(open.dataset.open);return;}const preset=e.target.closest('[data-preset]');if(preset){resetFilters();state.preset=preset.dataset.preset;if(state.preset==='electronic')state.method='Electronic nose';syncInputs();render();}});
  $('study-rows').addEventListener('change',e=>{if(e.target.matches('input[data-pick]'))pick(e.target.dataset.pick);});
  $('reset').onclick=resetFilters;$('empty-reset').onclick=resetFilters;
  $('studies-tab').onclick=()=>changeView('studies');$('compare-tab').onclick=()=>changeView('compare');$('compare-now').onclick=()=>changeView('compare');$('back-studies').onclick=()=>changeView('studies');
  $('example').onclick=example;$('example-empty').onclick=example;
  $('clear-selection').onclick=()=>{state.selected=[];save();render();};
  $('differences-only').onchange=renderComparison;
  $('close-dialog').onclick=()=>$('study-dialog').close();
  $('study-dialog').addEventListener('click',e=>{if(e.target===$('study-dialog')){const b=$('study-dialog').getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)$('study-dialog').close();}});
  $('notes').addEventListener('input',()=>{notes=$('notes').value;save();});
  $('export-results').onclick=()=>download(toCSV(visible),'prostate-urine-studies.csv','text/csv;charset=utf-8');
  $('export-comparison').onclick=()=>download(toCSV(selectedStudies(),notes),'urine-study-comparison.csv','text/csv;charset=utf-8');
  $('export-brief').onclick=()=>download(toBrief(selectedStudies(),notes),'urine-evidence-brief.md','text/markdown;charset=utf-8');
  $('export-ris').onclick=()=>download(toRIS(selectedStudies()),'urine-study-citations.ris','application/x-research-info-systems;charset=utf-8');
  $('copy-link').onclick=async()=>{const link=shareURL(location.href,state);try{await navigator.clipboard.writeText(link);toast('Comparison link copied. Your notes are not included.');}catch{renderCopyFallback(link);}};
  $('print-brief').onclick=()=>{renderComparison();window.print();};
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!/input|textarea|select/i.test(document.activeElement.tagName)&&!$('study-dialog').open){e.preventDefault();state.view='studies';render();$('search').focus();}});
  window.addEventListener('popstate',()=>{state={...state,...parseURL(location.search,studies)};syncInputs();render();});
}
function renderCopyFallback(link){$('dialog-citation').textContent='Share this comparison';$('dialog-body').innerHTML=`<h2 id="dialog-title">Copy the link below</h2><p>Your notes are not included.</p><textarea id="share-fallback" rows="4" readonly aria-label="Comparison link">${escape(link)}</textarea>`;$('study-dialog').showModal();$('share-fallback').select();}
async function load(){
  $('load-error').hidden=true;
  try{const response=await fetch('./data.json');if(!response.ok)throw new Error('Dataset unavailable');catalogue=await response.json();if(!Array.isArray(catalogue.studies)||!catalogue.studies.length)throw new Error('Invalid dataset');studies=catalogue.studies;
    try{const saved=JSON.parse(localStorage.getItem(STORE)||'{}');state.selected=cleanSelection(saved.selected,studies);notes=typeof saved.notes==='string'?saved.notes.slice(0,6000):'';}catch{$('storage-status').textContent='Browser storage unavailable. Export your work before closing.';}
    const parsed=parseURL(location.search,studies);state={...state,...parsed,selected:new URLSearchParams(location.search).has('studies')?parsed.selected:state.selected};
    selectOptions('method',studies.flatMap(s=>s.methods));selectOptions('controls',studies.map(s=>s.controlType));selectOptions('validation',studies.map(s=>s.validationType));
    $('notes').value=notes;syncInputs();setup();$('example').disabled=false;$('catalogue-date').textContent='Source records reviewed 21 Nov 2026';render();
  }catch(error){$('load-error').hidden=false;$('result-count').textContent='Study records unavailable.';$('catalogue-date').textContent='';console.error('Study load failed:',error.message);}
}
$('retry').onclick=load;
load();
