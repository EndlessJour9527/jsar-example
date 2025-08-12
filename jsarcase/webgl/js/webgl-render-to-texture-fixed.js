// JSAR Fixed Version: WebGL Render to Texture
// 修复了在JSAR中显示黑色的问题，通过添加深度缓冲附件

// 内联的WebGL工具函数，避免模块依赖
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

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function createProgramFromSources(gl, shaderSources) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, shaderSources[0]);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, shaderSources[1]);
  if (!vertexShader || !fragmentShader) {
    return null;
  }
  return createProgram(gl, vertexShader, fragmentShader);
}

// 内联的矩阵运算函数，避免m4模块依赖
const m4 = {
  perspective: function(fieldOfViewInRadians, aspect, near, far) {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    const rangeInv = 1.0 / (near - far);
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  },
  
  lookAt: function(cameraPosition, target, up) {
    const zAxis = normalize(subtractVectors(cameraPosition, target));
    const xAxis = normalize(cross(up, zAxis));
    const yAxis = normalize(cross(zAxis, xAxis));
    return [
      xAxis[0], xAxis[1], xAxis[2], 0,
      yAxis[0], yAxis[1], yAxis[2], 0,
      zAxis[0], zAxis[1], zAxis[2], 0,
      cameraPosition[0], cameraPosition[1], cameraPosition[2], 1
    ];
  },
  
  inverse: function(m) {
    const m00 = m[0 * 4 + 0]; const m01 = m[0 * 4 + 1]; const m02 = m[0 * 4 + 2]; const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0]; const m11 = m[1 * 4 + 1]; const m12 = m[1 * 4 + 2]; const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0]; const m21 = m[2 * 4 + 1]; const m22 = m[2 * 4 + 2]; const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0]; const m31 = m[3 * 4 + 1]; const m32 = m[3 * 4 + 2]; const m33 = m[3 * 4 + 3];
    const tmp_0  = m22 * m33; const tmp_1  = m32 * m23; const tmp_2  = m12 * m33;
    const tmp_3  = m32 * m13; const tmp_4  = m12 * m23; const tmp_5  = m22 * m13;
    const tmp_6  = m02 * m33; const tmp_7  = m32 * m03; const tmp_8  = m02 * m23;
    const tmp_9  = m22 * m03; const tmp_10 = m02 * m13; const tmp_11 = m12 * m03;
    const tmp_12 = m20 * m31; const tmp_13 = m30 * m21; const tmp_14 = m10 * m31;
    const tmp_15 = m30 * m11; const tmp_16 = m10 * m21; const tmp_17 = m20 * m11;
    const tmp_18 = m00 * m31; const tmp_19 = m30 * m01; const tmp_20 = m00 * m21;
    const tmp_21 = m20 * m01; const tmp_22 = m00 * m11; const tmp_23 = m10 * m01;
    const t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    const t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    const t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    const t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);
    const d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    return [
      d * t0, d * t1, d * t2, d * t3,
      d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) - (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
      d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) - (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
      d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) - (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
      d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) - (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
      d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) - (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
      d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) - (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
      d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) - (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
      d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) - (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
      d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) - (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
      d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) - (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
      d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) - (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
      d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) - (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02))
    ];
  },
  
  multiply: function(a, b) {
    const a00 = a[0 * 4 + 0]; const a01 = a[0 * 4 + 1]; const a02 = a[0 * 4 + 2]; const a03 = a[0 * 4 + 3];
    const a10 = a[1 * 4 + 0]; const a11 = a[1 * 4 + 1]; const a12 = a[1 * 4 + 2]; const a13 = a[1 * 4 + 3];
    const a20 = a[2 * 4 + 0]; const a21 = a[2 * 4 + 1]; const a22 = a[2 * 4 + 2]; const a23 = a[2 * 4 + 3];
    const a30 = a[3 * 4 + 0]; const a31 = a[3 * 4 + 1]; const a32 = a[3 * 4 + 2]; const a33 = a[3 * 4 + 3];
    const b00 = b[0 * 4 + 0]; const b01 = b[0 * 4 + 1]; const b02 = b[0 * 4 + 2]; const b03 = b[0 * 4 + 3];
    const b10 = b[1 * 4 + 0]; const b11 = b[1 * 4 + 1]; const b12 = b[1 * 4 + 2]; const b13 = b[1 * 4 + 3];
    const b20 = b[2 * 4 + 0]; const b21 = b[2 * 4 + 1]; const b22 = b[2 * 4 + 2]; const b23 = b[2 * 4 + 3];
    const b30 = b[3 * 4 + 0]; const b31 = b[3 * 4 + 1]; const b32 = b[3 * 4 + 2]; const b33 = b[3 * 4 + 3];
    return [
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33
    ];
  },
  
  xRotate: function(m, angleInRadians) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const m10 = m[4]; const m11 = m[5]; const m12 = m[6]; const m13 = m[7];
    const m20 = m[8]; const m21 = m[9]; const m22 = m[10]; const m23 = m[11];
    return [
      m[0], m[1], m[2], m[3],
      c * m10 + s * m20, c * m11 + s * m21, c * m12 + s * m22, c * m13 + s * m23,
      c * m20 - s * m10, c * m21 - s * m11, c * m22 - s * m12, c * m23 - s * m13,
      m[12], m[13], m[14], m[15]
    ];
  },
  
  yRotate: function(m, angleInRadians) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const m00 = m[0]; const m01 = m[1]; const m02 = m[2]; const m03 = m[3];
    const m20 = m[8]; const m21 = m[9]; const m22 = m[10]; const m23 = m[11];
    return [
      c * m00 - s * m20, c * m01 - s * m21, c * m02 - s * m22, c * m03 - s * m23,
      m[4], m[5], m[6], m[7],
      c * m20 + s * m00, c * m21 + s * m01, c * m22 + s * m02, c * m23 + s * m03,
      m[12], m[13], m[14], m[15]
    ];
  }
};

