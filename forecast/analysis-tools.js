/* UCY Analysis Tools - isolated forecast/nowcast preview, no changes to model outputs. */
(function () {
  'use strict';
  const ID = 'ucy-analysis-stage-v6';
  if (window[ID]) return;
  window[ID] = true;
  // UCY_ANALYSIS_SIDEBAR_V6 / UCY_ANALYSIS_NOWCAST_V6: UCY Heat production extension.
  // Explicit read-only bridge into the original UCY Heat model script.
  const bridge = window.__UCY_ROUTE_AREA_BRIDGE_V4__;
  let map=null,pointManifest=null,cursor=-1,v9Meta=null,v9Numeric=null;
  function v9Nowcast(){return !!(bridge&&bridge.isNowcast());}
  function loadNumericHour(i){
    if(!bridge)throw Error('UCY Heat bridge unavailable');
    return bridge.getForecastHour(i);
  }
  function syncCore(){
    if(!bridge)return false;
    try{
      map=bridge.getMap();
      pointManifest=bridge.getManifest();
      cursor=bridge.getCursor();
      v9Meta=bridge.getNowcastMeta();
      v9Numeric=bridge.getNowcastNumeric();
      return !!(map&&typeof map.getSource==='function'&&
                map.getSource('field-image')&&pointManifest&&
                Number.isInteger(cursor));
    }catch(e){
      window.__UCY_ANALYSIS_BRIDGE_LAST_ERROR__=String(e);
      return false;
    }
  }

  const state = {
    kind: null, drawing: false, points: [], metric: 'UTCI',
    samples: [], stats: {}, report: '', currentKey: '', busy: false,
    seq: 0, elements: {}, previewFeature: null
  };
  const KM = 6371008.8;
  const METRICS = [['UTCI','UTCI (°C)'],['PET','PET (°C)'],['Wind','Wind (m/s)']];
  const STRESS = [
    {max:-40,label:'Extreme cold stress',color:'#354f9b'},
    {max:-27,label:'Very strong cold stress',color:'#427fc1'},
    {max:-13,label:'Strong cold stress',color:'#46a2c8'},
    {max:0,label:'Moderate cold stress',color:'#4bbcb0'},
    {max:9,label:'Slight cold stress',color:'#85c6a0'},
    {max:26,label:'No thermal stress',color:'#60b76d'},
    {max:32,label:'Moderate heat stress',color:'#eed146'},
    {max:38,label:'Strong heat stress',color:'#eb9141'},
    {max:46,label:'Very strong heat stress',color:'#df5b3b'},
    {max:Infinity,label:'Extreme heat stress',color:'#bb333c'}
  ];
  const colorStops=['#3059aa','#2fa1cb','#37b4ac','#69bd77','#eecf4d','#ef9b42','#d74d38'];
  const stressFor = v => STRESS.find(c=>v<c.max) || STRESS[STRESS.length-1];
  function paletteColor(metric,value){
    if(!Number.isFinite(value))return '#8293a5';
    // Use the complete model's display scale when exposed through the UCY Heat bridge.
    const scales=typeof bridge.getScales==='function'?bridge.getScales():null;
    let scale=scales&&scales[metric], low=null,high=null;
    if(Array.isArray(scale)&&scale.length>=2){low=Number(scale[0]);high=Number(scale[1]);}
    else if(scale&&typeof scale==='object'){
      low=Number(scale.min??scale.vmin??scale[0]);
      high=Number(scale.max??scale.vmax??scale[1]);
    }
    if(!(Number.isFinite(low)&&Number.isFinite(high)&&high>low)){
      // No authoritative scale available: avoid pretending a relative shade
      // is the map's colorbar color.
      return metric==='UTCI'?stressFor(value).color:(metric==='Wind'?'#52b5cd':'#97aece');
    }
    let t=Math.max(0,Math.min(1,(value-low)/(high-low)))*(colorStops.length-1);
    const i=Math.min(colorStops.length-2,Math.floor(t)),f=t-i;
    const a=colorStops[i].match(/\w\w/g).map(h=>parseInt(h,16));
    const b=colorStops[i+1].match(/\w\w/g).map(h=>parseInt(h,16));
    return '#'+a.map((v,k)=>Math.round(v+(b[k]-v)*f).toString(16).padStart(2,'0')).join('');
  }
  function colorCell(metric,value){
    if(!Number.isFinite(value))return '<span class="ucya-nodata">—</span>';
    const c=paletteColor(metric,value);
    return `<span class="ucya-value" style="--ucya-value-color:${c}">${nfmt(value)}</span>`;
  }
  function drawStressDistribution(data){
    const counts=new Map(),valid=data.filter(x=>Number.isFinite(x.UTCI));
    for(const row of valid){const c=stressFor(row.UTCI);counts.set(c.label,(counts.get(c.label)||0)+1);}
    if(!valid.length)return '<p class="ucya-small">No valid UTCI samples for thermal stress.</p>';
    const parts=STRESS.filter(c=>counts.has(c.label)).map(c=>{
      const count=counts.get(c.label),fraction=100*count/valid.length;
      return `<div class="ucya-stress-row"><span class="ucya-stress-dot" style="background:${c.color}"></span><span>${c.label}</span><strong>${nfmt(fraction,1)}%</strong></div>`;
    });
    return `<div class="ucya-stress"><h4>Thermal stress (UTCI)</h4><div class="ucya-stress-bar">${STRESS.filter(c=>counts.has(c.label)).map(c=>`<span style="background:${c.color};width:${100*counts.get(c.label)/valid.length}%"></span>`).join('')}</div>${parts.join('')}<div class="ucya-small">Percentage of valid UTCI ${state.kind==='route'?'route samples':'grid-cell centres'}. Classification follows the UTCI thresholds.</div></div>`;
  }

  const EMPTY = {type:'FeatureCollection',features:[]};
  const nfmt = (x,d=2) => Number.isFinite(x) ? x.toFixed(d) : '—';

  function ready() {
    try { return syncCore(); }
    catch (_) { return false; }
  }
  function inNowcast() { return typeof v9Nowcast === 'function' && v9Nowcast(); }
  function footprint() {
    if (typeof pointManifest === 'undefined' || !pointManifest) return null;
    const a = pointManifest.bounds;
    if (!Array.isArray(a) || a.length !== 4) return null;
    return {
      west: Math.min(...a.map(p=>p[0])), east: Math.max(...a.map(p=>p[0])),
      south: Math.min(...a.map(p=>p[1])), north: Math.max(...a.map(p=>p[1])),
      w:pointManifest.width, h:pointManifest.height
    };
  }
  function inside(p,b) { return p && p[0]>=b.west && p[0]<=b.east && p[1]>=b.south && p[1]<=b.north; }
  function cellIndex(p,b) {
    if (!inside(p,b)) return -1;
    const x = Math.min(b.w-1,Math.max(0,Math.floor((p[0]-b.west)/(b.east-b.west)*b.w)));
    const y = Math.min(b.h-1,Math.max(0,Math.floor((b.north-p[1])/(b.north-b.south)*b.h)));
    return y*b.w+x;
  }
  function val(array,band,idx,n) {
    const v = array[band*n+idx];
    return Number.isFinite(v) ? v : null;
  }
  function hav(a,b) {
    const r=Math.PI/180, dphi=(b[1]-a[1])*r, dl=(b[0]-a[0])*r;
    const q=Math.sin(dphi/2)**2 + Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.sin(dl/2)**2;
    return 2*KM*Math.atan2(Math.sqrt(q),Math.sqrt(Math.max(0,1-q)));
  }
  function distanceSamples(points) {
    const legs=[]; let total=0;
    for(let i=1;i<points.length;i++) { const d=hav(points[i-1],points[i]); legs.push(d); total+=d; }
    if(!(total>0)) return {samples:[],total:0,spacing:0};
    const count=Math.max(2,Math.min(1501,Math.ceil(total/5)+1));
    const spacing=total/(count-1);
    const samples=[]; let segment=0, prior=0;
    for(let i=0;i<count;i++) {
      const d=i===count-1?total:i*spacing;
      while(segment<legs.length-1 && d>prior+legs[segment]) {prior+=legs[segment];segment++;}
      const f=legs[segment]>0?Math.max(0,Math.min(1,(d-prior)/legs[segment])):0;
      const a=points[segment],b=points[segment+1];
      samples.push({distance:d,point:[a[0]+f*(b[0]-a[0]),a[1]+f*(b[1]-a[1])]});
    }
    return {samples,total,spacing};
  }
  function pip(p,ring) { // boundary-inclusion + ray crossing
    const x=p[0],y=p[1]; let hit=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
      const a=ring[j],b=ring[i], dx=b[0]-a[0],dy=b[1]-a[1];
      const cross=(x-a[0])*dy-(y-a[1])*dx;
      if(Math.abs(cross)<1e-12 && x>=Math.min(a[0],b[0])-1e-12 && x<=Math.max(a[0],b[0])+1e-12 && y>=Math.min(a[1],b[1])-1e-12 && y<=Math.max(a[1],b[1])+1e-12) return true;
      if((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) hit=!hit;
    }
    return hit;
  }
  function areaPolygon(points) { // approximate local metric area via equirectangular projection
    const meanLat=points.reduce((a,p)=>a+p[1],0)/points.length*Math.PI/180;
    let sum=0; for(let i=0;i<points.length;i++) {
      const a=points[i],b=points[(i+1)%points.length];
      const x1=a[0]*Math.PI/180*KM*Math.cos(meanLat), y1=a[1]*Math.PI/180*KM;
      const x2=b[0]*Math.PI/180*KM*Math.cos(meanLat), y2=b[1]*Math.PI/180*KM;
      sum+=x1*y2-x2*y1;
    }
    return Math.abs(sum)/2;
  }
  function stats(arr) {
    const a=arr.filter(Number.isFinite).sort((x,y)=>x-y),n=a.length;
    if(!n) return null;
    const mean=a.reduce((s,x)=>s+x,0)/n;
    const mid=Math.floor(n/2),median=n%2?a[mid]:(a[mid-1]+a[mid])/2;
    return {count:n,mean,median,min:a[0],max:a[n-1],std:Math.sqrt(a.reduce((s,x)=>s+(x-mean)**2,0)/n)};
  }
  function elements() {return state.elements;}
  function message(s) {if(elements().info)elements().info.textContent=s;}
  function showResults(){
    const e=elements();if(!e.window)return;
    e.window.hidden=false;
    e.openResults.disabled=false;
  }
  function hideResults(){if(elements().window)elements().window.hidden=true;}
  function toggleAnalysis(open){
    const e=elements();if(!e.body)return;
    e.body.hidden=!open;
    e.toggle.setAttribute('aria-expanded',String(open));
  }
  function selectMetric(next){
    state.metric=next;
    elements().metric.value=next;
    elements().reportMetric.value=next;
    drawChart();
  }
  function bringAnalysisIntoView(){
    const sidebar=document.getElementById('sidebar');
    if(sidebar?.classList.contains('closed'))document.getElementById('collapseToggle')?.click();
    toggleAnalysis(true);
    elements().root?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function installTopShortcut(){
    if(document.getElementById('ucy-analysis-topshortcut'))return;
    const anchor=document.getElementById('toggleLayersTop');
    if(!anchor?.parentElement)return;
    const button=document.createElement('button');
    button.type='button';button.id='ucy-analysis-topshortcut';
    button.title='Spatial Analysis: Route and Area';
    button.setAttribute('aria-label','Open Spatial Analysis tools');
    button.innerHTML='<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5" cy="18" r="2"/><circle cx="9" cy="6" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 17 9 8M11 6l7 5"/></svg>';
    anchor.insertAdjacentElement('afterend',button);
    button.addEventListener('click',bringAnalysisIntoView);
  }
  function enableDrag(win,handle){
    let drag=null;
    handle.addEventListener('pointerdown',e=>{
      if(e.button!==0 || e.target.closest('button,select,input'))return;
      const r=win.getBoundingClientRect();
      drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};
      win.style.left=r.left+'px';win.style.top=r.top+'px';win.style.right='auto';win.style.bottom='auto';
      try{handle.setPointerCapture(e.pointerId);}catch(_){}
      e.preventDefault();
    });
    handle.addEventListener('pointermove',e=>{
      if(!drag)return;
      const maxX=Math.max(0,innerWidth-win.offsetWidth),maxY=Math.max(0,innerHeight-36);
      win.style.left=Math.max(0,Math.min(maxX,drag.left+e.clientX-drag.x))+'px';
      win.style.top=Math.max(0,Math.min(maxY,drag.top+e.clientY-drag.y))+'px';
    });
    const stop=()=>{drag=null;};
    handle.addEventListener('pointerup',stop);handle.addEventListener('pointercancel',stop);
  }
  function clearFocus() { if(map.getSource('ucy-analysis-focus'))map.getSource('ucy-analysis-focus').setData(EMPTY); }
  function setFocus(p) {if(!p) return clearFocus();map.getSource('ucy-analysis-focus').setData({type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:{type:'Point',coordinates:p}}]});}
  function drawGeometry() {
    if(!ready() || !map.getSource('ucy-analysis-line'))return;
    const pts=state.points;
    const features=[];
    if(pts.length>=2) features.push({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:pts}});
    map.getSource('ucy-analysis-line').setData({type:'FeatureCollection',features});
    if(state.kind==='area' && pts.length>=3) {
      map.getSource('ucy-analysis-polygon').setData({type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[...pts,pts[0]]]}}]});
    }else map.getSource('ucy-analysis-polygon').setData(EMPTY);
    map.getSource('ucy-analysis-vertices')?.setData({type:'FeatureCollection',features:pts.map(p=>({type:'Feature',properties:{},geometry:{type:'Point',coordinates:p}}))});
    elements().count.textContent=`${pts.length} vertices`;
  }
  function start(kind) {
    if (!ready() || !map.getSource('ucy-analysis-line') || !map.getLayer('ucy-analysis-line-layer')) initialize();
    if (!ready() || !map.getSource('ucy-analysis-line') || !map.getLayer('ucy-analysis-line-layer')) {
      message('Map layers are not ready. Check Forecast and the browser Console for UCY Analysis errors.');
      return;
    }
    state.kind=kind; state.drawing=true; state.points=[];state.samples=[];state.stats={};state.currentKey='';state.report='';state.seq++;
    window.__UCY_ANALYSIS_DRAWING__=true;
    map.getCanvas().style.cursor='crosshair';
    clearFocus();drawGeometry();elements().summary.innerHTML='';elements().chart.replaceChildren();hideResults();
    for(const [key,button] of [['route',elements().route],['area',elements().area]]) button.classList.toggle('chosen',kind===key);
    message(`${kind==='route'?'Route':'Area'}: click on the map, then Finish. Only locations inside the grid are accepted.`);
  }
  function clear() {
    state.kind=null; state.drawing=false;state.points=[];state.samples=[];state.stats={};state.currentKey='';state.seq++;
    window.__UCY_ANALYSIS_DRAWING__=false;
    map.getCanvas().style.cursor=''; clearFocus();drawGeometry();
    elements().route.classList.remove('chosen');elements().area.classList.remove('chosen');
    elements().summary.replaceChildren();elements().chart.replaceChildren();hideResults();message('Select Route or Area to draw.');
  }
  function click(e) {
    if(!state.drawing)return;
    const p=[e.lngLat.lng,e.lngLat.lat],b=footprint();
    if(!b || !inside(p,b)) {message('Click inside the UCY computational grid.');return;}
    if(state.points.length>=200) {message('Maximum 200 vertices reached. Press Finish.');return;}
    state.points.push(p);drawGeometry();message(`${state.points.length} vertices · press Finish when ready.`);
  }
  function finish() {
    if(!state.drawing)return;
    if(state.points.length<(state.kind==='area'?3:2)) {message('Add more points before finishing.');return;}
    state.drawing=false;window.__UCY_ANALYSIS_DRAWING__=false;map.getCanvas().style.cursor='';
    calculate(true);
  }
  function undo() {if(!state.drawing || !state.points.length)return;state.points.pop();drawGeometry();message(`${state.points.length} vertices`);}
  async function grid() {
    if(!ready())throw Error('Map/grid bridge is not ready');
    const b=footprint();if(!b)throw Error('Point-grid metadata unavailable');
    if(inNowcast()) {
      if(!window.__UCY_ANALYSIS_NOWCAST_VERIFIED__)throw Error('Nowcast band layout not yet verified from original Point Selection code');
      if(typeof v9Numeric==='undefined' || !v9Numeric)throw Error('Nowcast numeric grid is not loaded');
      if(typeof v9Meta==='undefined' || v9Meta.width!==b.w || v9Meta.height!==b.h) throw Error('Nowcast and Forecast grid geometry mismatch');
      if(v9Numeric.length!==b.w*b.h*3)throw Error('Unexpected Nowcast grid length');
      return {array:v9Numeric,b,mode:'Nowcast',key:'N|'+(v9Meta.observation_utc||v9Meta.release||'')};
    }
    if(typeof loadNumericHour!=='function' || typeof cursor==='undefined' || !Number.isInteger(cursor))throw Error('Forecast cursor unavailable');
    const a=await loadNumericHour(cursor);
    if(a.length!==b.w*b.h*3)throw Error('Unexpected Forecast grid length');
    return {array:a,b,mode:'Forecast',key:'F|'+cursor+'|'+pointManifest.run};
  }
  async function calculate(force=false) {
    if(state.drawing || !state.kind || !state.points.length || state.busy)return;
    const seq=++state.seq;state.busy=true;message('Sampling numeric grid…');
    try {
      const g=await grid();if(seq!==state.seq)return;
      if(!force && state.currentKey===g.key) return;
      const n=g.b.w*g.b.h; let rows=[];let meta={};
      if(state.kind==='route') {
        const v=distanceSamples(state.points);meta={total:v.total,spacing:v.spacing};
        rows=v.samples.map(x=>({distance:x.distance,point:x.point,idx:cellIndex(x.point,g.b)}));
      }else{
        const ring=state.points;
        const xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]);
        const minx=Math.max(0,Math.floor((Math.min(...xs)-g.b.west)/(g.b.east-g.b.west)*g.b.w)-1);
        const maxx=Math.min(g.b.w-1,Math.ceil((Math.max(...xs)-g.b.west)/(g.b.east-g.b.west)*g.b.w)+1);
        const miny=Math.max(0,Math.floor((g.b.north-Math.max(...ys))/(g.b.north-g.b.south)*g.b.h)-1);
        const maxy=Math.min(g.b.h-1,Math.ceil((g.b.north-Math.min(...ys))/(g.b.north-g.b.south)*g.b.h)+1);
        for(let y=miny;y<=maxy;y++)for(let x=minx;x<=maxx;x++) {
          const p=[g.b.west+(x+0.5)*(g.b.east-g.b.west)/g.b.w,g.b.north-(y+0.5)*(g.b.north-g.b.south)/g.b.h];
          if(pip(p,ring))rows.push({point:p,idx:y*g.b.w+x});
        }
        meta={area:areaPolygon(ring),cells:rows.length};
      }
      const validRows=rows.map(r=>({ ...r, UTCI:r.idx<0?null:val(g.array,0,r.idx,n),PET:r.idx<0?null:val(g.array,1,r.idx,n),Wind:r.idx<0?null:val(g.array,2,r.idx,n)}));
      const s={};for(const [key] of METRICS)s[key]=stats(validRows.map(r=>r[key]));
      state.samples=validRows;state.stats=s;state.currentKey=g.key;state.report=g.mode;
      showSummary(meta,g.mode);drawChart();elements().windowTitle.textContent=(state.kind==='route'?'Route':'Area')+' Analysis · '+g.mode;showResults();
      message(`${g.mode} · ${state.kind==='route'?nfmt(meta.total,1)+' m route':nfmt(meta.area,0)+' m² polygon'} · ${validRows.length} grid ${state.kind==='route'?'samples':'cell centres'}.`);
    }catch(e){if(seq===state.seq){state.currentKey='';elements().summary.replaceChildren();elements().chart.replaceChildren();hideResults();message('Analysis unavailable: '+e.message);console.error('UCY analysis stage:',e);}}
    finally{state.busy=false;}
  }
  function showSummary(meta,mode) {
    const rows=[];
    rows.push(`<div class="ucy-analysis-meta">${mode} · ${state.kind==='route'?`Route length: ${nfmt(meta.total,1)} m · sampling: ${nfmt(meta.spacing,2)} m`:`Approx. polygon area: ${nfmt(meta.area,0)} m² · ${meta.cells} included grid centres`}</div>`);
    rows.push('<div class="ucy-analysis-table-wrap"><table><thead><tr><th>Variable</th><th>Mean</th><th>Median</th><th>Min</th><th>Max</th><th>Valid</th></tr></thead><tbody>');
    for(const [key] of METRICS){
      const s=state.stats[key];
      rows.push(`<tr><td>${key}${key==='Wind'?' (m/s)':' (°C)'}</td><td>${s?colorCell(key,s.mean):'—'}</td><td>${s?colorCell(key,s.median):'—'}</td><td>${s?colorCell(key,s.min):'—'}</td><td>${s?colorCell(key,s.max):'—'}</td><td>${s?s.count:0}</td></tr>`);
    }
    rows.push('</tbody></table></div>');
    const u=state.stats.UTCI;
    if(u){
      const avg=stressFor(u.mean),med=stressFor(u.median);
      rows.push(`<div class="ucya-main-classes"><span>Mean UTCI class: <b style="color:${avg.color}">${avg.label}</b></span><span>Median UTCI class: <b style="color:${med.color}">${med.label}</b></span></div>`);
    }
    rows.push(drawStressDistribution(state.samples));
    rows.push('<div class="ucy-analysis-note">Area: grid-cell-centre inclusion, not fractional cell overlap. NaN cells excluded separately. Route: nominal 5 m sampling from nearest cells; repeated cells possible. Cell-value colors are indicative; validate against the exact map colorbar.</div>');
    elements().summary.innerHTML=rows.join('');
  }

  function drawChart() {
    const holder=elements().chart;holder.replaceChildren();
    if(state.kind!=='route' || !state.samples.length)return;
    const rows=state.samples,metric=state.metric,graphMetric=metric==='Stress'?'UTCI':metric,good=rows.filter(r=>r[graphMetric]!==null);
    if(!good.length){holder.textContent='No valid route values for '+metric;return;}
    const w=620,h=228,pad={l:48,r:12,t:18,b:42},pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;
    let min=Math.min(...good.map(r=>r[graphMetric])),max=Math.max(...good.map(r=>r[graphMetric]));
    if(max-min<0.01){min-=0.5;max+=0.5;}else {const extra=(max-min)*0.09;min-=extra;max+=extra;}
    const xmax=Math.max(0.01,rows[rows.length-1].distance);
    const x=v=>pad.l+v/xmax*pw,y=v=>pad.t+(max-v)/(max-min)*ph;
    const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',`${metric} along route, distance in metres`);
    const add=(tag,attrs,text)=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;svg.appendChild(e);return e;};
    for(let i=0;i<=4;i++){const yy=pad.t+i*ph/4;add('line',{x1:pad.l,y1:yy,x2:w-pad.r,y2:yy,stroke:'#667b93','stroke-opacity':'.32','stroke-dasharray':'3 3'});add('text',{x:pad.l-7,y:yy+4,'text-anchor':'end','font-size':'11',fill:'currentColor'},nfmt(max-i*(max-min)/4,1));}
    add('line',{x1:pad.l,y1:pad.t,x2:pad.l,y2:h-pad.b,stroke:'#9ab0ca'});add('line',{x1:pad.l,y1:h-pad.b,x2:w-pad.r,y2:h-pad.b,stroke:'#9ab0ca'});
    for(let i=0;i<=5;i++){const v=xmax*i/5;add('text',{x:x(v),y:h-pad.b+19,'text-anchor':'middle','font-size':'11',fill:'currentColor'},nfmt(v,0));}
    add('text',{x:w/2,y:h-5,'text-anchor':'middle','font-size':'12',fill:'currentColor'},'Distance along route (m)');
    const unit=metric==='Wind'?'m/s':'°C';add('text',{x:pad.l,y:11,'font-size':'12',fill:'currentColor'},(metric==='Stress'?'Thermal Stress · UTCI':metric)+' ('+unit+')');
    // Render segments independently; never interpolate across NoData.
    let previous=null;
    for(const r of rows){
      if(r[graphMetric]===null){previous=null;continue;}
      if(previous){
        const col=metric==='Stress'?stressFor((previous.UTCI+r.UTCI)/2).color:paletteColor(metric,(previous[graphMetric]+r[graphMetric])/2);
        add('line',{x1:x(previous.distance),y1:y(previous[graphMetric]),x2:x(r.distance),y2:y(r[graphMetric]),stroke:col,'stroke-width':'3.0','stroke-linecap':'round'});
      }
      previous=r;
    }
    const cross=add('line',{x1:0,y1:pad.t,x2:0,y2:h-pad.b,stroke:'#ffbc66','stroke-width':'1.5',visibility:'hidden'});
    const overlay=add('rect',{x:pad.l,y:pad.t,width:pw,height:ph,fill:'transparent'});
    overlay.style.cursor='crosshair';
    overlay.addEventListener('pointermove',evt=>{
      const rr=svg.getBoundingClientRect(),px=(evt.clientX-rr.left)/rr.width*w;
      const d=Math.max(0,Math.min(xmax,(px-pad.l)/pw*xmax));let nearest=rows[0];let best=Infinity;
      for(const r of rows){const dd=Math.abs(r.distance-d);if(dd<best){best=dd;nearest=r;}}
      const xx=x(nearest.distance);cross.setAttribute('x1',xx);cross.setAttribute('x2',xx);cross.setAttribute('visibility','visible');setFocus(nearest.point);
      elements().hover.textContent=`${nfmt(nearest.distance,1)} m · UTCI ${nfmt(nearest.UTCI)} °C · ${Number.isFinite(nearest.UTCI)?stressFor(nearest.UTCI).label:'No UTCI'} · PET ${nfmt(nearest.PET)} °C · Wind ${nfmt(nearest.Wind)} m/s`;
    });
    overlay.addEventListener('pointerleave',()=>{cross.setAttribute('visibility','hidden');clearFocus();elements().hover.textContent='Move over the graph to locate a point on the map.';});
    holder.append(svg);
  }
  // UCY_SIDEBAR_LEGACY_ADAPTER_V61
  // The current live Forecast may use the original metricStack/layerToggle/layerBody
  // structure rather than the older ucy-v4-* accordion IDs. Move DOM nodes;
  // do not clone/replace existing scientific controls or their listeners.
  function ucyaOrganizeSidebar(){
    if(document.getElementById('ucya-v6-map-display'))return true;

    const metricStack=document.getElementById('metricStack');
    const oldToggle=document.getElementById('layerToggle');
    const oldBody=document.getElementById('layerBody');
    const route=document.getElementById('ucy-analysis-stage');
    const sidebar=document.getElementById('sidebar');
    if(!metricStack||!oldToggle||!oldBody||!route||!sidebar)return false;

    // Original controls must share their real sidebar host. Never reorganize
    // a different view or move the entire sidebar/brand by accident.
    const host=metricStack.parentElement;
    if(!host||!sidebar.contains(host)||!host.contains(oldToggle)||
       !host.contains(oldBody)||!host.contains(route)){
      console.warn('UCY V6.1: sidebar controls not in the same host; layout unchanged');
      return false;
    }

    const topChild = node => {
      if(!node||node===host)return null;
      let el=node;
      while(el.parentElement && el.parentElement!==host)el=el.parentElement;
      return el.parentElement===host?el:null;
    };
    const equalLabel=(text,target)=>
       text.replace(/\s+/g,' ').trim().toLowerCase()===target.toLowerCase();
    const findSection=(label)=>{
      const choices=[...host.querySelectorAll('summary,button,h2,h3,h4,div,span')]
         .filter(el=>equalLabel(el.textContent||'',label));
      // Prefer the most specific heading, but relocate its existing top-level
      // section (not an unrelated parent containing multiple subpanels).
      for(const heading of choices){
        const direct=topChild(heading);
        if(direct && direct!==metricStack && direct!==oldToggle &&
           direct!==oldBody && direct!==route)return direct;
      }
      return null;
    };

    // Existing installations with ucy-v4 wrappers remain supported.
    const comfort=document.getElementById('ucy-v4-comfort') ||
      findSection('Time & thermal comfort');
    const weather=document.getElementById('ucy-v4-weather') ||
      findSection('Weather conditions');
    const about=findSection('About the data and tools');
    const time=topChild(comfort),meteo=topChild(weather),aboutNode=topChild(about);
    // Do not move a shared ancestor if time/weather live in one container.
    if(!time||!meteo||time===meteo || time===metricStack || meteo===metricStack){
      console.warn('UCY V6.1: Time/Weather sections not independently identified; layout unchanged');
      return false;
    }

    const originalLabel=[...host.querySelectorAll('.section-label')]
      .find(el=>equalLabel(el.textContent||'','Map layers'));

    const layers=document.getElementById('ucy-v4-layers') || document.createElement('details');
    if(!layers.id)layers.id='ucya-v61-map-layers';
    layers.classList.add('ucya-v6-details');
    const display=document.createElement('details');
    display.id='ucya-v6-map-display';
    display.className='ucya-v6-details';

    if(!layers.querySelector('summary')){
      const summary=document.createElement('summary');
      summary.textContent='Map Layers';
      layers.prepend(summary);
    }
    const layerContent=document.createElement('div');
    layerContent.className='ucya-v61-layer-content';
    layers.append(layerContent);
    layerContent.append(metricStack);

    const summary=document.createElement('summary');
    summary.textContent='Map Display';
    display.append(summary);
    const content=document.createElement('div');
    content.className='ucya-v6-display-content';
    display.append(content);
    content.append(oldToggle,oldBody);
    oldToggle.classList.add('ucya-v6-legacy-toggle');
    oldBody.hidden=false;
    oldToggle.setAttribute('aria-expanded','true');

    // Preserve original sections; never reconstruct their cards/handlers.
    // Keep the existing brand at the top of its parent.
    if(layers.parentElement!==host)host.insertBefore(layers,time);
    host.insertBefore(time,layers);
    layers.after(display);
    display.after(route);
    route.after(meteo);
    if(aboutNode && aboutNode!==time && aboutNode!==meteo &&
       aboutNode!==layers && aboutNode!==display && aboutNode!==route){
      meteo.after(aboutNode);
    }
    if(originalLabel && !layers.contains(originalLabel))
      originalLabel.classList.add('ucya-v61-original-label-hidden');

    if(time.tagName==='DETAILS')time.open=true;
    if(meteo.tagName==='DETAILS')meteo.open=false;
    layers.open=true;
    display.open=false;
    toggleAnalysis(false);

    display.addEventListener('toggle',()=>{
      if(display.open){oldBody.hidden=false;oldToggle.setAttribute('aria-expanded','true');}
    });
    const toolbar=document.getElementById('toggleLayersTop');
    if(toolbar)toolbar.addEventListener('click',()=>setTimeout(()=>{
      display.open=true;
      oldBody.hidden=false;
      oldToggle.setAttribute('aria-expanded','true');
      display.scrollIntoView({block:'nearest',behavior:'smooth'});
    },0));

    console.info('UCY V6.1: Time > Map Layers > Map Display > Spatial Analysis > Weather > About');
    return true;
  }

  function buildUI(){
    const panel=document.getElementById('layerBody');
    if(!panel) throw Error('Existing sidebar #layerBody not found');
    const root=document.createElement('section');root.id='ucy-analysis-stage';
    root.innerHTML=`
      <button id="ucy-analysis-toggle" type="button" aria-expanded="true" aria-controls="ucy-analysis-body" class="ucya-accordion">
        <span>Spatial Analysis</span><span class="ucya-chevron" aria-hidden="true">⌃</span>
      </button>
      <div id="ucy-analysis-body" class="ucya-body">
        <div class="ucy-analysis-buttons"><button type="button" id="ucy-analysis-route">Route Analysis</button><button type="button" id="ucy-analysis-area">Area Analysis</button></div>
        <div class="ucy-analysis-buttons"><button type="button" id="ucy-analysis-finish">Finish</button><button type="button" id="ucy-analysis-undo">Undo</button><button type="button" id="ucy-analysis-clear">Clear</button><button type="button" id="ucy-analysis-refresh">Update values</button></div>
        <div class="ucy-analysis-buttons"><button type="button" id="ucy-analysis-open-results" disabled>Open results window</button></div>
        <div class="ucy-analysis-info" id="ucy-analysis-info">Select Route or Area to draw.</div>
        <div class="ucy-analysis-info" id="ucy-analysis-count"></div>
      </div>`;
    panel.insertAdjacentElement('afterend',root);
    const win=document.createElement('aside');
    win.id='ucy-analysis-window';win.hidden=true;win.setAttribute('aria-label','Spatial Analysis results');
    win.innerHTML=`
      <div class="ucya-window-header" id="ucy-analysis-drag">
        <div><div class="ucya-window-kicker">UCY HEAT · SPATIAL RESULTS · DRAG / RESIZE</div><strong id="ucy-analysis-window-title">Spatial Analysis</strong></div>
        <div class="ucya-window-buttons"><button type="button" id="ucy-analysis-min" title="Minimize results">−</button><button type="button" id="ucy-analysis-close" title="Hide results">×</button></div>
      </div>
      <div id="ucy-analysis-window-body" class="ucya-window-body">
        <label class="ucy-analysis-select">Chart metric
          <select id="ucy-analysis-report-metric"><option value="UTCI">UTCI</option><option value="PET">PET</option><option value="Wind">Wind speed at 1.5 m</option><option value="Stress">Thermal Stress (UTCI)</option></select>
        </label>
        <div id="ucy-analysis-summary"></div>
        <div id="ucy-analysis-chart"></div>
        <div class="ucy-analysis-hover" id="ucy-analysis-hover"></div>
      </div>`;
    document.body.append(win);
    const find=id=>document.getElementById(id);
    state.elements={root,window:win,body:find('ucy-analysis-body'),toggle:find('ucy-analysis-toggle'),windowTitle:find('ucy-analysis-window-title'),windowBody:find('ucy-analysis-window-body'),route:find('ucy-analysis-route'),area:find('ucy-analysis-area'),finish:find('ucy-analysis-finish'),undo:find('ucy-analysis-undo'),clear:find('ucy-analysis-clear'),refresh:find('ucy-analysis-refresh'),openResults:find('ucy-analysis-open-results'),metric:find('ucy-analysis-report-metric'),reportMetric:find('ucy-analysis-report-metric'),info:find('ucy-analysis-info'),count:find('ucy-analysis-count'),summary:find('ucy-analysis-summary'),chart:find('ucy-analysis-chart'),hover:find('ucy-analysis-hover')};
    elements().toggle.addEventListener('click',()=>toggleAnalysis(elements().body.hidden));
    elements().route.addEventListener('click',()=>start('route'));
    elements().area.addEventListener('click',()=>start('area'));
    elements().finish.addEventListener('click',finish);
    elements().undo.addEventListener('click',undo);
    elements().clear.addEventListener('click',clear);
    elements().refresh.addEventListener('click',()=>calculate(true));
    elements().openResults.addEventListener('click',showResults);
    elements().metric.addEventListener('change',e=>selectMetric(e.target.value));
    find('ucy-analysis-close').addEventListener('click',hideResults);
    find('ucy-analysis-min').addEventListener('click',()=>{
      const body=elements().windowBody,closed=body.hidden;
      body.hidden=!closed;
      find('ucy-analysis-min').textContent=closed?'−':'+';
    });
    enableDrag(win,find('ucy-analysis-drag'));
    installTopShortcut();
    // Organize only existing sidebar nodes: do not recreate model input controls.
    setTimeout(ucyaOrganizeSidebar,120);
    console.info('UCY Analysis stage V6: collapsible sidebar and result window initialized');
  }

  function initialize(){
    // Re-entrant bootstrap: create controls once, then install map layers individually.
    // A busy raster or a partially completed first attempt must not permanently block drawing.
    if(!document.getElementById('layerBody')){
      setTimeout(initialize,450);
      return;
    }
    if(!document.getElementById('ucy-analysis-stage')){
      try { buildUI(); }
      catch(e){console.error('UCY Analysis V6 controls:',e);return;}
    }
    if(!document.getElementById('ucya-v6-map-display'))ucyaOrganizeSidebar();
    if(!ready()){
      message('Connecting to UCY Heat map… '+(!bridge?'Bridge missing':!map?'Map not initialized':!pointManifest?'Grid metadata missing':'Raster source not ready'));
      setTimeout(initialize,650);
      return;
    }
    try{
      const sources=['ucy-analysis-line','ucy-analysis-polygon','ucy-analysis-focus','ucy-analysis-vertices'];
      for(const id of sources){
        if(!map.getSource(id)) map.addSource(id,{type:'geojson',data:EMPTY});
      }
      const layers=[
        {id:'ucy-analysis-poly-fill',type:'fill',source:'ucy-analysis-polygon',paint:{'fill-color':'#26c5ed','fill-opacity':0.16}},
        {id:'ucy-analysis-poly-line',type:'line',source:'ucy-analysis-polygon',paint:{'line-color':'#27d2f3','line-width':3.5}},
        {id:'ucy-analysis-line-layer',type:'line',source:'ucy-analysis-line',paint:{'line-color':'#c273ff','line-width':4}},
        {id:'ucy-analysis-vertex-layer',type:'circle',source:'ucy-analysis-vertices',paint:{'circle-radius':4,'circle-color':'#ffffff','circle-stroke-color':'#6b45aa','circle-stroke-width':2}},
        {id:'ucy-analysis-focus-layer',type:'circle',source:'ucy-analysis-focus',paint:{'circle-radius':7,'circle-color':'#ffbf45','circle-stroke-color':'#ffffff','circle-stroke-width':2}}
      ];
      for(const layer of layers){
        if(!map.getLayer(layer.id))map.addLayer(layer);
      }
      if(!state.mapClickAttached){
        map.on('click',click);
        state.mapClickAttached=true;
      }
      if(!state.hourlyCheckAttached){
        state.hourlyCheckAttached=true;
        setInterval(()=>{
          if(!ready())return;
          if(!document.getElementById('ucya-v6-map-display'))ucyaOrganizeSidebar();
          if(!map.getSource('ucy-analysis-line') || !map.getLayer('ucy-analysis-line-layer')){
            initialize();
            return;
          }
          if(!state.drawing && state.kind && !state.busy){
            const key=inNowcast()?'N|'+(typeof v9Meta!=='undefined'?(v9Meta.observation_utc||v9Meta.release):''):'F|'+(typeof cursor!=='undefined'?cursor:'')+'|'+(typeof pointManifest!=='undefined'&&pointManifest?pointManifest.run:'');
            if(inNowcast() && !window.__UCY_ANALYSIS_NOWCAST_VERIFIED__){
              if(state.currentKey!==key){
                state.currentKey=key;
                elements().summary.replaceChildren();elements().chart.replaceChildren();hideResults();
                message('Nowcast numeric analysis unavailable: source band order has not been verified. Geometry remains saved.');
              }
            }else if(key!==state.currentKey)calculate(false);
          }
        },1200);
      }
      message(inNowcast()? (window.__UCY_ANALYSIS_NOWCAST_VERIFIED__ ? 'Nowcast ready: select Route or Area, then click on the map.' : 'Nowcast: drawing available, numeric band order not yet verified.') : 'Forecast ready: select Route or Area, then click on the map.');
      installTopShortcut();console.info('UCY Analysis V6: map drawing sources and layers ready via bridge');
    }catch(e){
      console.error('UCY Analysis V6 map setup:',e);
      message('Map setup retrying: '+e.message);
      setTimeout(initialize,800);
    }
  }
  initialize();
})();
