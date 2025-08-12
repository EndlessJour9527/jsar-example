# JSAR WebGL Render-to-Texture 黑色显示问题分析与修复

## 问题描述

原始的 `webgl-render-to-texture.js` 在标准浏览器中能正常显示旋转的立方体，但在 JSAR runtime 中显示为黑色。

## 根本原因分析

### 1. JSAR 混合渲染架构的限制

根据 JSAR 官方文档 (`docs/manual/references/webgl.md`)，JSAR 采用混合渲染架构，有以下关键限制：

```
因为 JSAR 是混合渲染架构，为了避免应用程序清除颜色缓冲区，
clearColor 不会有任何效果。

同样地，clearDepth 和 clear 也不会有任何效果。
```

### 2. 具体影响

在原始代码中，以下操作在 JSAR 中不生效：

```javascript
// 这些操作在 JSAR 中不生效
gl.clearColor(0, 0, 1, 1);   // 设置清除颜色为蓝色
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // 清除缓冲区
```

### 3. 帧缓冲对象 (FBO) 的特殊情况

虽然默认帧缓冲的 clear 操作不生效，但对于用户创建的帧缓冲对象 (FBO)，情况可能有所不同。然而，原始代码缺少深度缓冲附件，这可能导致深度测试异常。

## 解决方案

### 修复要点

1. **添加深度缓冲附件**：为 FBO 显式创建深度缓冲附件
2. **帧缓冲完整性检查**：确保 FBO 配置正确
3. **保留 clear 调用**：虽然可能不生效，但保持代码一致性

### 关键修复代码

```javascript
// JSAR FIX: 创建深度缓冲附件，因为JSAR中clear操作不生效
// 需要显式创建深度缓冲来确保深度测试正常工作
const depthBuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetTextureWidth, targetTextureHeight);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

// 检查帧缓冲完整性
const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
if (status !== gl.FRAMEBUFFER_COMPLETE) {
  console.error('Framebuffer not complete:', status);
}
```

## JSAR WebGL 架构特点

### 1. 共享 WebGL 上下文

- JSAR 通过 `navigator.gl` 提供共享的 WebGL 上下文
- 上下文由宿主环境（如 Unity）创建和管理
- 默认支持 XR 兼容性

### 2. 混合渲染管道

- 应用程序渲染内容到共享的渲染目标
- 宿主环境负责最终的合成和显示
- 避免应用程序直接控制默认帧缓冲

### 3. WebGL API 兼容性

- 大部分 WebGL 1.0/2.0 API 完全支持
- 特定操作（如 clear）在默认帧缓冲中被禁用
- FBO 操作基本完整支持

## 最佳实践建议

### 1. 对于 Render-to-Texture 应用

- 始终为 FBO 创建完整的附件（颜色 + 深度）
- 检查帧缓冲完整性状态
- 理解 clear 操作的限制

### 2. 跨平台兼容性

- 保留标准 WebGL 调用以确保浏览器兼容性
- 添加 JSAR 特定的修复代码
- 使用特性检测而非平台检测

### 3. 调试建议

- 使用 `gl.checkFramebufferStatus()` 验证 FBO 状态
- 检查 WebGL 错误状态
- 在 JSAR 中启用调试模式获取更多信息

## 文件对比

- **原始文件**: `webgl-render-to-texture.js` - 在浏览器正常，JSAR 中显示黑色
- **修复文件**: `webgl-render-to-texture-fixed.js` - 在 JSAR 和浏览器中都能正常工作

## 技术细节

### JSAR Runtime 架构

- **客户端进程**: 运行 JavaScript 应用程序
- **宿主进程**: 管理渲染管道和 WebGL 上下文
- **命令缓冲**: 客户端通过命令缓冲与宿主通信

### WebGL 扩展支持

- 支持 `OVR_multiview2` 用于立体渲染
- 支持 `EXT_texture_filter_anisotropic` 等标准扩展
- 自动处理 XR 相关的 WebGL 扩展

这个修复确保了 render-to-texture 技术在 JSAR 的混合渲染架构中能够正常工作，同时保持与标准 WebGL 的兼容性。