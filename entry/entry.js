
// ---- configuration: Supabase project (publishable key is safe in the browser) ----
const SB_URL = "https://aymubssotxkexsmatbjv.supabase.co";
const SB_KEY = "sb_publishable_jDQXZsbtASk9QhaP-374JQ_OC7RWIbz";

const $ = (id) => document.getElementById(id);
const FIELDS = [["ww","WW"],["pt","PT"],["st1","ST 1"],["st2","ST 2"],["te","TE"]];
const ERR = {
  network:"Cannot reach the server.",
  invalid_credentials:"Teacher ID or PIN is not correct.",
  locked:"Too many wrong attempts. Wait 15 minutes, or ask the coordinator to reset the PIN.",
  period_closed:"This reporting period is closed. Entries can no longer be changed.",
  no_period:"Choose a reporting period first.",
  bad_new_pin:"The new PIN must be 4 to 8 digits.",
  already_exists:"That already exists.",
  invalid_data:"Some values are not valid. Scores must be between 0 and 100.",
  not_found:"Not found."
};

async function rpc(fn, args){
  let res;
  try{
    res = await fetch(SB_URL + "/rest/v1/rpc/" + fn, {
      method:"POST",
      headers:{"apikey":SB_KEY,"Authorization":"Bearer " + SB_KEY,"Content-Type":"application/json"},
      body:JSON.stringify(args||{})
    });
  }catch(e){ return {ok:false,error:"network"}; }
  if(!res.ok) return {ok:false,error:"server"};
  return res.json();
}
function errText(r){
  if(r.error==="network") return "Cannot reach the server. Check your internet connection and try again.";
  if(r.error==="server") return "The server had a problem. Try again in a moment.";
  let t = ERR[r.error] || "Something went wrong.";
  if(r.detail && r.error==="invalid_data") t += " (" + r.detail.replace(/^.*violates check constraint.*$/,"a score is outside 0 to 100") + ")";
  return t;
}
function show(el,on){ $(el).classList.toggle("hidden",!on); }
function msg(id,text,kind){ $(id).innerHTML=""; if(!text) return; const d=document.createElement("div"); d.className="msg "+(kind||"err"); d.textContent=text; $(id).appendChild(d); }
function el(tag,attrs,...kids){
  const e=document.createElement(tag);
  for(const [k,v] of Object.entries(attrs||{})){
    if(k==="class") e.className=v; else if(k==="text") e.textContent=v;
    else if(k.startsWith("on")) e.addEventListener(k.slice(2),v);
    else if(v===true) e.setAttribute(k,""); else if(v!==false&&v!=null) e.setAttribute(k,v);
  }
  for(const k of kids) if(k!=null) e.append(k.nodeType?k:document.createTextNode(k));
  return e;
}
const fmt = (n) => (n==null||isNaN(n)) ? "–" : Number(n).toFixed(2);
function parseScore(v){
  const s=String(v??"").trim().replace(",",".");
  if(s==="") return {empty:true};
  if(!/^\d{1,3}(\.\d{1,2})?$/.test(s)) return {bad:true};
  const n=Number(s); return (n<0||n>100)?{bad:true}:{value:n};
}


// ---------------- division (SAPM) format constants ----------------
const SCHOOL = {id:"120006", name:"Subangdaku Elementary School", district:"South District", level:"Elementary"};
const ASSESS = [["ww","Written Works MPS"],["pt","Performance Tasks MPS"],["st1","Summative Test 1 MPS"],["st2","Summative Test 2 MPS"],["te","Term Examination MPS"]];
const LLC_SECT = [["st1","Summative Test 1"],["st2","Summative Test 2"],["te","Term Exam"]];
const INTERVENTIONS = ["Reteaching/reteaching cycle","Targeted remediation","Small-group instruction","Differentiated learning activities","Peer tutoring","LAC-based intervention","Teacher coaching/mentoring","Development/utilization of supplementary learning resources","Explicit instruction on prerequisite skills","Practice and retrieval activities","Assessment item analysis","Revision of teaching strategies","Learning recovery/enrichment activity","Parent/guardian engagement","Tutorial sessions","Technology-assisted intervention","Reassessment/exit assessment"];
const STATUSES = ["To be implemented","Ongoing","Completed"];
const OTHER = "__other__";
const SAPM_COLS = ["submitted_at","record_type","schoolId","school","district","level","gradeLevel","sectionName","learningArea","term","subjectTeacher","schoolHead","reportDate","assessment","male_mps","female_mps","average_mps","competency_section","rank","competency","intervention","timeline","status"];

