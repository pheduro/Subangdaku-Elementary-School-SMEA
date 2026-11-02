/* Enrollment projection for the Enrollment page.
   Everything is calculated from SMEA.enrollment.levels, so updating data/smea.js updates this section.
   Class counts follow the Enhanced Planning Parameters in DM-HROD-2022-0635 (divide by the maximum class size,
   round down, add a class when the remainder reaches the threshold). */
(function(){
  // [min, max, threshold above 100 learners, teacher factor]
  var RULE = [[25,30,15,.5],[30,35,18,1],[30,35,18,1],[30,35,18,7/6],[40,45,23,7/6],[40,45,23,7/6],[40,45,23,7/6]];

  function classes(i,n){
    var r=RULE[i]; if(n<=0) return 0; if(n<=r[0]) return 1;
    var q=Math.floor(n/r[1]), rem=n%r[1];
    return q + (n<=100 ? (rem>10?1:0) : (rem>=r[2]?1:0));
  }
  function org(enr){
    var c=0,t=0; enr.forEach(function(n,i){var k=classes(i,n); c+=k; t+=k*RULE[i][3]}); return {classes:c,teachers:t};
  }
  function sum(a){return a.reduce(function(x,y){return x+y},0)}
  function pct(a,b){var p=(a/b-1)*100; return (p<0?"−":"+")+Math.abs(p).toFixed(1)+"%"}

  window.SMEA_PROJECTION = function(E, D, U){
    var names=E.levels.slice(0,7).map(function(r){return r[0]});
    var cur=E.levels.slice(0,7).map(function(r){return r[1]});
    var total=sum(cur), avg=sum(cur.slice(1))/6, hiK=Math.round(avg), loK=cur[0], baK=Math.round((loK+hiK)/2);
    var y0=+((/(\d{4})/.exec(D.sy)||[])[1]||new Date().getFullYear());
    var lab=function(i){return (y0+i)+"–"+String(y0+i+1).slice(2)};

    function run(k){
      var enr=cur.slice(), out=[];
      for(var i=0;i<4;i++){
        if(i>0) enr=[k].concat(enr.slice(0,6));
        var o=org(enr); out.push({enr:enr.slice(),total:sum(enr),classes:o.classes,teachers:o.teachers});
      }
      return out;
    }
    var S={Low:run(loK),Base:run(baK),High:run(hiK)};
    var end={Low:S.Low[3],Base:S.Base[3],High:S.High[3]};

    /* ---- line chart ---- */
    var all=[].concat(S.Low,S.Base,S.High).map(function(r){return r.total});
    var vmin=Math.floor((Math.min.apply(null,all)-50)/100)*100, vmax=Math.ceil((Math.max.apply(null,all)+50)/100)*100;
    var VW=640,VH=300,L=56,T=30,B=40,PW=454,PH=VH-T-B,LAST=L+PW;
    var X=function(i){return L+i*PW/3}, Y=function(v){return T+PH-(v-vmin)/(vmax-vmin)*PH};
    var s='<svg class="pj-lc" viewBox="0 0 '+VW+' '+VH+'" role="img" aria-label="Projected Kinder to Grade 6 enrollment. Today '+U.fmt(total)+'. By '+lab(3)+': high '+U.fmt(end.High.total)+', base '+U.fmt(end.Base.total)+', low '+U.fmt(end.Low.total)+'.">';
    for(var v=vmin; v<=vmax; v+=100){
      s+='<line class="g" x1="'+L+'" x2="'+LAST+'" y1="'+Y(v).toFixed(1)+'" y2="'+Y(v).toFixed(1)+'"/><text class="ax" x="'+(L-8)+'" y="'+(Y(v)+4).toFixed(1)+'" text-anchor="end">'+U.fmt(v)+'</text>';
    }
    for(var i=0;i<4;i++) s+='<text class="ax" x="'+X(i).toFixed(1)+'" y="'+(VH-14)+'" text-anchor="middle">'+lab(i)+'</text>';
    var poly=[],k;
    for(k=0;k<4;k++) poly.push(X(k).toFixed(1)+","+Y(S.High[k].total).toFixed(1));
    for(k=3;k>=0;k--) poly.push(X(k).toFixed(1)+","+Y(S.Low[k].total).toFixed(1));
    s+='<polygon class="band" points="'+poly.join(" ")+'"/>';
    [["High","high"],["Low","low"],["Base","base"]].forEach(function(p){
      var pts=[]; for(var j=0;j<4;j++) pts.push(X(j).toFixed(1)+","+Y(S[p[0]][j].total).toFixed(1));
      s+='<polyline class="ln '+p[1]+'" points="'+pts.join(" ")+'"/>';
      for(var j2=1;j2<4;j2++) s+='<circle class="pt '+p[1]+'" cx="'+X(j2).toFixed(1)+'" cy="'+Y(S[p[0]][j2].total).toFixed(1)+'" r="4.5"/>';
    });
    s+='<circle class="pt now" cx="'+X(0).toFixed(1)+'" cy="'+Y(total).toFixed(1)+'" r="5.5"/><text class="lbl" x="'+(X(0)+4).toFixed(1)+'" y="'+(Y(total)-12).toFixed(1)+'">'+U.fmt(total)+' today</text>';
    [["High","high"],["Base","base"],["Low","low"]].forEach(function(p){
      var val=end[p[0]].total, yy=Y(val);
      s+='<text class="endl '+p[1]+'" x="'+(LAST+14)+'" y="'+(yy-1).toFixed(1)+'">'+p[0]+' '+U.fmt(val)+'</text><text class="endp" x="'+(LAST+14)+'" y="'+(yy+14).toFixed(1)+'">'+pct(val,total)+'</text>';
    });
    s+='</svg>';

    /* ---- bars ---- */
    var scale=Math.ceil(Math.max.apply(null,cur)/20)*20;
    var bars='<div class="pj-bars">'+cur.map(function(n,i){
      var d=n/avg-1, flag=d<-0.15&&i>=0;
      return '<div class="pj-bar"><span>'+U.esc(names[i])+'</span><div class="pj-track"><i class="pj-fill'+(flag?' flag':'')+'" style="width:'+(n/scale*100).toFixed(1)+'%"></i><b class="pj-avg" style="left:'+(avg/scale*100).toFixed(1)+'%"></b></div><span class="v">'+U.fmt(n)+(flag?' <em>'+pct(n,avg)+'</em>':'')+'</span></div>';
    }).join("")+'</div>';

    /* ---- what to watch: grades within 2 learners of an extra class ---- */
    var near=[];
    cur.forEach(function(n,i){
      var r=RULE[i]; if(n<=100) return;
      var rem=n%r[1], need=r[2]-rem;
      if(need>0 && need<=2) near.push(names[i]+" ("+n+") is "+(need===1?"one learner":"two learners")+" short of needing another class");
    });
    var watch='June Kinder enrollment shows which line the school is following.'+(near.length?' '+near.join("; ")+', so late enrollees there matter.':'');

    /* ---- table ---- */
    var yrs=[0,1,2,3].map(function(i){
      var row='<tr><th scope="row">'+lab(i)+(i===0?' <span class="pj-act">actual</span>':'')+'</th>';
      [["total",function(v){return U.fmt(v)}],["classes",function(v){return v}],["teachers",function(v){return v.toFixed(1)}]].forEach(function(m){
        ["Low","Base","High"].forEach(function(nm){row+='<td class="num'+(nm==="Base"?' b':'')+'">'+m[1](S[nm][i][m[0]])+'</td>'});
      });
      return row+'</tr>';
    }).join("");

    var stats='<section class="grid g4">'
      +U.stat(U.fmt(total),"Kinder to Grade 6 learners today","accent")
      +U.stat(pct(end.Base.total,total),"Base case by "+lab(3)+" ("+U.fmt(end.Base.total)+" learners)")
      +U.stat(pct(end.Low.total,total),"Low case by "+lab(3)+" ("+U.fmt(end.Low.total)+" learners)")
      +U.stat(S.Base[0].classes+" → "+end.Base.classes,"Classes today vs. base case, "+lab(3))
      +'</section>';

    return '<div class="sec-h"><div><h2>Enrollment projection</h2><p>Three-year outlook for Kinder to Grade 6 from the current enrollment.</p></div></div>'
      +stats
      +'<section class="card"><h2>Learners, Kinder to Grade 6</h2><p class="sub">The shaded range runs from a weak to a strong Kinder intake. The axis starts at '+U.fmt(vmin)+'.</p>'+s
      +'<div class="pj-lg"><div><i style="background:var(--pj-high)"></i><span><b>High.</b> Kinder returns to the Grade 1 to 6 average ('+hiK+').</span></div>'
      +'<div><i style="background:var(--pj-base)"></i><span><b>Base.</b> Kinder settles at '+baK+', about halfway back.</span></div>'
      +'<div><i style="background:var(--pj-low)"></i><span><b>Low.</b> Kinder stays at today’s '+loK+'.</span></div></div></section>'
      +'<section class="grid g2">'
      +'<div class="card"><h2>Why it declines: the Kinder gap</h2><p class="sub">Learners per grade level, '+U.esc(D.sy)+'</p>'+bars
      +'<div class="pj-key"><span><i class="o"></i>More than 15% below average</span><span><i class="d"></i>Grade 1 to 6 average ('+Math.round(avg)+')</span></div>'
      +'<p class="pj-note">Kinder is '+pct(cur[0],avg)+' against the average. Grade 6 leaves next year and Grade 5 the year after, and each is replaced by a smaller Kinder class unless intake recovers.</p></div>'
      +'<div class="card"><h2>How to read this</h2><p class="sub">Three points before using the numbers</p><div class="pj-how">'
      +'<div><h3>Method</h3><p>Every grade moves up one level each year and Grade 6 graduates. Kinder intake is the only unknown, so it is the one thing the three scenarios change.</p></div>'
      +'<div><h3>Class count</h3><p>Learners are divided by the maximum class size (30 Kinder, 35 Grades 1 to 3, 45 Grades 4 to 6) and rounded down. A class is added when the remainder is large enough, as set in DM-HROD-2022-0635.</p></div>'
      +'<div><h3>What to watch</h3><p>'+watch+'</p></div></div></div></section>'
      +'<section class="card"><h2>Classes and teachers needed</h2><p class="sub">By scenario, using the class organization rule. The base case is shaded.</p>'
      +'<table class="pj-t"><thead><tr><th rowspan="2" class="pj-l">School year</th><th colspan="3" class="pj-g">Learners</th><th colspan="3" class="pj-g">Classes</th><th colspan="3" class="pj-g">Teachers (est.)</th></tr>'
      +'<tr><th class="num pj-g">Low</th><th class="num b">Base</th><th class="num">High</th><th class="num pj-g">Low</th><th class="num b">Base</th><th class="num">High</th><th class="num pj-g">Low</th><th class="num b">Base</th><th class="num">High</th></tr></thead><tbody>'+yrs+'</tbody></table>'
      +'<p class="pj-fine">Assumes every learner is promoted and no one transfers in or out. SPED learners ('+U.fmt(E.levels[7]?E.levels[7][1]:0)+') are not included. Teacher figures apply the memo’s factors (Kinder 0.5, Grades 1 to 2 at 1.0, Grades 3 to 6 at 7:6) and are estimates; confirm them with the Division planning officer.</p></section>';
  };
})();
