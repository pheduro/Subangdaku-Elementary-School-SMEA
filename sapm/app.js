const COMP=["WW","PT","ST 1","ST 2","TE"], T=75;
const mean=a=>{a=a.filter(x=>x!=null);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null};
const f1=v=>v==null?'–':v.toFixed(1);
const band=v=>v>=85?'b1':v>=80?'b2':v>=75?'b4':v>=70?'b5':'b6';
const BANDS=[['b6','Below 70'],['b5','70 to 74.9'],['b4','75 to 79.9'],['b2','80 to 84.9'],['b1','85 and above']];
const barColor=v=>v>=T?'var(--leaf)':v>=70?'var(--amber)':'var(--red)';
const cell=v=>v==null?'<td class="na">no data</td>':`<td class="c ${band(v)}">${f1(v)}</td>`;
const all=[];for(const g in D)D[g].forEach(r=>all.push({g:+g,a:r[0],c:r.slice(1,6),o:r[6]}));
const gr=g=>all.filter(r=>r.g===g);
const gm=(g,i)=>mean(gr(g).map(r=>i===5?r.o:r.c[i]));
const core=a=>{const s=a.toLowerCase();
 if(/mathem/.test(s))return'Mathematics';if(/^science/.test(s))return'Science';if(/^english/.test(s))return'English';if(/^filipino/.test(s))return'Filipino';
 if(/^gmrc/.test(s))return'GMRC';if(/araling/.test(s))return'Araling Panlipunan';if(/^makabansa/.test(s))return'MAKABANSA';if(/^mapeh/.test(s))return'MAPEH';if(/ict/.test(s))return'ICT';return null};
const el=id=>document.getElementById(id);

/* ---------- Motion: scroll reveal, growing bars, line drawing, count-up ---------- */
const REDUCE=matchMedia('(prefers-reduced-motion: reduce)').matches;
const io=(!REDUCE&&'IntersectionObserver' in window)?new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;const n=e.target;io.unobserve(n);n.classList.add('in');if(n._cu)n._cu()}),{threshold:.05,rootMargin:'0px 0px -6% 0px'}):null;
function motion(root){
  if(!io)return;
  const q=s=>[...root.querySelectorAll(s)];
  /* chart groups: bars, dots, lines and table rows animate when the group scrolls into view */
  q('.rows,#stk,#ptte,#swings,.two>div,.tw').forEach(g=>{
    if(g.dataset.m)return;g.dataset.m=1;g.classList.add('ag');
    ['.row','.db','.swing'].forEach(s=>g.querySelectorAll(s).forEach((n,i)=>n.style.setProperty('--i',Math.min(i,14))));
    g.querySelectorAll('tbody tr').forEach((n,i)=>{n.classList.add('rt');n.style.setProperty('--i',Math.min(i,12))});
    io.observe(g)});
  /* text, cards and list items fade up */
  q('.kpi,.card,.takeaway,.find,.lede,.ph,.two h4,ul.l li').forEach(n=>{
    if(n.dataset.r)return;n.dataset.r=1;n.classList.add('rv');
    n.style.setProperty('--i',Math.min([...n.parentNode.children].indexOf(n),7));io.observe(n)});
  /* numbers count up from zero */
  q('.kpi .v,.val').forEach(n=>{
    if(n._z!=null)return;const t=n.textContent,m=t.match(/\d+(\.\d+)?/);if(!m)return;
    const end=parseFloat(m[0]),dec=m[1]?m[1].length-1:0;
    const d0=n.classList.contains('val')?250+(+n.parentNode.style.getPropertyValue('--i')||0)*80:250;
    n._z=t.replace(m[0],(0).toFixed(dec));n.textContent=n._z;
    n._cu=()=>{const k=n._k=(n._k||0)+1,t0=performance.now()+d0;
      const step=now=>{if(n._k!==k)return;const p=Math.min(1,Math.max(0,(now-t0)/1000)),e=1-Math.pow(1-p,3);
        n.textContent=t.replace(m[0],(end*e).toFixed(dec));if(p<1)requestAnimationFrame(step)};
      requestAnimationFrame(step)};
    io.observe(n)});
}
/* replay a section's animations each time its tab is opened */
function replay(sec){
  if(!io||!sec)return;
  sec.querySelectorAll('.in').forEach(n=>{n.classList.remove('in');if(n._z!=null){n._k=(n._k||0)+1;n.textContent=n._z}io.observe(n)});
}
const bar=(n,v,tag)=>`<div class="row"><div class="n">${n}${tag||''}</div><div class="trk"><div class="fill" style="width:${v}%;background:${barColor(v)}"></div><div class="tgt" style="left:${T}%"></div></div><div class="val">${f1(v)}</div></div>`;
const legend=()=>BANDS.map(b=>`<span><i class="${b[0]}"></i>${b[1]}</span>`).join('');
const pos=v=>((Math.max(40,Math.min(100,v))-40)/60*100).toFixed(2);
function dumb3(label,pt,st1,st2,te){
  if(st1==null||st2==null||te==null)return`<div class="db w4"><div>${label}</div><div class="tr"><div class="tg" style="left:${pos(T)}%"></div>${pt==null?'':`<div class="dot pt" style="left:${pos(pt)}%"></div>`}</div><div class="gap gp">–</div><div class="gap gp">no TE</div></div>`;
  const g1=te-st1,g2=te-st2,v=[st1,st2,te],lo=Math.min(...v),hi=Math.max(...v);
  const fmt=g=>(g<0?'−':'+')+Math.abs(g).toFixed(1);
  const dot=(c,x)=>`<div class="dot ${c}" style="left:${pos(x)}%"></div>`;
  return`<div class="db w4"><div>${label}</div><div class="tr" title="PT ${f1(pt)}, ST 1 ${f1(st1)}, ST 2 ${f1(st2)}, TE ${f1(te)}"><div class="tg" style="left:${pos(T)}%"></div><div class="bridge" style="left:${pos(lo)}%;width:${(pos(hi)-pos(lo)).toFixed(2)}%"></div>${pt==null?'':dot('pt',pt)}${dot('st1',st1)}${dot('st2',st2)}${dot('te',te)}</div><div class="gap gp">${fmt(g1)}</div><div class="gap" style="color:${g2<=-10?'var(--tec)':'var(--fg)'}">${fmt(g2)}</div></div>`}
