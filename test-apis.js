/**
 * NoteFlow API E2E Automated Verification Suite
 * Usage: node test-apis.js [API_URL]
 * Default API_URL: http://localhost:3001
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const API_URL = (process.argv[2] || 'http://localhost:3001').replace(/\/$/, '');
const isHttps = API_URL.startsWith('https');
const requestModule = isHttps ? https : http;

console.log('================================================================');
console.log('📓 Starting NoteFlow API E2E Verification Suite');
console.log(`📡 Target API Endpoint: ${API_URL}`);
console.log('================================================================\n');

// State store for sequential tests
let jwtToken = null;
let testNoteId = null;
const testEmail = `test-${Math.floor(Math.random() * 100000)}@noteflow-verify.com`;
const testPassword = 'VerifySecurePassword123!';
const testName = 'Verification Bot';

// Helper to make HTTP/S requests using native node.js
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlString = `${API_URL}${path}`;
    let parsedUrl;
    try {
      parsedUrl = new URL(urlString);
    } catch (e) {
      return reject(new Error(`Invalid URL: ${urlString}`));
    }

    const defaultHeaders = {
      'Accept': 'application/json',
      ...headers
    };

    let bodyData = '';
    if (data) {
      bodyData = JSON.stringify(data);
      defaultHeaders['Content-Type'] = 'application/json';
      defaultHeaders['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method.toUpperCase(),
      headers: defaultHeaders,
      timeout: 10000 // 10 second timeout limit
    };

    const req = requestModule.request(options, (res) => {
      let responseBody = '';
      res.setEncoding('utf8');
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        let parsedJson = null;
        if (res.headers['content-type'] && res.headers['content-type'].includes('application/json')) {
          try {
            parsedJson = JSON.parse(responseBody);
          } catch (e) {
            // response was marked as json but could not be parsed
          }
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          rawBody: responseBody,
          body: parsedJson || responseBody
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request to ${path} timed out after 10 seconds`));
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(bodyData);
    }
    req.end();
  });
}

// Visual status loggers
function logSuccess(testName, details = '') {
  console.log(`  🟢 [PASS] ${testName} ${details ? `(${details})` : ''}`);
}

function logFailure(testName, error) {
  console.log(`  🔴 [FAIL] ${testName}`);
  console.error(`     Error: ${error.message || JSON.stringify(error)}\n`);
}

// E2E Test Runner
async function runSuite() {
  let passedCount = 0;
  let failedCount = 0;

  // --- TEST 1: Health Check endpoint ---
  try {
    const res = await makeRequest('GET', '/api/health');
    if (res.statusCode === 200 && res.body.status === 'ok') {
      logSuccess('Health Check Endpoint (GET /api/health)', `DB: ${res.body.db}`);
      passedCount++;
    } else {
      throw new Error(`Unexpected status code: ${res.statusCode} or body: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    logFailure('Health Check Endpoint (GET /api/health)', err);
    failedCount++;
  }

  // --- TEST 2: User Registration ---
  try {
    const signupData = { email: testEmail, password: testPassword, name: testName };
    const res = await makeRequest('POST', '/api/auth/signup', signupData);
    const token = res.body && (res.body.token || res.body.accessToken);
    if ((res.statusCode === 200 || res.statusCode === 201) && token) {
      jwtToken = token;
      logSuccess('User Registration (POST /api/auth/signup)', `Registered: ${testEmail}`);
      passedCount++;
    } else {
      throw new Error(`Registration failed. Status: ${res.statusCode}. Body: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    logFailure('User Registration (POST /api/auth/signup)', err);
    failedCount++;
  }

  // --- TEST 3: User Login ---
  try {
    const loginData = { email: testEmail, password: testPassword };
    const res = await makeRequest('POST', '/api/auth/login', loginData);
    const token = res.body && (res.body.token || res.body.accessToken);
    if ((res.statusCode === 200 || res.statusCode === 201) && token) {
      jwtToken = token; // Refresh token
      logSuccess('User Authentication (POST /api/auth/login)', 'Successfully generated JWT');
      passedCount++;
    } else {
      throw new Error(`Authentication failed. Status: ${res.statusCode}. Body: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    logFailure('User Authentication (POST /api/auth/login)', err);
    failedCount++;
  }

  // --- TEST 4: Get Current User Profile ---
  try {
    if (!jwtToken) throw new Error('Skipped: Requires JWT token');
    const res = await makeRequest('GET', '/api/auth/me', null, { 'Authorization': `Bearer ${jwtToken}` });
    if (res.statusCode === 200 && res.body.email === testEmail) {
      logSuccess('Get Profile Profile (GET /api/auth/me)', `Verified User: ${res.body.name}`);
      passedCount++;
    } else {
      throw new Error(`Failed to get profile. Status: ${res.statusCode}. Body: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    logFailure('Get Profile Profile (GET /api/auth/me)', err);
    failedCount++;
  }

  // --- TEST 5: Create a Note (Prisma DB / Fallback Cache check) ---
  try {
    if (!jwtToken) throw new Error('Skipped: Requires JWT token');
    const noteData = {
      title: 'E2E Validation Note',
      content: '<h1>Testing Nodeflow API</h1><p>This note was automatically created by the validation bot to test the database connections and caching fallbacks.</p>'
    };
    const res = await makeRequest('POST', '/api/notes', noteData, { 'Authorization': `Bearer ${jwtToken}` });
    if (res.statusCode === 201 && res.body.id) {
      testNoteId = res.body.id;
      logSuccess('Create Note (POST /api/notes)', `Note ID: ${testNoteId}`);
      passedCount++;
    } else {
      throw new Error(`Failed to create note. Status: ${res.statusCode}. Body: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    logFailure('Create Note (POST /api/notes)', err);
    failedCount++;
  }

  // --- TEST 6: Read All Notes ---
  try {
    if (!jwtToken) throw new Error('Skipped: Requires JWT token');
    const res = await makeRequest('GET', `/api/notes?email=${encodeURIComponent(testEmail)}`, null, { 'Authorization': `Bearer ${jwtToken}` });
    if (res.statusCode === 200 && Array.isArray(res.body)) {
      logSuccess('Read Notes List (GET /api/notes)', `Found ${res.body.length} notes`);
      passedCount++;
    } else {
      throw new Error(`Failed to list notes. Status: ${res.statusCode}. Body: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    logFailure('Read Notes List (GET /api/notes)', err);
    failedCount++;
  }

  // --- TEST 7: Read Single Note ---
  try {
    if (!testNoteId) throw new Error('Skipped: Requires a valid note ID');
    const res = await makeRequest('GET', `/api/notes/${testNoteId}`, null, { 'Authorization': `Bearer ${jwtToken}` });
    if (res.statusCode === 200 && res.body.id === testNoteId) {
      logSuccess('Read Single Note (GET /api/notes/:id)', `Fetched: ${res.body.title}`);
      passedCount++;
    } else {
      throw new Error(`Failed to fetch note. Status: ${res.statusCode}. Body: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    logFailure('Read Single Note (GET /api/notes/:id)', err);
    failedCount++;
  }

  // --- TEST 8: Update Note ---
  try {
    if (!testNoteId) throw new Error('Skipped: Requires a valid note ID');
    const updateData = {
      title: 'E2E Hardened Verification Note',
      content: '<h1>E2E Suite Successful</h1><p>Modified contents.</p>'
    };
    const res = await makeRequest('PATCH', `/api/notes/${testNoteId}`, updateData, { 'Authorization': `Bearer ${jwtToken}` });
    if (res.statusCode === 200 && res.body.title === 'E2E Hardened Verification Note') {
      logSuccess('Update Note (PATCH /api/notes/:id)', `New Title: ${res.body.title}`);
      passedCount++;
    } else {
      throw new Error(`Failed to update note. Status: ${res.statusCode}. Body: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    logFailure('Update Note (PATCH /api/notes/:id)', err);
    failedCount++;
  }

  // --- TEST 9: Generate AI Summary ---
  try {
    if (!testNoteId) throw new Error('Skipped: Requires a valid note ID');
    console.log('    ⏳ Generating AI Summary (may take a few seconds)...');
    const res = await makeRequest('POST', `/api/notes/${testNoteId}/generate-summary`, null, { 'Authorization': `Bearer ${jwtToken}` });
    if (res.statusCode === 201 && res.body.summary) {
      logSuccess('Generate AI Summary (POST /api/notes/:id/generate-summary)', `Model: ${res.body.model || 'local'}`);
      console.log(`       └─ Summary snippet: ${res.body.summary.substring(0, 100)}...`);
      passedCount++;
    } else {
      throw new Error(`Failed to generate summary. Status: ${res.statusCode}. Body: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    logFailure('Generate AI Summary (POST /api/notes/:id/generate-summary)', err);
    failedCount++;
  }

  // --- TEST 10: Create Note Share Link ---
  try {
    if (!testNoteId) throw new Error('Skipped: Requires a valid note ID');
    const res = await makeRequest('POST', `/api/notes/${testNoteId}/share`, null, { 'Authorization': `Bearer ${jwtToken}` });
    if (res.statusCode === 201 && res.body.shareUrl) {
      logSuccess('Share Note (POST /api/notes/:id/share)', `Share Link: ${res.body.shareUrl}`);
      passedCount++;
    } else {
      throw new Error(`Failed to share note. Status: ${res.statusCode}. Body: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    logFailure('Share Note (POST /api/notes/:id/share)', err);
    failedCount++;
  }

  // --- TEST 11: Delete Note ---
  try {
    if (!testNoteId) throw new Error('Skipped: Requires a valid note ID');
    const res = await makeRequest('DELETE', `/api/notes/${testNoteId}`, null, { 'Authorization': `Bearer ${jwtToken}` });
    if (res.statusCode === 200 || res.statusCode === 204) {
      logSuccess('Delete Note (DELETE /api/notes/:id)', 'Successfully deleted verification note');
      passedCount++;
    } else {
      throw new Error(`Failed to delete note. Status: ${res.statusCode}. Body: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    logFailure('Delete Note (DELETE /api/notes/:id)', err);
    failedCount++;
  }

  console.log('\n================================================================');
  console.log('📊 Verification Suite Results Summary');
  console.log('================================================================');
  console.log(`  ✅ Passed Tests: ${passedCount} / 11`);
  console.log(`  ❌ Failed Tests: ${failedCount} / 11`);
  console.log('================================================================');
  
  if (failedCount > 0) {
    console.log('  ⚠️ Some verification checks failed. Review console logs above.');
    process.exit(1);
  } else {
    console.log('  🎉 All production checks passed successfully! API is deployment ready!');
    process.exit(0);
  }
}

runSuite();
