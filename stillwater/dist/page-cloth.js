import { createCloth } from './cloth.js';

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
    if(style.display==='none'||style.visibility==='hidden')continue;
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
  const mounted=[];
  document.querySelectorAll('[data-cloth]').forEach(wrapper=>{
    const content=wrapper.querySelector('.cloth-content'),output=wrapper.querySelector('.cloth-output'),source=document.createElement('canvas');
    if(!paintClothTexture(source,content))return;
    let instance;
    try{instance=createCloth({source,content,output},CLOTH_OPTIONS);}catch{instance=null;}
    if(!instance||output.dataset.clothTexture!=='ready'){instance?.destroy();output.hidden=true;wrapper.dataset.clothState='fallback';return;}
    wrapper.dataset.clothState='active';wrapper.classList.add('cloth-active');
    let frame=0;
    const refresh=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{paintClothTexture(source,content);instance.resize();instance.refresh();});};
    const observer=new ResizeObserver(refresh);observer.observe(content);
    document.fonts.ready.then(refresh);
    output.addEventListener('webglcontextlost',event=>{event.preventDefault();instance.destroy();observer.disconnect();wrapper.classList.remove('cloth-active');output.hidden=true;wrapper.dataset.clothState='fallback';},{once:true});
    mounted.push({instance,observer});
  });
  return {
    renderFrame(){for(const {instance} of mounted)instance.renderFrame();},
    destroy(){for(const {instance,observer} of mounted){observer.disconnect();instance.destroy();}}
  };
}
