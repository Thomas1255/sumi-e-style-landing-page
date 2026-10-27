// Small brush-drawn cranes. The same shoulder-to-tip geometry is projected for
// every stroke, keeping the wings naturally attached throughout a wingbeat.
function crane(ctx,bird,x,y,scale){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.rotate(bird.bank);
  ctx.globalAlpha=bird.opacity;ctx.lineCap='round';ctx.lineJoin='round';
  const point=(x,z,lift=0)=>[x,-z*.64-lift*.82];
  const wingPoint=(side,x,z)=>{
    const bend=bird.wing+Math.max(0,x-.5)*bird.tip;
    return point(side*(.055+x*Math.cos(bend)),z,x*Math.sin(bend));
  };
  const path=(commands,project)=>{
    ctx.beginPath();
    for(const [type,...coords] of commands){
      const p=[];for(let i=0;i<coords.length;i+=2)p.push(...project(coords[i],coords[i+1]));
      if(type==='M')ctx.moveTo(...p);else if(type==='L')ctx.lineTo(...p);
      else if(type==='Q')ctx.quadraticCurveTo(...p);else if(type==='C')ctx.bezierCurveTo(...p);
      else ctx.closePath();
    }
  };
  ctx.strokeStyle='#424a43';ctx.lineWidth=.018;
  for(const side of [-1,1]){
    path([['M',side*.038,-.18],['Q',side*.043,-.40,side*.048,-.79]],point);ctx.stroke();
    path([['M',side*.048,-.73],['L',side*.079,-.81]],point);ctx.lineWidth=.009;ctx.stroke();
  }
  for(const side of [-1,1]){
    const w=(x,z)=>wingPoint(side,x,z);
    path([
      ['M',0,.12],['C',.18,.29,.38,.36,.55,.25],
      ['Q',.75,.23,.98,.025],['Q',1.06,-.025,1.08,-.12],
      ['Q',.98,-.13,.96,-.18],['Q',.90,-.22,.86,-.24],
      ['Q',.74,-.29,.65,-.30],['Q',.31,-.31,0,-.12],['Z']
    ],w);
    ctx.fillStyle='#e9e6da';ctx.fill();
    ctx.strokeStyle='#52605c80';ctx.lineWidth=.012;ctx.stroke();
    path([
      ['M',.59,.20],['Q',.83,.12,1.04,-.045],
      ['Q',1.12,-.10,1.08,-.12],['Q',1.01,-.115,.88,-.16],
      ['Q',1.04,-.16,1.04,-.20],['Q',.98,-.23,.83,-.22],
      ['Q',.97,-.245,.94,-.27],['Q',.86,-.30,.73,-.265],
      ['Q',.85,-.31,.79,-.32],['Q',.68,-.35,.59,-.30],
      ['Q',.35,-.32,.12,-.18],['Q',.37,-.12,.59,.20],['Z']
    ],w);
    ctx.fillStyle='#46534e';ctx.fill();
    path([['M',.1,.06],['Q',.36,.22,.58,.18]],w);
    ctx.strokeStyle='#8c938481';ctx.lineWidth=.018;ctx.stroke();
  }
  // Back and forward-reaching neck are deliberately spare brush marks.
  path([['M',-.045,.19],['Q',-.12,.1,-.095,-.11],['Q',-.07,-.27,0,-.31],['Q',.08,-.25,.095,-.10],['Q',.10,.09,.045,.19],['Z']],point);
  ctx.fillStyle='#f0ebde';ctx.fill();ctx.strokeStyle='#56625880';ctx.lineWidth=.012;ctx.stroke();
  path([['M',0,.10],['Q',-.012,.34,0,.55]],point);
  ctx.strokeStyle='#66726a';ctx.lineWidth=.05;ctx.stroke();
  ctx.strokeStyle='#eee9d9';ctx.lineWidth=.028;ctx.stroke();
  const head=point(0,.57);ctx.fillStyle='#4b554c';ctx.beginPath();ctx.ellipse(head[0],head[1],.033,.043,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ae4e37';ctx.beginPath();ctx.ellipse(head[0],head[1]-.014,.023,.023,0,0,Math.PI*2);ctx.fill();
  path([['M',0,.61],['L',0,.75]],point);ctx.strokeStyle='#4b554c';ctx.lineWidth=.013;ctx.stroke();
  path([['M',-.045,-.18],['L',0,-.31],['L',.045,-.18]],point);ctx.fillStyle='#566058';ctx.fill();
  ctx.restore();
}

export function drawFlock(ctx,birds,width,height,progress){
  ctx.clearRect(0,0,width,height);
  const mobile=width<650;
  const scale=mobile?Math.min(width/660,.72):Math.min(width/1260,height/760);
  for(const bird of birds){
    const x=mobile?width*(.5+(bird.x-.60)*.84):width*bird.x;
    const y=height*(mobile?.64+(bird.y-.35)*.54:bird.y);
    crane(ctx,bird,x,y,bird.size*scale);
  }
}
