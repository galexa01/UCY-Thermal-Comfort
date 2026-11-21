/* v4.8: visual refinement of existing v4.7 native PWA install button only. */
(function(){
 'use strict';
 function update(){
   const b=document.getElementById('ucyheat-install-button');
   const switcher=document.getElementById('v9ModeBar');
   if(!b||!switcher)return;
   if(!b.dataset.ucyV48){
     b.dataset.ucyV48='1';
     b.setAttribute('aria-label','Get UCY Heat');
     b.replaceChildren();
     const img=document.createElement('img');
     img.className='ucy-install-v48-logo';
     img.src='../pwa/ucy-mark.png';
     img.alt='';
     img.setAttribute('aria-hidden','true');
     const label=document.createElement('span');
     label.textContent='Get UCY Heat';
     b.append(img,label);
   }
   const r=switcher.getBoundingClientRect();
   const controls=document.querySelector('.top-controls');
   let top=r.bottom+10;
   if(controls && getComputedStyle(controls).display!=='none'){
      const c=controls.getBoundingClientRect();
      const mid=window.innerWidth/2;
      const half=Math.min(114,(window.innerWidth-30)/2);
      const horiz= c.left < mid+half && c.right > mid-half;
      const vert= c.top < top+49 && c.bottom > top;
      if(horiz && vert)top=c.bottom+10;
   }
   b.style.setProperty('top',Math.max(8,Math.round(top))+'px','important');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',update,{once:true});else update();
 window.addEventListener('load',update,{once:true});
 window.addEventListener('resize',update);
 // Existing deferred scripts may create the button at DOMContentLoaded.
 setTimeout(update,250);
})();
