# WebGL异步加载器解决方案

## 问题描述

在JSAR Runtime中运行WebGL测试时，由于异步脚本加载的特性，可能会出现以下问题：
- `WebGLTestUtils` 未定义
- `description` 函数未定义
- `debug` 函数未定义
- `runBindAttribLocationAliasingTest` 函数未定义
- 其他测试依赖函数未定义

这些问题导致WebGL测试无法在JSAR Runtime中正常运行。

## 解决方案

### 1. WebGL异步加载器 (`webgl-async-loader.js`)

创建了一个专门针对WebGL测试的异步加载器，具有以下特性：

- **通用异步等待函数**: `waitForGlobal()` - 等待单个全局变量
- **多变量等待函数**: `waitForMultipleGlobals()` - 等待多个全局变量
- **WebGL专用函数**: `waitForWebGLTestGlobals()` - 专门等待WebGL测试所需的全局变量

### 2. 修改后的测试文件

将原来的同步执行改为异步等待模式：

```javascript
// 检查是否在JSAR runtime环境中
if (typeof waitForWebGLTestGlobals !== 'undefined') {
  // 在JSAR runtime中使用异步加载器
  waitForWebGLTestGlobals(runWebGLTest, {
    maxRetries: 200,
    retryInterval: 25,
    timeout: 10000
  });
} else {
  // 在普通浏览器中直接运行
  setTimeout(runWebGLTest, 100);
}
```

## 文件说明

### 核心文件

1. **`webgl-async-loader.js`** - WebGL异步加载器
   - 提供异步等待全局变量的功能
   - 支持超时和重试机制
   - 兼容多种JavaScript环境

2. **`gl-bindAttribLocation-aliasing-inactive.html`** - 修改后的测试文件
   - 集成了异步加载器
   - 支持JSAR Runtime和浏览器双环境
   - 包含错误处理和日志记录

3. **`test-webgl-async-loader.html`** - 测试验证文件
   - 验证异步加载器是否正常工作
   - 提供可视化的测试结果
   - 包含详细的测试步骤说明

### 依赖文件

- `../../js/js-test-pre.js` - WebGL测试前置脚本
- `../../js/webgl-test-utils.js` - WebGL测试工具
- `../../js/tests/gl-bindattriblocation-aliasing.js` - 具体测试逻辑

## 使用方法

### 在JSAR Runtime中运行

1. 确保所有依赖文件都已正确放置
2. 直接打开 `gl-bindAttribLocation-aliasing-inactive.html`
3. 异步加载器会自动检测环境并等待依赖加载完成
4. 查看控制台输出了解加载状态

### 在浏览器中运行

1. 在支持WebGL 2.0的浏览器中打开测试文件
2. 测试会自动以兼容模式运行
3. 查看控制台和页面输出了解测试结果

## 配置选项

异步加载器支持以下配置选项：

```javascript
{
  maxRetries: 200,        // 最大重试次数
  retryInterval: 25,      // 重试间隔(毫秒)
  timeout: 10000,         // 超时时间(毫秒)
  onTimeout: function(){}, // 超时回调
  onError: function(){}   // 错误回调
}
```

## 监控的全局变量

WebGL异步加载器默认监控以下全局变量：

- `WebGLTestUtils` - WebGL测试工具集
- `wtu` - WebGL测试工具简写
- `description` - 测试描述函数
- `debug` - 调试输出函数
- `runBindAttribLocationAliasingTest` - 具体测试函数
- `assertMsg` - 断言函数

## 故障排除

### 常见问题

1. **超时错误**: 增加 `timeout` 和 `maxRetries` 值
2. **依赖未找到**: 检查脚本文件路径是否正确
3. **环境检测错误**: 确认 `webgl-async-loader.js` 已正确加载

### 调试技巧

- 查看浏览器控制台的详细日志
- 使用 `test-webgl-async-loader.html` 验证加载器功能
- 检查网络请求确保所有脚本文件都已加载

## 扩展使用

这个异步加载器可以用于其他WebGL测试文件，只需要：

1. 引入 `webgl-async-loader.js`
2. 将测试代码包装在回调函数中
3. 使用 `waitForWebGLTestGlobals()` 等待依赖加载

## 技术原理

异步加载器通过以下方式工作：

1. **轮询检测**: 定期检查全局变量是否已定义
2. **多环境支持**: 检查 `window`、`global`、`globalThis` 等作用域
3. **错误处理**: 提供超时和重试机制
4. **环境适配**: 自动检测JSAR Runtime和浏览器环境

这种方案确保了WebGL测试在JSAR Runtime中的稳定运行，同时保持了与标准浏览器环境的兼容性。