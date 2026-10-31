/* Écuries du Vallon — menu mobile, jour courant dans le planning, formulaire (maquette, aucun envoi). */
(function(){
  "use strict";
  var btn=document.querySelector(".bar-menu"), drawer=document.getElementById("drawer");
  if(btn&&drawer){
    var set=function(o){drawer.hidden=!o;btn.setAttribute("aria-expanded",o?"true":"false");document.body.classList.toggle("drawer-open",o);};
    btn.addEventListener("click",function(){set(drawer.hidden);});
    drawer.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){set(false);});});
    document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!drawer.hidden)set(false);});
  }
  var today=new Date().getDay();
  document.querySelectorAll(".week-row[data-day]").forEach(function(r){
    var d=parseInt(r.getAttribute("data-day"),10);
    if(d===today||(d===1&&today>=1&&today<=5&&today!==3))r.classList.add("is-today");
  });
  var slots=["","Matin : ","Après-midi : ","Soir : "];
  document.querySelectorAll(".week-row").forEach(function(r){
    r.querySelectorAll("span").forEach(function(s,i){ if(!s.classList.contains("span3")) s.setAttribute("data-slot",slots[i+1]||""); });
  });
  var form=document.querySelector(".essai");
  if(form){
    var msg=form.querySelector(".form-msg");
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var nom=form.nom.value.trim(), tel=form.tel.value.replace(/[\s.\-]/g,"");
      var ok=nom.length>=2&&/^(\+33|0)[1-9]\d{8}$/.test(tel)&&form.consent.checked;
      msg.classList.toggle("is-error",!ok);
      msg.textContent=ok?"Merci "+nom+", demande notée (maquette : aucun envoi réel). Le club vous rappelle au "+form.tel.value.trim()+".":"Nom, téléphone valide et consentement sont nécessaires.";
      if(ok)form.reset();
    });
  }
})();
