# JSAR Runtime 异步脚本加载问题解决方案

## 问题描述

在 JSAR runtime 中，由于异步脚本处理机制，当在 JS 文件中定义全局方法后，在 HTML 的 `<script>` 标签中立即使用这些方法时会出现 `undefined` 错误。

### 典型错误场景

```html
<!-- 这种方式在 JSAR runtime 中会失败 -->
<script src="./test-import.js"></script>
<script>
  console.log(testImport); // 输出: undefined
  testImport(); // 错误: testImport is not a function
</script>
```

## 解决方案

### 方案1: 简单的轮询等待

在 `webgl-utils-test.html` 中使用的方法：

```javascript
function waitForTestImport() {
  if (typeof testImport !== 'undefined') {
    // 函数已加载，可以安全使用
    testImport();
  } else {
    // 函数未加载，继续等待
    setTimeout(waitForTestImport, 10);
  }
}
```

### 方案2: 通用异步加载工具 (推荐)

使用 `jsar-async-loader.js` 提供的工具函数：

```javascript
// 等待单个全局变量
waitForGlobal('testImport', function() {
  console.log('testImport is ready!');
  testImport();
});

// 等待多个全局变量
waitForMultipleGlobals(['testImport', 'anotherFunction'], function() {
  console.log('All functions are ready!');
  testImport();
  anotherFunction();
});
```

## 文件说明

### 核心文件

- `test-import.js` - 定义了 `testImport` 全局函数
- `jsar-async-loader.js` - 通用的异步脚本加载工具

### 测试文件

- `webgl-utils-test.html` - 修复后的原始测试文件
- `webgl-utils-test-improved.html` - 使用通用工具的改进版本
- `dom-operation-import.html` - 另一个测试用例

## API 参考

### waitForGlobal(globalName, callback, options)

等待单个全局变量变为可用。

**参数:**
- `globalName` (string) - 要等待的全局变量名
- `callback` (function) - 变量可用时的回调函数
- `options` (object, 可选) - 配置选项
  - `maxRetries` (number) - 最大重试次数，默认 100
  - `retryInterval` (number) - 重试间隔(ms)，默认 10
  - `timeout` (number) - 超时时间(ms)，默认 5000
  - `onTimeout` (function) - 超时回调
  - `onError` (function) - 错误回调

### waitForMultipleGlobals(globalNames, callback, options)

等待多个全局变量都变为可用。

**参数:**
- `globalNames` (array) - 要等待的全局变量名数组
- `callback` (function) - 所有变量都可用时的回调函数
- `options` (object, 可选) - 同 `waitForGlobal`

## 最佳实践

1. **总是使用异步等待机制** - 在 JSAR runtime 中，不要假设脚本会同步加载

2. **设置合理的超时时间** - 避免无限等待，设置适当的超时和错误处理

3. **使用通用工具** - `jsar-async-loader.js` 提供了可重用的解决方案

4. **添加日志输出** - 便于调试和监控加载状态

## 运行测试

在 JSAR runtime 中运行以下文件来测试解决方案：

```bash
# 测试修复后的原始版本
transmute_browser webgl-utils-test.html

# 测试改进版本
transmute_browser webgl-utils-test-improved.html
```

## 注意事项

- 这个解决方案专门针对 JSAR runtime 的异步脚本加载问题
- 在标准浏览器中，这些额外的等待机制通常不是必需的
- 确保在使用前加载 `jsar-async-loader.js` 工具文件