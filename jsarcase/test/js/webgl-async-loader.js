/**
 * JSAR Runtime Async Script Loader Utility
 * 解决JSAR runtime中异步脚本加载导致全局函数未定义的问题
 */

// 通用的异步等待函数
function waitForGlobal(globalName, callback, options = {}) {
  const maxRetries = options.maxRetries || 100;
  const retryInterval = options.retryInterval || 10;
  const timeout = options.timeout || 5000;

  let retries = 0;
  const startTime = Date.now();

  function check() {
    // 检查是否超时
    if (Date.now() - startTime > timeout) {
      console.error(`Timeout waiting for global variable: ${globalName}`);
      if (options.onTimeout) options.onTimeout();
      return;
    }

    // 检查是否达到最大重试次数
    if (retries >= maxRetries) {
      console.error(`Max retries reached waiting for global variable: ${globalName}`);
      if (options.onError) options.onError();
      return;
    }

    // 检查全局变量是否存在
    let globalExists = false;
    try {
      // 在 JSAR runtime 中，直接检查全局作用域
      globalExists = (typeof eval(globalName) !== 'undefined') ||
        (typeof window !== 'undefined' && typeof window[globalName] !== 'undefined') ||
        (typeof global !== 'undefined' && typeof global[globalName] !== 'undefined');
    } catch (e) {
      // 如果 eval 失败，说明变量不存在
      globalExists = false;
    }

    if (globalExists) {
      console.log(`Global variable ${globalName} is now available`);
      callback();
    } else {
      retries++;
      console.log(`Waiting for ${globalName}... (attempt ${retries}/${maxRetries})`);
      setTimeout(check, retryInterval);
    }
  }

  check();
}

// 等待多个全局变量
function waitForMultipleGlobals(globalNames, callback, options = {}) {
  const maxRetries = options.maxRetries || 100;
  const retryInterval = options.retryInterval || 10;
  const timeout = options.timeout || 5000;

  let retries = 0;
  const startTime = Date.now();

  function check() {
    // 检查是否超时
    if (Date.now() - startTime > timeout) {
      console.error(`Timeout waiting for global variables: ${globalNames.join(', ')}`);
      if (options.onTimeout) options.onTimeout();
      return;
    }

    // 检查是否达到最大重试次数
    if (retries >= maxRetries) {
      console.error(`Max retries reached waiting for global variables: ${globalNames.join(', ')}`);
      if (options.onError) options.onError();
      return;
    }

    // 检查所有全局变量是否都存在
    const allAvailable = globalNames.every(name => {
      return typeof window[name] !== 'undefined' || typeof global[name] !== 'undefined';
    });

    if (allAvailable) {
      console.log(`All global variables are now available: ${globalNames.join(', ')}`);
      callback();
    } else {
      const missing = globalNames.filter(name => {
        return typeof window[name] === 'undefined' && typeof global[name] === 'undefined';
      });
      retries++;
      console.log(`Waiting for globals... Missing: ${missing.join(', ')} (attempt ${retries}/${maxRetries})`);
      setTimeout(check, retryInterval);
    }
  }

  check();
}


function waitForWebGLTestGlobals(callback, options = {}) {
  console.log('🔄 Starting to wait for WebGL test globals...');

  const webglGlobals = [
    'WebGLTestUtils',
    'description',
    'debug',
    'runBindAttribLocationAliasingTest'
  ];

  // 增强的等待逻辑，包含更详细的日志
  const enhancedOptions = {
    maxRetries: options.maxRetries || 300,
    retryInterval: options.retryInterval || 50,
    timeout: options.timeout || 15000,
    onTimeout: options.onTimeout || function () {
      console.error('❌ WebGL test globals not available after timeout');
      console.error('Missing globals:', webglGlobals.filter(name => {
        try {
          return typeof eval(name) === 'undefined';
        } catch (e) {
          return true;
        }
      }));
    },
    onError: options.onError || function () {
      console.error('❌ Failed to load WebGL test globals after max retries');
    }
  };

  waitForMultipleGlobals(webglGlobals, function () {
    console.log('✅ All WebGL test globals are now available!');
    callback();
  }, enhancedOptions);
}
// 使函数全局可用
if (typeof window !== 'undefined') {
  window.waitForGlobal = waitForGlobal;
  window.waitForMultipleGlobals = waitForMultipleGlobals;
  window.waitForWebGLTestGlobals = waitForWebGLTestGlobals;
} else if (typeof global !== 'undefined') {
  global.waitForGlobal = waitForGlobal;
  global.waitForMultipleGlobals = waitForMultipleGlobals;
  global.waitForWebGLTestGlobals = waitForWebGLTestGlobals;
} else if (typeof globalThis !== 'undefined') {
  globalThis.waitForGlobal = waitForGlobal;
  globalThis.waitForMultipleGlobals = waitForMultipleGlobals;
  globalThis.waitForWebGLTestGlobals = waitForWebGLTestGlobals;
}

// CommonJS 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { waitForGlobal, waitForMultipleGlobals, waitForWebGLTestGlobals };
}
