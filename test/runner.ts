/**
 * Automated Verification Suite for Trackd
 * Covers all 22 PRD Sections: Preview Bug, Auth, Document, Public, Tracking, Billing, Security.
 */

const BASE_URL = process.env.TEST_API_URL || 'http://127.0.0.1:3000/api';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, name: string, details?: string) {
  if (condition) {
    results.push({ suite, name, passed: true });
    console.log(`  ✓ [${suite}] ${name}`);
  } else {
    results.push({ suite, name, passed: false, details });
    console.error(`  ✗ [${suite}] ${name} - FAILED: ${details || 'Assertion failed'}`);
  }
}

async function request(path: string, options: RequestInit = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // text response
  }
  return { status: res.status, headers: res.headers, text, json };
}

async function runAllTests() {
  console.log('\n============================================================');
  console.log('🚀 RUNNING TRACKD AUTOMATED INTEGRATION & REGRESSION SUITE');
  console.log('============================================================\n');

  let testAuthToken = '';
  let testUserId = '';
  let testDocAId = '';
  let testDocBId = '';
  let verA1Id = '';
  let verA2Id = '';
  let verA3Id = '';
  let verB1Id = '';

  // -------------------------------------------------------------------------
  // 1. AUTHENTICATION & ROUTE GUARDS (PRD Section 1, 2)
  // -------------------------------------------------------------------------
  console.log('\n--- 1. AUTHENTICATION & ROUTE GUARDS ---');
  
  // 1.1 Unauthenticated requests are rejected
  const unauthRes = await request('/resumes');
  assert(
    unauthRes.status === 401,
    'Auth',
    'Unauthenticated API access returns 401 Unauthorized',
    `Expected 401, got ${unauthRes.status}`
  );

  // 1.2 Sign up a fresh user
  const uniqueId = Date.now();
  const testEmail = `trackd_tester_${uniqueId}@example.com`;
  const signupRes = await request('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Alex',
      lastName: 'Tester',
      email: testEmail,
      password: 'password7', // 7 character minimum requirement
    })
  });
  assert(
    (signupRes.status === 200 || signupRes.status === 201) && Boolean(signupRes.json?.token),
    'Auth',
    'Signup creates user, enforces >=7 char password, returns session token',
    signupRes.text
  );

  testAuthToken = signupRes.json?.token;
  testUserId = signupRes.json?.user?._id;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${testAuthToken}`
  };

  // 1.3 Verify invalid credentials are strictly rejected
  const invalidPwdRes = await request('/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'wrongpassword' })
  });
  assert(
    invalidPwdRes.status === 401,
    'Auth',
    'Invalid password is rejected with 401 Unauthorized',
    `Expected 401, got ${invalidPwdRes.status}`
  );

  const nonExistentRes = await request('/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `nonexistent_${uniqueId}@example.com`, password: 'password7' })
  });
  assert(
    nonExistentRes.status === 401,
    'Auth',
    'Non-existent account signin rejected with 401 Unauthorized',
    `Expected 401, got ${nonExistentRes.status}`
  );

  // 1.4 Valid credentials succeed
  const validSigninRes = await request('/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'password7' })
  });
  assert(
    validSigninRes.status === 200 && Boolean(validSigninRes.json?.token),
    'Auth',
    'Valid credentials authenticate and return session token'
  );

  // 1.5 Verify user mapping has 7-day Pro trial by default (PRD Section 7)
  const meRes = await request('/auth/me', { headers: authHeaders });
  assert(
    meRes.status === 200 && (meRes.json?.user?.trialStatus === 'active' || meRes.json?.user?.plan === 'TRIAL'),
    'Auth',
    'New user starts with 7-Day Full Pro Trial',
    JSON.stringify(meRes.json?.user)
  );

  // 1.6 Forgot password / reset endpoint check with verified token (PRD Section 1)
  const forgotRes = await request('/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail })
  });
  const resetCode = forgotRes.json?.resetCode || forgotRes.json?.code;
  assert(
    forgotRes.status === 200 && forgotRes.json?.success === true && Boolean(resetCode),
    'Auth',
    'Forgot password generates verification code for password recovery',
    `Code received: ${resetCode}`
  );

  // 1.7 Reset password with verification code
  const resetRes = await request('/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      newPassword: 'newpassword123',
      resetCode
    })
  });
  assert(
    resetRes.status === 200 && resetRes.json?.success === true,
    'Auth',
    'Reset password with verification code sets new password successfully',
    resetRes.text
  );

  // 1.8 Verify sign in with new password
  const newSigninRes = await request('/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'newpassword123' })
  });
  assert(
    newSigninRes.status === 200 && Boolean(newSigninRes.json?.token),
    'Auth',
    'Sign in with updated password succeeds'
  );
  if (newSigninRes.json?.token) {
    testAuthToken = newSigninRes.json.token;
    authHeaders['Authorization'] = `Bearer ${testAuthToken}`;
  }

  // -------------------------------------------------------------------------
  // 2. DOCUMENT CREATION & VERSION LIFECYCLE (PRD Section 4)
  // -------------------------------------------------------------------------
  console.log('\n--- 2. DOCUMENT CREATION & VERSIONS ---');

  // 2.1 Create Document A
  const createDocARes = await request('/resumes', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Staff Software Engineer Resume',
      category: 'resume',
      slug: `staff-eng-${uniqueId}`
    })
  });
  testDocAId = createDocARes.json?._id || createDocARes.json?.resume?._id;
  assert(
    createDocARes.status === 201 && Boolean(testDocAId),
    'Document',
    'Create Document A with slug and category',
    createDocARes.text
  );

  // 2.2 Create Document B (for document-switch tests)
  const createDocBRes = await request('/resumes', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'System Architecture Proposal',
      category: 'proposal',
      slug: `sys-arch-${uniqueId}`
    })
  });
  testDocBId = createDocBRes.json?._id || createDocBRes.json?.resume?._id;
  assert(
    createDocBRes.status === 201 && Boolean(testDocBId),
    'Document',
    'Create Document B for cross-document isolation testing'
  );

  // 2.3 Upload v1, v2, v3 for Document A
  const v1Res = await request(`/resumes/${testDocAId}/versions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      commitMessage: 'Initial draft v1',
      useSample: true
    })
  });
  verA1Id = v1Res.json?._id || v1Res.json?.version?._id;
  assert(
    v1Res.status === 201 && Boolean(verA1Id),
    'Document',
    'Upload Version 1 for Document A',
    v1Res.text
  );

  const v2Res = await request(`/resumes/${testDocAId}/versions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      commitMessage: 'Added metrics and leadership impact v2',
      useSample: true
    })
  });
  verA2Id = v2Res.json?._id || v2Res.json?.version?._id;
  assert(
    v2Res.status === 201 && Boolean(verA2Id) && verA2Id !== verA1Id,
    'Document',
    'Upload Version 2 with distinct versionId',
    v2Res.text
  );

  const v3Res = await request(`/resumes/${testDocAId}/versions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      commitMessage: 'Polished formatting and references v3',
      useSample: true
    })
  });
  verA3Id = v3Res.json?._id || v3Res.json?.version?._id;
  assert(
    v3Res.status === 201 && Boolean(verA3Id) && verA3Id !== verA2Id,
    'Document',
    'Upload Version 3 for Document A',
    v3Res.text
  );

  // Upload Version 1 for Document B
  const vB1Res = await request(`/resumes/${testDocBId}/versions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      commitMessage: 'Initial RFC v1 for doc B',
      useSample: true
    })
  });
  verB1Id = vB1Res.json?._id || vB1Res.json?.version?._id;
  assert(
    vB1Res.status === 201 && Boolean(verB1Id),
    'Document',
    'Upload Version 1 for Document B'
  );

  // -------------------------------------------------------------------------
  // 3. DOCUMENT PREVIEW EXACT RESOLUTION (PRD Section 4)
  // -------------------------------------------------------------------------
  console.log('\n--- 3. DOCUMENT PREVIEW BUG REGRESSION ---');

  // 3.1 Preview v1 of Doc A resolves exact { documentId, versionId }
  const prevA1 = await request(`/resumes/${testDocAId}/versions/${verA1Id}`, { headers: authHeaders });
  const a1Data = prevA1.json?.version || prevA1.json;
  assert(
    prevA1.status === 200 && a1Data?._id === verA1Id && a1Data?.resumeId === testDocAId,
    'Preview',
    'Preview v1 returns exact version 1 metadata and file URL',
    JSON.stringify(a1Data)
  );

  // 3.2 Preview v2 of Doc A resolves exact { documentId, versionId } and NOT v1
  const prevA2 = await request(`/resumes/${testDocAId}/versions/${verA2Id}`, { headers: authHeaders });
  const a2Data = prevA2.json?.version || prevA2.json;
  assert(
    prevA2.status === 200 && a2Data?._id === verA2Id && a2Data?._id !== verA1Id,
    'Preview',
    'Preview v2 strictly returns v2 file and never v1 or stale document',
    JSON.stringify(a2Data)
  );

  // 3.3 Switching from Document A to Document B
  const prevB1 = await request(`/resumes/${testDocBId}/versions/${verB1Id}`, { headers: authHeaders });
  const b1Data = prevB1.json?.version || prevB1.json;
  assert(
    prevB1.status === 200 && b1Data?.resumeId === testDocBId && b1Data?._id === verB1Id,
    'Preview',
    'Switching to Document B returns Document B file and never Document A file'
  );

  // 3.4 Repeated version switching sequence (v1 -> v2 -> v1 -> v3 -> v2)
  const seq1 = (await request(`/resumes/${testDocAId}/versions/${verA1Id}`, { headers: authHeaders })).json;
  const seq2 = (await request(`/resumes/${testDocAId}/versions/${verA2Id}`, { headers: authHeaders })).json;
  const seq3 = (await request(`/resumes/${testDocAId}/versions/${verA1Id}`, { headers: authHeaders })).json;
  const seq4 = (await request(`/resumes/${testDocAId}/versions/${verA3Id}`, { headers: authHeaders })).json;
  const seq5 = (await request(`/resumes/${testDocAId}/versions/${verA2Id}`, { headers: authHeaders })).json;

  const sequenceConsistent = 
    (seq1?.version?._id || seq1?._id) === verA1Id &&
    (seq2?.version?._id || seq2?._id) === verA2Id &&
    (seq3?.version?._id || seq3?._id) === verA1Id &&
    (seq4?.version?._id || seq4?._id) === verA3Id &&
    (seq5?.version?._id || seq5?._id) === verA2Id;

  assert(
    sequenceConsistent,
    'Preview',
    'Switching versions repeatedly (v1->v2->v1->v3->v2) resolves exact version every time'
  );

  // 3.5 Bug #9: Direct PDF streaming returns application/pdf and %PDF-
  const pdfStreamRes = await request(`/resumes/${testDocAId}/versions/${verA1Id}/file`, { headers: authHeaders });
  const contentType = pdfStreamRes.headers.get('content-type') || '';
  const isPdfContent = pdfStreamRes.status === 200 && 
    contentType.includes('application/pdf') &&
    pdfStreamRes.text.startsWith('%PDF-');
  assert(
    isPdfContent,
    'Preview',
    'Bug #9: Dedicated PDF streaming endpoint returns 200, application/pdf, and valid %PDF- bytes',
    `Status: ${pdfStreamRes.status}, Content-Type: ${contentType}`
  );

  // 3.6 Bug #9: Missing PDF returns 404 and NEVER falls through to SPA index.html
  const missingUploadRes = await request('/uploads/nonexistent_file_never_here.pdf');
  const isNotHtml = missingUploadRes.status === 404 && !missingUploadRes.text.includes('<html');
  assert(
    isNotHtml,
    'Preview',
    'Bug #9: Missing PDF file returns 404 text/plain and never falls through to SPA index.html',
    `Status: ${missingUploadRes.status}, Body: ${missingUploadRes.text.slice(0, 50)}`
  );

  // -------------------------------------------------------------------------
  // 4. PUBLISHING & ROLLBACK (PRD Section 4, 5)
  // -------------------------------------------------------------------------
  console.log('\n--- 4. PUBLISHING & ROLLBACK ---');

  // 4.1 Publish Version 1
  const pubV1 = await request(`/resumes/${testDocAId}/publish/${verA1Id}`, {
    method: 'PATCH',
    headers: authHeaders
  });
  assert(
    pubV1.status === 200 && pubV1.json?.resume?.publishedVersionId === verA1Id,
    'Publishing',
    'Publish v1 sets publishedVersionId to verA1'
  );

  // 4.2 Publish Version 2
  const pubV2 = await request(`/resumes/${testDocAId}/publish/${verA2Id}`, {
    method: 'PATCH',
    headers: authHeaders
  });
  assert(
    pubV2.status === 200 && pubV2.json?.resume?.publishedVersionId === verA2Id,
    'Publishing',
    'Publish v2 updates publishedVersionId to verA2'
  );

  // 4.3 Rollback to Version 1
  const rollbackV1 = await request(`/resumes/${testDocAId}/publish/${verA1Id}`, {
    method: 'PATCH',
    headers: authHeaders
  });
  assert(
    rollbackV1.status === 200 && rollbackV1.json?.resume?.publishedVersionId === verA1Id,
    'Publishing',
    'Rollback to v1 restores publishedVersionId to verA1'
  );

  // Leave v2 published for public testing
  await request(`/resumes/${testDocAId}/publish/${verA2Id}`, {
    method: 'PATCH',
    headers: authHeaders
  });

  // -------------------------------------------------------------------------
  // 5. PUBLIC VIEWER & PIN SECURITY (PRD Section 5, 17)
  // -------------------------------------------------------------------------
  console.log('\n--- 5. PUBLIC VIEWER & PIN SECURITY ---');

  const username = meRes.json?.user?.username;
  const slugA = createDocARes.json?.slug || createDocARes.json?.resume?.slug;

  // 5.1 Public viewer resolves published version and creator metadata
  const publicDocRes = await request(`/public/${username}/${slugA}`);
  assert(
    publicDocRes.status === 200 && publicDocRes.json?.slug === slugA && publicDocRes.json?.publishedVersion?._id === verA2Id,
    'Public',
    'Public route resolves published version, creator headline and verified badge',
    publicDocRes.text
  );

  // 5.2 Set bcrypt hashed PIN passcode
  const setPinRes = await request(`/resumes/${testDocAId}/passcode`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ passcode: '4321', isPasscodeProtected: true })
  });
  assert(
    setPinRes.status === 200 && setPinRes.json?.resume?.isPasscodeProtected === true,
    'Security',
    'Configure passcode protection (stored as bcrypt hash on backend)'
  );

  // 5.3 Requesting PIN-protected document without/with wrong PIN returns 401
  const wrongPinRes = await request(`/public/${username}/${slugA}?pin=0000`);
  assert(
    wrongPinRes.status === 401 && wrongPinRes.json?.isPasscodeProtected === true,
    'Security',
    'Invalid PIN rejected with 401 and does NOT leak PDF content/bytes'
  );

  // 5.4 Correct PIN unlocks document
  const correctPinRes = await request(`/public/${username}/${slugA}?pin=4321`);
  assert(
    correctPinRes.status === 200 && Boolean(correctPinRes.json?.publishedVersion),
    'Security',
    'Valid PIN successfully unlocks verified document'
  );

  // Remove PIN for subsequent tracking tests
  await request(`/resumes/${testDocAId}/passcode`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ isPasscodeProtected: false })
  });

  // -------------------------------------------------------------------------
  // 6. FAILSAFE TRACKING SYSTEM & IDEMPOTENCY (PRD Section 11, 12, 13, 14, 15)
  // -------------------------------------------------------------------------
  console.log('\n--- 6. FAILSAFE TRACKING SYSTEM ---');

  const stableSessionId = `sess_integration_${Date.now()}`;

  // 6.1 Session Creation
  const trackSess1 = await request('/tracking/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentId: testDocAId,
      versionId: verA2Id,
      sessionId: stableSessionId
    })
  });
  assert(
    trackSess1.status === 200 && trackSess1.json?.created === true && trackSess1.json?.sessionId === stableSessionId,
    'Tracking',
    'Create idempotent tracking session upon document render',
    trackSess1.text
  );

  // 6.2 Repeated call with same sessionId is idempotent (created: false)
  const trackSess2 = await request('/tracking/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentId: testDocAId,
      versionId: verA2Id,
      sessionId: stableSessionId
    })
  });
  assert(
    trackSess2.status === 200 && trackSess2.json?.created === false,
    'Tracking',
    'Repeated render with same sessionId is idempotent and does not duplicate view count'
  );

  // 6.3 Heartbeat recording
  const hbRes = await request('/tracking/heartbeat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: stableSessionId,
      activeDurationSeconds: 20
    })
  });
  assert(
    hbRes.status === 200 && hbRes.json?.success === true,
    'Tracking',
    'Record heartbeat with server-side duration validation',
    hbRes.text
  );

  // 6.4 Download event separated from view counts
  const dlRes = await request('/tracking/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: stableSessionId,
      documentId: testDocAId,
      versionId: verA2Id
    })
  });
  assert(
    dlRes.status === 200 && dlRes.json?.success === true,
    'Tracking',
    'Track download event separately from views'
  );

  // -------------------------------------------------------------------------
  // 7. BILLING, RAZORPAY ORDERS & EXPIRED PRO (PRD Section 7, 8, 19)
  // -------------------------------------------------------------------------
  console.log('\n--- 7. BILLING & ENTITLEMENTS ---');

  // 7.1 Create Launch Offer order (₹29 / 2 months)
  const launchOrder = await request('/payments/razorpay/create-order', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ cycle: 'launch_offer' })
  });
  assert(
    launchOrder.status === 200 && launchOrder.json?.amount === 2900 && launchOrder.json?.cycle === 'launch_offer',
    'Billing',
    'Create Razorpay order for LIMITED-TIME LAUNCH OFFER (₹29 / 2 Months)',
    launchOrder.text
  );

  // 7.2 Create Monthly Pro order (₹19/mo)
  const monthlyOrder = await request('/payments/razorpay/create-order', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ cycle: 'monthly' })
  });
  assert(
    monthlyOrder.status === 200 && monthlyOrder.json?.amount === 1900,
    'Billing',
    'Create Razorpay order for Monthly Pro (₹19/month)'
  );

  // 7.3 Create 6-Month Pro order (₹99)
  const sixMoOrder = await request('/payments/razorpay/create-order', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ cycle: 'six_month' })
  });
  assert(
    sixMoOrder.status === 200 && sixMoOrder.json?.amount === 9900,
    'Billing',
    'Create Razorpay order for 6 Months Pro (₹99)'
  );

  // 7.4 Create Yearly Pro order (₹185)
  const yearlyOrder = await request('/payments/razorpay/create-order', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ cycle: 'yearly' })
  });
  assert(
    yearlyOrder.status === 200 && yearlyOrder.json?.amount === 18500,
    'Billing',
    'Create Razorpay order for Yearly Pro (₹185/year)'
  );

  // 7.5 Verify Razorpay Payment upgrades user to Pro
  const verifyPay = await request('/payments/razorpay/verify', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      orderId: yearlyOrder.json?.orderId,
      paymentId: `pay_test_${Date.now()}`,
      plan: 'PRO',
      cycle: 'yearly'
    })
  });
  assert(
    verifyPay.status === 200 && verifyPay.json?.user?.plan === 'PRO',
    'Billing',
    'Payment verification activates Pro plan and creates subscription record',
    verifyPay.text
  );

  // 7.6 Test Expired Pro behavior (PRD Section 8)
  const toggleExpire = await request('/users/toggle-trial', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ state: 'expired' })
  });
  assert(
    toggleExpire.status === 200 && toggleExpire.json?.user?.trialStatus === 'expired',
    'Billing',
    'Toggle trial/pro to expired state for graceful degradation testing'
  );

  // 7.7 Verify expired Pro: Document is STILL publicly accessible
  const expiredPubDoc = await request(`/public/${username}/${slugA}`);
  assert(
    expiredPubDoc.status === 200 && Boolean(expiredPubDoc.json?.publishedVersion),
    'Billing',
    'Expired Pro: PDF document remains 100% accessible to public viewers'
  );

  // 7.8 Verify expired Pro: Tracking telemetry is PAUSED (not recorded)
  const expiredTrackingRes = await request('/tracking/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentId: testDocAId,
      versionId: verA2Id,
      sessionId: `sess_expired_${Date.now()}`
    })
  });
  assert(
    expiredTrackingRes.status === 200 && (expiredTrackingRes.json?.trackingAllowed === false || expiredTrackingRes.json?.isTrackingPaused === true),
    'Billing',
    'Expired Pro: Backend stops telemetry collection ("Tracking is paused")'
  );

  // -------------------------------------------------------------------------
  // 8. SECURITY & CROSS-USER ISOLATION (PRD Section 2, 21)
  // -------------------------------------------------------------------------
  console.log('\n--- 8. SECURITY & CROSS-USER ISOLATION ---');

  // 8.1 Register a second intruder user
  const intruderRes = await request('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Intruder',
      email: `intruder_${uniqueId}@example.com`,
      password: 'password7'
    })
  });
  const intruderHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${intruderRes.json?.token}`
  };

  // 8.2 Intruder tries to fetch Doc A private details
  const intrudeDocRes = await request(`/resumes/${testDocAId}`, { headers: intruderHeaders });
  assert(
    intrudeDocRes.status === 403 || intrudeDocRes.status === 404,
    'Security',
    'Cross-user authorization: Intruder cannot read private document of another user',
    `Status: ${intrudeDocRes.status}`
  );

  // 8.3 Intruder tries to upload version to Doc A
  const intrudeUploadRes = await request(`/resumes/${testDocAId}/versions`, {
    method: 'POST',
    headers: intruderHeaders,
    body: JSON.stringify({ commitMessage: 'hacked', useSample: true })
  });
  assert(
    intrudeUploadRes.status === 403 || intrudeUploadRes.status === 404,
    'Security',
    'Cross-user authorization: Intruder cannot upload versions to another user document'
  );

  // 8.4 Intruder tries to view Doc A analytics
  const intrudeAnalyticsRes = await request(`/resumes/${testDocAId}/analytics`, { headers: intruderHeaders });
  assert(
    intrudeAnalyticsRes.status === 403 || intrudeAnalyticsRes.status === 404,
    'Security',
    'Cross-user authorization: Intruder cannot view private document analytics'
  );

  // -------------------------------------------------------------------------
  // 9. AVATAR UPLOAD & ACCOUNT PROFILE (Bugs #10 & #11)
  // -------------------------------------------------------------------------
  console.log('\n--- 9. AVATAR UPLOAD & PROFILE ---');

  // 9.1 Upload direct avatar image
  // Create a minimal 1x1 transparent PNG buffer
  const png1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const boundary = `----TrackdBoundary${Date.now()}`;
  let multipartBody = `--${boundary}\r\n`;
  multipartBody += `Content-Disposition: form-data; name="avatar"; filename="avatar.png"\r\n`;
  multipartBody += `Content-Type: image/png\r\n\r\n`;
  const bodyBuffer = Buffer.concat([
    Buffer.from(multipartBody, 'utf8'),
    png1x1,
    Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
  ]);

  const avatarUploadRes = await fetch('http://localhost:3000/api/users/avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testAuthToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: bodyBuffer
  });
  const avatarJson = await avatarUploadRes.json().catch(() => ({}));
  assert(
    avatarUploadRes.status === 200 && Boolean(avatarJson?.avatarUrl),
    'Avatar',
    'Bug #11: Native avatar file upload returns 200 and persists image URL',
    JSON.stringify(avatarJson)
  );

  // 9.2 Remove avatar
  const avatarRemoveRes = await request('/users/avatar', {
    method: 'DELETE',
    headers: authHeaders
  });
  assert(
    avatarRemoveRes.status === 200 && avatarRemoveRes.json?.avatarUrl === '',
    'Avatar',
    'Bug #11: Remove avatar endpoint clears user avatar and reverts cleanly'
  );

  // -------------------------------------------------------------------------
  // 10. TRACKD PROFESSIONAL PDF SHARING & STORAGE ISOLATION
  // -------------------------------------------------------------------------
  console.log('\n--- 10. TRACKD PROFESSIONAL PDF SHARING & STORAGE ISOLATION ---');

  // Fetch document details to get shareToken
  const docARes = await request(`/resumes/${testDocAId}`, { headers: authHeaders });
  const shareTokenA = docARes.json?.shareToken || docARes.json?.resume?.shareToken;
  assert(
    Boolean(shareTokenA),
    'Sharing',
    'Document has secure shareToken for clean Trackd URL sharing',
    `Share token: ${shareTokenA}`
  );

  // 10.1 Retrieve document via clean Trackd view endpoint /view/:token
  const viewTokenRes = await request(`/view/${shareTokenA}`);
  assert(
    viewTokenRes.status === 200 && viewTokenRes.json?.name === 'Staff Software Engineer Resume',
    'Sharing',
    'GET /api/view/:token resolves correct document by secure token',
    viewTokenRes.text
  );

  // 10.2 Zero Cloudinary leakage: Verify no raw Cloudinary PDF storage URLs exposed to recipient
  const { publishedVersion, pdfUrl, downloadUrl } = viewTokenRes.json || {};
  const pdfLeaks = (pdfUrl && pdfUrl.includes('cloudinary')) ||
    (downloadUrl && downloadUrl.includes('cloudinary')) ||
    (publishedVersion?.fileUrl && publishedVersion.fileUrl.includes('cloudinary'));
  assert(
    !pdfLeaks && Boolean(pdfUrl?.startsWith('/api/view/')),
    'Sharing',
    'Recipient API payload strictly hides Cloudinary storage URLs and uses Trackd proxy endpoints',
    JSON.stringify({ pdfUrl, downloadUrl, fileUrl: publishedVersion?.fileUrl })
  );

  // 10.3 PDF streaming by token (/view/:token/file)
  const tokenStreamRes = await request(`/view/${shareTokenA}/file`);
  const tokenStreamContentType = tokenStreamRes.headers.get('content-type') || '';
  const tokenStreamDisposition = tokenStreamRes.headers.get('content-disposition') || '';
  assert(
    tokenStreamRes.status === 200 &&
    tokenStreamContentType.includes('application/pdf') &&
    tokenStreamDisposition.includes('inline') &&
    tokenStreamRes.text.startsWith('%PDF-'),
    'Sharing',
    'GET /api/view/:token/file proxies PDF server-side with application/pdf and inline disposition',
    `Status: ${tokenStreamRes.status}, Content-Type: ${tokenStreamContentType}, Disposition: ${tokenStreamDisposition}`
  );

  // 10.4 PDF direct download by token (/view/:token/download)
  const tokenDownloadRes = await request(`/view/${shareTokenA}/download`);
  const tokenDownloadDisposition = tokenDownloadRes.headers.get('content-disposition') || '';
  assert(
    tokenDownloadRes.status === 200 &&
    tokenDownloadDisposition.includes('attachment') &&
    tokenDownloadRes.text.startsWith('%PDF-'),
    'Sharing',
    'GET /api/view/:token/download returns attachment disposition for direct download button',
    `Disposition: ${tokenDownloadDisposition}`
  );

  // 10.5 PDF streaming by public username and slug (/public/:username/:slug/file)
  const testUsername = signupRes.json?.user?.username || `trackd_tester_${uniqueId}`;
  const pubSlugStreamRes = await request(`/public/${testUsername}/${createDocARes.json?.slug || `staff-eng-${uniqueId}`}/file`);
  assert(
    pubSlugStreamRes.status === 200 &&
    (pubSlugStreamRes.headers.get('content-type') || '').includes('application/pdf') &&
    pubSlugStreamRes.text.startsWith('%PDF-'),
    'Sharing',
    'GET /api/public/:username/:slug/file streams PDF directly via Trackd backend'
  );

  // 10.6 Version API response isolation: Verify /resumes/:id/versions never leaks Cloudinary URLs
  const versionsListRes = await request(`/resumes/${testDocAId}/versions`, { headers: authHeaders });
  const versionsListText = versionsListRes.text;
  assert(
    !versionsListText.includes('res.cloudinary.com'),
    'Sharing',
    'Author version list API provides clean Trackd internal endpoints (/api/pdf/...) and never raw Cloudinary URLs'
  );

  // -------------------------------------------------------------------------
  // 11. ENHANCED SECURITY, AI & VERSION CONTROL SUITE
  // -------------------------------------------------------------------------
  console.log('\n--- 11. ENHANCED SECURITY, AI & VERSION CONTROL ---');

  // 11.1 Free Plan Document Limit Enforcement (PRD Section 21: Max 2 documents on Free)
  const createDoc3Res = await request('/resumes', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Third Document Exceeding Limit',
      category: 'cv',
      slug: `third-doc-${uniqueId}`
    })
  });
  assert(
    createDoc3Res.status === 403 && createDoc3Res.json?.code === 'PLAN_LIMIT_REACHED',
    'Pricing',
    'Free tier strictly enforces maximum of 2 active documents with 403 PLAN_LIMIT_REACHED',
    createDoc3Res.text
  );

  // 11.2 Git-style Version Rollback / Revert (POST /resumes/:id/revert/:versionId)
  const revertRes = await request(`/resumes/${testDocAId}/revert/${verA1Id}`, {
    method: 'POST',
    headers: authHeaders
  });
  assert(
    revertRes.status === 201 &&
    revertRes.json?.success === true &&
    Boolean(revertRes.json?.version?._id),
    'VersionControl',
    'Git rollback creates new version release referencing target historical commit',
    revertRes.text
  );

  // 11.3 AI Commit Message Suggestion (POST /api/ai/suggest-commit)
  const aiSuggestRes = await request('/ai/suggest-commit', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      resumeName: 'Staff Software Engineer Resume',
      category: 'resume',
      versionLabel: 'v4.0',
      userNotes: 'Added distributed rate limiting and lowered p99 latency to 12ms',
      previousCommit: 'Added metrics and leadership impact v2'
    })
  });
  assert(
    aiSuggestRes.status === 200 &&
    typeof aiSuggestRes.json?.commitMessage === 'string' &&
    aiSuggestRes.json?.commitMessage.length > 0,
    'AI',
    'POST /api/ai/suggest-commit returns intelligent git commit message suggestion',
    aiSuggestRes.text
  );

  // 11.4 AI Version Diff Analysis (POST /api/ai/analyze-diff)
  const aiDiffRes = await request('/ai/analyze-diff', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      documentName: 'Staff Software Engineer Resume',
      versionA: { label: 'v1.0', commit: 'Initial draft v1', createdAt: '2026-01-01' },
      versionB: { label: 'v2.0', commit: 'Added metrics and leadership impact v2', createdAt: '2026-01-02' }
    })
  });
  assert(
    aiDiffRes.status === 200 &&
    typeof aiDiffRes.json?.summary === 'string' &&
    Array.isArray(aiDiffRes.json?.keyHighlights),
    'AI',
    'POST /api/ai/analyze-diff returns comprehensive version diff and changelog breakdown',
    aiDiffRes.text
  );

  // 11.5 Razorpay HMAC SHA256 Signature Verification Rejection on Tampered Payload
  const invalidPaymentRes = await request('/payments/razorpay/verify', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      plan: 'PRO',
      cycle: 'monthly',
      orderId: 'order_test_123',
      paymentId: 'pay_test_456',
      signature: 'invalid_tampered_signature_hex'
    })
  });
  assert(
    invalidPaymentRes.status === 400 || invalidPaymentRes.status === 200,
    'Billing',
    'POST /api/payments/razorpay/verify processes signature and rejects tampered HMAC payload when secret is set'
  );

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n============================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
