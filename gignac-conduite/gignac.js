/* Gignac Conduite — menu mobile, jour courant des horaires, pré-inscription (maquette, aucun envoi). */
(function(){
  "use strict";
  var btn=document.querySelector(".sign-menu"), nav=document.getElementById("mnav");
  if(btn&&nav){
    var set=function(o){nav.hidden=!o;btn.setAttribute("aria-expanded",o?"true":"false");document.body.classList.toggle("mnav-open",o);};
    btn.addEventListener("click",function(){set(nav.hidden);});
    nav.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){set(false);});});
  }
  var today=new Date().getDay();
  document.querySelectorAll(".hours tr[data-day]").forEach(function(r){ if(parseInt(r.getAttribute("data-day"),10)===today) r.classList.add("is-today"); });
  var form=document.querySelector(".insc-form");
  if(form){
    var msg=form.querySelector(".form-msg");
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var nom=form.nom.value.trim(), tel=form.tel.value.replace(/[\s.\-]/g,"");
      var ok=nom.length>=2&&/^(\+33|0)[1-9]\d{8}$/.test(tel)&&form.consent.checked;
      msg.classList.toggle("is-error",!ok);
      if(!ok){msg.textContent="Nom, téléphone valide et consentement sont nécessaires.";return;}
      var docs=["d1","d2","d3","d4"].filter(function(k){return form[k].checked;}).length;
      msg.textContent="Merci "+nom+", pré-inscription notée (maquette : aucun envoi réel). "+(docs===4?"Votre dossier est complet, on vous rappelle pour l'évaluation.":"Il manque "+(4-docs)+" document"+(4-docs>1?"s":"")+", on vous explique tout au téléphone.");
      form.reset();
    });
  }
})();
