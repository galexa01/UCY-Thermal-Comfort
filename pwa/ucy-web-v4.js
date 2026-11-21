/* UCY Heat Web v4: presentation-only improvements. Does not modify science datasets. */
(function(){
 'use strict';
 if(window.__UCY_WEB_V4_STARTED)return;
 window.__UCY_WEB_V4_STARTED=true;
 const $=id=>document.getElementById(id);
 const tryCall=fn=>{try{return fn()}catch(err){console.warn('UCY v4:',err)}};
 function localTime(iso,options){
   if(!iso)return '—';
   const d=new Date(iso);
   if(!Number.isFinite(d.getTime()))return '—';
   return new Intl.DateTimeFormat('en-GB',Object.assign({timeZone:'Asia/Nicosia'},options||{})).format(d);
 }
 function create(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
 function section(title,contents,open,id){
   const d=create('details','ucy-v4-section');d.id=id;d.open=open;
   const s=create('summary','ucy-v4-section-title',title);d.append(s);
   const body=create('div','ucy-v4-section-body');
   contents.forEach(el=>{if(el)body.appendChild(el)});d.append(body);return d;
 }
 function setupSidebar(){
   const sidebar=document.querySelector('#sidebar .side-scroll');
   const brand=sidebar?.querySelector('.sidebar-brand');
   if(!sidebar||!brand||$('ucy-v4-layers'))return;
   const eyebrow=brand.querySelector('.eyebrow');
   if(eyebrow)eyebrow.textContent='UNIVERSITY OF CYPRUS · EFM-LAB';
   const heading=brand.querySelector('h1');
   if(heading)heading.innerHTML='Campus <em>Thermal</em><br>Comfort Forecast';
   const metrics=$('metricStack'), layerLabel=sidebar.querySelector('.section-label');
   const layersHead=$('layerToggle'),layersBody=$('layerBody');
   const date=$('dateDisplay')?.closest('.date-row');
   const cards=sidebar.querySelector('.v83-summary');
   const weatherHead=sidebar.querySelector('.weather-heading');
   const weatherGrid=sidebar.querySelector('.weather-grid');
   if(!metrics||!layersHead||!layersBody||!date||!cards||!weatherHead||!weatherGrid)return;
   const layerSection=section('01  Map layers',[metrics,layersHead,layersBody],true,'ucy-v4-layers');
   brand.after(layerSection);
   if(layerLabel)layerLabel.remove();
   const timeBox=create('div','ucy-v4-time-box');
   const clockLabel=create('div','ucy-v4-now-label','Current Cyprus time');
   const liveClock=create('div','ucy-v4-live-clock','—');liveClock.id='ucy-v4-live-clock';
   const dataLabel=create('div','ucy-v4-data-label','Latest observation / selected forecast time');
   timeBox.append(clockLabel,liveClock,dataLabel,date);
   const mean=$('v83MeanCard'),stress=$('v83StressCard');
   if(mean&&stress){cards.insertBefore(mean,stress)}
   const comfort=section('02  Time & thermal comfort',[timeBox,cards],true,'ucy-v4-comfort');
   layerSection.after(comfort);
   const weather=section('03  Weather conditions',[weatherHead,weatherGrid],false,'ucy-v4-weather');
   comfort.after(weather);
   // Existing controls remain intact; details only change their layout.
   layersBody.hidden=true;
   if(layersHead)layersHead.setAttribute('aria-expanded','false');
   const footer=sidebar.querySelector('.lab-footer');if(footer)sidebar.append(footer);
   const cardNote1=$('v83StressNote'),cardNote2=$('v83MeanNote');
   if(cardNote1)cardNote1.hidden=true;
   if(cardNote2)cardNote2.hidden=true;
   const cardLabel=mean?.querySelector('.v83-label');
   if(cardLabel)cardLabel.textContent='Feels-like (UTCI)';
   const stressLabel=stress?.querySelector('.v83-label');
   if(stressLabel)stressLabel.textContent='Thermal stress';
   // Keep the real dataset timestamp from existing renderHour() in #dateDisplay/#clockDisplay.
   function tick(){
     liveClock.textContent=localTime(new Date().toISOString(),{weekday:'short',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
     const now=typeof v9Nowcast==='function'&&v9Nowcast();
     dataLabel.textContent=now?'Latest AURA observation (Cyprus time)':'Selected ECMWF forecast hour (Cyprus time)';
   }
   tick();window.setInterval(tick,1000);
   const obs=new MutationObserver(()=>{tryCall(tick)});
   obs.observe(document.body,{attributes:true,attributeFilter:['class']});
 }
 function setupToolbar(){
   const toolbar=document.querySelector('.top-controls');if(!toolbar||$('ucy-v4-tools-toggle'))return;
   const button=create('button','ucy-v4-tools-toggle','‹');button.type='button';button.id='ucy-v4-tools-toggle';
   button.setAttribute('aria-label','Collapse map toolbar');button.setAttribute('aria-expanded','true');
   button.addEventListener('click',()=>{
     const closed=toolbar.classList.toggle('ucy-v4-tools-closed');
     button.textContent=closed?'›':'‹';button.setAttribute('aria-expanded',String(!closed));
     button.setAttribute('aria-label',closed?'Expand map toolbar':'Collapse map toolbar');
   });toolbar.prepend(button);
 }
 function setupStatus(){
   const status=$('status');if(!status)return;
   // Preserve important errors even when the ordinary AURA status badge is suppressed.
   function render(){
     const txt=status.textContent||'';
     status.classList.toggle('ucy-v4-status-error',/unavailable|error|failed|invalid/i.test(txt));
   }
   new MutationObserver(render).observe(status,{subtree:true,childList:true,characterData:true});render();
 }
 function fmt(v,unit,digits){return Number.isFinite(v)&&v>-100&&v<1000?v.toFixed(digits)+(unit||''):'—'}
 function category(v){return typeof v91Category==='function'&&Number.isFinite(v)&&v>-100&&v<=100?v91Category(v):null}
 function popupContent(mode,stamp,lng,lat,u,p,ws,wd){
   const root=create('div','ucy-v4-popup');
   root.append(create('div','ucy-v4-popup-title',mode),create('div','ucy-v4-popup-time',localTime(stamp,{weekday:'short',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'} )+' · Cyprus'));
   const main=create('div','ucy-v4-popup-primary');
   main.append(create('div','ucy-v4-popup-key','Feels-like (UTCI)'),create('div','ucy-v4-popup-utci',fmt(u,' °C',1)));
   root.append(main);
   const c=category(u);const stress=create('div','ucy-v4-popup-stress',c?.label||'Thermal stress unavailable');
   if(c){stress.style.background=c.color;stress.style.color=c.ink}root.append(stress);
   const values=create('div','ucy-v4-popup-values');
   [['PET',fmt(p,' °C',1)],['Wind speed',fmt(ws,' m/s',2)],['Wind direction',fmt(wd,'°',1)]].forEach(([key,value])=>{
     const v=create('div','ucy-v4-popup-measure');v.append(create('small','',key),create('strong','',value));values.append(v)
   });root.append(values);
   root.append(create('div','ucy-v4-popup-coords','Lat '+lat.toFixed(6)+'° · Lon '+lng.toFixed(6)+'°'));
   return root;
 }
 function setupPopup(){
   if(typeof refreshPoint!=='function'||typeof maplibregl==='undefined')return;
   let seq=0;
   refreshPoint=async function(){
     if(!selectedPoint||!pointManifest||!mapReady)return;
     const thisSeq=++seq;
     const lng=selectedPoint.lng,lat=selectedPoint.lat;
     if(!pointInside(lng,lat)){if(pointPopup)pointPopup.remove();return}
     const now=typeof v9Nowcast==='function'&&v9Nowcast();
     const stamp=now?v9Meta.observation_utc:v6?.timestamps[cursor]?.time_utc;
     const index=cursor;
     if(pointPopup)pointPopup.remove();
     pointPopup=new maplibregl.Popup({closeButton:true,closeOnClick:false,maxWidth:'350px',className:'v8-map-popup ucy-v4-map-popup'});
     pointPopup.setLngLat([lng,lat]).setDOMContent(create('div','ucy-v4-popup-loading','Loading point data…')).addTo(map);
     const instance=pointPopup;
     try{
       const n=pointManifest.width*pointManifest.height;
       const idx=pointCell(lng,lat);
       let data,dir;
       if(now){
         if(!v9Numeric||!v9Hwd)throw Error('Nowcast data not yet available');
         data=v9Numeric;dir=v9Hwd;
       }else{
         data=await loadNumericHour(index);
         try{dir=await v85LoadDirection(index)}catch(error){console.warn('Forecast wind direction unavailable:',error)}
       }
       if(thisSeq!==seq||pointPopup!==instance||now!==(typeof v9Nowcast==='function'&&v9Nowcast())||(!now&&index!==cursor))return;
       const value=(arr,i)=>arr&&Number.isFinite(arr[i])?arr[i]:NaN;
       const root=popupContent(now?'Nowcast':'Forecast',stamp,lng,lat,value(data,idx),value(data,n+idx),value(data,2*n+idx),value(dir,idx));
       instance.setDOMContent(root);
     }catch(error){
       if(thisSeq===seq&&pointPopup===instance)instance.setDOMContent(create('div','ucy-v4-popup-loading','Point data unavailable: '+error.message));
     }
   };
 }
 function initialize(){
   setupSidebar();setupToolbar();setupStatus();setupPopup();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
 else initialize();
})();
