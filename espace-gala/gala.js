/* Espace Gala — menu mobile, curseur de capacité, formulaire (maquette, aucun envoi). */
(function(){
  "use strict";
  var btn=document.querySelector(".head-menu"), menu=document.getElementById("menu");
  if(btn&&menu){
    var set=function(o){menu.hidden=!o;btn.setAttribute("aria-expanded",o?"true":"false");btn.textContent=o?"Fermer":"Menu";document.body.classList.toggle("menu-open",o);};
    btn.addEventListener("click",function(){set(menu.hidden);});
    menu.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){set(false);});});
  }
  var range=document.getElementById("guests"), out=document.getElementById("guests-out"), res=document.getElementById("cap-result");
  if(range){
    var update=function(){
      var n=parseInt(range.value,10); out.textContent=n;
      var t;
      if(n<=120) t="Format intime : dîner assis en configuration resserrée, terrasse et cocktail, salle seule ou formule menu.";
      else if(n<=220) t="Dîner assis possible, piste de danse ouverte, terrasse pour le cocktail. Formule la plus demandée pour un mariage.";
      else if(n<=400) t="Au-delà de 220 convives assis : cocktail dînatoire ou dîner en deux espaces, piste de danse et terrasse ouvertes.";
      else t="Jusqu'à 500 invités en cocktail debout, salle et terrasse réunies. Nous vous conseillons un traiteur habitué aux grands formats.";
      res.textContent=t;
    };
    range.addEventListener("input",update); update();
  }
  var form=document.querySelector(".card");
  if(form){
    var msg=form.querySelector(".form-msg");
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var nom=form.nom.value.trim(), tel=form.tel.value.replace(/[\s.\-]/g,"");
      var ok=nom.length>=2&&/^(\+33|0)[1-9]\d{8}$/.test(tel)&&form.consent.checked;
      msg.classList.toggle("is-error",!ok);
      msg.textContent=ok?"Merci "+nom+", demande notée (maquette : aucun envoi réel). Nous revenons vers vous sous 48 h.":"Nom, téléphone valide et consentement sont nécessaires.";
      if(ok)form.reset();
    });
  }
})();
