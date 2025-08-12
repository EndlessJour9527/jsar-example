# JSAR Runtime 异步脚本加载问题解决方案

## 问题概述

在 JSAR runtime 中，由于异步脚本处理机制，HTML 文件中的脚本标签会异步加载，导致依赖关系出现问题：

```html
<!-- 这种方式在 JSAR runtime 中会失败 -->
<script src="../../js/js-test-pre.js"></script>
<script src="../../js/webgl-test-utils.js"></script>
<script>
  // 这里直接使用 WebGLTestUtils 会报错：undefined
  var wtu = WebGLTestUtils; // ❌ Error: WebGLTestUtils is not defined
</script>
```

## 解决方案

### 1. 核心工具：jsar-async-script-loader.js

这是一个通用的异步脚本加载器，提供以下功能：

- ✅ 等待单个或多个全局变量
- ✅ 专门的 WebGL 测试依赖等待器
- ✅ 超时和错误处理
- ✅ 调试信息输出
- ✅ 灵活的配置选项

### 2. 使用方法

#### 方法一：手动修复单个文件

1. **在 HTML 文件头部添加异步加载器：**

```html
<head>
  <!-- 其他标签 -->
  <script src="../jsar-async-script-loader.js"></script>
  <!-- 依赖脚本 -->
  <script src="../../js/js-test-pre.js"></script>
  <script src="../../js/webgl-test-utils.js"></script>
</head>
```

2. **包装主要脚本代码：**

```html
<script>
"use strict";

// 使用JSAR异步加载器等待所有依赖就绪
JSARAsyncLoader.waitForWebGLTestDependencies(function() {
  console.log('[JSAR] All WebGL test dependencies are ready, starting test...');
  
  // 原始测试代码
  description("Your test description");
  var wtu = WebGLTestUtils;
  var canvas = document.getElementById("canvas");
  // ... 其他测试代码
  
  console.log('[JSAR] Test completed');
}, {
  timeout: 15000,
  debug: true,
  onTimeout: function() {
    console.error('[JSAR] Timeout: Required dependencies not available');
    JSARAsyncLoader.debugGlobals();
  }
});
</script>
```

#### 方法二：使用批量修复脚本

```bash
# 修复单个文件
node fix-async-scripts.js path/to/your-file.html

# 修复整个目录
node fix-async-scripts.js path/to/your-directory

# 修复当前目录
node fix-async-scripts.js .
```

### 3. API 参考

#### JSARAsyncLoader.waitForGlobal(globalName, callback, options)

等待单个全局变量：

```javascript
JSARAsyncLoader.waitForGlobal('WebGLTestUtils', function() {
  console.log('WebGLTestUtils is ready!');
  // 使用 WebGLTestUtils
});
```

#### JSARAsyncLoader.waitForMultipleGlobals(globalNames, callback, options)

等待多个全局变量：

```javascript
JSARAsyncLoader.waitForMultipleGlobals(
  ['WebGLTestUtils', 'description', 'debug'], 
  function() {
    console.log('All dependencies ready!');
    // 执行测试代码
  }
);
```

#### JSARAsyncLoader.waitForWebGLTestDependencies(callback, options)

专门用于 WebGL 测试的便捷方法：

```javascript
JSARAsyncLoader.waitForWebGLTestDependencies(function() {
  // 所有常见的 WebGL 测试依赖都已就绪
  // WebGLTestUtils, description, debug, runBindAttribLocationAliasingTest 等
});
```

#### 配置选项

```javascript
{
  maxRetries: 100,        // 最大重试次数
  retryInterval: 20,      // 重试间隔(ms)
  timeout: 10000,         // 超时时间(ms)
  debug: true,            // 是否输出调试信息
  onTimeout: function(){}, // 超时回调
  onError: function(){}   // 错误回调
}
```

### 4. 文件结构

```
jsarcase/
├── jsar-async-script-loader.js          # 核心异步加载器
├── fix-async-scripts.js                 # 批量修复脚本
├── JSAR-ASYNC-FIX-GUIDE.md             # 使用指南(本文件)
└── test/
    └── conformance2/
        └── attribute/
            ├── webgl-2d-geometry-translate-better.html           # 原始文件
            ├── webgl-2d-geometry-translate-better-fixed.html     # 修复示例
            └── webgl-2d-geometry-translate-better.html.backup    # 自动备份
```

### 5. 修复前后对比

#### 修复前（会出错）：
```html
<script src="../../js/js-test-pre.js"></script>
<script src="../../js/webgl-test-utils.js"></script>
<script>
"use strict";
description("Test description");  // ❌ Error: description is not defined
var wtu = WebGLTestUtils;          // ❌ Error: WebGLTestUtils is not defined
</script>
```

#### 修复后（正常工作）：
```html
<script src="../jsar-async-script-loader.js"></script>
<script src="../../js/js-test-pre.js"></script>
<script src="../../js/webgl-test-utils.js"></script>
<script>
"use strict";
JSARAsyncLoader.waitForWebGLTestDependencies(function() {
  description("Test description");  // ✅ 正常工作
  var wtu = WebGLTestUtils;          // ✅ 正常工作
});
</script>
```

### 6. 常见问题

#### Q: 为什么需要这个解决方案？
A: JSAR runtime 的脚本加载是异步的，不像标准浏览器那样按顺序同步加载。

#### Q: 会影响在标准浏览器中的运行吗？
A: 不会。这个解决方案在标准浏览器中也能正常工作，只是会有轻微的延迟。

#### Q: 如何调试依赖加载问题？
A: 使用 `JSARAsyncLoader.debugGlobals()` 查看当前可用的全局变量。

#### Q: 超时时间应该设置多少？
A: 建议 10-15 秒。如果脚本很大或网络较慢，可以适当增加。

### 7. 最佳实践

1. **总是使用异步等待** - 在 JSAR runtime 中，不要假设脚本会同步加载
2. **设置合理超时** - 避免无限等待，设置适当的超时和错误处理
3. **启用调试模式** - 在开发阶段启用 debug 选项
4. **批量处理** - 对于大量文件，使用批量修复脚本
5. **保留备份** - 修复前自动创建备份文件

### 8. 支持的依赖类型

当前解决方案特别针对以下常见的 WebGL 测试依赖进行了优化：

- `WebGLTestUtils` - WebGL 测试工具
- `description` - 测试描述函数
- `debug` - 调试输出函数
- `runBindAttribLocationAliasingTest` - 特定测试函数
- `wtu` - WebGL 测试工具别名
- `testPassed` / `testFailed` - 测试结果函数

如需支持其他依赖，可以修改 `fix-async-scripts.js` 中的 `webglDependencies` 配置。