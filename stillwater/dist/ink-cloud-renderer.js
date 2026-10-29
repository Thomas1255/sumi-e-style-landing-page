// Reconstruct the approved paintings on one high-density surface instead of
// stretching large, bilinearly filtered DOM compositor layers.
export const INK_CLOUD_SHARPNESS = .8;

export function inkCloudSurface(width, height, deviceRatio = 1, maxDimension = 16384) {
  const ratio = Math.min(Math.max(1, deviceRatio || 1), 2, maxDimension / width, maxDimension / height);
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)), ratio };
}

const vertexSource = `#version 300 es
in vec2 aCorner;
uniform vec2 uViewport;
uniform vec4 uRect;
out vec2 vUv;
void main() {
  vUv = aCorner;
  vec2 position = uRect.xy + aCorner * uRect.zw;
  gl_Position = vec4(position / uViewport * vec2(2., -2.) + vec2(-1., 1.), 0., 1.);
}`;

const fragmentSource = `#version 300 es
precision highp float;
uniform sampler2D uPainting;
uniform vec2 uSourceSize;
uniform float uOpacity;
uniform float uSharpness;
in vec2 vUv;
out vec4 color;

// Catmull-Rom reconstruction retains the narrow dry-brush marks that ordinary
// bilinear enlargement softens. Merge the two positive weights into one sample.
vec4 reconstruct(vec2 uv) {
  vec2 p = uv * uSourceSize - .5;
  vec2 cell = floor(p), t = fract(p), t2 = t*t, t3 = t2*t;
  vec2 w0 = -.5*t + t2 - .5*t3;
  vec2 w1 = 1. - 2.5*t2 + 1.5*t3;
  vec2 w2 = .5*t + 2.*t2 - 1.5*t3;
  vec2 w3 = -.5*t2 + .5*t3;
  vec2 middle = w1 + w2;
  vec2 a = (cell - .5) / uSourceSize;
  vec2 b = (cell + .5 + w2 / middle) / uSourceSize;
  vec2 c = (cell + 2.5) / uSourceSize;
  return texture(uPainting, vec2(a.x,a.y))*w0.x*w0.y
    + texture(uPainting, vec2(b.x,a.y))*middle.x*w0.y
    + texture(uPainting, vec2(c.x,a.y))*w3.x*w0.y
    + texture(uPainting, vec2(a.x,b.y))*w0.x*middle.y
    + texture(uPainting, vec2(b.x,b.y))*middle.x*middle.y
    + texture(uPainting, vec2(c.x,b.y))*w3.x*middle.y
    + texture(uPainting, vec2(a.x,c.y))*w0.x*w3.y
    + texture(uPainting, vec2(b.x,c.y))*middle.x*w3.y
    + texture(uPainting, vec2(c.x,c.y))*w3.x*w3.y;
}

vec3 straight(vec4 sampleColor) { return sampleColor.rgb / max(sampleColor.a, .0001); }

void main() {
  vec4 original = texture(uPainting, vUv);
  if (original.a < .001) { color = vec4(0.); return; }
  vec2 texel = 1. / uSourceSize;
  vec4 left = texture(uPainting, vUv - vec2(texel.x,0.));
  vec4 right = texture(uPainting, vUv + vec2(texel.x,0.));
  vec4 up = texture(uPainting, vUv - vec2(0.,texel.y));
  vec4 down = texture(uPainting, vUv + vec2(0.,texel.y));
  vec3 l = straight(left), r = straight(right), u = straight(up), d = straight(down);
  vec3 center = straight(original);
  vec3 reconstructed = straight(reconstruct(vUv));
  vec3 low = min(center,min(min(l,r),min(u,d)));
  vec3 high = max(center,max(max(l,r),max(u,d)));
  // Restrict enhancement to painted interiors. Keep the original alpha and
  // feathered mist edges, with no dark fringe around transparent pixels.
  float interior = smoothstep(.85, .99, min(original.a,min(min(left.a,right.a),min(up.a,down.a))));
  vec3 detail = clamp(reconstructed - (l+r+u+d)*.25, vec3(-.10), vec3(.10));
  vec3 ink = clamp(reconstructed + detail*uSharpness*interior, low, high);
  float alpha = original.a*uOpacity;
  color = vec4(clamp(ink,0.,1.)*alpha, alpha);
}`;