const num = (v) => { const p=parseScore(v); return p.value!=null ? p.value : null; };
function avgMF(m,f){ const a=num(m), b=num(f); if(a!=null&&b!=null) return (a+b)/2; return a!=null?a:(b!=null?b:null); }
function termAvg(r){ const v=ASSESS.map(([k])=>avgMF(r[k+"_m"],r[k+"_f"])); return v.some(x=>x==null)?null:v.reduce((x,y)=>x+y,0)/5; }
function tagOther(val,list){ const t=String(val||"").trim(); if(!t) return ""; return list.includes(t)?t:"Other: "+t; }
function blankLlc(){ return {st1:[0,1,2].map(blankRow),st2:[0,1,2].map(blankRow),te:[0,1,2].map(blankRow)}; }
function blankRow(){ return {competency:"",intervention:"",timeline:"",status:"",_o:{}}; }
function blankReport(area,section){ const r={area,section:section||"",remarks:"",llc:blankLlc()}; ASSESS.forEach(([k])=>{r[k+"_m"]="";r[k+"_f"]="";}); return r; }
function hasData(r){ return ASSESS.some(([k])=>String(r[k+"_m"]).trim()!==""||String(r[k+"_f"]).trim()!=="") || String(r.remarks).trim()!=="" || LLC_SECT.some(([s])=>r.llc[s].some(x=>x.competency.trim()||x.intervention.trim()||x.timeline.trim()||x.status.trim())); }
function remember(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function recall(k){ try{ return localStorage.getItem(k)||""; }catch(e){ return ""; } }

// ---------------- state ----------------
const S = {code:"",me:null,pin:null,areas:[],periods:[],cfg:{},period:null,reports:[],active:null,sel:{},llcTab:"st1",dirty:false,comps:null};
const curPeriod = () => S.periods.find(p=>p.id===S.period);
const isClosed = () => { const p=curPeriod(); return !!p && !p.is_open; };

// ---------------- login ----------------
$("loginForm").addEventListener("submit",async(e)=>{
  e.preventDefault(); msg("lgMsg","");
  const code=$("lgCode").value.trim(), pin=$("lgPin").value.trim();
  $("lgBtn").disabled=true; $("lgBtn").textContent="Signing in…";
  const r=await rpc("smea2_login",{p_code:code,p_pin:pin});
  $("lgBtn").disabled=false; $("lgBtn").textContent="Sign in";
  if(!r.ok){ msg("lgMsg",errText(r)); $("lgPin").select(); return; }
  S.me=r.teacher; S.code=code.toUpperCase(); S.pin=pin; S.areas=r.areas; S.periods=r.periods; S.cfg=r.cfg||{};
  $("lgPin").value="";
  try{ S.comps=await (await fetch("competencies.json")).json(); }catch(e){ S.comps={}; }
  startEntry();
});

function startEntry(){
  show("login",false); show("entry",true); show("who",true); show("savebar",true);
  $("whoName").textContent=S.me.name;
  $("gradeLbl").textContent="Grade "+S.me.grade;
  $("period").innerHTML="";
  S.periods.forEach(p=>$("period").append(el("option",{value:p.id,text:p.label+(p.is_open?"":" (closed)")})));
  const open=S.periods.find(p=>p.is_open)||S.periods[0];
  S.period=open?.id; $("period").value=S.period;
  S.active=S.areas[0];
  fillEcrAreas();
  loadPeriod();
}
$("period").addEventListener("change",()=>{
  if(S.dirty){ $("period").value=S.period; $("status").textContent="Save your changes before switching period."; $("status").className="status dirty"; return; }
  S.period=$("period").value; loadPeriod();
});
async function loadPeriod(){
  $("areaPanel").classList.add("spin");
  const r=await rpc("smea2_load",{p_id:S.me.id,p_pin:S.pin,p_period:S.period});
  $("areaPanel").classList.remove("spin");
  if(!r.ok){ msg("closedMsg",errText(r)); return; }
  S.reports=r.reports.map(x=>{
    const rep=blankReport(x.area,x.section); rep.remarks=x.remarks||"";
    ASSESS.forEach(([k])=>{ rep[k+"_m"]=x[k+"_m"]??""; rep[k+"_f"]=x[k+"_f"]??""; });
    (x.llc||[]).forEach(l=>{ const row=rep.llc[l.assess]?.[l.rank-1]; if(row){ row.competency=l.competency||""; row.intervention=l.intervention||""; row.timeline=l.timeline||""; row.status=l.status||""; } });
    return rep;
  });
  S.areas.forEach(a=>{ if(!S.reports.some(x=>x.area===a)) S.reports.push(blankReport(a,recall("smea_section"))); });
  S.sel={}; S.dirty=false;
  const p=curPeriod();
  $("ecrTerm").value="TERM "+(p?.term||1);
  msg("closedMsg", p&&!p.is_open ? "This term is closed. You can view your entries but not change them." : "", "warn");
  renderTabs(); renderArea();
  updateBar(r.reports.length? "Entries loaded" : "No entries saved yet");
}
const areaReports = (a) => S.reports.filter(x=>x.area===a);
const selReport = (a) => { const l=areaReports(a); return l[Math.min(S.sel[a]||0,l.length-1)]; };
function areaDone(a){ return areaReports(a).some(r=>ASSESS.every(([k])=>String(r[k+"_m"]).trim()!==""||String(r[k+"_f"]).trim()!=="")); }
function renderTabs(){
  $("tabs").innerHTML="";
  S.areas.forEach(a=>{
    $("tabs").append(el("button",{class:"tab",role:"tab",type:"button","aria-selected":String(a===S.active),onclick:()=>{S.active=a;renderTabs();renderArea();}},a,el("span",{class:"dot"+(areaDone(a)?" done":"")})));
  });
}
function renderTabsDots(){ document.querySelectorAll(".tab").forEach((t,i)=>{ const d=t.querySelector(".dot"); if(d) d.className="dot"+(areaDone(S.areas[i])?" done":""); }); }

function optionsFor(area){
  const p=curPeriod(); const list=(S.comps||{})[S.me.grade+"|"+area+"|"+(p?.term||1)]||[];
  const groups=new Map(); list.forEach(([d,c])=>{ const k=d||"Competencies"; if(!groups.has(k)) groups.set(k,[]); groups.get(k).push(c); });
  return {list:list.map(x=>x[1]),groups};
}
function pickBox(value,flag,items,groups,placeholder,disabled,onchange){
  // a select with an "Other" choice; when Other is chosen a text box appears
  const known = items.includes(value);
  const isOther = flag!==undefined ? flag : (value!=="" && !known);
  const sel=el("select",{disabled,"aria-label":placeholder});
  sel.append(el("option",{value:"",text:placeholder}));
  if(groups){ groups.forEach((cs,g)=>{ const og=el("optgroup",{label:g}); cs.forEach(c=>og.append(el("option",{value:c,text:c.length>110?c.slice(0,107)+"…":c,title:c}))); sel.append(og); }); }
  else items.forEach(c=>sel.append(el("option",{value:c,text:c})));
  sel.append(el("option",{value:OTHER,text:"Other"}));
  sel.value = isOther ? OTHER : (known?value:"");
  const wrap=el("div",{},sel);
  const txt=el("input",{type:"text",class:"oth",maxlength:"300",placeholder:"Type it here",value:isOther?value:"",disabled,"aria-label":placeholder+" (other)"});
  if(!isOther) txt.classList.add("hidden");
  sel.onchange=()=>{ if(sel.value===OTHER){ txt.classList.remove("hidden"); txt.focus(); onchange("",true); } else { txt.classList.add("hidden"); txt.value=""; onchange(sel.value,false); } };
  txt.oninput=()=>onchange(txt.value,true);
  wrap.append(txt); return wrap;
}

function renderArea(){
  const a=S.active, ro=isClosed(), p=$("areaPanel"); p.innerHTML="";
  if($("ecrArea").options.length) $("ecrArea").value=a;
  const list=areaReports(a); const rep=selReport(a);
  // section chips
  const chips=el("div",{class:"chips"});
  list.forEach((r,i)=>chips.append(el("button",{class:"chip",type:"button","aria-pressed":String(r===rep),text:r.section?("Section "+r.section):"New section",onclick:()=>{S.sel[a]=i;renderArea();}})));
  if(!ro) chips.append(el("button",{class:"chip",type:"button",text:"+ Add another section",onclick:()=>{ S.reports.push(blankReport(a,"")); S.sel[a]=areaReports(a).length-1; markDirty(); renderArea(); }}));
  const card=el("div",{class:"card"});
  card.append(el("h2",{text:a+" · A. Mean Percentage Scores"}),chips);
  const sec=el("input",{type:"text",id:"f_section",maxlength:"40",value:rep.section,placeholder:"e.g. Cucumber",disabled:ro,"aria-label":"Section name"});
  sec.oninput=()=>{ rep.section=sec.value; remember("smea_section",sec.value.trim()); markDirty(); const c=chips.querySelectorAll(".chip")[list.indexOf(rep)]; if(c) c.textContent=rep.section?("Section "+rep.section):"New section"; };
  card.append(el("div",{style:"max-width:320px;margin-bottom:12px"},el("label",{for:"f_section",text:"Section"}),sec));
  card.append(el("p",{class:"hint",text:"Enter male and female MPS values from 0 to 100. The average is calculated automatically. You may enter just one if the section has only boys or only girls."}));
  const tbl=el("table",{class:"mps"}); tbl.append(el("thead",{},el("tr",{},el("th",{text:"Assessment"}),el("th",{text:"Male MPS"}),el("th",{text:"Female MPS"}),el("th",{class:"n",text:"Average MPS"}))));
  const tb=el("tbody");
  ASSESS.forEach(([k,lbl])=>{
    const avg=el("td",{class:"avg",text:fmt(avgMF(rep[k+"_m"],rep[k+"_f"]))});
    const mk=(sx)=>{ const inp=el("input",{type:"text",inputmode:"decimal",value:rep[k+sx],disabled:ro,placeholder:"0.00","aria-label":lbl+(sx==="_m"?" male":" female")});
      inp.oninput=()=>{ rep[k+sx]=inp.value; inp.classList.toggle("bad",!!parseScore(inp.value).bad); avg.textContent=fmt(avgMF(rep[k+"_m"],rep[k+"_f"])); ta.textContent=fmt(termAvg(rep)); markDirty(); renderTabsDots(); }; return el("td",{},inp); };
    tb.append(el("tr",{},el("td",{text:lbl,style:"font-weight:600"}),mk("_m"),mk("_f"),avg));
  });
  const ta=el("b",{text:fmt(termAvg(rep))});
  tbl.append(tb); card.append(el("div",{class:"tablewrap"},tbl));
  card.append(el("div",{class:"avg",style:"margin-top:10px"},el("span",{text:"Term average (mean of the five)"}),ta));
  const rem=el("textarea",{rows:"2",maxlength:"300",disabled:ro,"aria-label":"Remarks"}); rem.value=rep.remarks; rem.oninput=()=>{rep.remarks=rem.value;markDirty();};
  card.append(el("div",{style:"margin-top:12px"},el("label",{text:"Remarks (optional)"}),rem));
  p.append(card);

  // B. least-learned competencies
  const {list:items,groups}=optionsFor(a);
  const lc=el("div",{class:"card"});
  lc.append(el("h2",{text:a+" · B. Least-Learned Competencies"}),el("p",{class:"hint",text:"Enter three ranked priorities for each assessment. Competencies come from the Budget of Work for Grade "+S.me.grade+" "+a+", Term "+(curPeriod()?.term||"")+". Choose Other if a competency is not on the list."+(items.length?"":" (No Budget of Work list is available for this learning area and term, so use Other.)")}));
  const seg=el("div",{class:"chips"});
  LLC_SECT.forEach(([k,l])=>seg.append(el("button",{class:"chip",type:"button","aria-pressed":String(S.llcTab===k),text:l,onclick:()=>{S.llcTab=k;renderArea();}})));
  lc.append(seg);
  const t=el("table",{class:"llc2"}); t.append(el("thead",{},el("tr",{},...["Rank","Least-learned competency","Intervention","Timeline","Status"].map(x=>el("th",{text:x})))));
  const tb2=el("tbody");
  rep.llc[S.llcTab].forEach((row,i)=>{
    const dirty=()=>{markDirty();};
    tb2.append(el("tr",{},
      el("td",{},el("span",{class:"rank",text:"Rank "+(i+1)})),
      el("td",{style:"min-width:260px"},pickBox(row.competency,row._o.c,items,groups,"Select competency",ro,(v,o)=>{row.competency=v;row._o.c=o;dirty();})),
      el("td",{style:"min-width:200px"},pickBox(row.intervention,row._o.i,INTERVENTIONS,null,"Select intervention",ro,(v,o)=>{row.intervention=v;row._o.i=o;dirty();})),
      el("td",{},(()=>{const x=el("input",{type:"text",maxlength:"100",value:row.timeline,placeholder:"e.g. Nov 3–14",disabled:ro,"aria-label":"Timeline"}); x.oninput=()=>{row.timeline=x.value;dirty();}; return x;})()),
      el("td",{style:"min-width:150px"},pickBox(row.status,row._o.s,STATUSES,null,"Select status",ro,(v,o)=>{row.status=v;row._o.s=o;dirty();}))));
  });
  t.append(tb2); lc.append(el("div",{class:"tablewrap"},t));
  p.append(lc);
  // downloads
  const dl=el("div",{class:"card"});
  dl.append(el("h2",{text:"Download for the Division SAPM tracker"}),el("p",{class:"hint",text:"Creates a CSV in the Division of Mandaue City report format (file name starts with SAPM-report). It includes every section and learning area that has entries. Save your entries first."}),
    el("button",{class:"btn",type:"button",text:"Download SAPM-report CSV",onclick:()=>{
      if(S.dirty){ $("status").textContent="Save your entries first, then download."; $("status").className="status dirty"; return; }
      const reps=S.reports.filter(hasData);
      if(!reps.length){ $("status").textContent="Nothing to download yet."; $("status").className="status dirty"; return; }
      if(!S.cfg.school_head) $("status").textContent="Note: the School Head name has not been set by the coordinator, so that column is blank.";
      const p=curPeriod();
      download("SAPM-report-"+S.code+"-Term"+(p?.term||"")+".csv",csv(sapmRows(reps.map(r=>({...r,teacher:S.me.name,grade:S.me.grade})),p?.term)));
    }}));
  p.append(dl);
}
function markDirty(){ S.dirty=true; updateBar(); }
function updateBar(text){
  const st=$("status");
  if(text){ st.textContent=text; st.className="status"; }
  else if(S.dirty){ st.textContent="Unsaved changes"; st.className="status dirty"; }
  $("saveBtn").disabled = !S.dirty || isClosed();
}

// ---------------- SAPM-report CSV (Division template columns) ----------------
function csv(rows){ return rows.map(r=>r.map(c=>{c=c==null?"":String(c); return /[",\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c;}).join(",")).join("\r\n"); }
function download(name,text){ const u=URL.createObjectURL(new Blob(["﻿"+text],{type:"text/csv"})); const a=el("a",{href:u,download:name}); document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),2000); }
function sapmRows(reports,term){
  const today=new Date().toISOString().slice(0,10); const rows=[SAPM_COLS];
  const optsFor=(g,a)=>((S.comps||{})[g+"|"+a+"|"+term]||[]).map(x=>x[1]);
  reports.forEach(r=>{
    const comps=optsFor(r.grade,r.area);
    let first=true;
    const row=(o)=>{ const x=Object.assign({},o); if(first){ Object.assign(x,{schoolId:SCHOOL.id,school:SCHOOL.name,district:SCHOOL.district,level:SCHOOL.level,gradeLevel:"Grade "+r.grade,sectionName:r.section,learningArea:r.area,term:"Term "+term,subjectTeacher:r.teacher,schoolHead:(S.cfg&&S.cfg.school_head)||(A&&A.data&&A.data.cfg&&A.data.cfg.school_head)||"",reportDate:today}); first=false; } rows.push(SAPM_COLS.map(c=>x[c]??"")); };
    ASSESS.forEach(([k,lbl])=>{ const a=avgMF(r[k+"_m"],r[k+"_f"]); row({record_type:"mps",assessment:lbl,male_mps:num(r[k+"_m"])??"",female_mps:num(r[k+"_f"])??"",average_mps:a==null?"":a.toFixed(2)}); });
    LLC_SECT.forEach(([s,lbl])=>[0,1,2].forEach(i=>{ const x=r.llc[s][i]||blankRow();
      row({record_type:"competency",competency_section:lbl,rank:i+1,competency:tagOther(x.competency,comps),intervention:tagOther(x.intervention,INTERVENTIONS),timeline:x.timeline,status:tagOther(x.status,STATUSES)}); }));
  });
  return rows;
}

// ---------------- save ----------------
$("saveBtn").addEventListener("click",async()=>{
  const used=S.reports.filter(hasData);
  for(const r of used){
    const bad=ASSESS.find(([k])=>parseScore(r[k+"_m"]).bad||parseScore(r[k+"_f"]).bad);
    if(bad){ S.active=r.area; S.sel[r.area]=areaReports(r.area).indexOf(r); renderTabs(); renderArea(); $("status").textContent="Fix the highlighted score in "+r.area+" ("+bad[1]+")."; $("status").className="status dirty"; return; }
    if(!r.section.trim()){ S.active=r.area; S.sel[r.area]=areaReports(r.area).indexOf(r); renderTabs(); renderArea(); $("status").textContent="Enter the section name for "+r.area+"."; $("status").className="status dirty"; return; }
  }
  const dup=new Set(); for(const r of used){ const k=r.area+"|"+r.section.trim().toLowerCase(); if(dup.has(k)){ $("status").textContent="Two sections named "+r.section+" in "+r.area+". Give each section a different name."; $("status").className="status dirty"; return; } dup.add(k); }
  const payload={reports:used.map(r=>({area:r.area,section:r.section.trim(),remarks:r.remarks,
    ...Object.fromEntries(ASSESS.flatMap(([k])=>[[k+"_m",String(r[k+"_m"]).trim().replace(",",".")],[k+"_f",String(r[k+"_f"]).trim().replace(",",".")]])),
    llc:LLC_SECT.flatMap(([s])=>r.llc[s].map((x,i)=>({assess:s,rank:i+1,competency:x.competency,intervention:x.intervention,timeline:x.timeline,status:x.status})))}))};
  $("saveBtn").disabled=true; $("status").textContent="Saving…"; $("status").className="status";
  const res=await rpc("smea2_save",{p_id:S.me.id,p_pin:S.pin,p_period:S.period,p_payload:payload});
  if(!res.ok){ $("status").textContent=errText(res); $("status").className="status dirty"; $("saveBtn").disabled=false; return; }
  S.dirty=false; $("status").textContent="Saved at "+new Date().toLocaleTimeString()+" · "+res.saved+" report(s)"; $("status").className="status saved"; $("saveBtn").disabled=true;
});
window.addEventListener("beforeunload",(e)=>{ if(S.dirty){ e.preventDefault(); e.returnValue=""; } });

// ---------------- class record (ECR) reader: runs in the browser, nothing is uploaded ----------------
const ECR_BLOCKS=[["ww","WRITTEN"],["pt","PERFORMANCE TASKS"],["st1","SUMMATIVE TEST 1"],["st2","SUMMATIVE TEST 2"],["te","TERM EXAMINATION"]];
const AREA_PATTERN={"GMRC":/GMRC|ESP|VALUES/,"Mathematics":/MATH/,"Filipino":/FILIPINO/,"English":/ENGLISH/,"Makabansa":/MAKABANSA|ARALING|\bAP\b/,"Araling Panlipunan":/ARALING|\bAP\b|MAKABANSA/,"Science":/SCIENCE/,"EPP":/EPP|TLE|LIVELIHOOD/,"Music & Arts":/MUSIC|ARTS|MAPEH/,"PE & Health":/\bPE\b|HEALTH|MAPEH/,"Reading & Literacy":/READING|LITERACY/,"Language":/LANGUAGE/};
const norm=(v)=>String(v??"").replace(/\s+/g," ").trim().toUpperCase();
const cellVal=(ws,addr)=>{ const c=ws[addr]; return c?c.v:undefined; };
const toNum=(v)=>{ const n=typeof v==="number"?v:parseFloat(v); return (isFinite(n)&&n>=0&&n<=100)?Math.round(n*100)/100:null; };
function readEcr(wb,sheetName){
  const out={meta:{},mps:{},problems:[]};
  const ds=wb.Sheets["DATA SHEET"];
  if(ds){ out.meta={grade:norm(cellVal(ds,"L8")),section:String(cellVal(ds,"L9")??"").replace(/\s+/g," ").trim(),subject:norm(cellVal(ds,"L10")),sy:String(cellVal(ds,"F13")??"")}; }
  const ws=wb.Sheets[sheetName];
  if(!ws){ out.problems.push("This file has no sheet named "+sheetName+". Is it the standard Electronic Class Record?"); return out; }
  ECR_BLOCKS.forEach(([key,marker])=>{
    let got={m:null,f:null,t:null};
    for(let r=150;r<=215;r++){
      const label=norm(cellVal(ws,"B"+r));
      if(label.includes("MEAN PERCENTAGE")&&label.includes(marker)){
        for(let rr=r;rr<=r+8;rr++){
          if(norm(cellVal(ws,"Q"+rr))==="MPS"){ got={m:toNum(cellVal(ws,"I"+(rr+1))),f:toNum(cellVal(ws,"M"+(rr+1))),t:toNum(cellVal(ws,"Q"+(rr+1)))}; break; }
        }
        break;
      }
    }
    out.mps[key]=got;
  });
  return out;
}
function fillEcrAreas(){ const sel=$("ecrArea"); sel.innerHTML=""; S.areas.forEach(a=>sel.append(el("option",{value:a,text:a}))); sel.value=S.active||S.areas[0]; }
const titleCase=(s)=>s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
$("ecrFile").addEventListener("change",async(ev)=>{
  const f=ev.target.files[0]; const out=$("ecrOut"); out.innerHTML="";
  if(!f) return;
  if(typeof XLSX==="undefined"){ msg("ecrOut","The file reader could not load. Check your internet connection and refresh."); return; }
  const term=$("ecrTerm").value, area=$("ecrArea").value;
  out.append(el("div",{class:"msg warn",text:"Reading the file…"}));
  let res;
  try{
    const buf=await f.arrayBuffer();
    const wb=XLSX.read(buf,{type:"array",sheets:["DATA SHEET",term],cellFormula:false,cellStyles:false,cellHTML:false});
    res=readEcr(wb,term);
  }catch(e){ msg("ecrOut","That file could not be read. Use the standard Electronic Class Record in .xlsx format."); return; }
  out.innerHTML="";
  if(res.problems.length){ msg("ecrOut",res.problems[0]); return; }
  const warns=[];
  const gradeNum=(res.meta.grade.match(/\d+/)||[])[0];
  if(gradeNum && Number(gradeNum)!==S.me.grade) warns.push("The file says "+res.meta.grade+" but you are signed in as Grade "+S.me.grade+".");
  const pat=AREA_PATTERN[area];
  if(res.meta.subject && pat && !pat.test(res.meta.subject)) warns.push("The file's subject is "+res.meta.subject+" but you chose "+area+".");
  const pTerm=curPeriod()?.term; if(pTerm && term!=="TERM "+pTerm) warns.push("You are entering Term "+pTerm+" but chose the "+term+" sheet.");
  const found=ECR_BLOCKS.filter(([k])=>res.mps[k].m!=null||res.mps[k].f!=null||res.mps[k].t!=null);
  const box=el("div",{class:"card",style:"margin:12px 0 0;background:var(--bg)"});
  box.append(el("h3",{text:"Found in "+term+" of this file"}),
    el("p",{class:"hint",text:[res.meta.subject,res.meta.grade,res.meta.section?("Section "+res.meta.section):"",res.meta.sy?("SY "+res.meta.sy):""].filter(Boolean).join(" · ")}));
  const tb=el("table",{class:"mps"}); tb.append(el("thead",{},el("tr",{},...["Assessment","Male","Female","Total"].map(x=>el("th",{text:x})))));
  const b=el("tbody"); ASSESS.forEach(([k,l])=>{ const g=res.mps[k]; b.append(el("tr",{},el("td",{text:l}),el("td",{class:"n",text:fmt(g.m)}),el("td",{class:"n",text:fmt(g.f)}),el("td",{class:"n",text:fmt(g.t)}))); });
  tb.append(b); box.append(el("div",{class:"tablewrap"},tb));
  warns.forEach(w=>box.append(el("div",{class:"msg warn",text:w})));
  if(!found.length){ box.append(el("div",{class:"msg err",text:"No MPS values found in "+term+". Make sure the scores are entered and the file was saved after calculating."})); out.append(box); return; }
  const onlyTotal=found.some(([k])=>res.mps[k].m==null&&res.mps[k].f==null&&res.mps[k].t!=null);
  if(onlyTotal) box.append(el("div",{class:"msg warn",text:"For some rows only the total was found, not male and female. The total will be placed in both boxes so the average stays correct."}));
  if(isClosed()){ box.append(el("div",{class:"msg err",text:"This term is closed."})); out.append(box); return; }
  const sectionName=titleCase(res.meta.section||"");
  const hasMps=(r)=>ASSESS.some(([k])=>String(r[k+"_m"]).trim()!==""||String(r[k+"_f"]).trim()!=="");
  const applyEcr=(rep)=>{
    if(!rep){ rep=blankReport(area,sectionName); S.reports.push(rep); }
    if(sectionName) rep.section=sectionName;
    if(rep.section) remember("smea_section",rep.section);
    ECR_BLOCKS.forEach(([k])=>{ const g=res.mps[k]; const m=g.m??(g.f==null?g.t:null), f=g.f??(g.m==null?g.t:null);
      if(m!=null) rep[k+"_m"]=String(m); if(f!=null) rep[k+"_f"]=String(f); });
    S.active=area; S.sel[area]=areaReports(area).indexOf(rep); markDirty(); renderTabs(); renderArea();
    out.innerHTML=""; out.append(el("div",{class:"msg ok",text:"Values placed in "+area+(rep.section?" · Section "+rep.section:"")+". Check them, then press Save my entries."}));
    $("ecrFile").value="";
  };
  const useBtn=el("button",{class:"btn",type:"button",style:"margin-top:12px",text:"Use these values for "+area+(sectionName?" · "+sectionName:""),onclick:()=>{
    const list=areaReports(area);
    const rep=list.find(r=>sectionName&&r.section.trim().toLowerCase()===sectionName.toLowerCase())
         || list.find(r=>!hasData(r) && (!r.section.trim()||!sectionName))
         || list.find(r=>!hasData(r));
    // never overwrite MPS already entered for this learning area and section without asking
    if(rep && hasMps(rep)){
      const ask=el("div",{class:"msg warn",style:"margin-top:12px"},
        el("p",{style:"margin:0 0 8px",text:area+(rep.section?" · Section "+rep.section:"")+" already has MPS entered. Replace the male and female MPS with the values from this file? Your competencies and remarks are not changed."}),
        el("div",{class:"seg"},
          el("button",{class:"btn",type:"button",text:"Yes, replace",onclick:()=>applyEcr(rep)}),
          el("button",{class:"btn soft",type:"button",text:"No, keep what I have",onclick:()=>{ ask.remove(); useBtn.classList.remove("hidden"); }})));
      useBtn.classList.add("hidden"); box.append(ask); return;
    }
    applyEcr(rep);
  }});
  box.append(useBtn);
  out.append(box);
});


// ---------------- PIN change / sign out ----------------
$("pinBtn").onclick=()=>{ show("entry",false); show("savebar",false); show("pinCard",true); msg("pinMsg",""); };
$("pinCancel").onclick=()=>{ show("pinCard",false); show("entry",true); show("savebar",true); };
$("pinForm").addEventListener("submit",async(e)=>{
  e.preventDefault();
  const r=await rpc("smea_change_pin",{p_id:S.me.id,p_old:$("oldPin").value.trim(),p_new:$("newPin").value.trim()});
  if(!r.ok){ msg("pinMsg",errText(r)); return; }
  S.pin=$("newPin").value.trim(); $("oldPin").value=""; $("newPin").value="";
  msg("pinMsg","Your PIN was changed. Use the new PIN next time.","ok");
});
$("outBtn").onclick=()=>{
  if(S.dirty && !$("outBtn").dataset.sure){ $("outBtn").dataset.sure="1"; $("outBtn").textContent="Discard changes and sign out?"; return; }
  location.reload();
};

// ---------------- coordinator ----------------
const A={pin:null,period:null,data:null,view:"board",grade:1};
$("toAdmin").onclick=()=>{ show("login",false); show("admin",true); show("adminLogin",true); show("adminBody",false); };
$("toTeacher").onclick=()=>{ show("admin",false); show("login",true); };
const NIL="00000000-0000-0000-0000-000000000000";
$("adminForm").addEventListener("submit",async(e)=>{
  e.preventDefault(); msg("adMsg","");
  const pin=$("adPin").value.trim();
  const r=await rpc("smea2_admin_overview",{p_pin:pin,p_period:NIL});
  if(!r.ok){ msg("adMsg",errText(r)); return; }
  A.pin=pin; $("adPin").value="";
  A.period=(r.periods.find(p=>p.is_open)||r.periods[0])?.id||null;
  try{ S.comps=await (await fetch("competencies.json")).json(); }catch(e){ S.comps={}; }
  show("adminLogin",false); show("adminBody",true); show("who",true); $("whoName").textContent="Coordinator"; $("pinBtn").classList.add("hidden");
  loadAdmin();
});
async function loadAdmin(){
  const r=await rpc("smea2_admin_overview",{p_pin:A.pin,p_period:A.period||NIL});
  if(!r.ok){ alert(errText(r)); return; }
  A.data=r; renderAdmin();
}
function asLlcObject(r){ const o=blankLlc(); (r.llc||[]).forEach(l=>{ const row=o[l.assess]&&o[l.assess][l.rank-1]; if(row){ row.competency=l.competency||""; row.intervention=l.intervention||""; row.timeline=l.timeline||""; row.status=l.status||""; } }); return {...r,llc:o}; }
const cls = (v) => v==null ? "" : (v<75?"lo":"hi");
const mean = (xs) => { const v=xs.filter(x=>x!=null); return v.length?v.reduce((a,b)=>a+b,0)/v.length:null; };
const AREA_ORDER=["GMRC","Mathematics","Reading & Literacy","Language","Filipino","English","Makabansa","Araling Panlipunan","Science","EPP","Music & Arts","PE & Health"];
function boardRows(d,grade){
  // one row per teacher + section within each learning area, in the order of the monitoring workbook
  const rows=d.reports.filter(r=>r.grade===grade).map(r=>{ const v={}; ASSESS.forEach(([k])=>v[k]=avgMF(r[k+"_m"],r[k+"_f"])); return {...r,v,avg:termAvg(r)}; });
  const areas=[...new Set(rows.map(r=>r.area))].sort((a,b)=>AREA_ORDER.indexOf(a)-AREA_ORDER.indexOf(b));
  return areas.map(a=>({area:a,rows:rows.filter(r=>r.area===a)}));
}
function workbookFor(d,periodLabel){
  const wb=XLSX.utils.book_new();
  for(let g=1;g<=6;g++){
    const aoa=[]; const blocks=boardRows(d,g);
    blocks.forEach(b=>{
      aoa.push(["","Learning Area","Grade Level","WW MPS","PT MPS","ST 1 MPS","ST 2 MPS","TE MPS","Term Average","Remarks"]);
      aoa.push(["",b.area,g]);
      b.rows.forEach(r=>aoa.push([r.teacher+(b.rows.filter(x=>x.code===r.code).length>1?" ("+r.section+")":""),"",g,...ASSESS.map(([k])=>r.v[k]==null?"":+r.v[k].toFixed(2)),r.avg==null?"":+r.avg.toFixed(2),r.remarks||""]));
      aoa.push(["","AVERAGE","",...ASSESS.map(([k])=>{const m=mean(b.rows.map(r=>r.v[k])); return m==null?"":+m.toFixed(2);}),(()=>{const m=mean(b.rows.map(r=>r.avg)); return m==null?"":+m.toFixed(2);})()]);
      aoa.push([]);
    });
    if(!aoa.length) aoa.push(["No entries yet for this term"]);
    const ws=XLSX.utils.aoa_to_sheet(aoa); ws["!cols"]=[{wch:30},{wch:22},{wch:11},{wch:9},{wch:9},{wch:9},{wch:9},{wch:9},{wch:13},{wch:30}];
    XLSX.utils.book_append_sheet(wb,ws,"GRADE "+g);
  }
  return wb;
}
function renderAdmin(){
  const d=A.data, b=$("adminBody"); b.innerHTML="";
  S.cfg=d.cfg||{};
  const per=d.periods.find(p=>p.id===A.period);
  const top=el("div",{class:"card"});
  const sel=el("select",{id:"adPeriod"}); d.periods.forEach(p=>sel.append(el("option",{value:p.id,text:p.label+(p.is_open?"":" (closed)")}))); sel.value=A.period;
  sel.onchange=()=>{A.period=sel.value;loadAdmin();};
  top.append(el("h2",{text:"Coordinator dashboard"}),el("div",{class:"row two",style:"margin-top:10px"},el("div",{},el("label",{for:"adPeriod",text:"Reporting period"}),sel)));
  const seg=el("div",{class:"seg",style:"margin-top:12px"});
  if(per) seg.append(el("button",{class:"btn soft sm",type:"button",text:per.is_open?"Close this term":"Reopen this term",onclick:async()=>{await rpc("smea_admin_period",{p_pin:A.pin,p_action:per.is_open?"close":"open",p_label:null,p_period:per.id});loadAdmin();}}));
  top.append(seg); b.append(top);

  const tabs=el("div",{class:"tabs"});
  [["board","Display board"],["status","Submission status"],["llc","Least-learned"],["staff","Teachers and PINs"],["settings","Settings"]].forEach(([k,l])=>tabs.append(el("button",{class:"tab",type:"button","aria-selected":String(A.view===k),text:l,onclick:()=>{A.view=k;renderAdmin();}})));
  b.append(tabs);
  const card=el("div",{class:"card"}); b.append(card);
  const term=per?.term;

  if(A.view==="board"){
    card.append(el("h2",{text:"Monitoring of Mean Percentage Score · "+(per?per.label:"")}),el("p",{class:"hint",text:"Mean of male and female MPS for each teacher and learning area. Scores below 75 are shaded red. Only you can see this page."}));
    const bar=el("div",{class:"seg",style:"margin:8px 0 12px"});
    bar.append(el("button",{class:"btn sm",type:"button",text:"Download spreadsheet (.xlsx)",onclick:()=>{ if(typeof XLSX==="undefined"){alert("The spreadsheet tool could not load. Check your internet connection and refresh.");return;} XLSX.writeFile(workbookFor(d,per?.label),"Monitoring-MPS-and-LLC-Term"+term+".xlsx"); }}),
      el("button",{class:"btn soft sm",type:"button",text:"Download SAPM-report CSV (all teachers)",onclick:()=>{ if(!d.reports.length){alert("No entries yet for this term.");return;} download("SAPM-report-All-Term"+term+".csv",csv(sapmRows(d.reports.map(asLlcObject),term))); }}));
    card.append(bar);
    const gt=el("div",{class:"tabs"}); for(let g=1;g<=6;g++) gt.append(el("button",{class:"tab",type:"button","aria-selected":String(A.grade===g),text:"Grade "+g,onclick:()=>{A.grade=g;renderAdmin();}}));
    card.append(gt);
    const blocks=boardRows(d,A.grade);
    if(!blocks.length) card.append(el("p",{class:"hint",text:"No entries yet for Grade "+A.grade+" in this term."}));
    blocks.forEach(bl=>{
      const t=el("table"); t.append(el("thead",{},el("tr",{},...[bl.area,"Section","WW","PT","ST 1","ST 2","TE","Term Avg"].map((x,i)=>el("th",{class:i>1?"n":"",text:x})))));
      const tb=el("tbody");
      bl.rows.forEach(r=>tb.append(el("tr",{},el("td",{text:r.teacher}),el("td",{text:r.section}),...ASSESS.map(([k])=>el("td",{class:"n "+cls(r.v[k]),text:fmt(r.v[k])})),el("td",{class:"n "+cls(r.avg),text:fmt(r.avg)}))));
      const av=ASSESS.map(([k])=>mean(bl.rows.map(r=>r.v[k]))), ta=mean(bl.rows.map(r=>r.avg));
      tb.append(el("tr",{style:"font-weight:700"},el("td",{text:"AVERAGE"}),el("td",{}),...av.map(x=>el("td",{class:"n "+cls(x),text:fmt(x)})),el("td",{class:"n "+cls(ta),text:fmt(ta)})));
      t.append(tb); card.append(el("div",{class:"tablewrap",style:"margin-bottom:14px"},t));
    });
  }
  if(A.view==="status"){
    const act=d.teachers.filter(t=>t.active);
    const done=act.filter(t=>t.submitted>=t.expected).length;
    card.append(el("h2",{text:done+" of "+act.length+" teachers have entries for every learning area"}),el("p",{class:"hint",text:"Counts a learning area once at least one section has entries."}));
    const t=el("table"); t.append(el("thead",{},el("tr",{},...["Grade","Teacher","Areas entered","Progress","Last saved"].map(x=>el("th",{text:x})))));
    const tb=el("tbody"); act.forEach(x=>{
      const pct=Math.min(100,Math.round(100*x.submitted/x.expected));
      tb.append(el("tr",{},el("td",{text:x.grade}),el("td",{text:x.name}),
        el("td",{},el("span",{class:"pill "+(x.submitted>=x.expected?"ok":x.submitted>0?"part":"none"),text:x.submitted+" / "+x.expected})),
        el("td",{},el("div",{class:"bar"},el("i",{style:"width:"+pct+"%"}))),
        el("td",{text:x.updated_at?new Date(x.updated_at).toLocaleString():"–"})));
    }); t.append(tb); card.append(el("div",{class:"tablewrap"},t));
  }
  if(A.view==="llc"){
    const rows=[]; d.reports.forEach(r=>(r.llc||[]).forEach(l=>{ if(l.competency) rows.push({grade:r.grade,teacher:r.teacher,area:r.area,section:r.section,...l}); }));
    const nm={st1:"ST 1",st2:"ST 2",te:"Term Exam"};
    card.append(el("h2",{text:"Least-learned competencies"}));
    card.append(el("div",{class:"seg",style:"margin:8px 0"},el("button",{class:"btn sm",type:"button",text:"Download CSV",onclick:()=>download("least-learned-Term"+term+".csv",csv([["Grade","Teacher","Section","Learning Area","Assessment","Rank","Competency","Intervention","Timeline","Status"],...rows.map(l=>[l.grade,l.teacher,l.section,l.area,nm[l.assess],l.rank,l.competency,l.intervention,l.timeline,l.status])]))})));
    const t=el("table"); t.append(el("thead",{},el("tr",{},...["Gr","Teacher","Section","Area","Test","Rank","Competency","Intervention","Timeline","Status"].map(x=>el("th",{text:x})))));
    const tb=el("tbody"); rows.forEach(l=>tb.append(el("tr",{},...[l.grade,l.teacher,l.section,l.area,nm[l.assess],l.rank,l.competency,l.intervention||"",l.timeline||"",l.status||""].map(x=>el("td",{text:x})))));
    if(!rows.length) tb.append(el("tr",{},el("td",{colspan:"10",text:"No competencies entered yet for this term."})));
    t.append(tb); card.append(el("div",{class:"tablewrap"},t));
  }
  if(A.view==="staff"){
    card.append(el("h2",{text:"Teachers and PINs"}),el("p",{class:"hint",text:"PINs are stored scrambled and cannot be viewed. Reset one to generate a new 6-digit PIN, then give it to the teacher privately."}));
    const out=el("div",{id:"pinOut"}); card.append(out);
    const t=el("table"); t.append(el("thead",{},el("tr",{},...["ID","Grade","Teacher",""].map(x=>el("th",{text:x})))));
    const tb=el("tbody"); d.teachers.forEach(x=>tb.append(el("tr",{},el("td",{class:"num",text:x.code}),el("td",{text:x.grade}),el("td",{text:x.name}),el("td",{},el("button",{class:"btn soft sm",type:"button",text:"Reset PIN",onclick:async()=>{const r=await rpc("smea_admin_reset_pin",{p_pin:A.pin,p_teacher:x.id}); out.innerHTML=""; out.append(r.ok?el("div",{class:"msg ok"},"New PIN for "+x.name+" ("+x.code+"): ",el("span",{class:"pin",text:r.pin})):el("div",{class:"msg err",text:errText(r)})); out.scrollIntoView({block:"nearest"});}})))));
    t.append(tb); card.append(el("div",{class:"tablewrap"},t));
    const f=el("form",{class:"row two",style:"margin-top:16px"});
    const nmI=el("input",{type:"text",placeholder:"Full name",required:true,"aria-label":"New teacher name"});
    const gr=el("select",{"aria-label":"Grade"}); for(let g=1;g<=6;g++) gr.append(el("option",{value:g,text:"Grade "+g}));
    f.append(nmI,gr,el("button",{class:"btn",type:"submit",text:"Add teacher"}));
    f.addEventListener("submit",async(e)=>{e.preventDefault(); const r=await rpc("smea_admin_add_teacher",{p_pin:A.pin,p_name:nmI.value,p_grade:Number(gr.value)}); out.innerHTML=""; if(r.ok){ out.append(el("div",{class:"msg ok"},"Teacher added. Teacher ID "+r.code+", PIN: ",el("span",{class:"pin",text:r.pin}))); loadAdmin(); } else out.append(el("div",{class:"msg err",text:errText(r)}));});
    card.append(f);
  }
  if(A.view==="settings"){
    card.append(el("h2",{text:"Settings"}),el("p",{class:"hint",text:"The School Head name is written into the SAPM-report CSV files."}));
    const f=el("form",{class:"row two"}); const hi=el("input",{type:"text",maxlength:"120",value:(d.cfg&&d.cfg.school_head)||"","aria-label":"School Head name",placeholder:"Name of School Head"});
    const o=el("div",{id:"setOut"});
    f.append(hi,el("button",{class:"btn",type:"submit",text:"Save"}));
    f.addEventListener("submit",async(e)=>{e.preventDefault(); const r=await rpc("smea2_admin_set",{p_pin:A.pin,p_key:"school_head",p_value:hi.value}); o.innerHTML=""; o.append(r.ok?el("div",{class:"msg ok",text:"Saved."}):el("div",{class:"msg err",text:errText(r)})); if(r.ok){ d.cfg={school_head:hi.value.trim()}; S.cfg=d.cfg; }});
    card.append(f,o);
  }
}
