
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

// ---------------- state ----------------
const S = {teachers:[],periods:[],me:null,pin:null,areas:[],period:null,scores:{},llc:{},active:null,dirty:false,loaded:false};

// ---------------- login ----------------
$("loginForm").addEventListener("submit",async(e)=>{
  e.preventDefault(); msg("lgMsg","");
  const code=$("lgCode").value.trim(), pin=$("lgPin").value.trim();
  $("lgBtn").disabled=true; $("lgBtn").textContent="Signing in…";
  const r=await rpc("smea_login",{p_code:code,p_pin:pin});
  $("lgBtn").disabled=false; $("lgBtn").textContent="Sign in";
  if(!r.ok){ msg("lgMsg",errText(r)); $("lgPin").select(); return; }
  S.me=r.teacher; S.pin=pin; S.areas=r.areas; S.periods=r.periods;
  $("lgPin").value="";
  startEntry();
});

// ---------------- teacher entry ----------------
function startEntry(){
  show("login",false); show("entry",true); show("who",true); show("savebar",true);
  $("whoName").textContent=S.me.name;
  $("gradeLbl").textContent="Grade "+S.me.grade;
  $("period").innerHTML="";
  S.periods.forEach(p=>$("period").append(el("option",{value:p.id,text:p.label+(p.is_open?"":" (closed)")})));
  S.period=S.periods[0]?.id; $("period").value=S.period;
  S.active=S.areas[0];
  fillEcrAreas();
  loadPeriod();
}
$("period").addEventListener("change",async()=>{
  if(S.dirty){ $("period").value=S.period; $("status").textContent="Save your changes before switching period."; $("status").className="status dirty"; return; }
  S.period=$("period").value; loadPeriod();
});
async function loadPeriod(){
  $("areaPanel").classList.add("spin");
  const r=await rpc("smea_load",{p_id:S.me.id,p_pin:S.pin,p_period:S.period});
  $("areaPanel").classList.remove("spin");
  if(!r.ok){ msg("closedMsg",errText(r)); return; }
  S.scores={}; S.llc={};
  S.areas.forEach(a=>{S.scores[a]={ww:"",pt:"",st1:"",st2:"",te:"",remarks:""}; S.llc[a]=[];});
  r.scores.forEach(s=>{ S.scores[s.area]={ww:s.ww??"",pt:s.pt??"",st1:s.st1??"",st2:s.st2??"",te:s.te??"",remarks:s.remarks??""}; });
  r.llc.forEach(l=>{ (S.llc[l.area]||[]).push({code:l.code??"",competency:l.competency,mps:l.mps??"",action:l.action??""}); });
  S.dirty=false; S.loaded=true;
  const p=S.periods.find(x=>x.id===S.period);
  msg("closedMsg", p&&!p.is_open ? "This period is closed. You can view your entries but not change them." : "", "warn");
  renderTabs(); renderArea(); updateBar(r.updated_at ? "Last saved "+new Date(r.updated_at).toLocaleString() : "No entries saved yet");
}
function isClosed(){ const p=S.periods.find(x=>x.id===S.period); return p && !p.is_open; }
function areaDone(a){ const s=S.scores[a]; return FIELDS.every(([k])=>String(s[k]).trim()!==""); }
function renderTabs(){
  $("tabs").innerHTML="";
  S.areas.forEach(a=>{
    const t=el("button",{class:"tab",role:"tab",type:"button","aria-selected":String(a===S.active),onclick:()=>{S.active=a;renderTabs();renderArea();}},a,el("span",{class:"dot"+(areaDone(a)?" done":"")}));
    $("tabs").append(t);
  });
}
function avgOf(s){
  const vals=FIELDS.map(([k])=>parseScore(s[k]));
  if(vals.some(v=>v.empty||v.bad)) return null;
  return vals.reduce((x,v)=>x+v.value,0)/5;
}
function renderArea(){
  const a=S.active, s=S.scores[a], ro=isClosed();
  if($("ecrArea").options.length) $("ecrArea").value=a;
  const p=$("areaPanel"); p.innerHTML="";
  const card=el("div",{class:"card"});
  card.append(el("h2",{text:a+" · Mean Percentage Score"}), el("p",{class:"hint",text:"Enter the class MPS for each component (0 to 100). Leave blank if not yet available."}));
  const grid=el("div",{class:"scores"});
  FIELDS.forEach(([k,lbl])=>{
    const inp=el("input",{id:"f_"+k,type:"text",inputmode:"decimal",value:s[k],disabled:ro,"aria-label":lbl+" MPS",placeholder:"0.00"});
    const err=el("div",{class:"fielderr",id:"e_"+k});
    inp.addEventListener("input",()=>{
      s[k]=inp.value; const v=parseScore(inp.value);
      inp.classList.toggle("bad",!!v.bad); err.textContent=v.bad?"0 to 100 only":"";
      avgEl.textContent=fmt(avgOf(s)); markDirty(); renderTabsDots();
    });
    grid.append(el("div",{},el("label",{for:"f_"+k,text:lbl}),inp,err));
  });
  card.append(grid);
  const avgEl=el("b",{text:fmt(avgOf(s))});
  card.append(el("div",{class:"avg"},el("span",{text:"Term Average MPS (mean of the five)"}),avgEl));
  card.append(el("div",{style:"margin-top:12px"},el("label",{for:"f_rem",text:"Remarks (optional)"}),
    (()=>{const t=el("textarea",{id:"f_rem",rows:"2",maxlength:"300",disabled:ro},s.remarks); t.value=s.remarks; t.addEventListener("input",()=>{s.remarks=t.value;markDirty();}); return t;})()));
  p.append(card);

  const lc=el("div",{class:"card"});
  lc.append(el("h2",{text:a+" · Least-Learned Competencies"}), el("p",{class:"hint",text:"List the competencies with the lowest mastery for this learning area (up to 10), the MPS for each, and the action you will take."}));
  const list=el("div",{class:"llc"}); lc.append(list);
  const draw=()=>{
    list.innerHTML="";
    S.llc[a].forEach((row,i)=>{
      const code=el("input",{type:"text",value:row.code,maxlength:"40",placeholder:"e.g. M3NS-Ia-1",disabled:ro,"aria-label":"Competency code"});
      const mps=el("input",{type:"text",inputmode:"decimal",value:row.mps,placeholder:"MPS",disabled:ro,"aria-label":"Competency MPS"});
      const comp=el("textarea",{rows:"2",maxlength:"400",placeholder:"Least-learned competency",disabled:ro,"aria-label":"Competency"}); comp.value=row.competency;
      const act=el("textarea",{rows:"2",maxlength:"400",placeholder:"Intervention / action taken",disabled:ro,"aria-label":"Action"}); act.value=row.action;
      code.oninput=()=>{row.code=code.value;markDirty();}; comp.oninput=()=>{row.competency=comp.value;markDirty();}; act.oninput=()=>{row.action=act.value;markDirty();};
      mps.oninput=()=>{row.mps=mps.value; mps.classList.toggle("bad",!!parseScore(mps.value).bad); markDirty();};
      const item=el("div",{class:"llc-item"},
        el("div",{},el("label",{text:"Code"}),code),
        el("div",{class:"wide",style:"grid-column:2/3"},el("label",{text:"Competency"}),comp),
        el("div",{},el("label",{text:"MPS"}),mps),
        el("div",{class:"wide"},el("label",{text:"Action / intervention"}),act),
        ro?null:el("div",{class:"wide"},el("button",{class:"btn soft sm",type:"button",text:"Remove",onclick:()=>{S.llc[a].splice(i,1);markDirty();draw();}})));
      list.append(item);
    });
    if(!S.llc[a].length) list.append(el("p",{class:"hint",text:"None added yet."}));
  };
  draw();
  if(!ro) lc.append(el("div",{style:"margin-top:12px"},el("button",{class:"btn soft",type:"button",text:"Add competency",onclick:()=>{ if(S.llc[a].length>=10){return;} S.llc[a].push({code:"",competency:"",mps:"",action:""}); markDirty(); draw(); }})));
  p.append(lc);
}
function renderTabsDots(){ document.querySelectorAll(".tab").forEach((t,i)=>{ const d=t.querySelector(".dot"); d.className="dot"+(areaDone(S.areas[i])?" done":""); }); }
function markDirty(){ S.dirty=true; updateBar(); }
function updateBar(text){
  const st=$("status");
  if(text){ st.textContent=text; st.className="status"; }
  else if(S.dirty){ st.textContent="Unsaved changes"; st.className="status dirty"; }
  $("saveBtn").disabled = !S.dirty || isClosed();
}
$("saveBtn").addEventListener("click",async()=>{
  // validate everything first
  for(const a of S.areas){
    for(const [k,l] of FIELDS){ if(parseScore(S.scores[a][k]).bad){ S.active=a; renderTabs(); renderArea(); $("status").textContent="Fix the highlighted score in "+a+" ("+l+")."; $("status").className="status dirty"; return; } }
    for(const row of S.llc[a]) if(parseScore(row.mps).bad){ S.active=a; renderTabs(); renderArea(); $("status").textContent="Fix the competency MPS in "+a+"."; $("status").className="status dirty"; return; }
  }
  const payload={
    scores:S.areas.map(a=>({area:a,...Object.fromEntries(FIELDS.map(([k])=>[k,String(S.scores[a][k]).trim().replace(",",".")])),remarks:S.scores[a].remarks})),
    llc:S.areas.flatMap(a=>S.llc[a].filter(r=>r.competency.trim()).map(r=>({area:a,code:r.code,competency:r.competency,mps:String(r.mps).trim().replace(",","."),action:r.action})))
  };
  $("saveBtn").disabled=true; $("status").textContent="Saving…"; $("status").className="status";
  const r=await rpc("smea_save",{p_id:S.me.id,p_pin:S.pin,p_period:S.period,p_payload:payload});
  if(!r.ok){ $("status").textContent=errText(r); $("status").className="status dirty"; $("saveBtn").disabled=false; return; }
  S.dirty=false; $("status").textContent="Saved at "+new Date().toLocaleTimeString()+" · "+r.saved_scores+" learning area(s), "+r.saved_llc+" competency row(s)"; $("status").className="status saved"; $("saveBtn").disabled=true;
});
window.addEventListener("beforeunload",(e)=>{ if(S.dirty){ e.preventDefault(); e.returnValue=""; } });