const HD3='<div class="db w4 hd"><div></div><div></div><div class="gap">vs ST 1</div><div class="gap">vs ST 2</div></div>';
const LEG3=(a,b,c,d)=>`<span><i class="o" style="background:var(--s1c)"></i>${a}</span><span><i class="o" style="background:var(--s2c)"></i>${b}</span><span><i class="o" style="background:var(--tec)"></i>${c}</span><span><i class="o" style="background:var(--card);border:2px solid var(--ptc);width:8px;height:8px"></i>${d}</span><span><span class="tgtkey" style="border-left-style:dashed"></span>75</span>`;
const tbl=(head,rows)=>'<thead><tr>'+head.map((h,i)=>`<th${i<1?' class="l"':''}>${h}</th>`).join('')+'</tr></thead><tbody>'+rows+'</tbody>';

/* ---------- Overview ---------- */
const nAll=all.length, ovAll=mean(all.map(r=>r.o)), ge75=all.filter(r=>r.o>=T).length;
const teRows=all.filter(r=>r.c[4]!=null), teLt75=teRows.filter(r=>r.c[4]<T).length, teLt70=teRows.filter(r=>r.c[4]<70).length;
const lowest=[...all].sort((a,b)=>a.o-b.o)[0];
el('kpis').innerHTML=
 `<div class="kpi"><div class="l">School average (overall MPS)</div><div class="v">${f1(ovAll)}</div><div class="s">across ${nAll} grade and area results</div></div>`+
 `<div class="kpi"><div class="l">Results at or above 75</div><div class="v">${ge75} of ${nAll}</div><div class="s">on overall MPS</div></div>`+
 `<div class="kpi"><div class="l">Term Exam below 75</div><div class="v">${teLt75} of ${teRows.length}</div><div class="s">the gap behind the overall scores</div></div>`+
 `<div class="kpi"><div class="l">Lowest overall result</div><div class="v">${f1(lowest.o)}</div><div class="s">Grade ${lowest.g} ${lowest.a}</div></div>`;
el('gbars').innerHTML=[1,2,3,4,5,6].map(g=>bar('Grade '+g,gm(g,5))).join('');
el('gtake').textContent='Grade 6 is the highest (82.4) and Grade 3 the lowest (72.4). Grades 1, 2, 4, 5 and 6 sit within three points of each other, so Grade 3 stands apart.';
el('bleg').innerHTML=legend();
el('stk').innerHTML=[1,2,3,4,5,6].map(g=>{const rs=gr(g);return`<div class="row" style="grid-template-columns:70px 1fr"><div class="n">Grade ${g}</div><div class="stk">`+BANDS.map(b=>{const n=rs.filter(r=>band(r.o)===b[0]).length;return n?`<span class="${b[0]}" style="flex:${n}" title="${b[1]}: ${n}">${n}</span>`:''}).join('')+'</div></div>'}).join('');
el('stktake').textContent='All six Grade 3 areas fall below 75. Outside Grade 3, only four results are under 75: Grade 4 MAPEH and Grade 5 Filipino, Araling Panlipunan and Mathematics.';
el('ptte').innerHTML=HD3+[1,2,3,4,5,6].map(g=>dumb3('Grade '+g,gm(g,1),gm(g,2),gm(g,3),gm(g,4))).join('')+dumb3('<b>School</b>',mean(all.map(r=>r.c[1])),mean(all.map(r=>r.c[2])),mean(all.map(r=>r.c[3])),mean(teRows.map(r=>r.c[4])));
el('ptte-take').textContent='The Term Exam is close to ST 2 in Grades 1, 2 and 5 (within 5 points), 7.6 points lower in Grade 6, and well below it in Grades 3 (12.4) and 4 (13.0). Against ST 1 it is more than 5 points lower only in Grade 4 (10.4), and higher in Grades 1 and 3, where ST 1 was weak. Performance Tasks are higher than the Term Exam in all six grades.';
const cn=['Written Work','Performance Task','Summative Test 1','Summative Test 2','Term Exam'];
el('cbars').innerHTML=cn.map((n,i)=>bar(n,mean(all.map(r=>r.c[i])))).join('');
el('ctake').textContent='The Term Exam (74.4) is the only component below 75. It is 7.4 points below ST 2 (81.7) and 1.5 below ST 1 (75.9). Performance Tasks (86.8) are 12.4 points higher.';
el('comp').innerHTML=tbl(['Grade',...COMP,'Overall'],[1,2,3,4,5,6].map(g=>`<tr><td class="l">Grade ${g}</td>`+[0,1,2,3,4,5].map(i=>cell(gm(g,i))).join('')+'</tr>').join('')+`<tr class="sum"><td class="l">School</td>`+[0,1,2,3,4].map(i=>cell(mean(all.map(r=>r.c[i])))).join('')+cell(ovAll)+'</tr>');
el('leg').innerHTML=legend();el('leg2').innerHTML=legend();

