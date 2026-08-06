const fs = require('fs');
const appJs = fs.readFileSync('src/renderer/js/app.js', 'utf8');
const pipeline1AiJs = fs.readFileSync('src/renderer/js/pipelines/pipeline1-ai.js', 'utf8');
const indexHtml = fs.readFileSync('src/renderer/index.html', 'utf8');
const mainCss = fs.readFileSync('src/renderer/styles/main.css', 'utf8');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
    if (condition) {
        console.log('PASS: ' + message);
        passCount++;
    } else {
        console.log('FAIL: ' + message);
        failCount++;
    }
}

// Job/Model/Voice tests
assert(appJs.includes('job.p1AiModel = e.target.value'), 'app.js saves ai model to job');
assert(appJs.includes('job.p1TtsVoice = e.target.value'), 'app.js saves tts voice to job');
assert(appJs.includes('job.p1TtsSpeed = e.target.value'), 'app.js saves tts speed to job');
assert(appJs.includes('el.aiModel2.value = job.p1AiModel'), 'app.js loads ai model from job in aiModelChanged');
assert(appJs.includes('el.aiModel2.value = job.p1AiModel') && appJs.includes('ttsVoice.value = job.p1TtsVoice'), 'app.js loads job settings in renderJobDetail1');
assert(pipeline1AiJs.includes('job.p1AiModel ||'), 'pipeline1-ai.js uses job.p1AiModel');
assert(pipeline1AiJs.includes('job.p1TtsVoice ||'), 'pipeline1-ai.js uses job.p1TtsVoice');
assert(pipeline1AiJs.includes('job.p1TtsSpeed !== undefined'), 'pipeline1-ai.js uses job.p1TtsSpeed');

// UI Selection tests
assert(indexHtml.includes('value="none"'), 'index.html step1-tts-voice has valid value attributes for standard voices');
assert(indexHtml.includes('id="step1-tts-speed"'), 'index.html step1-tts-speed ID exists');
assert(mainCss.includes('.tk-job-card'), 'main.css contains .tk-job-card styling');
assert(!appJs.includes('ChÆ°a chá» n'), 'app.js does not contain mojibake for Chưa chọn');
assert(appJs.includes('Chưa chọn'), 'app.js contains proper Vietnamese label Chưa chọn');
assert(appJs.includes('sourceSelect.options.length > 0'), 'app.js copies all model options correctly');

// Error handling tests
assert(appJs.includes('[UI Async Error Stack]'), 'app.js logs full stack for unhandledrejection');

console.log('TOTAL: ' + passCount + ' PASS / ' + failCount + ' FAIL');
process.exit(failCount > 0 ? 1 : 0);
