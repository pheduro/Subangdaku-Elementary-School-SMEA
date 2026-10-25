(function(){
  var D = window.SMEA, root = document.body.dataset.root || "";
  var page = document.body.dataset.page;
  var NAV = [
    ["home","Home","index.html"],
    ["sapm","Term 1 SAPM","sapm/index.html"],
    ["enrollment","Enrollment","enrollment.html"],
    ["literacy","Literacy","literacy.html"],
    ["nutrition","Nutrition","nutrition.html"],
    ["outcomes","Learner Outcomes","outcomes.html"],
    ["practices","BLICs & Practices","practices.html"],
    ["slides","Slides","slides.html"]
  ];
  var esc = function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
  var fmt = function(n){return Number(n).toLocaleString("en-US")};
  var pct = function(a,b){return b? (Math.round(a/b*1000)/10).toFixed(1)+"%":"–"};

  window.UI = {
    esc:esc, fmt:fmt, pct:pct,
    stat:function(n,l,cls){return '<div class="card stat '+(cls||"")+'"><div class="n">'+n+'</div><div class="l">'+l+'</div></div>'},
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
    hero:function(pill,title,sub){
      return '<div class="hero"><span class="pill">'+esc(pill)+'</span><h1>'+esc(title)+'</h1><p>'+esc(sub)+'</p></div>';
    }
  };

  // shell
  var header = '<header class="top"><div class="wrap"><a class="brand" href="'+root+'index.html"><span class="mark"><img src="'+root+'assets/logo.png" alt="" width="40" height="40"></span><span><b>'+esc(D.school)+'</b><small>School Monitoring, Evaluation and Adjustment · '+esc(D.sy)+'</small></span></a><nav>'+
    NAV.map(function(n){return '<a href="'+root+n[2]+'"'+(n[0]===page?' class="on"':'')+'>'+n[1]+'</a>'}).join("")+'</nav></div></header>';
  var footer = '<footer class="wrap">'+esc(D.school)+' · '+esc(D.district)+' · '+esc(D.sy)+', '+esc(D.term)+'. Figures come from the school SMEA workbooks.</footer>';
  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer);
})();