// ---------------- class record (ECR) reader: runs in the browser, nothing is uploaded ----------------
const ECR_BLOCKS=[["ww","WRITTEN"],["pt","PERFORMANCE TASKS"],["st1","SUMMATIVE TEST 1"],["st2","SUMMATIVE TEST 2"],["te","TERM EXAMINATION"]];
const AREA_PATTERN={"GMRC":/GMRC|ESP|VALUES/,"Mathematics":/MATH/,"Filipino":/FILIPINO/,"English":/ENGLISH/,"Makabansa":/MAKABANSA|ARALING|\bAP\b/,"Science":/SCIENCE/,"EPP":/EPP|TLE|LIVELIHOOD/,"Music & Arts":/MUSIC|ARTS|MAPEH/,"PE & Health":/\bPE\b|HEALTH|MAPEH/,"Reading & Literacy":/READING|LITERACY/,"Language":/LANGUAGE/};
const norm=(v)=>String(v??"").replace(/\s+/g," ").trim().toUpperCase();
function cellVal(ws,addr){ const c=ws[addr]; return c?c.v:undefined; }
function readEcr(wb,sheetName){
  const out={meta:{},mps:{},problems:[]};
  const ds=wb.Sheets["DATA SHEET"];
  if(ds){ out.meta={grade:norm(cellVal(ds,"L8")),section:norm(cellVal(ds,"L9")),subject:norm(cellVal(ds,"L10")),sy:String(cellVal(ds,"F13")??"")}; }
  const ws=wb.Sheets[sheetName];
  if(!ws){ out.problems.push("This file has no sheet named "+sheetName+". Is it the standard Electronic Class Record?"); return out; }
  ECR_BLOCKS.forEach(([key,marker])=>{
    let found=null;
    for(let r=150;r<=215&&found===null;r++){
      const label=norm(cellVal(ws,"B"+r));
      if(label.includes("MEAN PERCENTAGE")&&label.includes(marker)){
        for(let rr=r;rr<=r+8;rr++){
          if(norm(cellVal(ws,"Q"+rr))==="MPS"){ found=cellVal(ws,"Q"+(rr+1)); break; }
        }
        if(found===null) found="";
      }
    }
    const n=typeof found==="number"?found:parseFloat(found);
    out.mps[key]=(isFinite(n)&&n>=0&&n<=100)?Math.round(n*100)/100:null;
  });
  return out;
}
function fillEcrAreas(){
  const sel=$("ecrArea"); sel.innerHTML="";
  S.areas.forEach(a=>sel.append(el("option",{value:a,text:a})));
  sel.value=S.active||S.areas[0];
}
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
  const missing=ECR_BLOCKS.filter(([k])=>res.mps[k]==null).map(([k])=>FIELDS.find(x=>x[0]===k)[1]);
  const box=el("div",{class:"card",style:"margin:12px 0 0;background:var(--bg)"});
  box.append(el("h3",{text:"Found in "+term+" of this file"}),
    el("p",{class:"hint",text:[res.meta.subject,res.meta.grade,res.meta.section?("Section "+res.meta.section):"",res.meta.sy?("SY "+res.meta.sy):""].filter(Boolean).join(" · ")}));
  const g=el("div",{class:"scores"});
  FIELDS.forEach(([k,l])=>g.append(el("div",{class:"avg",style:"flex-direction:column;align-items:flex-start;gap:2px"},el("span",{text:l}),el("b",{text:fmt(res.mps[k])}))));
  box.append(g);
  warns.forEach(w=>box.append(el("div",{class:"msg warn",text:w})));
  if(missing.length===5){ box.append(el("div",{class:"msg err",text:"No MPS values found in "+term+". Make sure the scores are entered and the file was saved after calculating."})); out.append(box); return; }
  if(missing.length) box.append(el("div",{class:"msg warn",text:"No value found for: "+missing.join(", ")+". Those boxes will stay as they are."}));
  if(isClosed()){ box.append(el("div",{class:"msg err",text:"This reporting period is closed."})); out.append(box); return; }
  const use=el("button",{class:"btn",type:"button",style:"margin-top:12px",text:"Use these values for "+area,onclick:()=>{
    FIELDS.forEach(([k])=>{ if(res.mps[k]!=null) S.scores[area][k]=String(res.mps[k]); });
    S.active=area; markDirty(); renderTabs(); renderArea();
    out.innerHTML=""; out.append(el("div",{class:"msg ok",text:"Values placed in "+area+". Check them, then press Save my entries."}));
    $("ecrFile").value="";
  }});
  box.append(use); out.append(box);
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
const A={pin:null,period:null,data:null,view:"status"};
$("toAdmin").onclick=()=>{ show("login",false); show("admin",true); show("adminLogin",true); show("adminBody",false); };
$("toTeacher").onclick=()=>{ show("admin",false); show("login",true); };
$("adminForm").addEventListener("submit",async(e)=>{
  e.preventDefault(); msg("adMsg","");
  const pin=$("adPin").value.trim();
  const r=await rpc("smea_admin_overview",{p_pin:pin,p_period:"00000000-0000-0000-0000-000000000000"});
  if(!r.ok){ msg("adMsg",errText(r)); return; }
  A.pin=pin; $("adPin").value=""; A.period=r.periods[0]?.id||null;
  show("adminLogin",false); show("adminBody",true); show("who",true); $("whoName").textContent="Coordinator"; $("pinBtn").classList.add("hidden");
  loadAdmin();
});
async function loadAdmin(){
  const r=await rpc("smea_admin_overview",{p_pin:A.pin,p_period:A.period||"00000000-0000-0000-0000-000000000000"});
  if(!r.ok){ alert(errText(r)); return; }
  A.data=r; renderAdmin();
}
function csv(rows){ return rows.map(r=>r.map(c=>{c=c==null?"":String(c); return /[",\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c;}).join(",")).join("\r\n"); }
function download(name,text){ const u=URL.createObjectURL(new Blob(["﻿"+text],{type:"text/csv"})); const a=el("a",{href:u,download:name}); document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),2000); }
function renderAdmin(){
  const d=A.data, b=$("adminBody"); b.innerHTML="";
  const per=d.periods.find(p=>p.id===A.period);
  const top=el("div",{class:"card"});
  const sel=el("select",{id:"adPeriod"}); d.periods.forEach(p=>sel.append(el("option",{value:p.id,text:p.label+(p.is_open?"":" (closed)")}))); sel.value=A.period;
  sel.onchange=()=>{A.period=sel.value;loadAdmin();};
  top.append(el("h2",{text:"Coordinator dashboard"}),el("div",{class:"row two",style:"margin-top:10px"},el("div",{},el("label",{for:"adPeriod",text:"Reporting period"}),sel)));
  const seg=el("div",{class:"seg",style:"margin-top:12px"});
  if(per) seg.append(el("button",{class:"btn soft sm",type:"button",text:per.is_open?"Close this period":"Reopen this period",onclick:async()=>{await rpc("smea_admin_period",{p_pin:A.pin,p_action:per.is_open?"close":"open",p_label:null,p_period:per.id});loadAdmin();}}));
  const nl=el("input",{type:"text",id:"newPer",placeholder:"e.g. SY 2026-2027 · Term 3","aria-label":"New period name"});
  seg.append(nl,el("button",{class:"btn sm",type:"button",text:"Add period",onclick:async()=>{ if(!nl.value.trim())return; const r=await rpc("smea_admin_period",{p_pin:A.pin,p_action:"create",p_label:nl.value,p_period:null}); if(!r.ok){alert(errText(r));return;} A.period=r.id; loadAdmin();}}));
  top.append(seg); b.append(top);

  const tabs=el("div",{class:"tabs"});
  [["status","Submission status"],["scores","MPS entries"],["llc","Least-learned"],["staff","Teachers and PINs"]].forEach(([k,l])=>tabs.append(el("button",{class:"tab",type:"button","aria-selected":String(A.view===k),text:l,onclick:()=>{A.view=k;renderAdmin();}})));
  b.append(tabs);

  const card=el("div",{class:"card"}); b.append(card);
  if(A.view==="status"){
    const done=d.teachers.filter(t=>t.active&&t.submitted>=t.expected).length, total=d.teachers.filter(t=>t.active).length;
    card.append(el("h2",{text:done+" of "+total+" teachers complete"}),el("p",{class:"hint",text:"Complete means all five MPS components entered for every learning area."}));
    const t=el("table"); t.append(el("thead",{},el("tr",{},...["Grade","Teacher","Areas complete","Progress","Last saved"].map(x=>el("th",{text:x})))));
    const tb=el("tbody"); d.teachers.filter(x=>x.active).forEach(x=>{
      const pct=Math.round(100*x.submitted/x.expected);
      tb.append(el("tr",{},el("td",{text:x.grade}),el("td",{text:x.name}),
        el("td",{},el("span",{class:"pill "+(x.submitted>=x.expected?"ok":x.submitted>0?"part":"none"),text:x.submitted+" / "+x.expected})),
        el("td",{},el("div",{class:"bar"},el("i",{style:"width:"+pct+"%"}))),
        el("td",{text:x.updated_at?new Date(x.updated_at).toLocaleString():"–"})));
    }); t.append(tb); card.append(el("div",{class:"tablewrap"},t));
  }
  if(A.view==="scores"){
    card.append(el("h2",{text:"MPS entries"}));
    card.append(el("div",{class:"seg",style:"margin-top:8px"},el("button",{class:"btn sm",type:"button",text:"Download CSV",onclick:()=>download("mps-"+(per?per.label:"period")+".csv",csv([["Grade","Teacher","Learning Area","WW","PT","ST1","ST2","TE","Term Average","Remarks"],...d.scores.map(s=>[s.grade,s.teacher,s.area,s.ww,s.pt,s.st1,s.st2,s.te,s.avg,s.remarks])]))})));
    const t=el("table"); t.append(el("thead",{},el("tr",{},...["Gr","Teacher","Area","WW","PT","ST1","ST2","TE","Avg"].map((x,i)=>el("th",{class:i>2?"n":"",text:x})))));
    const tb=el("tbody"); d.scores.forEach(s=>tb.append(el("tr",{},el("td",{text:s.grade}),el("td",{text:s.teacher}),el("td",{text:s.area}),...["ww","pt","st1","st2","te","avg"].map(k=>el("td",{class:"n",text:fmt(s[k])})))));
    if(!d.scores.length) tb.append(el("tr",{},el("td",{colspan:"9",text:"No entries yet for this period."})));
    t.append(tb); card.append(el("div",{class:"tablewrap"},t));
  }
  if(A.view==="llc"){
    card.append(el("h2",{text:"Least-learned competencies"}));
    card.append(el("div",{class:"seg",style:"margin-top:8px"},el("button",{class:"btn sm",type:"button",text:"Download CSV",onclick:()=>download("least-learned-"+(per?per.label:"period")+".csv",csv([["Grade","Teacher","Learning Area","Code","Competency","MPS","Action"],...d.llc.map(l=>[l.grade,l.teacher,l.area,l.code,l.competency,l.mps,l.action])]))})));
    const t=el("table"); t.append(el("thead",{},el("tr",{},...["Gr","Teacher","Area","Code","Competency","MPS","Action"].map((x,i)=>el("th",{class:i===5?"n":"",text:x})))));
    const tb=el("tbody"); d.llc.forEach(l=>tb.append(el("tr",{},el("td",{text:l.grade}),el("td",{text:l.teacher}),el("td",{text:l.area}),el("td",{text:l.code||""}),el("td",{text:l.competency}),el("td",{class:"n",text:fmt(l.mps)}),el("td",{text:l.action||""}))));
    if(!d.llc.length) tb.append(el("tr",{},el("td",{colspan:"7",text:"No competencies entered yet."})));
    t.append(tb); card.append(el("div",{class:"tablewrap"},t));
  }
  if(A.view==="staff"){
    card.append(el("h2",{text:"Teachers and PINs"}),el("p",{class:"hint",text:"PINs are stored scrambled and cannot be viewed. Reset one to generate a new 6-digit PIN, then give it to the teacher privately."}));
    const out=el("div",{id:"pinOut"}); card.append(out);
    const t=el("table"); t.append(el("thead",{},el("tr",{},...["ID","Grade","Teacher",""].map(x=>el("th",{text:x})))));
    const tb=el("tbody"); d.teachers.forEach(x=>tb.append(el("tr",{},el("td",{class:"num",text:x.code}),el("td",{text:x.grade}),el("td",{text:x.name}),el("td",{},el("button",{class:"btn soft sm",type:"button",text:"Reset PIN",onclick:async()=>{const r=await rpc("smea_admin_reset_pin",{p_pin:A.pin,p_teacher:x.id}); out.innerHTML=""; out.append(r.ok?el("div",{class:"msg ok"},"New PIN for "+x.name+" ("+x.code+"): ",el("span",{class:"pin",text:r.pin})):el("div",{class:"msg err",text:errText(r)})); out.scrollIntoView({block:"nearest"});}})))));
    t.append(tb); card.append(el("div",{class:"tablewrap"},t));
    const f=el("form",{class:"row two",style:"margin-top:16px"});
    const nm=el("input",{type:"text",placeholder:"Full name",required:true,"aria-label":"New teacher name"});
    const gr=el("select",{"aria-label":"Grade"}); for(let g=1;g<=6;g++) gr.append(el("option",{value:g,text:"Grade "+g}));
    f.append(nm,gr,el("button",{class:"btn",type:"submit",text:"Add teacher"}));
    f.addEventListener("submit",async(e)=>{e.preventDefault(); const r=await rpc("smea_admin_add_teacher",{p_pin:A.pin,p_name:nm.value,p_grade:Number(gr.value)}); out.innerHTML=""; if(r.ok){ out.append(el("div",{class:"msg ok"},"Teacher added. Teacher ID "+r.code+", PIN: ",el("span",{class:"pin",text:r.pin}))); loadAdmin(); } else out.append(el("div",{class:"msg err",text:errText(r)}));});
    card.append(f);
  }
}

