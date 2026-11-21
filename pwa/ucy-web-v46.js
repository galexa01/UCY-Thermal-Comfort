/* UCY Heat v4.6 — credits placement only. No map/data changes. */
(function(){
  'use strict';
  if(window.__UCY_V46_CREDITS)return;
  window.__UCY_V46_CREDITS=true;

  var ACK='Computational resources were provided by the High Performance Computing facility of the University of Cyprus (UCY HPC).';

  function create(tag,className,text){
    var el=document.createElement(tag);
    if(className)el.className=className;
    if(text!==undefined)el.textContent=text;
    return el;
  }
  function showCredits(){
    var sidebar=document.querySelector('#sidebar .side-scroll');
    var brand=sidebar && sidebar.querySelector('.sidebar-brand');
    if(brand){
      var current=document.getElementById('ucy-v45-footer');
      var credit=document.getElementById('ucy-v46-credit');
      if(!credit){
        credit=create('div','ucy-v46-credit');
        credit.id='ucy-v46-credit';
        credit.appendChild(create('div','ucy-v46-credit-label','Developed by Giorgos Alexandrou'));
        var link=create('a','ucy-v46-credit-email','galexa01@ucy.ac.cy');
        link.href='mailto:galexa01@ucy.ac.cy';
        credit.appendChild(link);
      }
      /* The brand itself precedes Map layers: place credits directly below it. */
      brand.insertAdjacentElement('afterend',credit);
      if(current)current.remove();
    }

    var modal=document.querySelector('#aboutModal .modal');
    if(modal){
      var section=document.getElementById('ucy-v45-contact');
      if(!section){
        section=create('section','');
        section.id='ucy-v45-contact';
        section.appendChild(create('h3','', 'Development & Contact'));
        var p=create('p','');
        var strong=create('strong','', 'Giorgos Alexandrou');
        p.appendChild(strong);section.appendChild(p);
        section.appendChild(create('p','', 'Researcher · Environmental Fluid Mechanics Laboratory'));
        section.appendChild(create('p','', 'University of Cyprus'));
        var emailP=create('p','');
        var email=create('a','', 'galexa01@ucy.ac.cy');
        email.href='mailto:galexa01@ucy.ac.cy';
        emailP.appendChild(email);section.appendChild(emailP);
      }
      var ack=section.querySelector('.ucy-v45-ack');
      if(!ack){
        ack=create('div','ucy-v45-ack');
        section.appendChild(ack);
      }
      var title=ack.querySelector('h4');
      if(!title){title=create('h4','','Acknowledgements');ack.prepend(title)}
      var paragraph=ack.querySelector('p');
      if(!paragraph){paragraph=create('p','');ack.appendChild(paragraph)}
      paragraph.textContent=ACK;

      /* Bring credits to the start of About, after its heading.
         Previously appended at the very end of a long modal. */
      var modalTitle=modal.querySelector('.modal-title');
      if(modalTitle && modalTitle.nextElementSibling!==section){
        modalTitle.insertAdjacentElement('afterend',section);
      }
    }
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',showCredits,{once:true});
  }else{showCredits()}
  window.addEventListener('load',showCredits,{once:true});
})();
