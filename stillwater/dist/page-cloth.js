import { createCloth } from './cloth.js';
import { clothRollGeometry, scrollRollFrame, scrollSceneArrival } from './scroll-roll.js';

export const CLOTH_OPTIONS = Object.freeze({ wind: 3, speed: .5, amplitude: 30, drape: 40, brush: 2.05, brushSize: 150, damping: 1, light: .5, sheen: .1, shadow: .25, cornerRadius: 2, perspective: 1200, pin: 'top', backing: [.916,.879,.779] });

// Capture the actual laid-out text glyphs into a texture using their DOM ranges.
// This keeps the supplied cloth mesh available on browsers without drawElementImage.
export function paintClothTexture(source, content) {
  const box = content.getBoundingClientRect();
  if (!box.width || !box.height) return false;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  source.width = Math.ceil(box.width * ratio); source.height = Math.ceil(box.height * ratio);
  const ctx = source.getContext('2d'); ctx.scale(ratio, ratio);
  ctx.fillStyle = '#ebe1c8'; ctx.fillRect(0,0,box.width,box.height);
  // Fine woven linen, restrained rather than a glossy paper card.
  ctx.lineWidth = .5;
  for(let x=0;x<box.width;x+=3){ctx.strokeStyle=x%2?'#796a4712':'#fff8e522';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,box.height);ctx.stroke();}
  for(let y=0;y<box.height;y+=3){ctx.strokeStyle=y%2?'#7b73500d':'#fffcdf25';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(box.width,y);ctx.stroke();}
  ctx.strokeStyle = '#887a5440'; ctx.lineWidth = .6;
  ctx.strokeRect(11,11,box.width-22,box.height-22);
  ctx.strokeStyle = '#a84d3a50'; ctx.beginPath();ctx.moveTo(15,20);ctx.lineTo(box.width-15,20);ctx.stroke();
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
  const range = document.createRange(); let node;
  while((node=walker.nextNode())){
    const parent = node.parentElement, style = getComputedStyle(parent);
    // Closed scrolls are visually hidden, but still need their complete ink
    // texture ready before the fabric starts to unroll.
    if(style.display==='none')continue;
    const size = parseFloat(style.fontSize);
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${size}px ${style.fontFamily}`;
    ctx.fillStyle = style.color; ctx.textBaseline = 'alphabetic';
    const metrics = ctx.measureText('Mg');
    const ascent = metrics.fontBoundingBoxAscent || size*.8, descent = metrics.fontBoundingBoxDescent || size*.2;
    for(let i=0;i<node.length;i++){
      const text=node.textContent[i]; if(/\s/.test(text))continue;
      range.setStart(node,i);range.setEnd(node,i+1);const rect=range.getBoundingClientRect();
      const baseline=rect.top-box.top+(rect.height-ascent-descent)/2+ascent;
      ctx.fillText(style.textTransform==='uppercase'?text.toUpperCase():text,rect.left-box.left,baseline);
    }
  }
  range.detach();
  for(const element of content.querySelectorAll('.round-arrow,.passage-seal,.epilogue-seal')){
    const r=element.getBoundingClientRect(),style=getComputedStyle(element);
    ctx.strokeStyle=style.borderColor;ctx.lineWidth=1;ctx.beginPath();
    if(element.classList.contains('round-arrow'))ctx.ellipse(r.left-box.left+r.width/2,r.top-box.top+r.height/2,r.width/2,r.height/2,0,0,Math.PI*2);
    else ctx.rect(r.left-box.left,r.top-box.top,r.width,r.height);
    ctx.stroke();
  }
  return true;
}

export function mountStoryCloth() {
  const mounted=[],html=document.documentElement,motion=matchMedia('(prefers-reduced-motion: reduce)');
  let disposed=false,intro=motion.matches?1:0,introStarted=false,introFrame=0;
  const wrappers=[...document.querySelectorAll('[data-cloth]')];
  wrappers.forEach((wrapper,index)=>{
    const content=wrapper.querySelector('.cloth-content'),output=wrapper.querySelector('.cloth-output'),source=document.createElement('canvas');
    let instance=null;
    if(paintClothTexture(source,content))try{instance=createCloth({source,content,output},CLOTH_OPTIONS);}catch(error){console.warn('Cloth fallback:',error.message);instance=null;}
    if(!instance||output.dataset.clothTexture!=='ready'){instance?.destroy();instance=null;output.hidden=true;wrapper.dataset.clothState='fallback';}
    else {wrapper.dataset.clothState='active';wrapper.classList.add('cloth-active');}
    const roller=document.createElement('span');roller.className='scroll-roller';roller.setAttribute('aria-hidden','true');wrapper.append(roller);
    const entry={wrapper,content,output,instance,roller,panel:wrapper.closest('.panel'),index,shift:0,frame:0,wasInert:content.inert};
    const refresh=()=>{cancelAnimationFrame(entry.frame);entry.frame=requestAnimationFrame(()=>{
      if(disposed)return;
      if(entry.instance){paintClothTexture(source,content);entry.instance.resize();entry.instance.refresh();}
      update();
    });};
    const observer=new ResizeObserver(refresh);observer.observe(content);
    entry.observer=observer;
    document.fonts.ready.then(refresh);
    entry.onLost=event=>{event.preventDefault();entry.instance?.destroy();entry.instance=null;wrapper.classList.remove('cloth-active');output.hidden=true;wrapper.dataset.clothState='fallback';};
    output.addEventListener('webglcontextlost',entry.onLost,{once:true});
    wrapper.classList.add('scroll-roll');mounted.push(entry);
  });
  function update(){
    if(disposed)return;
    const viewport=innerHeight,progress=scrollY/Math.max(1,html.scrollHeight-viewport);
    for(const entry of mounted){
      const {wrapper,content,panel,instance,index}=entry,rect=panel.getBoundingClientRect();
      const height=wrapper.offsetHeight,style=getComputedStyle(wrapper);
      const anchor=Math.min(parseFloat(style.top)||viewport*.22,Math.max(80,viewport-height-100));
      const frame=scrollRollFrame({top:rect.top,bottom:rect.bottom,height,anchor,viewport,
        paddingBottom:parseFloat(getComputedStyle(panel).paddingBottom)||0,
        first:index===0,last:index===wrappers.length-1,intro,arrival:scrollSceneArrival(progress,index),reducedMotion:motion.matches});
      const naturalTop=wrapper.getBoundingClientRect().top-entry.shift;
      entry.shift=motion.matches||frame.open<=.001?0:anchor-naturalTop;
      const roll=clothRollGeometry(frame.open,height);
      wrapper.style.setProperty('--scroll-pin',`${entry.shift.toFixed(3)}px`);
      wrapper.style.setProperty('--scroll-opacity',String(frame.opacity));
      wrapper.style.setProperty('--scroll-visible',frame.open>.001?'visible':'hidden');
      wrapper.style.setProperty('--scroll-clip',`${roll.bottom.toFixed(3)}px`);
      wrapper.style.setProperty('--scroll-roll-top',`${(roll.radius?roll.hanging+roll.radius*.35:height-4).toFixed(3)}px`);
      wrapper.style.setProperty('--scroll-roll-size',`${Math.max(9,roll.radius*.9+5).toFixed(3)}px`);
      wrapper.style.setProperty('--scroll-turn',`${(frame.open*1440).toFixed(2)}px`);
      wrapper.dataset.scrollOpen=frame.open.toFixed(4);wrapper.dataset.scrollPhase=frame.phase;
      content.inert=entry.wasInert||(!motion.matches&&frame.open<.98);
      instance?.setUnroll(frame.open);
    }
  }
  function beginIntro(){
    if(disposed||introStarted||html.classList.contains('ink-opening-pending'))return;
    introStarted=true;
    if(motion.matches||scrollY>innerHeight*.5||(location.hash&&location.hash!=='#top')){intro=1;update();return;}
    const startedAt=performance.now();
    const tick=now=>{if(disposed)return;const t=Math.min(1,(now-startedAt)/1100);intro=t*t*(3-2*t);update();if(t<1)introFrame=requestAnimationFrame(tick);};
    introFrame=requestAnimationFrame(tick);
  }
  const openingObserver=new MutationObserver(beginIntro);openingObserver.observe(html,{attributes:true,attributeFilter:['class']});
  const onMotion=()=>{if(motion.matches){cancelAnimationFrame(introFrame);intro=1;}update();};
  motion.addEventListener('change',onMotion);
  beginIntro();update();
  return {
    update,
    renderFrame(){for(const {instance} of mounted)instance?.renderFrame();},
    destroy(){
      if(disposed)return;disposed=true;cancelAnimationFrame(introFrame);openingObserver.disconnect();motion.removeEventListener('change',onMotion);
      for(const entry of mounted){
        entry.observer.disconnect();cancelAnimationFrame(entry.frame);entry.instance?.destroy();entry.output.removeEventListener('webglcontextlost',entry.onLost);
        entry.content.inert=entry.wasInert;entry.roller.remove();entry.wrapper.classList.remove('scroll-roll','cloth-active');
        for(const name of ['pin','opacity','visible','clip','roll-top','roll-size','turn'])entry.wrapper.style.removeProperty(`--scroll-${name}`);
        delete entry.wrapper.dataset.scrollOpen;delete entry.wrapper.dataset.scrollPhase;
      }
    }
  };
}
