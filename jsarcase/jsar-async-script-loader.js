/**
 * JSAR Runtime 通用异步脚本加载器
 * 解决JSAR runtime中异步脚本加载导致依赖未定义的问题
 * 
 * 使用方法：
 * 1. 在HTML文件中首先引入此脚本
 * 2. 使用 JSARAsyncLoader 来管理脚本依赖
 */

(function(global) {
  'use strict';
  
  // 创建全局命名空间
  const JSARAsyncLoader = {
    // 存储已加载的脚本
    loadedScripts: new Set(),
    
    // 存储等待中的回调
    pendingCallbacks: [],
    
    // 默认配置
    defaultConfig: {
      maxRetries: 100,
      retryInterval: 20,
      timeout: 10000,
      debug: true
    },
    
    /**
     * 等待单个全局变量
     */
    waitForGlobal: function(globalName, callback, options = {}) {
      const config = Object.assign({}, this.defaultConfig, options);
      let retries = 0;
      const startTime = Date.now();
      
      const check = () => {
        // 检查超时
        if (Date.now() - startTime > config.timeout) {
          if (config.debug) {
            console.error(`[JSARAsyncLoader] Timeout waiting for: ${globalName}`);
          }
          if (options.onTimeout) options.onTimeout();
          return;
        }
        
        // 检查最大重试次数
        if (retries >= config.maxRetries) {
          if (config.debug) {
            console.error(`[JSARAsyncLoader] Max retries reached for: ${globalName}`);
          }
          if (options.onError) options.onError();
          return;
        }
        
        // 检查全局变量是否存在
        const globalExists = (typeof window !== 'undefined' && typeof window[globalName] !== 'undefined') ||
                            (typeof global !== 'undefined' && typeof global[globalName] !== 'undefined');
        
        if (globalExists) {
          if (config.debug) {
            console.log(`[JSARAsyncLoader] ✅ ${globalName} is now available`);
          }
          callback();
        } else {
          retries++;
          if (config.debug && retries % 10 === 0) {
            console.log(`[JSARAsyncLoader] Waiting for ${globalName}... (${retries}/${config.maxRetries})`);
          }
          setTimeout(check, config.retryInterval);
        }
      };
      
      check();
    },
    
    /**
     * 等待多个全局变量
     */
    waitForMultipleGlobals: function(globalNames, callback, options = {}) {
      const config = Object.assign({}, this.defaultConfig, options);
      let retries = 0;
      const startTime = Date.now();
      
      const check = () => {
        // 检查超时
        if (Date.now() - startTime > config.timeout) {
          if (config.debug) {
            console.error(`[JSARAsyncLoader] Timeout waiting for: ${globalNames.join(', ')}`);
          }
          if (options.onTimeout) options.onTimeout();
          return;
        }
        
        // 检查最大重试次数
        if (retries >= config.maxRetries) {
          if (config.debug) {
            console.error(`[JSARAsyncLoader] Max retries reached for: ${globalNames.join(', ')}`);
          }
          if (options.onError) options.onError();
          return;
        }
        
        // 检查所有全局变量是否都存在
        const allAvailable = globalNames.every(name => {
          return (typeof window !== 'undefined' && typeof window[name] !== 'undefined') ||
                 (typeof global !== 'undefined' && typeof global[name] !== 'undefined');
        });
        
        if (allAvailable) {
          if (config.debug) {
            console.log(`[JSARAsyncLoader] ✅ All globals available: ${globalNames.join(', ')}`);
          }
          callback();
        } else {
          const missing = globalNames.filter(name => {
            return (typeof window === 'undefined' || typeof window[name] === 'undefined') &&
                   (typeof global === 'undefined' || typeof global[name] === 'undefined');
          });
          retries++;
          if (config.debug && retries % 10 === 0) {
            console.log(`[JSARAsyncLoader] Waiting... Missing: ${missing.join(', ')} (${retries}/${config.maxRetries})`);
          }
          setTimeout(check, config.retryInterval);
        }
      };
      
      check();
    },
    
    /**
     * 等待DOM准备就绪
     */
    waitForDOM: function(callback) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
      } else {
        callback();
      }
    },
    
    /**
     * 通用的WebGL测试依赖等待器
     */
    waitForWebGLTestDependencies: function(callback, options = {}) {
      const requiredGlobals = [
        'WebGLTestUtils',
        'description',
        'debug',
        'runBindAttribLocationAliasingTest'
      ];
      
      this.waitForMultipleGlobals(requiredGlobals, callback, options);
    },
    
    /**
     * 创建一个安全的脚本执行环境
     */
    safeExecute: function(fn, dependencies = [], options = {}) {
      this.waitForMultipleGlobals(dependencies, fn, options);
    },
    
    /**
     * 调试信息：列出当前可用的全局变量
     */
    debugGlobals: function() {
      const globals = [];
      const globalObj = (typeof window !== 'undefined') ? window : global;
      
      for (let key in globalObj) {
        if (globalObj.hasOwnProperty(key) && typeof globalObj[key] === 'function') {
          globals.push(key);
        }
      }
      
      console.log('[JSARAsyncLoader] Available global functions:', globals.sort());
    }
  };
  
  // 使JSARAsyncLoader全局可用
  if (typeof window !== 'undefined') {
    window.JSARAsyncLoader = JSARAsyncLoader;
    // 为了向后兼容，也提供简短的别名
    window.waitForGlobal = JSARAsyncLoader.waitForGlobal.bind(JSARAsyncLoader);
    window.waitForMultipleGlobals = JSARAsyncLoader.waitForMultipleGlobals.bind(JSARAsyncLoader);
  } else if (typeof global !== 'undefined') {
    global.JSARAsyncLoader = JSARAsyncLoader;
    global.waitForGlobal = JSARAsyncLoader.waitForGlobal.bind(JSARAsyncLoader);
    global.waitForMultipleGlobals = JSARAsyncLoader.waitForMultipleGlobals.bind(JSARAsyncLoader);
  }
  
  // 自动检测和报告
  if (JSARAsyncLoader.defaultConfig.debug) {
    console.log('[JSARAsyncLoader] Async script loader initialized');
  }
  
})(typeof window !== 'undefined' ? window : global);