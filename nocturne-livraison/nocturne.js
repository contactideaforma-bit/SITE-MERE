/* Nocturne — menu mobile, cadran de nuit (24 h), statut d'ouverture, composeur de SMS.
   Maquette : rien n'est envoyé depuis la page ; le bouton final ouvre la messagerie du téléphone. */
(function(){
  "use strict";

  /* --- Menu mobile --- */
  var btn=document.querySelector(".burger"), menu=document.getElementById("mobile-menu");
  if(btn&&menu){
    var set=function(o){menu.hidden=!o;btn.setAttribute("aria-expanded",o?"true":"false");};
    btn.addEventListener("click",function(){set(menu.hidden);});
    menu.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){set(false);});});
  }

  /* --- Cadran 24 h : 0 h en haut, arc de service 22 h → 5 h --- */
  var OPEN=22, CLOSE=5, CX=160, CY=160, R=118;
  function pt(h){var a=(h/24)*Math.PI*2-Math.PI/2;return [CX+R*Math.cos(a),CY+R*Math.sin(a)];}
  var arc=document.getElementById("dial-arc");
  if(arc){
    var s=pt(OPEN), e=pt(CLOSE);
    arc.setAttribute("d","M"+s[0].toFixed(1)+" "+s[1].toFixed(1)+" A"+R+" "+R+" 0 0 1 "+e[0].toFixed(1)+" "+e[1].toFixed(1));
    var ticks=document.querySelector(".dial-ticks");
    [0,3,6,9,12,15,18,21].forEach(function(h){
      var a=(h/24)*Math.PI*2-Math.PI/2, rr=R+30;
      var t=document.createElementNS("http://www.w3.org/2000/svg","text");
      t.setAttribute("x",(CX+rr*Math.cos(a)).toFixed(1)); t.setAttribute("y",(CY+rr*Math.sin(a)+5).toFixed(1));
      t.textContent=h+" h"; ticks.appendChild(t);
    });
    [OPEN,CLOSE].forEach(function(h){
      var a=(h/24)*Math.PI*2-Math.PI/2, rr=R+30;
      var t=document.createElementNS("http://www.w3.org/2000/svg","text");
      t.setAttribute("x",(CX+rr*Math.cos(a)).toFixed(1)); t.setAttribute("y",(CY+rr*Math.sin(a)+5).toFixed(1));
      t.setAttribute("fill","#6E1E73"); t.textContent=h+" h"; ticks.appendChild(t);
    });
  }
  var hand=document.getElementById("dial-hand"), status=document.querySelector("[data-status]");
  function tick(){
    var d=new Date(), h=d.getHours()+d.getMinutes()/60;
    if(hand){
      var a=(h/24)*Math.PI*2-Math.PI/2, len=R-14, inner=R-46;
      hand.setAttribute("x1",(CX+inner*Math.cos(a)).toFixed(1)); hand.setAttribute("y1",(CY+inner*Math.sin(a)).toFixed(1));
      hand.setAttribute("x2",(CX+len*Math.cos(a)).toFixed(1)); hand.setAttribute("y2",(CY+len*Math.sin(a)).toFixed(1));
    }
    if(status){
      var open=(h>=OPEN||h<CLOSE);
      var mins;
      if(open){
        mins=Math.round(((h<CLOSE?CLOSE:CLOSE+24)-h)*60);
        status.textContent="C'est ouvert : on livre encore pendant "+fmt(mins)+" (jusqu'à 5 h).";
      }else{
        mins=Math.round((OPEN-h)*60);
        status.textContent="Fermé pour l'instant. Ouverture ce soir dans "+fmt(mins)+", à 22 h.";
      }
      status.classList.toggle("is-open",open);
    }
  }
  function fmt(m){var hh=Math.floor(m/60), mm=m%60;return hh?hh+" h"+(mm?" "+(mm<10?"0":"")+mm:""):mm+" min";}
  tick(); setInterval(tick,60000);

  /* --- Composeur de SMS --- */
  var form=document.querySelector(".cmd-form");
  if(!form) return;
  var picks=form.querySelectorAll(".pick"), total=form.querySelector("[data-total]"), prev=form.querySelector("[data-preview]"),
      sms=form.querySelector("[data-sms]"), msg=form.querySelector(".form-msg");
  function euro(n){return n.toFixed(2).replace(".",",").replace(",00","")+" €";}
  function build(){
    var lines=[], sum=0;
    picks.forEach(function(p){
      var q=parseInt(p.querySelector("output").textContent,10)||0;
      if(q){lines.push(q+" × "+p.querySelector(".name").textContent); sum+=q*parseFloat(p.dataset.price);}
    });
    total.textContent=euro(sum);
    var prenom=form.prenom.value.trim(), adresse=form.adresse.value.trim();
    var text="Bonjour NOCTURNE, je souhaite commander : "+(lines.length?lines.join(", "):"…")+
      (lines.length?" (total "+euro(sum)+")":"")+". Prénom : "+(prenom||"…")+". Adresse : "+(adresse||"…")+".";
    prev.textContent=text;
    sms.setAttribute("href","sms:"+form.zone.value+"?&body="+encodeURIComponent(text));
    return {lines:lines,prenom:prenom,adresse:adresse};
  }
  picks.forEach(function(p){
    var out=p.querySelector("output");
    p.querySelector("[data-plus]").addEventListener("click",function(){out.textContent=Math.min(20,(parseInt(out.textContent,10)||0)+1);build();});
    p.querySelector("[data-minus]").addEventListener("click",function(){out.textContent=Math.max(0,(parseInt(out.textContent,10)||0)-1);build();});
  });
  ["input","change"].forEach(function(ev){form.addEventListener(ev,build);});
  sms.addEventListener("click",function(e){
    var st=build();
    var ok=st.lines.length&&st.prenom.length>=2&&st.adresse.length>=10&&form.consent.checked;
    msg.classList.toggle("is-error",!ok);
    if(!ok){e.preventDefault();msg.textContent="Choisis au moins un plat, indique ton prénom, ton adresse complète et coche la case.";return;}
    msg.textContent="Ta messagerie s'ouvre avec le texte ci-dessus. Maquette : rien n'est envoyé automatiquement.";
  });
  build();
})();
