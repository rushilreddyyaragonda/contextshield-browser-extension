// ContextShield Analysis Logic Tests
// Run with: node tests/run-tests.js

'use strict';

// Load analysis libraries
const fs = require('fs');
const path = require('path');

// Load library files by evaluating them in a mock context
function loadLib(filename) {
  const code = fs.readFileSync(path.join(__dirname, '..', 'lib', filename), 'utf8');
  const mockGlobal = {};
  const fn = new Function('window', 'this', code);
  fn.call(mockGlobal, mockGlobal, mockGlobal);
  return mockGlobal;
}

const ClaimAnalyzer = loadLib('claim-analyzer.js').ClaimAnalyzer;
const ContextDetector = loadLib('context-detector.js').ContextDetector;
const ComparisonEngine = loadLib('comparison-engine.js').ComparisonEngine;

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    console.log('  FAIL: ' + message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    failures.push(message + ' (expected: ' + expected + ', got: ' + actual + ')');
    console.log('  FAIL: ' + message + ' (expected: ' + expected + ', got: ' + actual + ')');
  }
}

function testSection(name, fn) {
  console.log('\n--- ' + name + ' ---');
  fn();
}

// === Claim Classification ===

testSection('Claim Classification', function () {
  // Factual
  var r = ClaimAnalyzer.classifyClaim('The study published in 2023 found that the treatment reduced symptoms by 40 percent.');
  assertEqual(r.type, 'numerical', 'Study with percentage should be numerical');

  r = ClaimAnalyzer.classifyClaim('According to the report, the company was founded in 2015.');
  assertEqual(r.type, 'factual', 'According-to statement should be factual');

  // Opinion
  r = ClaimAnalyzer.classifyClaim('I think this policy is unfair and wrong.');
  assertEqual(r.type, 'opinion', 'I think statement should be opinion');

  r = ClaimAnalyzer.classifyClaim('Personally, I believe this is the best decision.');
  assertEqual(r.type, 'opinion', 'Personally believe should be opinion');

  // Prediction
  r = ClaimAnalyzer.classifyClaim('The market will likely recover in the coming years.');
  assertEqual(r.type, 'prediction', 'Will likely recover should be prediction');

  // Question
  r = ClaimAnalyzer.classifyClaim('What will happen to the economy next year?');
  assertEqual(r.type, 'question', 'What will happen should be question');

  // Instruction
  r = ClaimAnalyzer.classifyClaim('Always verify your sources before sharing information.');
  assertEqual(r.type, 'instruction', 'Always verify should be instruction');

  // Generalization
  r = ClaimAnalyzer.classifyClaim('Everyone knows that this approach always works.');
  assertEqual(r.type, 'generalization', 'Everyone always should be generalization');

  // Numerical
  r = ClaimAnalyzer.classifyClaim('Revenue grew by 25% last quarter.');
  assertEqual(r.type, 'numerical', '25% growth should be numerical');

  // Empty
  r = ClaimAnalyzer.classifyClaim('');
  assertEqual(r.type, 'empty', 'Empty string should return empty');

  r = ClaimAnalyzer.classifyClaim(null);
  assertEqual(r.type, 'invalid', 'Null should return invalid');

  // Too long
  var longText = 'a'.repeat(60000);
  r = ClaimAnalyzer.classifyClaim(longText);
  assertEqual(r.type, 'too_long', 'Very long text should return too_long');

  // Explanation works
  r = ClaimAnalyzer.classifyClaim('I think this is great.');
  var explanation = ClaimAnalyzer.explainClassification(r);
  assert(explanation.length > 20, 'Explanation should be non-trivial');
  assert(explanation.indexOf('opinion') !== -1 || explanation.indexOf('Opinion') !== -1, 'Opinion explanation should mention opinion');
});

// === Context Gap Detection ===

