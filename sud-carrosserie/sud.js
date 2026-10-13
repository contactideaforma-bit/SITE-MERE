/* Sud Carrosserie — menu mobile, numéro d'ordre du jour, photos cochées, devis (maquette, aucun envoi). */
(function(){
  "use strict";
  var btn=document.querySelector(".hdr-menu"), nav=document.getElementById("mnav");
  if(btn&&nav){
    var set=function(o){nav.hidden=!o;btn.setAttribute("aria-expanded",o?"true":"false");document.body.classList.toggle("mnav-open",o);};
    btn.addEventListener("click",function(){set(nav.hidden);});
    nav.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){set(false);});});
  }
  var d=new Date(), pad=function(n){return (n<10?"0":"")+n;};
  document.querySelectorAll("[data-order]").forEach(function(el){el.textContent=pad(d.getMonth()+1)+pad(d.getDate());});
  document.querySelectorAll(".shots input[type=file]").forEach(function(inp){
    inp.addEventListener("change",function(){
      var label=inp.closest("label"), em=label.querySelector("em");
      var has=inp.files&&inp.files.length;
      label.classList.toggle("has-file",!!has);
      em.textContent=has?"Photo ajoutée ✓":"Prendre la photo";
    });
  });
  var form=document.querySelector(".quote-form");
  if(form){
    var msg=form.querySelector(".form-msg");
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var nom=form.nom.value.trim(), tel=form.tel.value.replace(/[\s.\-]/g,"");
      var photos=["p1","p2","p3"].filter(function(k){return form[k].files&&form[k].files.length;}).length;
      var ok=nom.length>=2&&/^(\+33|0)[1-9]\d{8}$/.test(tel)&&form.consent.checked;
      msg.classList.toggle("is-error",!ok);
      if(!ok){msg.textContent="Nom, téléphone valide et consentement sont nécessaires.";return;}
      msg.textContent="Merci "+nom+", demande notée avec "+photos+" photo"+(photos>1?"s":"")+" (maquette : aucun envoi réel). Devis sous 24 h ouvrées au "+form.tel.value.trim()+".";
      form.reset(); form.querySelectorAll(".shots label").forEach(function(l){l.classList.remove("has-file");l.querySelector("em").textContent="Prendre la photo";});
    });
  }
})();
