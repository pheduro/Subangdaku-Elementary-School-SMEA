(function(){
  document.documentElement.classList.add("js");
  var D = window.SMEA, root = document.body.dataset.root || "";
  var page = document.body.dataset.page;

  var P = {
    home:"M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    chart:"M4 20V10M10 20V4M16 20v-8M22 20H2",
    users:"M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.2a4 4 0 0 1 0 7.6M22 21v-1a6 6 0 0 0-4-5.6",
    book:"M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM20 17v4H6.5A2.5 2.5 0 0 1 4 18.5",
    heart:"M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z",
    target:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    compass:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z",
    slides:"M2 3h20M21 3v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3M12 15v6M8 21h8M8 10l3-3 2 2 3-3",
    image:"M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
    bulb:"M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z",
    arrow:"M5 12h14M13 5l7 7-7 7",
    pin:"M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    edit:"M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
    cal:"M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 2v4M8 2v4M3 10h18"
  };
  var icon = function(n,extra){return '<svg class="i '+(extra||"")+'" viewBox="0 0 24 24" aria-hidden="true"><path d="'+(P[n]||P.chart)+'"/></svg>'};

  var NAV = [
    ["home","Home","index.html","home","Reporting hub"],
    ["sapm","Term 1 SAPM","sapm/index.html","chart"],
    ["enrollment","Enrollment","enrollment.html","users"],
    ["literacy","Literacy","literacy.html","book"],
    ["nutrition","Nutrition","nutrition.html","heart"],
    ["outcomes","Learner Outcomes","outcomes.html","target"],
    ["practices","BLICs & Practices","practices.html","compass"],
    ["entry","Teacher Entry","entry/index.html","edit"],
    ["slides","Slides","slides.html","slides"],
    ["gallery","Gallery","gallery.html","image"]
  ];
  var pageIcon = {}; NAV.forEach(function(n){pageIcon[n[0]]=n[3]});
  var esc = function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
  var fmt = function(n){return Number(n).toLocaleString("en-US")};
  var pct = function(a,b){return b? (Math.round(a/b*1000)/10).toFixed(1)+"%":"–"};
  var abs = function(p){return new URL(root+p, document.baseURI).href};

  window.UI = {
    esc:esc, fmt:fmt, pct:pct, icon:icon, P:P,
    stat:function(n,l,cls,ic){return '<div class="card stat rv '+(cls||"")+'">'+(ic?'<div class="si">'+icon(ic)+'</div>':'')+'<div class="n">'+n+'</div><div class="l">'+l+'</div></div>'},
    bars:function(rows,max){
      max = max || Math.max.apply(null, rows.map(function(r){return r[1]}));
      return '<div class="bars">'+rows.map(function(r){
        return '<div class="bar"><span>'+esc(r[0])+'</span><div class="track"><div class="fill" style="width:'+(max? r[1]/max*100:0)+'%"></div></div><span class="v">'+fmt(r[1])+'</span></div>';
      }).join("")+'</div>';
    },
    stack:function(vals,colors){
      var t = vals.reduce(function(a,b){return a+b},0)||1;
      return '<div class="stack" role="img">'+vals.map(function(v,i){
        return v? '<span style="width:'+(v/t*100)+'%;background:'+colors[i]+'" title="'+v+'"></span>':"";
      }).join("")+'</div>';
    },
    hero:function(pill,title,sub,ic,photo,pos){
      return '<div class="hero'+(photo?' photo':'')+'" style="--img:url('+abs(photo||"assets/facade.jpg")+');'+(pos?'--pos:'+pos:'')+'">'+icon(ic||pageIcon[page]||"chart","ico")+'<span class="pill">'+icon("cal")+esc(pill)+'</span><h1>'+esc(title)+'</h1><p>'+esc(sub)+'</p></div>';
    }
  };

  // shell
  var header = '<header class="top"><div class="wrap"><a class="brand" href="'+root+'index.html"><span class="mark"><img src="'+root+'assets/logo.png" alt="" width="42" height="42"></span><span><b>'+esc(D.school)+'</b><small>School Monitoring, Evaluation and Adjustment · '+esc(D.sy)+'</small></span></a><nav aria-label="Main">'+
    NAV.filter(function(n){return n[0]!=="home"}).map(function(n){return '<a href="'+root+n[2]+'"'+(n[0]===page?' class="on" aria-current="page"':'')+'>'+icon(n[3])+'<span>'+n[1]+'</span></a>'}).join("")+'</nav>'+(page==="home"?'':'<a class="homebtn" href="'+root+'index.html">'+icon("home")+'<span>Home</span></a>')+'</div></header>';
  var footer = '<footer class="site"><div class="wrap"><div class="fl"><img src="'+root+'assets/logo.png" alt=""><div><b>'+esc(D.school)+'</b>'+esc(D.address)+'<br>School ID '+esc(D.schoolId)+' · '+esc(D.districtName)+', '+esc(D.division)+' · '+esc(D.sy)+', '+esc(D.term)+'<br>Figures come from the school SMEA workbooks.</div></div><div><a href="'+root+'sapm/index.html">Term 1 SAPM</a><a href="'+root+'entry/index.html">Teacher Entry</a><a href="'+root+'slides.html">Slides</a><a href="'+root+'gallery.html">Gallery</a></div></div></footer>';
  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer);
  var ic = document.createElement("link"); ic.rel="icon"; ic.href=root+"assets/logo.png"; document.head.appendChild(ic);

  // motion: runs after the page script has drawn its content
  function motion(){
    var sel = ".card,.sec-h,.band a,.gal a,.hero,.cta";
    var els = [].slice.call(document.querySelectorAll(sel)).filter(function(e){return !e.closest(".top")&&!e.closest(".banner")});
    els.forEach(function(e){
      if(e.classList.contains("hero")) return;
      e.classList.add("rv");
      var sibs=[].slice.call(e.parentNode.children).filter(function(s){return s.classList.contains("rv")||s.matches(sel)});
      e.style.transitionDelay=Math.min(sibs.indexOf(e),8)*70+"ms";
    });
    function count(el){
      var t=el.textContent.trim(); if(!/^[\d,]+(\.\d+)?%?$/.test(t)) return;
      var pc=/%$/.test(t), dec=(t.split(".")[1]||"").replace("%","").length, end=parseFloat(t.replace(/[,%]/g,""));
      var t0=null, dur=1300;
      function step(ts){ if(!t0)t0=ts; var k=Math.min((ts-t0)/dur,1), v=end*(1-Math.pow(1-k,3));
        el.textContent=(dec?v.toFixed(dec):fmt(Math.round(v)))+(pc?"%":""); if(k<1)requestAnimationFrame(step); else el.textContent=t; }
      requestAnimationFrame(step);
    }
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(!("IntersectionObserver" in window) || reduce){ document.querySelectorAll(".rv").forEach(function(e){e.classList.add("in")}); return; }
    var io = new IntersectionObserver(function(es){es.forEach(function(en){
      if(!en.isIntersecting) return; var e=en.target; e.classList.add("in"); io.unobserve(e);
      e.querySelectorAll(".stat .n").forEach(count); if(e.classList.contains("stat")) count(e.querySelector(".n"));
    })},{threshold:.12,rootMargin:"0px 0px -6% 0px"});
    document.querySelectorAll(".rv").forEach(function(e){io.observe(e)});
    setTimeout(function(){document.querySelectorAll(".rv:not(.in)").forEach(function(e){var r=e.getBoundingClientRect(); if(r.top<innerHeight)e.classList.add("in")})},1500);
  }

  // lightbox for any .gal / .band photo links
  function lightbox(){
    var links=[].slice.call(document.querySelectorAll(".gal a,.band a")); if(!links.length) return;
    var lb=document.createElement("div"); lb.className="lb"; lb.innerHTML='<button class="x" aria-label="Close">×</button><button class="p" aria-label="Previous">‹</button><img alt=""><button class="nx" aria-label="Next">›</button><div class="cap"></div>';
    document.body.appendChild(lb); var img=lb.querySelector("img"), cap=lb.querySelector(".cap"), i=0;
    function show(n){i=(n+links.length)%links.length; var a=links[i], im=a.querySelector("img"); img.src=a.href; img.alt=im?im.alt:""; cap.textContent=(im?im.alt:"")+"  ·  "+(i+1)+" / "+links.length; lb.classList.add("on")}
    links.forEach(function(a,n){a.addEventListener("click",function(e){e.preventDefault();show(n)})});
    lb.querySelector(".x").onclick=function(){lb.classList.remove("on")};
    lb.querySelector(".p").onclick=function(e){e.stopPropagation();show(i-1)};
    lb.querySelector(".nx").onclick=function(e){e.stopPropagation();show(i+1)};
    lb.addEventListener("click",function(e){if(e.target===lb)lb.classList.remove("on")});
    document.addEventListener("keydown",function(e){if(!lb.classList.contains("on"))return; if(e.key==="Escape")lb.classList.remove("on"); if(e.key==="ArrowLeft")show(i-1); if(e.key==="ArrowRight")show(i+1)});
  }
  window.addEventListener("load",function(){motion();lightbox()});
})();