// 向量运算辅助函数
function subtractVectors(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function normalize(v) {
  const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (length > 0.00001) {
    return [v[0] / length, v[1] / length, v[2] / length];
  } else {
    return [0, 0, 0];
  }
}

const vs1 = `
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;

varying vec2 v_texcoord;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;

  // Pass the texcoord to the fragment shader.
  v_texcoord = a_texcoord;
}
`;
const fs1 = `
precision mediump float;

// Passed in from the vertex shader.
varying vec2 v_texcoord;

// The texture.
uniform sampler2D u_texture;

void main() {
   gl_FragColor = texture2D(u_texture, v_texcoord);
}
`;
const vsgles3 = `
#version 300 es
in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_matrix;

out vec2 v_texcoord;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;

  // Pass the texcoord to the fragment shader.
  v_texcoord = a_texcoord;
}
`;
const fsgles3 = `
#version 300 es
precision mediump float;

// Passed in from the vertex shader.
in vec2 v_texcoord;

// The texture.
uniform sampler2D u_texture;

// 输出颜色变量
out vec4 fragColor;

void main() {
   fragColor = texture(u_texture, v_texcoord);
}
`;

function getShaderSoutce(isWebgl2, vs1, vs2, fs1, fs2) {
  if (isWebgl2) {
    return { vs: vs2, fs: fs2 };
  }
  return { vs: vs1, fs: fs1 };
}

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = navigator.gl || canvas.getContext("webgl");
  const isWebGL2 = gl instanceof WebGL2RenderingContext;

  console.log("gl", gl);
  var canvas = gl._screenCanvas || gl.canvas;
  if (!gl) {
    return;
  }
  
  // 确保canvas有正确的尺寸
  var canvasWidth = canvas.width || 500;
  var canvasHeight = canvas.height || 500;
  var clientWidth = canvas.clientWidth || 500;
  var clientHeight = canvas.clientHeight || 500;
  
  console.log("canvas", canvas, "dimensions:", canvasWidth, canvasHeight, clientWidth, clientHeight);
  // setup GLSL program

  var { vs, fs } = getShaderSoutce(isWebGL2, vs1, vsgles3, fs1, fsgles3);
  var program = createProgramFromSources(gl, [vs, fs]);
  console.log("program", program);
  
  // JSAR FIX: 检查程序是否创建成功
  if (!program) {
    console.error('Failed to create shader program');
    return;
  }
  
  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

  // lookup uniforms
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
  var textureLocation = gl.getUniformLocation(program, "u_texture");
  
  // JSAR FIX: 检查attribute和uniform位置是否有效
  console.log('Attribute locations:', { positionLocation, texcoordLocation });
  console.log('Uniform locations:', { matrixLocation, textureLocation });
  
  if (positionLocation === -1) {
    console.error('Failed to get a_position attribute location');
    return;
  }
  if (texcoordLocation === -1) {
    console.error('Failed to get a_texcoord attribute location');
    return;
  }
  if (matrixLocation === null || matrixLocation === -1) {
    console.error('Failed to get u_matrix uniform location');
  }
  if (textureLocation === null || textureLocation === -1) {
    console.error('Failed to get u_texture uniform location');
  }

  // Create a buffer for positions
  var positionBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Put the positions in the buffer
  setGeometry(gl);

  // provide texture coordinates for the rectangle.
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  // Set Texcoords.
  setTexcoords(gl);

  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  {
    // fill texture with 3x2 pixels
    const level = 0;
    const internalFormat = gl.LUMINANCE;
    const width = 3;
    const height = 2;
    const border = 0;
    const format = gl.LUMINANCE;
    const type = gl.UNSIGNED_BYTE;
    const data = new Uint8Array([
      128, 64, 128,
      0, 192, 0,
    ]);
    const alignment = 1;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
      format, type, data);

    // set the filtering so we don't need mips and it's not filtered
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  // Create a texture to render to
  const targetTextureWidth = 256;
  const targetTextureHeight = 256;
  const targetTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, targetTexture);

  {
    // define size and format of level 0
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
      targetTextureWidth, targetTextureHeight, border,
      format, type, data);

    // set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  // Create and bind the framebuffer
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

  // attach the texture as the first color attachment
  const attachmentPoint = gl.COLOR_ATTACHMENT0;
  const level = 0;
  gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

  // JSAR FIX: 创建深度缓冲附件，因为JSAR中clear操作不生效
  // 需要显式创建深度缓冲来确保深度测试正常工作
  const depthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetTextureWidth, targetTextureHeight);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

  // 检查帧缓冲完整性
  // const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  // if (status !== gl.FRAMEBUFFER_COMPLETE) {
  //   console.error('Framebuffer not complete:', status);
  // }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);
  var modelXRotationRadians = degToRad(0);
  var modelYRotationRadians = degToRad(0);

  // Get the starting time.
  var then = 0;

  requestAnimationFrame(drawScene);

  function drawCube(aspect) {
    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3;          // 3 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
      positionLocation, size, type, normalize, stride, offset);

    // Turn on the texcoord attribute
    gl.enableVertexAttribArray(texcoordLocation);

    // bind the texcoord buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

    // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
      texcoordLocation, size, type, normalize, stride, offset);

    // Compute the projection matrix
    var projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    var cameraPosition = [0, 0, 2];
    var up = [0, 1, 0];
    var target = [0, 0, 0];

    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    var matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
    matrix = m4.yRotate(matrix, modelYRotationRadians);

    // Set the matrix.
    // JSAR FIX: 检查uniform位置是否有效，并确保matrix是有效的Float32Array
    if (matrixLocation !== null && matrixLocation !== -1) {
      // 确保matrix是Float32Array格式
      const matrixArray = matrix instanceof Float32Array ? matrix : new Float32Array(matrix);
      if (matrixArray.length === 16) {
        try {
          gl.uniformMatrix4fv(matrixLocation, false, matrixArray);
        } catch (e) {
          console.error('Error setting matrix uniform:', e, 'matrixLocation:', matrixLocation, 'matrix:', matrixArray);
        }
      } else {
        console.error('Invalid matrix length:', matrixArray.length, 'expected 16');
      }
    } else {
      console.error('matrixLocation is invalid:', matrixLocation);
    }

    // Tell the shader to use texture unit 0 for u_texture
    // JSAR FIX: 检查uniform位置是否有效
    if (textureLocation !== null && textureLocation !== -1) {
      try {
        gl.uniform1i(textureLocation, 0);
      } catch (e) {
        console.error('Error setting texture uniform:', e, 'textureLocation:', textureLocation);
      }
    } else {
      console.error('textureLocation is invalid:', textureLocation);
    }

    // Draw the geometry.
    gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
  }

  // Draw the scene.
  function drawScene(time) {
    // convert to seconds
    time *= 0.001;
    // Subtract the previous time from the current time
    var deltaTime = time - then;
    // Remember the current time for the next frame.
    then = time;

    // Animate the rotation
    modelYRotationRadians += -0.7 * deltaTime;
    modelXRotationRadians += -0.4 * deltaTime;

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    {
      // render to our targetTexture by binding the framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

      // render cube with our 3x2 texture
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, targetTextureWidth, targetTextureHeight);

      // JSAR FIX: 在JSAR中，clearColor和clear操作不生效
      // 但是对于FBO渲染，我们仍然需要设置这些值，因为它们可能在某些情况下有效
      // 同时，我们依赖深度缓冲附件来确保深度测试正常工作
      gl.clearColor(0, 0, 1, 1);   // clear to blue
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const aspect = targetTextureWidth / targetTextureHeight;
      drawCube(aspect);
    }

    {
      // render to the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // render the cube with the texture we just rendered to
      gl.bindTexture(gl.TEXTURE_2D, targetTexture);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, canvasWidth, canvasHeight);

      // JSAR FIX: 对于默认帧缓冲，clear操作在JSAR中不生效
      // 但我们仍然保留这些调用以保持代码的一致性
      gl.clearColor(1, 1, 1, 1);   // clear to white
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const aspect = clientWidth / clientHeight;
      drawCube(aspect);
    }

    requestAnimationFrame(drawScene);
  }
}

