/**
 * StudentAI — Supabase Auth Gating Verification Suite
 *
 * Verifies:
 * 1. Server-side requireAiAuth function & HTTP 401 AUTH_REQUIRED response format
 * 2. Mandatory gating in app/api/ai/chat/route.ts
 * 3. Mandatory gating in app/api/ai/pdf/route.ts
 * 4. Client-side gating in StudentAIWorkspace.tsx
 * 5. Client-side gating in StudentAIVideoModal.tsx
 * 6. Client-side gating in StudentAIDocumentModal.tsx
 * 7. Client-side gating in FloatingAIChat.tsx
 * 8. Client-side gating in PdfToolClientWorkspace.tsx
 * 9. Free access to public client-side student tools (zero auth requirements)
 * 10. Supabase SSR architecture (@supabase/ssr)
 */

const fs = require('fs');
const path = require('path');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
  }
}

console.log('===============================================================');
console.log(' StudentAI — Supabase Auth Gating Verification Suite');
console.log('===============================================================');

// --- Group 1: Server-Side AI Auth Gateway Contract ---
console.log('\n--- Group 1: Server-Side AI Auth Gateway Contract ---');
const requireAuthCode = fs.readFileSync(path.join(__dirname, '../lib/auth/require-auth.ts'), 'utf8');

assert(
  requireAuthCode.includes('requireAiAuth') && requireAuthCode.includes('AUTH_REQUIRED'),
  'lib/auth/require-auth.ts exports requireAiAuth with AUTH_REQUIRED error code'
);
assert(
  requireAuthCode.includes('createSupabaseServerClient'),
  'lib/auth/require-auth.ts uses createSupabaseServerClient for SSR cookie validation'
);
assert(
  requireAuthCode.includes('Bearer ') || requireAuthCode.includes('authHeader'),
  'lib/auth/require-auth.ts supports Bearer tokens in Authorization header'
);
assert(
  requireAuthCode.includes('401'),
  'lib/auth/require-auth.ts returns status 401 on unauthenticated access'
);

// --- Group 2: AI Server Routes Protected ---
console.log('\n--- Group 2: AI Server Routes Protected ---');
const chatRouteCode = fs.readFileSync(path.join(__dirname, '../app/api/ai/chat/route.ts'), 'utf8');
const pdfRouteCode = fs.readFileSync(path.join(__dirname, '../app/api/ai/pdf/route.ts'), 'utf8');

assert(
  chatRouteCode.includes('requireAiAuth') && chatRouteCode.indexOf('requireAiAuth') < chatRouteCode.indexOf('aiRouter.generate'),
  'app/api/ai/chat/route.ts invokes requireAiAuth BEFORE routing request to AI providers'
);
assert(
  pdfRouteCode.includes('requireAiAuth') && pdfRouteCode.indexOf('requireAiAuth') < pdfRouteCode.indexOf('aiRouter.generate'),
  'app/api/ai/pdf/route.ts invokes requireAiAuth BEFORE routing request to AI providers'
);

// --- Group 3: Client-Side AI Components Auth Gated ---
console.log('\n--- Group 3: Client-Side AI Components Auth Gated ---');
const workspaceCode = fs.readFileSync(path.join(__dirname, '../components/ai/workspace/StudentAIWorkspace.tsx'), 'utf8');
const videoModalCode = fs.readFileSync(path.join(__dirname, '../components/ai/workspace/StudentAIVideoModal.tsx'), 'utf8');
const docModalCode = fs.readFileSync(path.join(__dirname, '../components/ai/workspace/StudentAIDocumentModal.tsx'), 'utf8');
const floatingChatCode = fs.readFileSync(path.join(__dirname, '../components/ai/FloatingAIChat.tsx'), 'utf8');
const pdfToolWorkspaceCode = fs.readFileSync(path.join(__dirname, '../components/pdf/PdfToolClientWorkspace.tsx'), 'utf8');

