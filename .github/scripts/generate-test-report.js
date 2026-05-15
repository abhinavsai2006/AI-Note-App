const fs = require('fs');
const path = require('path');

const artifactsDir = path.resolve(process.cwd(), 'artifacts');
if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });

function readJson(file) {
  try {
    const p = path.resolve(process.cwd(), file);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

const apiResults = readJson('artifacts/api-test.json');

function renderApiResults(json) {
  if (!json) return '<p>No API test results found.</p>';
  const { numTotalTests, numPassedTests, numFailedTests, startTime, testResults } = json;
  const durationMs = Date.now() - startTime;
  const failed = testResults
    .flatMap((suite) => suite.assertionResults.map((a) => ({ suite: suite.name, ...a })))
    .filter((r) => r.status !== 'passed');

  return `
    <h2>API Tests</h2>
    <ul>
      <li>Total: ${numTotalTests}</li>
      <li>Passed: ${numPassedTests}</li>
      <li>Failed: ${numFailedTests}</li>
      <li>Duration: ${Math.round(durationMs / 1000)}s</li>
    </ul>
    ${failed.length ? `<h3>Failed Tests</h3><ul>${failed
      .map((f) => `<li><strong>${f.title}</strong> in <em>${f.suite}</em><pre>${escapeHtml(
        f.failureMessages.join('\n')
      )}</pre></li>`)
      .join('')}</ul>` : '<p>No failed tests.</p>'}
  `;
}

function escapeHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>NoteFlow CI Test Report</title>
  <style>body{font-family:Arial,Helvetica,sans-serif;background:#07102a;color:#e9eef8;padding:24px}pre{background:#021022;padding:12px;border-radius:8px;overflow:auto;color:#fff}</style>
</head>
<body>
  <h1>NoteFlow CI Test Report</h1>
  ${renderApiResults(apiResults)}
  <hr />
  <p>Generated at ${new Date().toISOString()}</p>
</body>
</html>`;

fs.writeFileSync(path.join(artifactsDir, 'report.html'), html);
console.log('Wrote artifacts/report.html');
