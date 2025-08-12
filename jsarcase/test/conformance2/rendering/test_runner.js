#!/usr/bin/env node

/**
 * 测试运行器 - 验证修改后的WebGL测试用例是否能在JSAR Runtime中正常运行
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const JSAR_RUNTIME_PATH = '/Users/next/develop/git-proj/jsar-zone/jsar-runtime';
const TEST_SERVER_URL = 'http://127.0.0.1:5500/jsarcase/test/conformance2/rendering';
const RENDERING_DIR = '/Users/next/develop/git-proj/jsar-zone/example/jsar-example/jsarcase/test/conformance2/rendering';

// 读取测试列表
function getTestList() {
  const testListPath = path.join(RENDERING_DIR, '00_test_list.txt');
  const content = fs.readFileSync(testListPath, 'utf8');
  return content.split('\n')
    .filter(line => line.trim() && !line.startsWith('--'))
    .map(line => line.replace(/^--min-version [0-9.]+ /, '').trim())
    .filter(line => line.endsWith('.html'));
}

// 运行单个测试
function runTest(testFile) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Testing: ${testFile}`);
    
    const testUrl = `${TEST_SERVER_URL}/${testFile}`;
    const jsarProcess = spawn('./build/targets/darwin/transmute_browser', ['--mono', testUrl], {
      cwd: JSAR_RUNTIME_PATH,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    jsarProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    jsarProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    // 设置超时
    const timeout = setTimeout(() => {
      jsarProcess.kill('SIGTERM');
      console.log(`⏰ ${testFile}: Timeout (10s)`);
      resolve({ file: testFile, status: 'timeout', output, errorOutput });
    }, 10000);
    
    jsarProcess.on('close', (code) => {
      clearTimeout(timeout);
      
      // 分析输出判断测试状态
      let status = 'unknown';
      if (output.includes('Time summary:')) {
        status = 'loaded';
      } else if (output.includes('GL_INVALID_ENUM') || errorOutput.includes('error')) {
        status = 'error';
      } else if (output.includes('beforescripting')) {
        status = 'partial';
      }
      
      console.log(`${getStatusIcon(status)} ${testFile}: ${status}`);
      resolve({ file: testFile, status, output, errorOutput, code });
    });
    
    jsarProcess.on('error', (err) => {
      clearTimeout(timeout);
      console.log(`❌ ${testFile}: Error - ${err.message}`);
      resolve({ file: testFile, status: 'error', error: err.message });
    });
  });
}

function getStatusIcon(status) {
  switch (status) {
    case 'loaded': return '✅';
    case 'partial': return '🟡';
    case 'error': return '❌';
    case 'timeout': return '⏰';
    default: return '❓';
  }
}

// 主函数
async function main() {
  console.log('🚀 Starting WebGL Conformance Test Runner for JSAR Runtime\n');
  
  const testFiles = getTestList();
  console.log(`📋 Found ${testFiles.length} test files to run\n`);
  
  const results = [];
  
  // 运行前5个测试作为示例
  const testSubset = testFiles.slice(0, 5);
  
  for (const testFile of testSubset) {
    const result = await runTest(testFile);
    results.push(result);
    
    // 短暂延迟避免资源冲突
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 输出总结
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const summary = results.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(summary).forEach(([status, count]) => {
    console.log(`${getStatusIcon(status)} ${status}: ${count}`);
  });
  
  console.log(`\n✨ Tested ${results.length} files out of ${testFiles.length} total`);
  console.log('\n💡 Status meanings:');
  console.log('   ✅ loaded: Test loaded and executed successfully');
  console.log('   🟡 partial: Test partially loaded but may have issues');
  console.log('   ❌ error: Test failed to load or had errors');
  console.log('   ⏰ timeout: Test timed out after 10 seconds');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTest, getTestList };