/* ---------- By grade ---------- */
const GR={
1:{lede:'Solid results, and the Term Exam is close to both Summative Tests. Reading and Language are the soft spot.',
 s:['Overall MPS is 80.8 and all seven learning areas are at or above 75.','Science (87.6) and ICT (84.4) lead the grade. The Term Exam average (80.1) is the highest of any grade.','The Term Exam (80.1) is about 5 points above ST 1 (74.7) and about 4 points below ST 2 (84.5), a small gap on both tests.'],
 c:['Reading and Literacy (76.3) and Language (77.5) are the lowest areas, with Term Exams of 71.9 and 71.6.','ST 1 is the lowest component (74.7). Reading and Literacy scored 68.6 and ICT 70.1 on it, while their Term Exams were 71.9 and 88.2.','Mathematics is 78.3 overall, with Written Work (74.6) and ST 1 (74.6) the weaker parts.'],
 i:['Start early reading support in Language and Reading and Literacy, because reading skill carries into every later grade.','Run item analysis on ST 1 for Reading and Literacy and ICT to find out what was missed, then re-teach those items.','Compare the competencies in the ICT ST 1 (70.1) with those in ST 2 (83.2) and the Term Exam (88.2) to see which ones were reached later.']},
2:{lede:'Strong overall, with Filipino, MAKABANSA and English exams pulling below the rest.',
 s:['Overall MPS is 81.3. Science (89.1) and GMRC (88.0) are among the highest results in the school.','Written Work (85.1) and Performance Tasks (87.9) are strong.','All six areas are at or above 75 overall.'],
 c:['The Term Exam is below 75 in three of six areas: Filipino (65.0), MAKABANSA (65.3) and English (73.6).','ST 1 (77.0) and the Term Exam (76.5) are the two lowest components. Filipino scored 59.9 and English 64.3 on ST 1.','Mathematics fell 27.4 points between ST 1 (91.3) and ST 2 (63.9), the largest drop in the school. The two tests cover different competencies, and the Term Exam (77.2) falls between them.','Filipino has a very high Written Work score (94.8) but its tests are the weakest in the grade.'],
 i:['Do item analysis on Filipino and MAKABANSA Term Exams and on the Mathematics ST 2 to find the competencies behind the drop.','Give Filipino a short, regular test-practice routine (a 10-item weekly check) because work output is strong and test results are not.','Compare the competencies covered by the Mathematics ST 1 and ST 2 (91.3 and 63.9) with those on the Term Exam (77.2), which mixes both, and check the scores for recording errors.','Share the Science and GMRC routines at a LAC, since both are among the best in the school.']},
3:{lede:'Highest priority. Learners do the work but are not showing mastery on tests.',
 s:['Performance Tasks are the highest in the school (93.1) and Written Work is solid (82.6).','ST 2 (72.7) is higher than ST 1 (53.2) in every area. The two tests cover different competencies, so this points to some competencies being stronger than others.','MAKABANSA (74.3) and Science (74.2) are the closest to 75.'],
 c:['Lowest overall MPS of any grade (72.4). All six areas are below 75, from MAKABANSA at 74.3 down to Filipino at 67.9.','The Term Exam is 60.3, between ST 1 (53.2) and ST 2 (72.7). Filipino (53.4) and English (58.2) are the lowest Term Exam results in the grade.','ST 1 averages 53.2, with Filipino 40.8, Mathematics 42.5, GMRC 48.5 and Science 55.0. This is the weakest component result in the school.','The Term Exam is below ST 2 in every area, by 12.4 points on average. Filipino is 19.3 points lower, MAKABANSA 14.6 and Mathematics 13.1.','The overall MPS is low here because tests are low. Performance Tasks are lifting it.'],
 i:['Treat this as a whole-grade recovery. Since every subject test is low, run a reading-comprehension screening (e.g., Phil-IRI) first, because difficulty reading questions would lower scores in all subjects.','Look first at which competencies ST 1 covered (53.2) compared with ST 2 (72.7) and the Term Exam (60.3). If ST 1 held the harder competencies, those are the ones to reteach. Also check the ST 1 records for recording errors.','Filipino and Mathematics first: item analysis of ST 1 and the Term Exam, then 3 short sessions a week (about 30 minutes) on the least-learned competencies, built into ARAL time where learners qualify.','Moderate Performance Tasks: two teachers co-score five samples per task using the same rubric to check that PT scores of 87 to 97 reflect mastery.','Share one Grade 3 progress update per month with the School Head.']},
4:{lede:'Good overall, but the Term Exam is the weak spot in eight of 13 results.',
 s:['Overall MPS is 81.4. EPP – AFA/FCS/IA (88.0), Music and Arts (87.3) and PE and Health (86.3) lead.','ST 2 is strong (85.4) and Performance Tasks are high (86.3).','Twelve of 13 rows are at or above 75 overall.'],
 c:['MAPEH (72.0) is the only row under 75, and Mathematics (75.0) sits right on the line.','The Term Exam averages 72.4 and is below 75 in eight of 13 rows. Filipino is 58.2, Mathematics 65.4, Science 63.1 and MAPEH 62.7.','Filipino ST 1 is 88.8 and ST 2 is 81.3, but its Term Exam is 58.2, which is 23.1 points below ST 2.','The Term Exam is at least 10 points below ST 2 in 9 of 13 rows.','The grade lists both "Music and Arts" and "music and arts", and both "PE and Health" and "PE & Health", as separate rows, plus a MAPEH row.'],
 i:['Do item analysis on the Term Exam for Filipino, Science, Mathematics and MAPEH, then teach the least-learned competencies in short sessions.','Ask the grade teachers to confirm which MAPEH, Music and Arts and PE and Health rows are current, and why the MAPEH row (72.0) is lower than the Music and Arts and PE and Health rows.','Add a cumulative review week before each Term Exam and a weekly 10-item check in Filipino, Science and Mathematics.','Keep the Written Work, ST 2 and EPP routines that are already working.']},
5:{lede:'Mixed. Mathematics, Filipino and Araling Panlipunan need support, and two rows have incomplete records.',
 s:['Overall MPS is 79.6. EPP – ICT (84.9), Music and Art (84.1) and GMRC (83.1) lead.','Performance Tasks are high (86.3), and Science and EPP – ICT summative tests are steady in the 80s.','Nine of 12 rows are at or above 75 overall.'],
 c:['Three areas are under 75: Mathematics (71.4), Araling Panlipunan (73.5) and Filipino (73.6).','Mathematics Term Exam is 54.4, the lowest exam result in the school outside Grade 3. Filipino TE is 60.1, about 9 to 10 points below both of its Summative Tests (70.2 and 69.3). Mathematics is 21.2 points below its ST 2 (75.6).','Written Work is the lowest of any grade (78.1). Araling Panlipunan Written Work is 70.0 and its ST 2 is 62.7.','PE AND HEALTH and MUSIC AND ARTS have Written Work and Performance Task scores only. ST 1, ST 2 and TE are blank.'],
 i:['Mathematics and Filipino first: item analysis of the Term Exam, then 3 short sessions a week on the least-learned competencies.','Check Written Work completion in Araling Panlipunan and Mathematics with a weekly checklist and a make-up window.','Review the Araling Panlipunan ST 2 paper (62.7) for topics not mastered and re-teach them.','Complete the missing ST 1, ST 2 and TE scores for the two rows with blanks, or confirm that those rows should be dropped.']},
6:{lede:'The strongest grade. The problem is specific to Mathematics.',
 s:['Highest overall MPS (82.4). All eight areas are at or above 75.','GMRC (90.1) is the best result in the school. Filipino (85.9) and English (85.1) follow, and the Filipino ST 2 reached 98.9.','ST 2 (87.1) is the highest summative test average of any grade, and the Term Exam (79.4) is about the same as ST 1 (79.5).'],
 c:['Mathematics is the lowest area (76.3) and its Term Exam is 61.6, which is 15.6 points below ST 2 (77.2) and 17.2 below ST 1 (78.8).','TLE – ICT Term Exam (73.2) and Science Term Exam (70.1) are also below 75.','ST 1 is uneven: Araling Panlipunan 71.3, MAPEH 73.2 and Science 74.3, while GMRC is 95.9.','Filipino went from 75.8 on ST 1 to 98.9 on ST 2, and English from 78.5 to 93.7. The Term Exam (91.2 and 84.8) falls between the two, which fits tests that cover different competencies.'],
 i:['Run item analysis on the Mathematics Term Exam and use ARAL Math for learners below 75.','Review the Science and TLE – ICT Term Exams for the competencies that were not mastered.','Hold a LAC where Grade 6 teachers show their GMRC, Filipino and English routines to Grades 3 to 5.','Compare the competencies covered by ST 1 and ST 2 in Filipino and English to see which ones the Term Exam favored.']}
};
let curG=3;
function gradeView(g){
  const rs=gr(g), c=GR[g];
  const list=rs.map((r,i)=>`<tr><td class="l">${r.a}</td>`+r.c.map(cell).join('')+cell(r.o)+'</tr>').join('');
  el('gbody').innerHTML=`<h3>Grade ${g} · overall MPS ${f1(gm(g,5))}</h3><p class="lede" style="margin-top:6px">${c.lede}</p>
  <div class="two"><div><h4>Grade ${g} MPS by learning area</h4><div class="tw"><table>${tbl(['Learning area',...COMP,'Overall'],list)}</table></div><div class="legend">${legend()}</div></div>
  <div><h4>Summative Tests and Term Exam by learning area</h4>${HD3}${rs.map(r=>dumb3(r.a,r.c[1],r.c[2],r.c[3],r.c[4])).join('')}<div class="legend">${LEG3('ST 1','ST 2','TE','PT (context)')}</div></div></div>
  <div class="two" style="margin-top:18px"><div><h4>Strengths</h4><ul class="l">${c.s.map(x=>`<li>${x}</li>`).join('')}</ul><h4>Concerns</h4><ul class="l">${c.c.map(x=>`<li>${x}</li>`).join('')}</ul></div><div><h4>Possible interventions</h4><ul class="l">${c.i.map(x=>`<li>${x}</li>`).join('')}</ul></div></div>`;
  motion(el('gbody'));
}
el('gchips').innerHTML='';[1,2,3,4,5,6].forEach(g=>{const b=document.createElement('button');b.className='chip';b.textContent='Grade '+g;b.setAttribute('aria-pressed',g===curG);b.onclick=()=>{curG=g;[...el('gchips').children].forEach(x=>x.setAttribute('aria-pressed',x===b));gradeView(g)};el('gchips').appendChild(b)});
gradeView(curG);

