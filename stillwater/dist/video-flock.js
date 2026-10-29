import { FLIGHT_CLIPS, flightVideoState, flockTravel, clamp } from './flight-timeline.js';
import { CANVAS_RIPPLE_GLSL, bindCanvasRipple } from './canvas-ripple.js';

const VERT = `
attribute vec2 aPosition;
uniform vec4 uRect;
uniform vec2 uResolution;
varying vec2 vUv;
void main(){
  vUv=aPosition;
  vec2 pixel=uRect.xy+aPosition*uRect.zw;
  gl_Position=vec4(pixel.x/uResolution.x*2.0-1.0,1.0-pixel.y/uResolution.y*2.0,0.0,1.0);
}`;
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uFilm;
uniform float uOpacity;
uniform vec4 uRect;
${CANVAS_RIPPLE_GLSL}
void main(){
  vec2 grad=canvasRippleGradient();
  vec2 uv=canvasRippleUv(vUv,grad,uRect.zw,1.0);
  vec3 color=texture2D(uFilm,uv).rgb;
  float d=canvasRippleDispersion();
  if(d>0.001){
    color.r=texture2D(uFilm,canvasRippleUv(vUv,grad,uRect.zw,1.0+d)).r;
    color.b=texture2D(uFilm,canvasRippleUv(vUv,grad,uRect.zw,1.0-d)).b;
  }
  float other=max(color.r,color.b);
  float saturation=(max(other,color.g)-min(min(color.r,color.b),color.g))/max(max(other,color.g),.001);
  float green=smoothstep(.035,.16,color.g-other)*smoothstep(.12,.40,saturation);
  float alpha=1.0-green;
  // Remove green spill from the soft ink edges without altering red crowns.
  color.g=min(color.g,other*1.025);
  color=canvasRippleLight(color,grad);
  float edge=smoothstep(0.0,.006,min(min(uv.x,1.0-uv.x),min(uv.y,1.0-uv.y)));
  alpha*=uOpacity*edge;
  gl_FragColor=vec4(color*alpha,alpha);
}`;

export function createVideoFlock(canvas, poster) {
  let gl = null, program, uniforms, ripple, state = flightVideoState(0), lost = false, queued = false;
  const assets = FLIGHT_CLIPS.map((clip, index) => {
    const video = document.createElement('video');
    video.className = 'flight-decoder';
    video.muted = true; video.defaultMuted = true; video.playsInline = true;
    video.preload = 'metadata'; video.setAttribute('aria-hidden', 'true'); video.tabIndex = -1;
    video.dataset.clip = String(index); video.src = clip.src;
    document.body.append(video);
    return { video, clip, texture: null, ready: false, failed: false, activated: false,
      desired: 0, decoded: -1 };
  });
  function shader(type, source) {
    const result = gl.createShader(type); gl.shaderSource(result, source); gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
    return result;
  }
  function initialize() {
    gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, premultipliedAlpha: true });
    if (!gl) return;
    program = gl.createProgram(); gl.attachShader(program, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    uniforms = Object.fromEntries(['uRect','uResolution','uOpacity','uFilm'].map(name => [name, gl.getUniformLocation(program, name)]));
    ripple = bindCanvasRipple(gl, program, canvas);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    assets.forEach(asset => {
      asset.texture = gl.createTexture(); asset.ready = false;
      gl.bindTexture(gl.TEXTURE_2D, asset.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      upload(asset);
    });
  }
  function upload(asset) {
    if (!gl || lost || asset.video.readyState < 2 || asset.video.seeking) return;
    gl.bindTexture(gl.TEXTURE_2D, asset.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asset.video);
    asset.ready = true;
    asset.decoded = Math.min(asset.clip.frames - 1, Math.floor(asset.video.currentTime * asset.clip.fps));
    asset.video.dataset.decodedFrame = String(asset.decoded);
  }
  function seek(asset) {
    if (asset.failed || asset.video.readyState < 1 || asset.video.seeking || asset.decoded === asset.desired) return;
    // Seek inside a frame, avoiding ambiguous floating point frame boundaries.
    const time = Math.min((asset.desired + .25) / asset.clip.fps, asset.video.duration - .001);
    if (Math.abs(asset.video.currentTime - time) > .001) asset.video.currentTime = time;
  }
  function activate(asset) {
    if (asset.activated || asset.failed) return;
    asset.activated = true; asset.video.preload = 'auto'; asset.video.load();
  }
  function schedule() {
    if (queued) return;
    queued = true; requestAnimationFrame(() => { queued = false; render(); });
  }
  function layout(index) {
    const width = document.documentElement.clientWidth, height = innerHeight;
    // Each perspective stays beside its own cloth and fades out in place.
    const forest = index === 2 ? 1 : 0;
    let w = Math.min(width * (.58 - forest * .03), height * 1.45), x = width * (.69 - forest * .37), y = height * .49;
    if (width <= 650) {
      const footerTop = document.querySelector('.flight-controls').getBoundingClientRect().top;
      const clothRects = [...document.querySelectorAll('[data-cloth]')].map(panel => panel.getBoundingClientRect());
      const clothBottom = Math.max(height * .48, ...clothRects
        .filter(rect => rect.top < height * .6 && rect.bottom > height * .25)
        .map(rect => rect.bottom));
      const top = Math.min(footerTop - 110, Math.max(height * .53, clothBottom + 16)), bottom = footerTop - 12;
      w = Math.min(width * .96, (bottom - top) * 1918 / 1080); x = width * .5; y = (top + bottom) / 2;
      const enteringCloth = clothRects.find(rect => rect.top > height * .2 && rect.top < footerTop && rect.bottom > footerTop);
      if (index === 0 && enteringCloth) {
        const clearTop = height * .22, clearBottom = Math.max(clearTop + 90, enteringCloth.top - 16);
        w = Math.min(width * .96, (clearBottom - clearTop) * 1918 / 1080);
        y = clamp(height * .69, clearTop + w * 540 / 1918, clearBottom - w * 540 / 1918);
      }
    }
    const travel = flockTravel(index, state.progress);
    x += travel.x * width;
    // Keep the mobile flock inside the open space beneath its cloth panel.
    y += travel.y * (width <= 650 ? Math.min(height, w * .4) : height);
    w *= travel.scale;
    const h = w * 1080 / 1918;
    return [x - w / 2, y - h / 2, w, h];
  }
  function render() {
    const width = document.documentElement.clientWidth, height = innerHeight;
    const dominant = state.layers.reduce((a, b) => a.opacity >= b.opacity ? a : b);
    const rect = layout(dominant.index);
    const selected = assets[dominant.index];
    const fallback = !gl || lost || !selected.ready || selected.failed;
    canvas.dataset.flightMode = fallback ? 'painted-poster' : 'generated-video';
    canvas.dataset.view = selected.clip.name; canvas.dataset.craneCount = '9';
    canvas.dataset.flightProgress = state.progress.toFixed(6);
    canvas.dataset.targetFrame = String(dominant.frame); canvas.dataset.renderedFrame = String(selected.decoded);
    canvas.dataset.scene = String(dominant.index);
    const source = selected.clip.poster;
    if (poster.getAttribute('src') !== source) poster.src = source;
    Object.assign(poster.style, { left: `${rect[0]}px`, top: `${rect[1]}px`, width: `${rect[2]}px`, height: `${rect[3]}px`, opacity: String(fallback ? dominant.opacity : 0) });
    if (!gl || lost) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.6), w = Math.round(width * dpr), h = Math.round(height * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program); gl.uniform2f(uniforms.uResolution, width, height); ripple();
    gl.uniform4f(uniforms.uRect, ...rect); gl.uniform1i(uniforms.uFilm, 0);
    if (fallback) return;
    for (const layer of state.layers) {
      const asset = assets[layer.index];
      if (!asset.ready || layer.opacity <= 0) continue;
      gl.uniform4f(uniforms.uRect, ...layout(layer.index));
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, asset.texture);
      gl.uniform1f(uniforms.uOpacity, layer.opacity); gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }
  assets.forEach(asset => {
    asset.video.addEventListener('loadedmetadata', () => seek(asset));
    asset.video.addEventListener('loadeddata', () => { upload(asset); seek(asset); schedule(); });
    asset.video.addEventListener('seeked', () => { upload(asset); schedule(); seek(asset); });
    asset.video.addEventListener('error', () => { asset.failed = true; schedule(); });
  });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; schedule(); });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; initialize(); schedule(); });
  try { initialize(); } catch (error) { console.warn('Crane video fallback:', error.message); gl = null; }
  return {
    setProgress(progress, reducedMotion = false) {
      state = flightVideoState(progress, reducedMotion);
      // Preload the next angle while its preceding landscape is in view.
      for (const layer of state.layers) {
        const asset = assets[layer.index]; asset.desired = layer.frame;
        asset.video.dataset.targetFrame = String(layer.frame);
        if (gl && !lost) { activate(asset); seek(asset); }
      }
      render();
    }
  };
}
