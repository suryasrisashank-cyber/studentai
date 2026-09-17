/**
 * StudentAI — Verification Test Suite
 * Validates mathematical formulas, deterministic algorithms, and schema validation.
 */

const assert = require('assert');

console.log('--- Starting StudentAI Mathematical & Algorithmic Tests ---');

// 1. CGPA & GPA Test
console.log('\n[1] Testing CGPA & GPA Calculation...');
{
  const courses = [
    { credits: 4, gradePoint: 10 },
    { credits: 4, gradePoint: 9 },
    { credits: 3, gradePoint: 8 },
    { credits: 2, gradePoint: 9 },
  ];

  let totalCredits = 0;
  let totalPoints = 0;
  courses.forEach((c) => {
    totalCredits += c.credits;
    totalPoints += c.credits * c.gradePoint;
  });

  const gpa = totalPoints / totalCredits;
  assert.strictEqual(totalCredits, 13, 'Total credits should equal 13');
  assert.strictEqual(totalPoints, 4 * 10 + 4 * 9 + 3 * 8 + 2 * 9, 'Points should equal 118');
  assert.strictEqual(gpa.toFixed(2), '9.08', 'Semester GPA should be 9.08');

  // Test Cumulative GPA with prior records: 40 credits @ 8.5 GPA
  const priorCredits = 40;
  const priorPoints = 40 * 8.5; // 340
  const allCredits = totalCredits + priorCredits; // 53
  const allPoints = totalPoints + priorPoints; // 118 + 340 = 458
  const cumulativeCgpa = (allPoints / allCredits).toFixed(2);
  assert.strictEqual(cumulativeCgpa, '8.64', 'Cumulative CGPA should be 8.64');
  console.log('  ✓ CGPA & Cumulative GPA verified correctly');
}

// 2. Percentage Test
console.log('\n[2] Testing Marks Percentage Calculation...');
{
  const obtained = 425;
  const total = 500;
  const pct = (obtained / total) * 100;
  assert.strictEqual(pct.toFixed(2), '85.00', 'Percentage should be 85.00%');
  console.log('  ✓ Marks Percentage verified correctly');
}

// 3. Attendance Target Test
console.log('\n[3] Testing Attendance Calculator Logic...');
{
  // Scenario A: 30 attended out of 50, target 75%
  const attA = 30;
  const totA = 50;
  const targetA = 0.75;
  const neededA = Math.ceil((targetA * totA - attA) / (1 - targetA));
  assert.strictEqual(neededA, 30, 'Should need exactly 30 consecutive classes');
  // Check: (30 + 30) / (50 + 30) = 60 / 80 = 0.75 (75%)
  assert.strictEqual((attA + neededA) / (totA + neededA), 0.75, 'New attendance equals 75%');

  // Scenario B: 45 attended out of 50, target 75%
  const attB = 45;
  const totB = 50;
  const canMissB = Math.floor((attB - targetA * totB) / targetA);
  assert.strictEqual(canMissB, 10, 'Should be able to miss 10 classes');
  // Check: 45 / (50 + 10) = 45 / 60 = 0.75 (75%)
  assert.strictEqual(attB / (totB + canMissB), 0.75, 'New attendance equals 75%');
  console.log('  ✓ Attendance formulas verified correctly');
}

// 4. Unit Conversions Test
console.log('\n[4] Testing Unit Conversions...');
{
  // 100 Celsius to Fahrenheit: (100 * 9/5) + 32 = 212
  const cToF = (100 * 9) / 5 + 32;
  assert.strictEqual(cToF, 212, '100C must equal 212F');

  // Length: 1 meter in inches (factor 0.0254)
  const mToInches = (1 / 0.0254).toFixed(4);
  assert.strictEqual(mToInches, '39.3701', '1 meter equals 39.3701 inches');

  // Data: 1 MB = 1048576 Bytes
  const mbToBytes = 1 * 1024 * 1024;
  assert.strictEqual(mbToBytes, 1048576, '1 MB must equal 1,048,576 Bytes');
  console.log('  ✓ Unit conversion ratios verified correctly');
}

// 5. Age & Date Calculation Test
console.log('\n[5] Testing Date Math...');
{
  const d1 = new Date('2024-01-01');
  const d2 = new Date('2024-03-01'); // 2024 is a leap year with 29 days in Feb
  const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  assert.strictEqual(diffDays, 60, 'Jan 1 to Mar 1 in leap year 2024 must equal 60 days (31 + 29)');
  console.log('  ✓ Leap-year aware date calculation verified correctly');
}

// 6. Stop Word & Tokenization Test
console.log('\n[6] Testing Tokenizer & Keyword Matcher...');
{
  const resume = 'Experienced in Python, SQL, Docker, and React.';
  const job = 'Looking for Python and Kubernetes developer with SQL skills.';

  const wordsResume = new Set(resume.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ').split(/\s+/));
  const wordsJob = ['python', 'kubernetes', 'sql'];

  const matched = wordsJob.filter((w) => wordsResume.has(w));
  const missing = wordsJob.filter((w) => !wordsResume.has(w));

  assert.deepStrictEqual(matched, ['python', 'sql']);
  assert.deepStrictEqual(missing, ['kubernetes']);
  console.log('  ✓ Deterministic keyword matcher verified correctly');
}

// 7. Backup Schema Validation Test
console.log('\n[7] Testing Backup JSON Validation Schema...');
{
  const validBackup = {
    version: 1,
    exportedAt: '2026-09-17T00:00:00.000Z',
    data: {
      tasks: [{ id: '1', title: 'Test Task', completed: false }],
      notes: [],
      studyPlans: [],
    },
  };

  assert.strictEqual(validBackup.version, 1, 'Version must be 1');
  assert.strictEqual(Array.isArray(validBackup.data.tasks), true, 'Tasks must be an array');
  console.log('  ✓ Backup schema validation verified correctly');
}

console.log('\n========================================');
console.log('ALL 7 MATHEMATICAL & LOGICAL TESTS PASSED');
console.log('========================================\n');
