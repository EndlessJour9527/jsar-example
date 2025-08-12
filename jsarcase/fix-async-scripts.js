#!/usr/bin/env node
/**
 * JSAR Runtime 批量修复脚本
 * 自动修复HTML文件中的异步脚本加载问题
 * 
 * 使用方法：
 * node fix-async-scripts.js [目录路径]
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
  // 需要等待的常见WebGL测试依赖
  webglDependencies: [
    'WebGLTestUtils',
    'description', 
    'debug',
    'runBindAttribLocationAliasingTest',
    'wtu',
    'testPassed',
    'testFailed'
  ],
  
  // 异步加载器的相对路径
  loaderPath: '../jsar-async-script-loader.js',
  
  // 备份文件后缀
  backupSuffix: '.backup'
};

/**
 * 检测HTML文件是否需要修复
 */
function needsFix(content) {
  // 检查是否已经包含异步加载器
  if (content.includes('jsar-async-script-loader.js') || 
      content.includes('JSARAsyncLoader')) {
    return false;
  }
  
  // 检查是否有脚本依赖和直接使用
  const hasScriptTags = content.includes('<script src=');
  const hasDirectUsage = config.webglDependencies.some(dep => 
    content.includes(dep) && !content.includes(`waitFor`)
  );
  
  return hasScriptTags && hasDirectUsage;
}

/**
 * 修复HTML文件内容
 */
function fixHtmlContent(content, filePath) {
  let fixed = content;
  
  // 1. 在head标签中添加异步加载器
  const headMatch = fixed.match(/<head[^>]*>/i);
  if (headMatch) {
    const loaderScript = `\n<!-- JSAR异步脚本加载器 -->\n<script src="${config.loaderPath}"></script>`;
    fixed = fixed.replace(headMatch[0], headMatch[0] + loaderScript);
  }
  
  // 2. 查找主要的脚本标签
  const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatches = [];
  let match;
  
  // 收集所有匹配的脚本
  while ((match = scriptRegex.exec(content)) !== null) {
    scriptMatches.push(match);
  }
  
  const scripts = [];
  
  // 处理每个脚本匹配
  for (const scriptMatch of scriptMatches) {
    const scriptContent = scriptMatch[1].trim();
    
    // 跳过空脚本或已经包含JSARAsyncLoader的脚本
    if (!scriptContent || scriptContent.includes('JSARAsyncLoader')) {
      continue;
    }
    
    // 检查是否包含WebGL测试代码
    const hasWebGLCode = config.webglDependencies.some(dep => 
      scriptContent.includes(dep)
    );
    
    if (hasWebGLCode) {
      scripts.push({
        fullMatch: scriptMatch[0],
        content: scriptContent,
        index: scriptMatch.index
      });
    }
  }
  
  // 3. 包装主要脚本（从后往前处理避免索引偏移）
  scripts.reverse().forEach(script => {
    const wrappedScript = `<script>
"use strict";

// 使用JSAR异步加载器等待所有依赖就绪
JSARAsyncLoader.waitForWebGLTestDependencies(function() {
  console.log('[JSAR] All WebGL test dependencies are ready, starting test...');
  
  // 原始测试代码
  ${script.content.replace(/^"use strict";\s*/, '')}
  
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
    
    fixed = fixed.substring(0, script.index) + 
            wrappedScript + 
            fixed.substring(script.index + script.fullMatch.length);
  });
  
  return fixed;
}

/**
 * 处理单个HTML文件
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!needsFix(content)) {
      console.log(`⏭️  跳过: ${filePath} (已修复或不需要修复)`);
      return false;
    }
    
    // 创建备份
    const backupPath = filePath + config.backupSuffix;
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, content);
      console.log(`💾 备份: ${backupPath}`);
    }
    
    // 修复文件
    const fixedContent = fixHtmlContent(content, filePath);
    fs.writeFileSync(filePath, fixedContent);
    
    console.log(`✅ 修复: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ 错误处理 ${filePath}:`, error.message);
    return false;
  }
}

/**
 * 递归处理目录
 */
function processDirectory(dirPath) {
  let fixedCount = 0;
  let totalCount = 0;
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        walkDir(itemPath);
      } else if (item.endsWith('.html')) {
        totalCount++;
        if (processFile(itemPath)) {
          fixedCount++;
        }
      }
    }
  }
  
  walkDir(dirPath);
  
  console.log(`\n📊 处理完成: 修复了 ${fixedCount}/${totalCount} 个HTML文件`);
}

/**
 * 主函数
 */
function main() {
  const targetPath = process.argv[2] || '.';
  
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ 路径不存在: ${targetPath}`);
    process.exit(1);
  }
  
  console.log(`🚀 开始修复JSAR异步脚本问题...`);
  console.log(`📁 目标路径: ${path.resolve(targetPath)}`);
  console.log(`🔧 异步加载器路径: ${config.loaderPath}`);
  console.log('');
  
  const stat = fs.statSync(targetPath);
  
  if (stat.isFile() && targetPath.endsWith('.html')) {
    processFile(targetPath);
  } else if (stat.isDirectory()) {
    processDirectory(targetPath);
  } else {
    console.error('❌ 请提供HTML文件或目录路径');
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  processFile,
  processDirectory,
  needsFix,
  fixHtmlContent
};