#!/usr/bin/env node

/**
 * JSAR Runtime WebGL 测试异步脚本修复工具
 * 专门用于修复 WebGL 测试文件中的异步脚本加载问题
 */

const fs = require('fs');
const path = require('path');

// WebGL 测试常见依赖
const WEBGL_DEPENDENCIES = [
  'WebGLTestUtils',
  'description',
  'debug',
  'runBindAttribLocationAliasingTest',
  'wtu',
  'testPassed',
  'testFailed'
];

/**
 * 检查文件是否需要修复
 */
function needsFix(content) {
  // 检查是否已经包含异步加载器
  if (content.includes('JSARAsyncLoader') || content.includes('jsar-async-script-loader.js')) {
    return false;
  }
  
  // 检查是否包含WebGL测试相关代码
  const hasWebGLCode = WEBGL_DEPENDENCIES.some(dep => content.includes(dep));
  const hasScriptTags = content.includes('<script src=') && content.includes('</script>');
  
  return hasWebGLCode && hasScriptTags;
}

/**
 * 修复单个HTML文件
 */
function fixHtmlFile(filePath) {
  console.log(`🔧 修复文件: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!needsFix(content)) {
    console.log(`⏭️  跳过: ${filePath} (不需要修复或已修复)`);
    return false;
  }
  
  // 创建备份
  const backupPath = filePath + '.backup';
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, content);
    console.log(`💾 备份: ${backupPath}`);
  }
  
  // 计算相对路径到异步加载器
  const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, 'jsar-async-script-loader.js'));
  
  // 1. 在 <head> 中添加异步加载器
  if (!content.includes('jsar-async-script-loader.js')) {
    content = content.replace(
      /<head>/i,
      `<head>\n<!-- JSAR异步脚本加载器 -->\n<script src="${relativePath}"></script>`
    );
  }
  
  // 2. 查找并包装主要的测试脚本
  const scriptPattern = /<script>\s*([\s\S]*?)\s*<\/script>/g;
  let matches = [];
  let match;
  
  while ((match = scriptPattern.exec(content)) !== null) {
    matches.push(match);
  }
  
  // 从后往前处理，避免索引偏移
  for (let i = matches.length - 1; i >= 0; i--) {
    const scriptMatch = matches[i];
    const scriptContent = scriptMatch[1].trim();
    
    // 跳过空脚本或已经包含JSARAsyncLoader的脚本
    if (!scriptContent || scriptContent.includes('JSARAsyncLoader')) {
      continue;
    }
    
    // 检查是否包含WebGL测试代码
    const hasWebGLCode = WEBGL_DEPENDENCIES.some(dep => 
      scriptContent.includes(dep) ||
      scriptContent.includes('WebGL') ||
      scriptContent.includes('description(') ||
      scriptContent.includes('debug(')
    );
    
    if (hasWebGLCode) {
      // 包装脚本内容
      const wrappedScript = `<script>
"use strict";

// 使用JSAR异步加载器等待所有依赖就绪
JSARAsyncLoader.waitForWebGLTestDependencies(function() {
  console.log('[JSAR] All WebGL test dependencies are ready, starting test...');
  
  // 原始测试代码
  ${scriptContent}
  
  console.log('[JSAR] Test completed');
}, {
  timeout: 15000,
  debug: true,
  onTimeout: function() {
    console.error('[JSAR] Timeout: Required WebGL test dependencies not available');
    JSARAsyncLoader.debugGlobals();
  },
  onError: function() {
    console.error('[JSAR] Error: Failed to load WebGL test dependencies');
    JSARAsyncLoader.debugGlobals();
  }
});
</script>`;
      
      // 替换原始脚本
      content = content.substring(0, scriptMatch.index) + 
               wrappedScript + 
               content.substring(scriptMatch.index + scriptMatch[0].length);
      break; // 只处理第一个匹配的脚本
    }
  }
  
  // 写入修复后的内容
  fs.writeFileSync(filePath, content);
  console.log(`✅ 修复完成: ${filePath}`);
  return true;
}

/**
 * 递归处理目录
 */
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  let fixedCount = 0;
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      fixedCount += processDirectory(fullPath);
    } else if (item.endsWith('.html') && !item.includes('.backup')) {
      if (fixHtmlFile(fullPath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('使用方法:');
    console.log('  node fix-webgl-async.js <文件或目录路径>');
    console.log('');
    console.log('示例:');
    console.log('  node fix-webgl-async.js test.html');
    console.log('  node fix-webgl-async.js test/conformance2/');
    console.log('  node fix-webgl-async.js .');
    process.exit(1);
  }
  
  const targetPath = path.resolve(args[0]);
  
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ 路径不存在: ${targetPath}`);
    process.exit(1);
  }
  
  console.log('🚀 开始修复JSAR异步脚本问题...');
  console.log(`📁 目标路径: ${targetPath}`);
  
  const stat = fs.statSync(targetPath);
  let fixedCount = 0;
  
  if (stat.isFile()) {
    if (targetPath.endsWith('.html')) {
      if (fixHtmlFile(targetPath)) {
        fixedCount = 1;
      }
    } else {
      console.error('❌ 只支持HTML文件');
      process.exit(1);
    }
  } else if (stat.isDirectory()) {
    fixedCount = processDirectory(targetPath);
  }
  
  console.log('');
  console.log(`🎉 修复完成! 共修复了 ${fixedCount} 个文件`);
  
  if (fixedCount > 0) {
    console.log('');
    console.log('📝 注意事项:');
    console.log('- 原始文件已自动备份为 .backup 文件');
    console.log('- 修复后的文件在JSAR runtime和标准浏览器中都能正常工作');
    console.log('- 如需恢复原始文件，可以从备份文件恢复');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  fixHtmlFile,
  processDirectory,
  needsFix
};