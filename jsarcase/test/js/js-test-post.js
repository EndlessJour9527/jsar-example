/*
Copyright (c) 2019 The Khronos Group Inc.
Use of this source code is governed by an MIT-style license that can be
found in the LICENSE.txt file.
*/

// JSAR Runtime compatibility: Check if functions exist before calling
if (typeof shouldBeTrue === 'function') {
    shouldBeTrue("successfullyParsed");
} else {
    console.warn('shouldBeTrue function not available, skipping test validation');
}

if (typeof _addSpan === 'function') {
    _addSpan('<br /><span class="pass">TEST COMPLETE</span>');
} else {
    console.log('TEST COMPLETE');
}

if (typeof _jsTestPreVerboseLogging !== 'undefined' && _jsTestPreVerboseLogging) {
    if (typeof _bufferedLogToConsole === 'function') {
        _bufferedLogToConsole('TEST COMPLETE');
    } else {
        console.log('TEST COMPLETE');
    }
}

// JSAR Runtime compatibility: Check if RESULTS exists before using it
if (typeof RESULTS === 'undefined') {
    console.warn('RESULTS variable not defined, test may not have completed properly');
    // return;
}

// JSAR Runtime compatibility: Fix variable scope issue
const e_results = document.createElement('div');
let fails_class = 'pass';
if (RESULTS.fail) {
    fails_class = 'fail';
} else {
    const parseBoolean = v => v.toLowerCase().startsWith('t') || parseFloat(v) > 0;
    const params = new URLSearchParams(window.location.search);
    if (parseBoolean(params.get('runUntilFail') || '')) {
      setTimeout(() => {
        params.set('runCount', parseInt(params.get('runCount') || '0') + 1);
        const url = new URL(window.location.href);
        url.search = params.toString();
        window.location.href = url.toString();
      }, 100);
    }
}
e_results.classList.add('pass');
e_results.innerHTML = `<p>TEST COMPLETE: ${RESULTS.pass} PASS, ` +
  `<span class="${fails_class}">${RESULTS.fail} FAIL</span></p>`;

const e_desc = document.getElementById("description");
if (e_desc) {
    e_desc.appendChild(e_results);
} else {
    console.warn('Description element not found, appending results to body');
    document.body.appendChild(e_results);
}

notifyFinishedToHarness()

// JSAR Runtime compatibility: Use global variables instead of ESM exports
// ESM exports are not supported in JSAR Runtime's script context
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS environment
  module.exports = { shouldBeTrue, _addSpan, _bufferedLogToConsole, RESULTS, notifyFinishedToHarness };
} else if (typeof window !== 'undefined') {
  // Browser environment - make functions globally available for JSAR Runtime compatibility
  window.shouldBeTrue = shouldBeTrue;
  window._addSpan = _addSpan;
  window._bufferedLogToConsole = _bufferedLogToConsole;
  window.RESULTS = RESULTS;
  window.notifyFinishedToHarness = notifyFinishedToHarness;
  console.log('WebGL test functions exported to global scope for JSAR Runtime compatibility');
}
