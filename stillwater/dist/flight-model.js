export const clamp = (value,min=0,max=1) => Math.min(max,Math.max(min,value));
// A loose V, viewed from the rear. Far birds lead, nearer birds trail to either
// side. Pausing and reversing scroll always reproduce the same formation.
const FORMATION = [
  [0,0,25,.0],
  [-.054,.041,31,.7],[.058,.049,33,1.9],
  [-.115,.096,40,2.8],[.120,.103,43,4.2],
  [-.177,.157,50,5.0],[.181,.174,55,6.1],
  [-.241,.232,62,7.8],[.251,.255,71,9.2]
];
export function flockState(progress,reducedMotion=false){
  const p=clamp(Number.isFinite(progress)?progress:0),t=reducedMotion?0:p;
  const ease=(a,b)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u);};
  const crossing=ease(.35,.44)*(1-ease(.60,.69));
  return FORMATION.map(([dx,dy,size,offset],index)=>{
    const clock=t*7.7+offset*.19,cycle=clock-Math.floor(clock);
    // A measured wingbeat followed by a glide, staggered across the flock.
    const stroke=cycle<.56?Math.sin(cycle/.56*Math.PI*2)*Math.sin(cycle/.56*Math.PI):0;
    return {
      x:.60-crossing*.19+dx+Math.sin(t*Math.PI*2.2+offset)*.010,
      y:.352+dy+Math.sin(clock*Math.PI*2)*.0035,size,
      wing:stroke*.64-.045,tip:Math.sin(clock*Math.PI*2-.65)*.075,
      bank:Math.sin(t*Math.PI*3+offset)*.045,opacity:.58+index*.044,
      frame:Math.round(t*719)
    };
  });
}
