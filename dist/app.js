import { flightState, clamp } from './flight-model.js';
import { mountPageClouds } from './page-clouds.js';
const canvas = document.querySelector('#flight-canvas');
const ctx = canvas.getContext('2d', { alpha:false });
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const panorama = new Image(); panorama.src = 'assets/flight-panorama.webp';
const atlas = new Image(); atlas.src = 'assets/crane-atlas.webp';
const controls = document.querySelector('#flight-timeline');
const progressBar = document.querySelector('.reading-progress');
const percentLabel = document.querySelector('#flight-percent');
const navLinks = [...document.querySelectorAll('.chapter-nav a')];
const panels = [...document.querySelectorAll('.panel')];
const names = ['THE FIRST WINGBEAT','THE WAKING WATER','THE MOUNTAIN’S BREATH','THE WAY HOME'];
let width=0, height=0, pixelRatio=1, scheduled=false;
function shape(path, fill, stroke=null, lineWidth=.6) {
  const item = new Path2D(path);
  if(fill) { ctx.fillStyle=fill; ctx.fill(item); }
  if(stroke) { ctx.strokeStyle=stroke; ctx.lineWidth=lineWidth; ctx.stroke(item); }
}
function wing(flutter,far=false) {
  ctx.save(); ctx.translate(far?7:-8,-9);
  ctx.scale(far?-.72:1,(far?.77:1)*(flutter*.91+.11));
  const outline='M0 0 C27-31 26-81 1-125 C-10-151-37-176-56-183 C-75-167-104-139-117-112 C-113-87-73-33 0 0Z';
  const tone=ctx.createLinearGradient(15,0,-50,-175);
  tone.addColorStop(0,far?'#b8beb0':'#f0ecdf'); tone.addColorStop(.56,far?'#dedfd1':'#faf5e8'); tone.addColorStop(1,'#424a40');
  shape(outline,tone,'#6f75666b',.8);
  for(let i=0;i<13;i++) {
    const u=i/12,rx=1-u*62,ry=-96-u*20,tx=-19-u*103,ty=-194+u*72;
    ctx.beginPath(); ctx.moveTo(rx+11,ry+8);
    ctx.bezierCurveTo(rx-3,ry-30,tx+8,ty-12,tx,ty);
    ctx.bezierCurveTo(tx-12,ty+15,rx-17,ry+21,rx-9,ry+29); ctx.closePath();
    ctx.fillStyle=i%3===0?'#282f2b':i%3===1?'#373f35':'#202925'; ctx.fill();
    ctx.strokeStyle='#7e83725c'; ctx.lineWidth=.55; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rx,ry+8); ctx.quadraticCurveTo((rx+tx)/2,(ry+ty)/2,tx+1,ty+7);
    ctx.strokeStyle='#c8c8ac38'; ctx.lineWidth=.65; ctx.stroke();
  }
  for(let row=0;row<3;row++) for(let i=0;i<9;i++) {
    const x=3-i*8-row*3,y=-24-row*26-i*3.4;
    ctx.beginPath(); ctx.moveTo(x+12,y+9); ctx.quadraticCurveTo(x+3,y-18,x-15,y-24); ctx.quadraticCurveTo(x-13,y-1,x+12,y+9);
    ctx.fillStyle=(row+i)%3===0?'#d4d7c8':'#eae7d8'; ctx.fill(); ctx.strokeStyle='#747e613b'; ctx.lineWidth=.5; ctx.stroke();
  }
  ctx.restore();
}
function fallbackCrane(state) {
  ctx.save();
  const base=Math.min(width/1100,height/730)*.92;
  const scale=width<650?Math.min(width/660,.7):base;
  ctx.translate(width*state.x,height*state.y); ctx.scale(scale*state.scale,scale*state.scale); ctx.rotate(state.pitch);
  shape('M-34 12 Q-91 27-160 18 L-185 12 M-32 17 Q-93 38-163 31 L-186 26 M-159 18 L-180 21 M-162 31 L-183 35',null,'#394536',2.4);
  wing(state.farWing,true);
  shape('M-43-6 Q-73-10-99 4 L-74 12-94 20 Q-54 25-31 14Z','#29332c','#4c5645',.7);
  const belly=ctx.createLinearGradient(0,-27,0,24); belly.addColorStop(0,'#fbf6e8'); belly.addColorStop(.47,'#e9e8d8'); belly.addColorStop(1,'#a2ad96');
  shape('M-57 2 C-57-16-24-29 8-22 C34-20 56-10 57 1 C42 22-7 30-38 18Z',belly,'#76806a99',.8);
  shape('M24-18 C64-22 94-24 133-27 C147-33 160-28 166-22 L157-12 C124-12 78-8 45 5Z','#e6e6d5','#68755b88',.6);
  shape('M48-11 C89-16 116-16 145-20 L161-18 158-11 C125-9 81-4 52 3Z','#343f34');
  shape('M140-27 C145-36 162-34 169-25 L169-17 C160-9 144-13 140-20Z','#e9e7d6','#65715b',.5);
  shape('M143-29 Q154-39 165-29 L163-25 Q154-28 145-26Z','#b24634');
  shape('M166-24 L207-18 165-16Z','#555d46','#303b2e',.55);
  ctx.beginPath();ctx.ellipse(160,-23,2.4,2.1,0,0,Math.PI*2);ctx.fillStyle='#151f19';ctx.fill();
  ctx.beginPath();ctx.arc(160.6,-23.6,.65,0,Math.PI*2);ctx.fillStyle='#e5e0ca';ctx.fill();
  for(let i=0;i<11;i++) {ctx.beginPath();ctx.moveTo(-45+i*7,4+Math.sin(i)*3);ctx.quadraticCurveTo(-31+i*7,-5,-17+i*5,-7);ctx.strokeStyle='#88907855';ctx.lineWidth=.7;ctx.stroke();}
  wing(state.wing);ctx.restore();
}
function cloud(x,y,radius,opacity) {
  const haze=ctx.createRadialGradient(x,y,0,x,y,radius);
  haze.addColorStop(0,`rgba(242,239,225,${opacity})`);haze.addColorStop(.5,`rgba(242,239,225,${opacity*.5})`);haze.addColorStop(1,'rgba(242,239,225,0)');
  ctx.fillStyle=haze;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
}
function crane(state) {
  if (!atlas.complete || !atlas.naturalWidth) { fallbackCrane(state); return; }
  const base = Math.min(width / 1100, height / 730) * .92;
  const scale = (width < 650 ? Math.min(width / 660, .7) : base) * state.scale;
  const x = Math.min(width - 210 * scale - 18, Math.max(190 * scale + 18, width * state.x));
  const y = width < 650 ? height * (.76 + (state.y - .35) * .1) : height * state.y;
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.rotate(state.pitch);
  // The two painted wings pivot at the shoulder; compression provides the
  // foreshortening of a wing passing through its horizontal flight position.
  ctx.save(); ctx.translate(7, -9); ctx.scale(1, state.farWing * .73 + .11);
  ctx.globalAlpha = .9;
  ctx.drawImage(atlas, 740, 500, 514, 754, -17, -165, 144, 211);
  ctx.restore();
  ctx.drawImage(atlas, 0, 180, 1254, 280, -180, -39, 385, 86);
  ctx.save(); ctx.translate(-8, -11); ctx.scale(1, state.wing * .91 + .11);
  ctx.drawImage(atlas, 0, 480, 640, 774, -183, -181.5, 192, 232.2);
  ctx.restore(); ctx.restore();
}
function render(progress) {
  if(!ctx)return;
  const state=flightState(progress,reduced.matches);
  ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);ctx.fillStyle='#eee8da';ctx.fillRect(0,0,width,height);
  if(panorama.complete&&panorama.naturalWidth) {
    const zoom=1.035+Math.sin(state.camera*Math.PI)*.045;
    const imageHeight=height*zoom,imageWidth=imageHeight*panorama.naturalWidth/panorama.naturalHeight;
    const x=-(imageWidth-width)*state.camera,y=(height-imageHeight)*.56+Math.sin(state.camera*Math.PI*2)*height*.02;
    ctx.drawImage(panorama,x,y,imageWidth,imageHeight);
  }
  cloud(width*(.05+state.mist*.4),height*.45,width*.45,.12);
  cloud(width*(.85-state.mist*.38),height*.18,width*.35,.16);
  crane(state);
  cloud(width*(1.45-state.mist*1.8),height*.35,Math.max(width*.26,180),.35);
  canvas.dataset.flightProgress=state.progress.toFixed(6);canvas.dataset.flightFrame=String(state.frame);canvas.dataset.wing=state.wing.toFixed(6);canvas.dataset.camera=state.camera.toFixed(6);
}
function update() {
  const maximum=Math.max(1,document.documentElement.scrollHeight-innerHeight),progress=clamp(scrollY/maximum);
  render(progress); controls.value=String(Math.round(progress*1000));
  const percentage=`${Math.round(progress*100)}%`;
  controls.style.setProperty('--flight-percent',percentage);controls.setAttribute('aria-valuetext',`${Math.round(progress*100)} percent of the flight`);
  percentLabel.textContent=percentage;progressBar.style.transform=`scaleX(${progress})`;
  let active=0;panels.slice(0,4).forEach((panel,index)=>{if(panel.getBoundingClientRect().top<=innerHeight*.53)active=index;});
  navLinks.forEach((link,index)=>{if(index===active)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');});
  document.querySelector('#passage-number').textContent=String(active).padStart(2,'0');document.querySelector('#passage-name').textContent=names[active];
  panels.forEach(panel=>{const rect=panel.getBoundingClientRect(),enter=clamp((innerHeight*.8-rect.top)/(innerHeight*.35)),exit=clamp(rect.bottom/(innerHeight*.6));panel.style.setProperty('--reveal',String(reduced.matches?1:Math.min(enter,exit)));});
  scheduled=false;
}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update);}}
function resize(){width=document.documentElement.clientWidth;height=innerHeight;pixelRatio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*pixelRatio);canvas.height=Math.round(height*pixelRatio);update();}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize,{passive:true});reduced.addEventListener('change',schedule);panorama.addEventListener('load',schedule);
atlas.addEventListener('load',schedule);
controls.addEventListener('input',()=>{scrollTo({top:Number(controls.value)/1000*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'});update();});
resize();
mountPageClouds(document.querySelector('#clouds-canvas'));
// Opt-in ambient water sound; the animation itself is driven only by scrolling.
const soundButton=document.querySelector('.sound-toggle'),soundLabel=document.querySelector('.sound-label');let audio,volume,dropTimer,playing=false;
function createPond(){const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)throw new Error('Audio unavailable');audio=new AudioContext();volume=audio.createGain();volume.gain.value=0;volume.connect(audio.destination);const buffer=audio.createBuffer(1,audio.sampleRate*5,audio.sampleRate),channel=buffer.getChannelData(0);let previous=0;for(let i=0;i<channel.length;i++){previous=(previous+.025*(Math.random()*2-1))/1.025;channel[i]=previous*3;}const source=audio.createBufferSource();source.buffer=buffer;source.loop=true;const water=audio.createBiquadFilter();water.type='lowpass';water.frequency.value=740;source.connect(water);water.connect(volume);source.start();}
function drop(){if(!playing||audio.state!=='running')return;const now=audio.currentTime,oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.frequency.setValueAtTime(850+Math.random()*900,now);oscillator.frequency.exponentialRampToValueAtTime(320,now+.17);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.065,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+.34);oscillator.connect(gain);gain.connect(volume);oscillator.start(now);oscillator.stop(now+.36);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}
soundButton.addEventListener('click',async()=>{soundButton.disabled=true;try{if(!audio)createPond();await audio.resume();playing=!playing;volume.gain.cancelScheduledValues(audio.currentTime);volume.gain.setTargetAtTime(playing?.28:0,audio.currentTime,.4);clearInterval(dropTimer);if(playing)dropTimer=setInterval(drop,2200);soundButton.setAttribute('aria-pressed',String(playing));soundButton.setAttribute('aria-label',`Turn ${playing?'off':'on'} ambient pond sounds`);soundLabel.textContent=playing?'Sound on':'Sound off';}catch{playing=false;soundLabel.textContent='Sound unavailable';soundButton.setAttribute('aria-pressed','false');}finally{soundButton.disabled=false;}});
document.addEventListener('visibilitychange',()=>{if(!audio)return;if(document.hidden)audio.suspend().catch(()=>{});else if(playing)audio.resume().catch(()=>{});});