/* ---------- By learning area ---------- */
const subs=['Mathematics','English','Filipino','Science','GMRC','MAKABANSA','Araling Panlipunan','MAPEH','ICT'];
el('xg').innerHTML=tbl(['Learning area','Gr 1','Gr 2','Gr 3','Gr 4','Gr 5','Gr 6'],subs.map(s=>`<tr><td class="l">${s}</td>`+[1,2,3,4,5,6].map(g=>{const m=gr(g).filter(r=>core(r.a)===s);return m.length?cell(m[0].o):'<td class="na">–</td>'}).join('')+'</tr>').join('')+
 '<tr><td class="l">Language</td><td class="c '+band(77.5)+'">77.5</td><td class="na">–</td><td class="na">–</td><td class="na">–</td><td class="na">–</td><td class="na">–</td></tr><tr><td class="l">Reading and Literacy</td><td class="c '+band(76.3)+'">76.3</td><td class="na">–</td><td class="na">–</td><td class="na">–</td><td class="na">–</td><td class="na">–</td></tr>');
const AREAS=[
 {k:'Mathematics',sel:r=>core(r.a)==='Mathematics',ser:[['Mathematics',r=>true]],
  lede:'Exam scores fall as the grades go up, while task scores stay high.',
  shows:['Overall: 78.3, 78.1, 72.3, 75.0, 71.4 and 76.3 for Grades 1 to 6. Grades 3 and 5 are under 75 and Grade 4 is exactly 75.0.','Term Exam falls from 83.1 and 77.2 in Grades 1 and 2 to 63.9, 65.4, 54.4 and 61.6 in Grades 3 to 6.','Against ST 2, the Term Exam is 3.7 points higher in Grade 1 and 13.3 higher in Grade 2, then 13.1 lower in Grade 3, 6.4 in Grade 4, 21.2 in Grade 5 and 15.6 in Grade 6. Performance Tasks stay between 80.9 and 92.6 in Grades 3 to 6.','Grade 2 fell 27.4 points between ST 1 and ST 2, and Grade 3 ST 1 (42.5) is the lowest Mathematics result in the school.'],
  iv:['Start in Grade 3, where the gap first becomes large, rather than waiting until Grade 5.','Use Term Exam item analysis to list the least-learned Math competencies per grade and teach them in 3 short sessions a week.','Use ARAL Math for learners below 75 and share a common 10-item weekly check across Grades 3 to 6.','Hold one Math-focused LAC on aligning tasks with tests (worked examples, problem solving, number sense).']},
 {k:'English',sel:r=>core(r.a)==='English',ser:[['English',r=>true]],
  lede:'Strong in Grades 4 and 6, weak in Grade 3 and uneven in between.',
  shows:['Overall: 78.9, 73.0, 84.2, 77.1 and 85.1 for Grades 2 to 6. Only Grade 3 is under 75.','Grade 3 Term Exam is 58.2 against ST 1 and ST 2 of 64.8 and 65.2 (Performance Tasks 92.5). Grade 5 Term Exam is 67.2, which is 13.6 below ST 2 (80.8).','Grade 2 ST 1 (64.3) and ST 2 (80.5) are 16.2 points apart, and the Term Exam (73.6) falls between them.','Grade 4 and Grade 6 are among the strongest English results, with Term Exams of 80.8 and 84.8.'],
  iv:['Run item analysis on the Grade 3 and Grade 5 English Term Exams.','Use reading-comprehension practice (short passages with questions) in Grades 3 and 5.','Ask Grade 4 and Grade 6 English teachers to share their test-preparation routines at a LAC.']},
 {k:'Filipino',sel:r=>core(r.a)==='Filipino',ser:[['Filipino',r=>true]],
  lede:'The weakest exam results in the school, in four grades in a row.',
  shows:['Overall: 77.6, 67.9, 78.0, 73.6 and 85.9 for Grades 2 to 6. Grade 3 is the lowest result in the school and Grade 5 is also under 75.','Term Exam is 65.0, 53.4, 58.2 and 60.1 in Grades 2 to 5, and then 91.2 in Grade 6. The five-grade Term Exam average is 65.6, the lowest of any subject.','The Term Exam is 14.3, 19.3, 23.1 and 9.2 points below ST 2 in Grades 2 to 5, while Performance Tasks are 89 or higher in all four.','Grade 3 ST 1 is 40.8. Grade 6 ST 2 is 98.9, up from 75.8.'],
  iv:['Make Filipino the first subject for item analysis in Grades 2 to 5.','Hold a LAC where the Grade 6 Filipino teacher shares what produced the 91.2 Term Exam.','Add a weekly 10-item check that uses the same question styles as the Term Exam.','Compare the competencies covered by ST 1 and ST 2 in Grades 3 and 6, and check the records for recording errors.']},
 {k:'Science',sel:r=>core(r.a)==='Science',ser:[['Science',r=>true]],
  lede:'Very strong in Grades 1 and 2, weaker from Grade 3 onward.',
  shows:['Overall: 87.6, 89.1, 74.2, 76.2, 82.4 and 77.8 for Grades 1 to 6. Only Grade 3 is under 75.','Term Exam is 90.5 and 93.7 in Grades 1 and 2, then 64.3, 63.1, 83.6 and 70.1 in Grades 3 to 6.','Grade 3 ST 1 is 55.0 and ST 2 is 74.6. Grade 6 ST 1 is 74.3.','Grade 5 Science is steady (ST 1, ST 2 and TE all between 83.2 and 84.2).'],
  iv:['Use the Grade 5 Science routines as a model for Grades 3, 4 and 6.','Run item analysis on the Grade 3, Grade 4 and Grade 6 Science Term Exams.','Add hands-on tasks and a short test on the same competency so tasks and tests line up.']},
 {k:'GMRC',sel:r=>core(r.a)==='GMRC',ser:[['GMRC',r=>true]],
  lede:'Often the strongest area, with one clear exception in Grade 3.',
  shows:['Overall: 80.9, 88.0, 72.7, 85.1, 83.1 and 90.1 for Grades 1 to 6. Grade 3 is the only one under 75.','Grade 6 GMRC is the best result in the school (90.1).','Grade 3 ST 1 is 48.5 and Term Exam 61.5 against a Performance Task of 95.6. Grade 4 Term Exam is 69.2 against ST 2 of 93.4.'],
  iv:['Check whether the Grade 3 GMRC tests measure the same competencies as the tasks.','Review the Grade 4 Term Exam paper, since ST 1 and ST 2 are both close to 90 and the exam is not.','Share the Grade 6 GMRC practice at a LAC.']},
 {k:'MAKABANSA and Araling Panlipunan',sel:r=>['MAKABANSA','Araling Panlipunan'].includes(core(r.a)),ser:[['MAKABANSA',r=>core(r.a)==='MAKABANSA'],['Araling Panlipunan',r=>core(r.a)==='Araling Panlipunan']],
  lede:'MAKABANSA falls each year from Grade 1 to Grade 3, and Araling Panlipunan dips in Grade 5.',
  shows:['MAKABANSA overall: 80.9, 75.9 and 74.3 in Grades 1 to 3. Its Term Exam falls from 77.9 to 65.3 to 60.7.','Araling Panlipunan overall: 82.2, 73.5 and 81.8 in Grades 4 to 6.','Grade 5 Araling Panlipunan has the lowest Written Work in the school (70.0) and a ST 2 of 62.7.','Grade 2 MAKABANSA ST 1 and ST 2 are 72.4 and 73.3, and its Term Exam is 65.3.'],
  iv:['Run item analysis on the Grade 2 and Grade 3 MAKABANSA Term Exams.','Check Written Work completion in Grade 5 Araling Panlipunan and review the ST 2 paper.','Use shared concept-mapping or short-answer practice, since both areas rely on reading and recall.']},
 {k:'MAPEH',sel:r=>/mapeh|music|^pe\b|pe and|pe &/i.test(r.a),ser:[['MAPEH',r=>core(r.a)==='MAPEH']],
  lede:'The MAPEH row in Grade 4 is lower than the Music and Arts and PE and Health rows beside it.',
  shows:['MAPEH overall: 72.0 (Grade 4), 78.7 (Grade 5) and 78.9 (Grade 6).','Grade 4 lists Music and Arts at 87.3 and 81.9, and PE and Health at 86.3 and 79.5, as separate rows next to a MAPEH row of 72.0.','Grade 4 MAPEH Term Exam is 62.7. Grade 6 MAPEH ST 1 and ST 2 are 73.2 and 74.5.','Grade 5 lists PE AND HEALTH and MUSIC AND ARTS with Written Work and Performance Task scores only.'],
  iv:['Confirm with Grade 4 and Grade 5 teachers how MAPEH is recorded (one combined row or separate component rows) and remove duplicates.','Run item analysis on the Grade 4 MAPEH Term Exam.','Complete the missing summative scores for Grade 5 PE and Health and Music and Arts, or drop the rows.']},
 {k:'EPP, TLE and ICT',sel:r=>/epp|tle|ict/i.test(r.a),ser:[['ICT',r=>core(r.a)==='ICT'],['AFA/FCS/IA',r=>/afa/i.test(r.a)]],
  lede:'The steadiest group in the school, with every result at or above 81.9.',
  shows:['ICT: 84.4 (Grade 1), 82.3 (Grade 4), 84.9 (Grade 5) and 83.4 (Grade 6).','EPP – AFA/FCS/IA: 88.0 (Grade 4) and 81.9 (Grade 5).','The only part below 75 is Grade 6 TLE – ICT Term Exam (73.2) and Grade 1 ICT ST 1 (70.1).'],
  iv:['Keep the current practice.','Share what works at a LAC.','Check the Grade 6 TLE – ICT Term Exam and the Grade 1 ICT ST 1 paper.']},
 {k:'Grade 1 Language and Reading',sel:r=>r.g===1&&/language|reading/i.test(r.a),ser:[['Language',r=>/language/i.test(r.a)],['Reading and Literacy',r=>/reading/i.test(r.a)]],
  lede:'The two lowest Grade 1 areas, held back by test results.',
  shows:['Language overall is 77.5 and Reading and Literacy 76.3. Both are at or above 75, with little margin.','Term Exams are 71.6 and 71.9, and ST 1 is 74.2 and 68.6.','Against ST 2 (83.8 and 81.0), the Term Exams are 12.2 and 9.1 points lower. Performance Tasks are 80.6 and 79.6.'],
  iv:['Run item analysis on the ST 1 and Term Exam for both areas.','Start daily guided reading with questions in Grade 1.','Use a Phil-IRI style screening early in the year to find learners who need support.']}
];
let curA=0;
const LC=['var(--ptc)','var(--tec)','var(--amber)'];
function lineChart(a){
  const W=560,H=250,L=36,B=26,R=14,x=g=>L+(g-1)/5*(W-L-R),y=v=>H-B-(Math.max(50,Math.min(100,v))-50)/50*(H-B-10);
  const rowsOf=f=>[1,2,3,4,5,6].map(g=>{const m=all.filter(r=>r.g===g&&a.sel(r)&&f(r));return m.length?[g,mean(m.map(r=>r.o)),mean(m.map(r=>r.c[1])),mean(m.map(r=>r.c[4]))]:null});
  let lines=[];
  if(a.ser.length===1){const p=rowsOf(a.ser[0][1]);lines=[['Overall',p.map(q=>q&&[q[0],q[1]]),'var(--ptc)',''],['Performance Task',p.map(q=>q&&[q[0],q[2]]),'var(--amber)','4 3'],['Term Exam',p.map(q=>q&&[q[0],q[3]]),'var(--tec)','']]}
  else lines=a.ser.map((s,i)=>[s[0]+' overall',rowsOf(s[1]).map(q=>q&&[q[0],q[1]]),LC[i],'']).concat(a.ser.map((s,i)=>[s[0]+' Term Exam',rowsOf(s[1]).map(q=>q&&[q[0],q[3]]),LC[i],'4 3']));
  let s=`<svg class="svgc" viewBox="0 0 ${W} ${H}" role="img" aria-label="${a.k} scores by grade">`;
  for(let v=50;v<=100;v+=10)s+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${v}</text>`;
  for(let g=1;g<=6;g++)s+=`<text x="${x(g)}" y="${H-8}" text-anchor="middle">Gr ${g}</text>`;
  s+=`<line x1="${L}" x2="${W-R}" y1="${y(75)}" y2="${y(75)}" stroke="var(--red)" stroke-dasharray="3 3"/>`;
  s+='<g class="lg">';
  lines.forEach(l=>{const pts=l[1].filter(Boolean);if(!pts.length)return;s+=`<polyline fill="none" stroke="${l[2]}" stroke-width="2.4" ${l[3]?`stroke-dasharray="${l[3]}"`:''} points="${pts.map(p=>x(p[0])+','+y(p[1])).join(' ')}"/>`+pts.map(p=>`<circle cx="${x(p[0])}" cy="${y(p[1])}" r="3.6" fill="${l[2]}"><title>${l[0]} Grade ${p[0]}: ${f1(p[1])}</title></circle>`).join('')});
  s+='</g></svg><div class="legend">'+lines.map(l=>`<span><i style="background:${l[2]};${l[3]?'opacity:.6':''}"></i>${l[0]}</span>`).join('')+'<span><span class="tgtkey" style="border-left-style:dashed"></span>75</span></div>';
  return s}
function areaView(i){
  const a=AREAS[i],rs=all.filter(a.sel).sort((p,q)=>p.g-q.g);
  el('abody').innerHTML=`<h3>${a.k}</h3><p class="lede" style="margin-top:6px">${a.lede}</p>
  <div class="two"><div><h4>${a.k} scores by grade</h4>${lineChart(a)}</div><div><h4>${a.k} MPS by grade</h4><div class="tw"><table>${tbl(['Grade · area',...COMP,'Overall'],rs.map(r=>`<tr><td class="l">G${r.g} · ${r.a}</td>`+r.c.map(cell).join('')+cell(r.o)+'</tr>').join(''))}</table></div></div></div>
  <div class="two" style="margin-top:18px"><div><h4>What the results show</h4><ul class="l">${a.shows.map(x=>`<li>${x}</li>`).join('')}</ul></div><div><h4>Possible interventions</h4><ul class="l">${a.iv.map(x=>`<li>${x}</li>`).join('')}</ul></div></div>`;
  motion(el('abody'))}
el('achips').innerHTML='';AREAS.forEach((a,i)=>{const b=document.createElement('button');b.className='chip';b.textContent=a.k;b.setAttribute('aria-pressed',i===0);b.onclick=()=>{[...el('achips').children].forEach(x=>x.setAttribute('aria-pressed',x===b));areaView(i)};el('achips').appendChild(b)});
areaView(0);

/* ---------- Findings ---------- */
const F=[
 ['Overall MPS looks healthy, but the Term Exam does not',`42 of 52 grade-and-area results are at or above 75 overall, yet the Term Exam is below 75 in ${teLt75} of ${teRows.length} and below 70 in ${teLt70} of ${teRows.length}. High Performance Task (86.8) and Written Work (80.7) scores lift the overall figure and hide weaker test results.`],
 ['Grade 3 needs the most support',`All six Grade 3 areas are under 75 overall (72.4 on average). Performance Tasks are 93.1, the highest in the school, while ST 1 is 53.2 and the Term Exam 60.3. Its Term Exam is below ST 2 in every area, by 12.4 points on average. Outside Grade 3, only four of 46 results are under 75.`],
 ['The Term Exam is well below the Summative Tests in Grades 3 and 4','ST 2 is the closest match to the Term Exam, since the exam draws mostly on it. Against ST 2, the Term Exam is 12.4 points lower in Grade 3, 13.0 in Grade 4 and 7.6 in Grade 6, and within 5 points in Grades 1, 2 and 5. Across the school, 22 of 50 results with both scores have a Term Exam at least 10 points below ST 2, and 9 of them are in Grade 4. Performance Tasks (86.8) are higher than every test, so they are read separately.'],
 ['Mathematics and Filipino are the clearest learning-area concerns','Mathematics has the lowest overall average (75.2) among areas taught in three or more grades and is under 75 in Grades 3 (72.3) and 5 (71.4), with Grade 4 at 75.0. Filipino has the lowest Term Exam average (65.6) and its Term Exam is under 66 in every grade from 2 to 5, then 91.2 in Grade 6.'],
 ['Some results swing sharply between the two Summative Tests','Grade 3 Mathematics rose 34.5 points from ST 1 (42.5) to ST 2 (77.0) and Grade 3 Filipino rose 31.9. Grade 2 Mathematics fell 27.4 (91.3 to 63.9). Eleven results moved by 15 points or more. ST 1 and ST 2 cover different competencies, so these swings most likely reflect which topics each test covered. The Term Exam mixes both, mostly from ST 2, so it is read against ST 2 first. Item analysis can confirm.'],
 ['Grade 6 is strong except in Mathematics','Grade 6 has the highest overall MPS (82.4) and the strongest ST 2 (87.1). Its one clear problem is Mathematics, with a Term Exam of 61.6 against ST 2 of 77.2 and Performance Tasks of 86.0.'],
 ['Some records need cleaning before the next report','Grade 4 and Grade 5 list the same area twice under different spellings (for example "Music and Arts" and "music and arts"), and two Grade 5 rows have no summative or exam scores. These rows are included as they appear in the files and may affect the averages.']
];
el('finds').innerHTML=F.map((f,i)=>`<div class="find"><div class="n">${i+1}</div><div><h3>${f[0]}</h3><p>${f[1]}</p></div></div>`).join('');
const sw=[];all.forEach(r=>{if(r.c[2]!=null&&r.c[3]!=null&&Math.abs(r.c[3]-r.c[2])>=15)sw.push({l:`G${r.g} ${r.a}`,d:r.c[3]-r.c[2],a:r.c[2],b:r.c[3]})});sw.sort((p,q)=>q.d-p.d);
el('swings').innerHTML=sw.map(s=>{const w=Math.min(50,Math.abs(s.d)/40*50);return`<div class="swing"><div>${s.l}</div><div class="tr" title="ST 1 ${f1(s.a)} to ST 2 ${f1(s.b)}"><div class="sb" style="${s.d>=0?`left:50%;background:var(--leaf)`:`right:50%;background:var(--red)`};transform-origin:${s.d>=0?'left':'right'};width:${w}%"></div></div><div class="val" style="font-size:13px">${s.d>0?'+':'−'}${Math.abs(s.d).toFixed(1)}</div></div>`}).join('');

/* ---------- Plan ---------- */
const PH=[
 ['Phase 1 · First 2 weeks','Share the results and find out exactly what learners missed.',[
  ['Present the SAPM results to teachers (faculty meeting or LAC), focusing on the Term Exam gap, Grade 3 and Mathematics.','School Head, L&D Coordinator','Minutes and attendance (MOV)'],
  ['Check which competencies the Grade 3 ST 1 covered, and the class records (Filipino 40.8, Mathematics 42.5, GMRC 48.5, Science 55.0), for difficulty or recording errors.','Grade 3 teachers, grade-level chair','Short review note per subject'],
  ['Run item analysis on the Term Exam and the weakest summative tests, starting with all Grade 3 areas, Grade 5 Mathematics and Filipino, Grade 4 Filipino, and Grade 6 Mathematics.','Subject teachers with grade-level chairs','List of least-learned competencies per grade and area'],
  ['List learners scoring below 75 in Mathematics and Filipino (Grades 3 to 6) and match them to ARAL sessions.','Class advisers, ARAL coordinator','Learner list per section'],
  ['Clean the MPS records: merge or remove duplicate rows in Grades 4 and 5 and complete or drop the two Grade 5 rows with blank scores.','Grade 4 and 5 teachers, School Head','Corrected MPS consolidation']]],
 ['Phase 2 · Weeks 3 to 8','Teach the missed competencies and strengthen how tasks and tests line up.',[
  ['Targeted sessions (about 30 minutes, 3 times a week) in Filipino and Mathematics for Grade 3 first, then Grades 4 to 6, using the least-learned competencies and a 10-item weekly check.','Filipino and Math teachers, ARAL tutors','Weekly check results; session logs'],
  ['Reading-comprehension screening for Grades 3 to 5 (e.g., Phil-IRI), then 15 minutes of daily reading with questions across subjects.','English and Filipino teachers, advisers','Screening results; reading log'],
  ['LAC session on aligning Performance Tasks and tests: co-score five PT samples per grade using one rubric and compare to test results.','L&D Coordinator, grade-level teachers','LAC documentation; moderated rubrics'],
  ['Check Written Work completion in Grade 5 (Araling Panlipunan, Mathematics) with a weekly checklist and a make-up window.','Subject teachers','Completion checklist'],
  ['Add a cumulative review week before each Term Exam in Grades 3 to 5 and a weekly 5 to 10 item check in the weaker subjects.','Subject teachers','Check results; review schedule']]],
 ['Phase 3 · Next assessment cycle','Check whether the gaps are closing and keep what works.',[
  ['Re-run the MPS consolidation and compare with this baseline (Term Exam, the gap between the Term Exam and ST 2, and the ten results under 75).','L&D Coordinator, School Head','Updated SAPM results'],
  ['Share what worked (e.g., Grade 6 GMRC, Filipino and English; Grade 2 Science and GMRC) at a LAC and keep the effective routines.','Teachers, L&D Coordinator','LAC documentation'],
  ['Report progress and decide what to continue, adjust or stop.','School Head','Short progress report']]]];
el('plan').innerHTML=PH.map(p=>`<div class="ph">${p[0]}</div><p style="margin:2px 0 8px;color:var(--muted)">${p[1]}</p><div class="tw"><table>${tbl(['Action','Who','Output / MOV'],p[2].map(r=>`<tr>${r.map((c,i)=>`<td style="text-align:left;vertical-align:top;padding:7px 8px;border-bottom:1px solid var(--line);${i==0?'min-width:260px;':'min-width:140px;'}">${c}</td>`).join('')}</tr>`).join(''))}</table></div>`).join('');
el('targets').innerHTML=tbl(['Measure','Now','Target'],[
 ['Grade-and-area results under 75 overall',`${nAll-ge75} of ${nAll}`,`0 of ${nAll}`],
 ['Term Exam results under 75',`${teLt75} of ${teRows.length}`,`Fewer than 13 of ${teRows.length}`],
 ['Grade 3 overall MPS','72.4','75 or higher'],
 ['Grade 3 Term Exam below ST 2','12.4 points','6 points or less'],
 ['Grade 3 ST 1 average','53.2','65 or higher'],
 ['Grade 5 Mathematics Term Exam','54.4','65 or higher'],
 ['Grade 6 Mathematics Term Exam','61.6','70 or higher']].map(r=>`<tr><td class="l" style="white-space:normal">${r[0]}</td><td class="c" style="background:var(--track)">${r[1]}</td><td class="c" style="background:var(--track)">${r[2]}</td></tr>`).join(''));

/* ---------- Data ---------- */
el('all').innerHTML=tbl(['Grade','Learning area',...COMP,'Overall'],all.map(r=>`<tr><td class="l">${r.g}</td><td class="l">${r.a}</td>`+r.c.map(cell).join('')+cell(r.o)+'</tr>').join(''));
el('notes').innerHTML=[
 'These are school-level Mean Percentage Scores. They do not show how many learners are below the benchmark, nor results per section or competency.',
 'ST 1 and ST 2 cover different competencies, and the Term Exam mixes both, mostly from ST 2. The charts therefore compare the Term Exam with the Summative Tests (ST 2 first). Performance Tasks are shown for context and are not used in those gaps.',
 'A high Performance Task score with a low Term Exam score can mean learners understand the activity but not the test, or that tasks are scored more leniently than tests. Item analysis and rubric moderation will show which.',
 'Targets above are proposals. The school should confirm or change them.',
 'The 75 benchmark is a reference line used on this page for easy reading and is not an official proficiency level.',
 'Grade 4 lists "Music and Arts" and "music and arts", and "PE and Health" and "PE & Health", as separate rows. Grade 5 lists "MUSIC AND ART" and "MUSIC AND ARTS", and its PE AND HEALTH and MUSIC AND ARTS rows have no ST 1, ST 2 or TE. All rows are counted as they appear.',
 'Grade 1 lists Language and Reading and Literacy in place of English, so it has no English row.',
 'The files contain no learner names or learner counts.'].map(t=>`<li>${t}</li>`).join('');
const csv='Grade,Learning area,WW,PT,ST 1,ST 2,TE,Overall\n'+all.map(r=>[r.g,'"'+r.a+'"',...r.c.map(v=>v==null?'':v),r.o].join(',')).join('\n');
el('copy').onclick=async()=>{try{await navigator.clipboard.writeText(csv);el('copied').textContent='Copied to clipboard.'}catch(e){el('csvbox').innerHTML='<textarea class="csv" id="ta" readonly></textarea>';const t=el('ta');t.value=csv;t.focus();t.select();el('copied').textContent='Select all and copy.'}};

motion(document);

/* ---------- Navigation ---------- */
const SEC=[['overview','Overview'],['grades','By grade level'],['areas','By learning area'],['findings','Key findings'],['plan','Interventions and action plan'],['data','Data and notes']];
SEC.forEach(s=>{const b=document.createElement('button');b.className='nt';b.id='t-'+s[0];b.textContent=s[1];b.setAttribute('role','tab');b.onclick=()=>show(s[0],true);el('nav').appendChild(b)});
function show(k,push){if(!SEC.some(s=>s[0]===k))k='overview';SEC.forEach(s=>{el('s-'+s[0]).hidden=s[0]!==k;el('t-'+s[0]).setAttribute('aria-selected',s[0]===k)});replay(el('s-'+k));if(push){try{location.hash=k}catch(e){}}}
addEventListener('hashchange',()=>show((location.hash||'').replace('#',''),false));
show((location.hash||'').replace('#',''),false);
