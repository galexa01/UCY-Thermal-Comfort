/* UCY Heat v4.3 — minor UX polish. Preserves current scientific behaviour. */
(function(){
  'use strict';
  if(window.__UCY_WEB_V43_STARTED)return;
  window.__UCY_WEB_V43_STARTED=true;
  var current=document.currentScript;
  var root=current&&current.src?new URL('.',current.src).href:'../pwa/';
  function nowcast(){
    try{return document.getElementById('v9Nowcast')?.getAttribute('aria-pressed')==='true'}catch(e){return false}
  }
  function applyBrand(){
    var brand=document.querySelector('#sidebar .sidebar-brand');
    if(!brand)return;
    var h1=brand.querySelector('h1');
    if(!h1)return;
    if(!brand.querySelector('.ucy-v43-brand-row')){
      var row=document.createElement('div');
      row.className='ucy-v43-brand-row';
      var img=document.createElement('img');
      img.className='ucy-v43-brandmark';
      img.alt='UCY Heat';
      img.src=root+'ucy-mark.png';
      h1.parentNode.insertBefore(row,h1);
      row.appendChild(img);
      row.appendChild(h1);
    }
  }
  function applyLabels(){
    var dataLabel=document.querySelector('#ucy-v4-comfort .ucy-v4-data-label');
    if(dataLabel){
      dataLabel.textContent=nowcast()
        ? 'Last AURA update'
        : 'Selected ECMWF forecast hour (Cyprus time)';
    }
    var weatherSmall=document.querySelector('#ucy-v4-weather .weather-heading small');
    if(weatherSmall){
      weatherSmall.textContent=nowcast()
        ? 'AURA · latest available observation'
        : 'ECMWF · selected forecast hour';
    }
  }
  function fixToolbarArrow(){
    var btn=document.getElementById('ucy-v4-tools-toggle');
    var toolbar=document.querySelector('.top-controls');
    if(!btn||!toolbar)return;
    var closed=toolbar.classList.contains('ucy-v4-tools-closed');
    btn.textContent=closed?'‹':'›';
    btn.setAttribute('aria-expanded',String(!closed));
    btn.setAttribute('aria-label',closed?'Expand map toolbar':'Collapse map toolbar');
    btn.title=closed?'Expand map toolbar':'Collapse map toolbar';
  }
  function forceOpenPrimarySections(){
    ['ucy-v4-layers','ucy-v4-comfort','ucy-v4-weather'].forEach(function(id){
      var el=document.getElementById(id);
      if(el)el.open=true;
    });
  }

  function addContact(){
    var modal=document.querySelector('#aboutModal .modal');
    if(modal){
      modal.querySelectorAll('#v91Info p').forEach(function(p){
        if(p.textContent && p.textContent.includes('Individual researcher names and contact emails will be added')) p.remove();
      });
    }
    if(modal && !document.getElementById('ucy-v45-contact')){
      var section=document.createElement('section');
      section.id='ucy-v45-contact';
      var title=document.createElement('h3');title.textContent='Development & Contact';
      var name=document.createElement('p');
      var strong=document.createElement('strong');strong.textContent='Giorgos Alexandrou';name.appendChild(strong);
      var role=document.createElement('p');role.textContent='Researcher · Environmental Fluid Mechanics Laboratory';
      var institute=document.createElement('p');institute.textContent='University of Cyprus';
      var emailrow=document.createElement('p');
      var email=document.createElement('a');email.href='mailto:galexa01@ucy.ac.cy';email.textContent='galexa01@ucy.ac.cy';
      emailrow.appendChild(email);
      section.append(title,name,role,institute,emailrow);
      var ack=document.createElement('div');ack.className='ucy-v45-ack';
      var ackTitle=document.createElement('h4');ackTitle.textContent='Acknowledgements';
      var ackText=document.createElement('p');ackText.textContent='Computational resources were provided by the High Performance Computing facility of the University of Cyprus (UCY HPC).';
      ack.append(ackTitle,ackText);
      section.appendChild(ack);
      modal.appendChild(section);
    }
    var sidebar=document.querySelector('#sidebar .side-scroll');
    if(sidebar && !document.getElementById('ucy-v45-footer')){
      var note=document.createElement('div');note.id='ucy-v45-footer';
      var line=document.createElement('div');line.textContent='Developed by Giorgos Alexandrou';
      var link=document.createElement('a');link.href='mailto:galexa01@ucy.ac.cy';link.textContent='galexa01@ucy.ac.cy';
      note.append(line,link);
      var lab=sidebar.querySelector('.lab-footer');
      if(lab)lab.after(note);else sidebar.appendChild(note);
    }
  }
  function apply(){
    addContact();
    applyBrand();
    applyLabels();
    fixToolbarArrow();
    forceOpenPrimarySections();
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',apply,{once:true});
  }else apply();
  window.addEventListener('load',apply,{once:true});
  setTimeout(apply,600);
  setTimeout(apply,1800);
  setInterval(function(){ applyLabels(); fixToolbarArrow(); },1000);
  try{
    new MutationObserver(function(){ applyLabels(); fixToolbarArrow(); })
      .observe(document.body,{attributes:true,attributeFilter:['class'],subtree:false});
  }catch(e){}
})();