assert(
  workspaceCode.includes('requireAiAccess') && workspaceCode.includes('getAccessToken'),
  'StudentAIWorkspace integrates requireAiAccess and getAccessToken'
);
assert(
  videoModalCode.includes('requireAiAccess') && videoModalCode.includes('getAccessToken'),
  'StudentAIVideoModal integrates requireAiAccess and getAccessToken'
);
assert(
  docModalCode.includes('requireAiAccess') && docModalCode.includes('getAccessToken'),
  'StudentAIDocumentModal integrates requireAiAccess and getAccessToken'
);
assert(
  floatingChatCode.includes('requireAiAccess') && floatingChatCode.includes('getAccessToken'),
  'FloatingAIChat integrates requireAiAccess and getAccessToken'
);
assert(
  pdfToolWorkspaceCode.includes('requireAiAccess') && pdfToolWorkspaceCode.includes('getAccessToken'),
  'PdfToolClientWorkspace integrates requireAiAccess and getAccessToken'
);

// --- Group 4: Auth State Management & Modal Continuity ---
console.log('\n--- Group 4: Auth State Management & Modal Continuity ---');
const authProviderCode = fs.readFileSync(path.join(__dirname, '../components/auth/AuthProvider.tsx'), 'utf8');
const auth3DModalCode = fs.readFileSync(path.join(__dirname, '../components/auth/Auth3DModal.tsx'), 'utf8');

assert(
  authProviderCode.includes('requireAiAccess') && authProviderCode.includes('pendingActionRef'),
  'AuthProvider stores pendingActionRef to resume actions after authentication'
);
assert(
  authProviderCode.includes('pendingPrompt') && authProviderCode.includes('updatePendingPrompt'),
  'AuthProvider preserves pendingPrompt so student prompts are never lost'
);
assert(
  auth3DModalCode.includes('signInWithOAuth') && auth3DModalCode.includes('google'),
  'Auth3DModal provides Google OAuth sign in'
);
assert(
  auth3DModalCode.includes('forgotPassword') || auth3DModalCode.includes('resetPasswordForEmail'),
  'Auth3DModal provides password reset flow'
);

// --- Group 5: Zero Interference with Public Client-Side Tools ---
console.log('\n--- Group 5: Zero Interference with Public Client-Side Tools ---');
const calcPageCode = fs.existsSync(path.join(__dirname, '../app/calculators/page.tsx'))
  ? fs.readFileSync(path.join(__dirname, '../app/calculators/page.tsx'), 'utf8')
  : '';
const mergePageCode = fs.readFileSync(path.join(__dirname, '../components/pdf/MergePdfWorkspace.tsx'), 'utf8');
const jpgToPdfCode = fs.readFileSync(path.join(__dirname, '../components/pdf/JpgToPdfWorkspace.tsx'), 'utf8');
const pdfToJpgCode = fs.readFileSync(path.join(__dirname, '../components/pdf/PdfToJpgWorkspace.tsx'), 'utf8');

assert(
  !mergePageCode.includes('requireAiAuth') && !mergePageCode.includes('openAuthModal'),
  'MergePdfWorkspace operates client-side with zero mandatory authentication'
);
assert(
  !jpgToPdfCode.includes('requireAiAuth') && !jpgToPdfCode.includes('openAuthModal'),
  'JpgToPdfWorkspace operates client-side with zero mandatory authentication'
);
assert(
  !pdfToJpgCode.includes('requireAiAuth') && !pdfToJpgCode.includes('openAuthModal'),
  'PdfToJpgWorkspace operates client-side with zero mandatory authentication'
);

// --- Group 6: Supabase SSR Infrastructure ---
console.log('\n--- Group 6: Supabase SSR Infrastructure ---');
const supabaseClientCode = fs.readFileSync(path.join(__dirname, '../lib/supabase/client.ts'), 'utf8');
const supabaseServerCode = fs.readFileSync(path.join(__dirname, '../lib/supabase/server.ts'), 'utf8');
const pkgJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

assert(
  Boolean(pkgJson.dependencies['@supabase/ssr']),
  'package.json has @supabase/ssr dependency installed'
);
assert(
  supabaseClientCode.includes('createBrowserClient'),
  'lib/supabase/client.ts uses createBrowserClient from @supabase/ssr'
);
assert(
  supabaseServerCode.includes('createServerClient') && supabaseServerCode.includes('cookies'),
  'lib/supabase/server.ts uses createServerClient and next/headers cookies()'
);

console.log('\n===============================================================');
console.log(` Supabase Auth Gating Verification Completed!`);
console.log(` Passed: ${passedTests}/${totalTests} tests`);
console.log('===============================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
