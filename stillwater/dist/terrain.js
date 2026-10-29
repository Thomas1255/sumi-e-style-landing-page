// The paintings contain the correct perspective. A restrained depth-dependent
// dolly moves near riverbanks faster than peaks without flattening the artwork.
import { sceneState } from './flight-timeline.js';
import { CANVAS_RIPPLE_GLSL, bindCanvasRipple } from './canvas-ripple.js';
export const SCENES=Object.freeze([
  'assets/flight-wetlands-v2.webp','assets/flight-village-v2.webp',
  'assets/flight-temples-v2.webp','assets/flight-gorge-v2.webp'
]);
export function routeCamera(progress,reducedMotion=false){
  const scene=sceneState(progress,reducedMotion),p=scene.progress;
  return {...scene,x:Math.sin(p*Math.PI*2.3)*.010,z:p*1000};
}
const VERT=`
attribute vec2 aPosition;
varying vec2 vUv;
void main(){vUv=vec2((aPosition.x+1.0)*.5,(1.0-aPosition.y)*.5);gl_Position=vec4(aPosition,0.0,1.0);}`;
const FRAG=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uSceneA,uSceneB;
uniform vec2 uResolution,uAspect;
uniform float uProgress,uBlend,uIndex,uNext,uSway;
${CANVAS_RIPPLE_GLSL}
vec2 sceneUv(float aspect,float index,vec2 screenUv){
  float screen=uResolution.x/uResolution.y;
  vec2 cover=screen>aspect?vec2(1.0,aspect/screen):vec2(screen/aspect,1.0);
  // Recede along each flock's direction; the final view looks down into the gorge.
  vec2 anchor=index<.5?vec2(.58,.25):index<1.5?vec2(.23,.20):index<2.5?vec2(.78,.18):vec2(.50,.32);
  vec2 uv=(screenUv-.5)*cover+.5;
  float age=clamp((uProgress-index*.25+.045)/.33,0.0,1.0);
  float depth=smoothstep(.28,1.05,uv.y);
  float zoom=1.035+age*(.065+depth*.14);
  uv=anchor+(uv-anchor)/zoom;
  uv.x+=uSway*(.25+depth*.75);
  uv.x+=sin(uv.y*92.0+uProgress*34.0)*.00065*depth;
  return uv;
}
vec3 sceneColor(vec2 uv){
  vec3 a=texture2D(uSceneA,sceneUv(uAspect.x,uIndex,uv)).rgb;
  vec3 b=texture2D(uSceneB,sceneUv(uAspect.y,uNext,uv)).rgb;
  vec3 color=mix(a,b,uBlend);
  float passageMist=sin(uBlend*3.14159265)*.19;
  color=mix(color,vec3(.94,.925,.88),passageMist);
  return color;
}
void main(){
  vec2 grad=canvasRippleGradient();
  vec2 uv=canvasRippleUv(vUv,grad,uCanvasRippleViewport.zw,1.0);
  vec3 color=sceneColor(uv);
  float d=canvasRippleDispersion();
  if(d>0.001){
    color.r=sceneColor(canvasRippleUv(vUv,grad,uCanvasRippleViewport.zw,1.0+d)).r;
    color.b=sceneColor(canvasRippleUv(vUv,grad,uCanvasRippleViewport.zw,1.0-d)).b;
  }
  gl_FragColor=vec4(canvasRippleLight(color,grad),1.0);
}`;
export function createTerrain(canvas,images){
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false});
  if(!gl)return null;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,VERT));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,FRAG));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const textures=images.map(image=>{
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);return texture;
  });
  const uniforms=Object.fromEntries(['uSceneA','uSceneB','uResolution','uAspect','uProgress','uBlend','uIndex','uNext','uSway'].map(name=>[name,gl.getUniformLocation(program,name)]));
  const ripple=bindCanvasRipple(gl,program,canvas);
  canvas.dataset.terrainRenderer='painted-flight';
  return {
    render(progress,reducedMotion=false){
      const camera=routeCamera(progress,reducedMotion),dpr=Math.min(devicePixelRatio||1,1.6);
      const width=Math.round(canvas.clientWidth*dpr),height=Math.round(canvas.clientHeight*dpr);
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      gl.viewport(0,0,width,height);gl.useProgram(program);
      for(const [unit,index]of [[0,camera.index],[1,camera.next]]){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,textures[index]);}
      gl.uniform1i(uniforms.uSceneA,0);gl.uniform1i(uniforms.uSceneB,1);
      gl.uniform2f(uniforms.uResolution,width,height);gl.uniform2f(uniforms.uAspect,images[camera.index].naturalWidth/images[camera.index].naturalHeight,images[camera.next].naturalWidth/images[camera.next].naturalHeight);
      gl.uniform1f(uniforms.uProgress,camera.progress);gl.uniform1f(uniforms.uBlend,camera.blend);gl.uniform1f(uniforms.uIndex,camera.index);gl.uniform1f(uniforms.uNext,camera.next);gl.uniform1f(uniforms.uSway,camera.x);
      ripple();
      gl.drawArrays(gl.TRIANGLES,0,6);
      canvas.dataset.cameraZ=camera.z.toFixed(4);canvas.dataset.terrainProgress=camera.progress.toFixed(6);canvas.dataset.scene=String(camera.index);canvas.dataset.sceneBlend=camera.blend.toFixed(6);
    }
  };
}