export function createInkCloudRenderer(canvas, onChange) {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return null;
  let program, buffer, uniforms, usable = false, disposed = false;
  const textures = new Map();
  const limit = Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), ...gl.getParameter(gl.MAX_VIEWPORT_DIMS));

  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
      gl.deleteShader(result);
      throw new Error('Cloud reconstruction shader could not compile');
    }
    return result;
  }

  function initialize() {
    try {
      const vertex = shader(gl.VERTEX_SHADER, vertexSource), fragment = shader(gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram();
      gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
      gl.deleteShader(vertex); gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Cloud reconstruction program could not link');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 1,0, 0,1, 0,1, 1,0, 1,1]), gl.STATIC_DRAW);
      const corner = gl.getAttribLocation(program, 'aCorner');
      gl.enableVertexAttribArray(corner); gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
      uniforms = Object.fromEntries(['uViewport','uRect','uSourceSize','uOpacity','uSharpness','uPainting'].map(name => [name,gl.getUniformLocation(program,name)]));
      gl.uniform1i(uniforms.uPainting,0);
      gl.uniform1f(uniforms.uSharpness,INK_CLOUD_SHARPNESS);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0,0,0,0);
      usable = true;
    } catch {
      usable = false;
    }
  }

  function texture(image) {
    if (textures.has(image.src)) return textures.get(image.src);
    const result = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,result);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    textures.set(image.src,result);
    return result;
  }

  function lost(event) { event.preventDefault(); usable = false; textures.clear(); onChange(); }
  function restored() { if (!disposed) { initialize(); onChange(); } }
  canvas.addEventListener('webglcontextlost',lost);
  canvas.addEventListener('webglcontextrestored',restored);
  initialize();

  return {
    draw(frame, images, width, height, deviceRatio = 1) {
      if (!usable || disposed || gl.isContextLost()) return false;
      if (!frame.active) return true;
      try {
        const surface = inkCloudSurface(width,height,deviceRatio,limit);
        if (canvas.width !== surface.width || canvas.height !== surface.height) {
          canvas.width = surface.width; canvas.height = surface.height;
        }
        // Explicit CSS dimensions avoid rescaling the backing surface to the
        // fixed container's width, which excludes the browser scrollbar.
        canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
        canvas.dataset.pixelRatio = String(surface.ratio);
        gl.viewport(0,0,surface.width,surface.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.uniform2f(uniforms.uViewport,width,height);
        gl.activeTexture(gl.TEXTURE0);
        const ordered = frame.layers.map((layer,index) => ({layer,image:images[index]})).sort((a,b)=>a.layer.zIndex-b.layer.zIndex);
        for (const {layer,image} of ordered) {
          if (layer.x >= width || layer.x + layer.width <= 0 || layer.y >= height || layer.y + layer.height <= 0) continue;
          gl.bindTexture(gl.TEXTURE_2D,texture(image));
          gl.uniform2f(uniforms.uSourceSize,image.naturalWidth,image.naturalHeight);
          gl.uniform4f(uniforms.uRect,Math.round(layer.x*surface.ratio)/surface.ratio,Math.round(layer.y*surface.ratio)/surface.ratio,layer.width,layer.height);
          gl.uniform1f(uniforms.uOpacity,layer.opacity);
          gl.drawArrays(gl.TRIANGLES,0,6);
        }
        return true;
      } catch {
        usable = false;
        return false;
      }
    },
    destroy() {
      disposed = true;
      canvas.removeEventListener('webglcontextlost',lost);
      canvas.removeEventListener('webglcontextrestored',restored);
      for (const value of textures.values()) gl.deleteTexture(value);
      textures.clear();
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    }
  };
}
