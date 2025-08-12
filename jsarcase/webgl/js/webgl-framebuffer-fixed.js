const canvas = document.getElementById('glcanvas');
// WebGL1 context fallback
// const canvas = document.createElement('canvas');
// document.body.appendChild(canvas);

// 优先尝试 WebGL2，降级为 WebGL1
const gl = navigator.gl || canvas.getContext('webgl2') || canvas.getContext('webgl');
if (!gl) {
  // alert('WebGL not supported');
  throw new Error('WebGL not supported');
}

const isWebGL2 = gl instanceof WebGL2RenderingContext;

// --- 着色器源码 ---
const vsSource = isWebGL2 ? `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0, 1);
}` : `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fsSource = isWebGL2 ? `#version 300 es
precision mediump float;
in vec2 v_uv;
out vec4 fragColor;
void main() {
  fragColor = vec4(v_uv, 0.5 + 0.5 * sin(v_uv.x * 20.0), 1.0);
}` : `
precision mediump float;
varying vec2 v_uv;
void main() {
  gl_FragColor = vec4(v_uv, 0.5 + 0.5 * sin(v_uv.x * 20.0), 1.0);
}
`;


// --- 编译着色器 (添加错误检查) ---
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

if (!vs || !fs) {
  throw new Error('Failed to create shaders');
}

// --- 创建程序 (添加错误检查) ---
function createProgram(gl, vs, fs) {
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

const program = createProgram(gl, vs, fs);
if (!program) {
  throw new Error('Failed to create program');
}

gl.useProgram(program);

// --- 全屏四边形 ---
const quad = new Float32Array([
  -1, -1,
  +1, -1,
  -1, +1,
  -1, +1,
  +1, -1,
  +1, +1,
]);

const posLoc = gl.getAttribLocation(program, 'a_position');
if (posLoc === -1) {
  console.error('Could not find attribute a_position');
}

const posBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
gl.enableVertexAttribArray(posLoc);
gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

// --- 创建 FBO 及其纹理 attachment ---
const fbo = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

// // --- 检查 FBO 状态 (重要：取消注释并添加详细错误信息) ---
// const fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
// if (fbStatus !== gl.FRAMEBUFFER_COMPLETE) {
//   let errorMsg = 'Framebuffer is not complete: ';
//   switch (fbStatus) {
//     case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
//       errorMsg += 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT';
//       break;
//     case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
//       errorMsg += 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT';
//       break;
//     case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
//       errorMsg += 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS';
//       break;
//     case gl.FRAMEBUFFER_UNSUPPORTED:
//       errorMsg += 'FRAMEBUFFER_UNSUPPORTED';
//       break;
//     default:
//       errorMsg += 'Unknown error (' + fbStatus + ')';
//   }
//   console.error(errorMsg);
//   // alert(errorMsg);
// }

// --- Step 1: 渲染到 FBO（离屏） ---
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
gl.viewport(0, 0, 512, 512);
gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 6);

// 检查WebGL错误
let error = gl.getError();
if (error !== gl.NO_ERROR) {
  console.error('WebGL error after FBO rendering:', error);
}

// --- Step 2: 渲染到默认帧缓冲（屏幕） ---
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

// 使用 fbo 的纹理作为输入渲染另一个 pass
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.drawArrays(gl.TRIANGLES, 0, 6);

// 检查最终WebGL错误
error = gl.getError();
if (error !== gl.NO_ERROR) {
  console.error('WebGL error after final rendering:', error);
}

console.log('WebGL framebuffer rendering completed successfully');
console.log("canvas", canvas.width, canvas.height, canvas.clientWidth, canvas.clientHeight);
// 添加渲染循环以持续显示内容
function render() {
  // Step 1: 渲染到 FBO（离屏）
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.viewport(0, 0, 512, 512);
  gl.clearColor(0.1, 0.1, 0.1, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Step 2: 渲染到默认帧缓冲（屏幕）
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // 使用 fbo 的纹理作为输入渲染另一个 pass
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // 继续下一帧
  requestAnimationFrame(render);
}

// 启动渲染循环
requestAnimationFrame(render);