testSection('Context Gap Detection', function () {
  // Missing time context
  var gaps = ContextDetector.detectGaps('Revenue grew significantly.');
  assert(gaps.some(function (g) { return g.id === 'missing_time_context'; }), 'Grew without time should flag missing_time_context');

  // With time context — should not flag
  gaps = ContextDetector.detectGaps('Revenue grew in 2023 compared to 2022.');
  assert(!gaps.some(function (g) { return g.id === 'missing_time_context'; }), 'Grew with dates should not flag missing_time_context');

  // Missing attribution
  gaps = ContextDetector.detectGaps('Experts say the new policy will be effective.');
  assert(gaps.some(function (g) { return g.id === 'missing_attribution'; }), 'Experts say should flag missing_attribution');

  // With attribution
  gaps = ContextDetector.detectGaps('According to Dr. Smith, the new policy will be effective.');
  assert(!gaps.some(function (g) { return g.id === 'missing_attribution'; }), 'According to Dr. should not flag missing_attribution');

  // Unclear numerical comparison
  gaps = ContextDetector.detectGaps('Sales increased by 30%.');
  assert(gaps.some(function (g) { return g.id === 'unclear_numerical_comparison'; }), '30% increase without baseline should flag');

  // With baseline
  gaps = ContextDetector.detectGaps('Sales increased by 30% from 2022 to 2023.');
  assert(!gaps.some(function (g) { return g.id === 'unclear_numerical_comparison'; }), '30% with from-to should not flag');

  // Broad generalization
  gaps = ContextDetector.detectGaps('Everyone agrees this is always the best approach.');
  assert(gaps.some(function (g) { return g.id === 'broad_generalization'; }), 'Everyone always should flag broad_generalization');

  // Correlation vs causation
  gaps = ContextDetector.detectGaps('The increase in coffee consumption caused the rise in productivity after the new policy.');
  assert(gaps.some(function (g) { return g.id === 'correlation_causation'; }), 'Caused after increase should flag correlation_causation');

  // Missing comparison group
  gaps = ContextDetector.detectGaps('The new drug is more effective.');
  assert(gaps.some(function (g) { return g.id === 'missing_comparison_group'; }), 'More effective without than should flag');

  // Clean passage — no gaps
  gaps = ContextDetector.detectGaps('The sun rises in the east.');
  assertEqual(gaps.length, 0, 'Simple factual statement should have no gaps');

  // Empty
  gaps = ContextDetector.detectGaps('');
  assertEqual(gaps.length, 0, 'Empty text should return no gaps');

  // Each gap has required fields
  gaps = ContextDetector.detectGaps('Everyone knows revenue grew by 50%.');
  gaps.forEach(function (g) {
    assert(g.label && g.whyItMatters && g.questionToAsk && g.suggestedAction, 'Gap should have all required fields: ' + g.id);
  });
});

// === Comparison Engine ===

testSection('Comparison Engine', function () {
  // Identical
  var r = ComparisonEngine.compare('The sky is blue.', 'The sky is blue.');
  assert(r.identical === true, 'Identical passages should be marked identical');

  // Differing numbers
  r = ComparisonEngine.compare('Revenue was $5 million in 2023.', 'Revenue was $7 million in 2023.');
  assert(r.differences.some(function (d) { return d.type === 'numbers'; }), 'Different dollar amounts should flag numbers');

  // Differing dates
  r = ComparisonEngine.compare('The event occurred in January 2023.', 'The event occurred in January 2024.');
  assert(r.differences.some(function (d) { return d.type === 'dates'; }), 'Different years should flag dates');

  // Negation difference
  r = ComparisonEngine.compare('The policy is effective.', 'The policy is not effective.');
  assert(r.differences.some(function (d) { return d.type === 'negation'; }), 'Negation difference should flag');

  // Similar wording — should not automatically be contradiction
  r = ComparisonEngine.compare('The report shows growth in the sector.', 'The report indicates growth in the sector.');
  // These are very similar — should have high overlap and possibly no differences
  assert(r.overlapRatio > 60, 'Similar passages should have high overlap, got: ' + r.overlapRatio);

  // Empty input
  r = ComparisonEngine.compare('', 'Something');
  assert(r.valid === false, 'Empty input should be invalid');

  // Both passages required
  r = ComparisonEngine.compare('Valid text', '');
  assert(r.valid === false, 'One empty passage should be invalid');

  // Geographic difference
  r = ComparisonEngine.compare('Sales rose in the United States.', 'Sales rose in Japan.');
  assert(r.differences.some(function (d) { return d.type === 'geographic'; }), 'Different countries should flag geographic');
});

// === Summary ===

console.log('\n=== Test Summary ===');
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(function (f) { console.log('  - ' + f); });
}
console.log('');
process.exit(failed > 0 ? 1 : 0);