// Fill the buffer with the values that define a cube.
function setGeometry(gl) {
  var positions = new Float32Array(
    [
      -0.5, -0.5, -0.5,
      -0.5, 0.5, -0.5,
      0.5, -0.5, -0.5,
      -0.5, 0.5, -0.5,
      0.5, 0.5, -0.5,
      0.5, -0.5, -0.5,

      -0.5, -0.5, 0.5,
      0.5, -0.5, 0.5,
      -0.5, 0.5, 0.5,
      -0.5, 0.5, 0.5,
      0.5, -0.5, 0.5,
      0.5, 0.5, 0.5,

      -0.5, 0.5, -0.5,
      -0.5, 0.5, 0.5,
      0.5, 0.5, -0.5,
      -0.5, 0.5, 0.5,
      0.5, 0.5, 0.5,
      0.5, 0.5, -0.5,

      -0.5, -0.5, -0.5,
      0.5, -0.5, -0.5,
      -0.5, -0.5, 0.5,
      -0.5, -0.5, 0.5,
      0.5, -0.5, -0.5,
      0.5, -0.5, 0.5,

      -0.5, -0.5, -0.5,
      -0.5, -0.5, 0.5,
      -0.5, 0.5, -0.5,
      -0.5, -0.5, 0.5,
      -0.5, 0.5, 0.5,
      -0.5, 0.5, -0.5,

      0.5, -0.5, -0.5,
      0.5, 0.5, -0.5,
      0.5, -0.5, 0.5,
      0.5, -0.5, 0.5,
      0.5, 0.5, -0.5,
      0.5, 0.5, 0.5,

    ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

// Fill the buffer with texture coordinates the cube.
function setTexcoords(gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(
      [
        0, 0,
        0, 1,
        1, 0,
        0, 1,
        1, 1,
        1, 0,

        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,

        0, 0,
        0, 1,
        1, 0,
        0, 1,
        1, 1,
        1, 0,

        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,

        0, 0,
        0, 1,
        1, 0,
        0, 1,
        1, 1,
        1, 0,

        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,

      ]),
    gl.STATIC_DRAW);
}

main();