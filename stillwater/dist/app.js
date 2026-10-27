import { flockState, clamp } from './flight-model.js';
import { drawFlock } from './flock.js';
import { createTerrain, SCENES, routeCamera } from './terrain.js';
import { mountStoryCloth } from './page-cloth.js';
import { mountPageClouds } from './page-clouds.js';
import './audio.js';
const birdCanvas=document.querySelector('#flight-canvas'),terrainCanvas=document.querySelector('#terrain-canvas');
const ctx=birdCanvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const terrainImages=SCENES.map(src=>{const image=new Image();image.src=src;return image;});
const controls=document.querySelector('#flight-timeline'),progressBar=document.querySelector('.reading-progress'),percentLabel=document.querySelector('#flight-percent');
const panels=[...document.querySelectorAll('.panel')],navLinks=[...document.querySelectorAll('.chapter-nav a')];
const names=['THE LOTUS WETLANDS','THE GOLDEN TERRACES','BAMBOO & AUTUMN','THE HIGH PEAKS'];
let terrain=null,width=0,height=0,ratio=1,scheduled=false,contextLost=false;
function fallbackTerrain(progress){
  terrainCanvas.hidden=true;
  const stage=document.querySelector('.stage');
  stage.style.backgroundImage=`url('${SCENES[routeCamera(progress).index]}')`;
  stage.style.backgroundSize='cover';
  stage.style.backgroundPosition='57% 50%';
  terrainCanvas.dataset.terrainRenderer='painted-fallback';
}
function draw(progress){
  const birds=flockState(progress,reduced.matches);
  if(terrain&&!contextLost)terrain.render(progress,reduced.matches);
  else fallbackTerrain(reduced.matches?0:progress);
  ctx.setTransform(ratio,0,0,ratio,0,0);drawFlock(ctx,birds,width,height,progress);
  birdCanvas.dataset.flightProgress=progress.toFixed(6);birdCanvas.dataset.flightFrame=String(birds[0].frame);
  birdCanvas.dataset.wing=birds[0].wing.toFixed(6);birdCanvas.dataset.view='rear-follow-flock';birdCanvas.dataset.craneCount=String(birds.length);
}
function update(){
  const maximum=Math.max(1,document.documentElement.scrollHeight-innerHeight),progress=clamp(scrollY/maximum);
  draw(progress);
  controls.value=String(Math.round(progress*1000));const percentage=`${Math.round(progress*100)}%`;
  controls.style.setProperty('--flight-percent',percentage);controls.setAttribute('aria-valuetext',`${Math.round(progress*100)} percent of the flight`);
  percentLabel.textContent=percentage;progressBar.style.transform=`scaleX(${progress})`;
  let active=0;panels.slice(0,4).forEach((panel,index)=>{if(panel.getBoundingClientRect().top<=innerHeight*.53)active=index;});
  navLinks.forEach((link,index)=>{if(index===active)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');});
  document.querySelector('#passage-number').textContent=String(active).padStart(2,'0');document.querySelector('#passage-name').textContent=names[active];
  panels.forEach(panel=>{const r=panel.getBoundingClientRect(),enter=clamp((innerHeight*.85-r.top)/(innerHeight*.35)),exit=clamp(r.bottom/(innerHeight*.6));panel.style.setProperty('--reveal',String(reduced.matches?1:Math.min(enter,exit)));});
  scheduled=false;
}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update);}}
function resize(){width=document.documentElement.clientWidth;height=innerHeight;ratio=Math.min(devicePixelRatio||1,2);birdCanvas.width=Math.round(width*ratio);birdCanvas.height=Math.round(height*ratio);update();}
function setupTerrain(){try{terrain=createTerrain(terrainCanvas,terrainImages);}catch(error){console.warn('Terrain fallback:',error.message);terrain=null;}terrainCanvas.hidden=!terrain;resize();}
Promise.all(terrainImages.map(image=>image.decode())).then(setupTerrain).catch(()=>{fallbackTerrain(0);schedule();});
terrainCanvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;fallbackTerrain(Number(controls.value)/1000);});
terrainCanvas.addEventListener('webglcontextrestored',()=>{contextLost=false;setupTerrain();});
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize,{passive:true});reduced.addEventListener('change',schedule);
controls.addEventListener('input',()=>{scrollTo({top:Number(controls.value)/1000*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'});update();});
resize();
mountStoryCloth();
mountPageClouds(document.querySelector('#clouds-canvas'));
