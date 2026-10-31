/* Cabanons du Fortin — menu mobile, barre de dates mobile reliée au formulaire, formulaire (maquette, aucun envoi). */
(function(){
  "use strict";
  var btn=document.querySelector(".top-menu"), nav=document.getElementById("mnav");
  if(btn&&nav){
    var set=function(o){nav.hidden=!o;btn.setAttribute("aria-expanded",o?"true":"false");document.body.classList.toggle("mnav-open",o);};
    btn.addEventListener("click",function(){set(nav.hidden);});
    nav.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){set(false);});});
  }
  var form=document.querySelector(".book-form");
  var dbIn=document.getElementById("db-in"), dbOut=document.getElementById("db-out");
  var today=new Date().toISOString().slice(0,10);
  [form&&form.arrivee,form&&form.depart,dbIn,dbOut].forEach(function(i){if(i)i.min=today;});
  var sync=function(from,to){from&&from.addEventListener("change",function(){if(to)to.value=from.value;});};
  if(form){sync(dbIn,form.arrivee);sync(dbOut,form.depart);}
  if(form){
    var msg=form.querySelector(".form-msg");
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var a=form.arrivee.value, d=form.depart.value, nom=form.nom.value.trim(), c=form.contact.value.trim();
      var ok=a&&d&&d>a&&nom.length>=2&&c.length>=6&&form.consent.checked;
      msg.classList.toggle("is-error",!ok);
      if(!ok){msg.textContent="Merci d'indiquer des dates valides (départ après l'arrivée), votre nom, un moyen de contact et votre consentement.";return;}
      var nights=Math.round((new Date(d)-new Date(a))/86400000);
      msg.textContent="Merci "+nom+", demande notée pour "+nights+" nuit"+(nights>1?"s":"")+" (maquette : aucun envoi réel). Réponse sous 24 h.";
      form.reset();
    });
  }
})();
