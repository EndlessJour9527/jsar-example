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

// // 使函数全局可用
// if (typeof window !== 'undefined') {
//   window.waitForGlobal = waitForGlobal;
//   window.waitForMultipleGlobals = waitForMultipleGlobals;
// } else if (typeof global !== 'undefined') {
//   global.waitForGlobal = waitForGlobal;
//   global.waitForMultipleGlobals = waitForMultipleGlobals;
// }
export { waitForGlobal, waitForMultipleGlobals };
