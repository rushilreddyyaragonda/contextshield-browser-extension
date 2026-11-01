/**
 * ContextShield Claim Analyzer
 * Deterministic, rule-based classification of text passages.
 * No external APIs, no AI services — all local.
 */

(function (global) {
  'use strict';

  const MAX_TEXT_LENGTH = 50000;

  // --- Pattern definitions ---

  const OPINION_CUES = [
    /\bi\s+(?:think|believe|feel|reckon|suppose|guess)\b/i,
    /\b(?:personally|in\s+my\s+(?:opinion|view)|honestly|frankly|admittedly)\b/i,
    /\b(?:should|ought\s+to|must)\b.{0,40}\b(?:be|do|have|go|stop|start)\b/i,
    /\b(?:good|bad|great|terrible|wonderful|awful|beautiful|ugly|best|worst)\s+(?:thing|idea|decision|choice|move)\b/i,
    /\b(?:unfair|unjust|wrong|right|immoral|ethical|unethical)\b/i,
    /\b(?:arguably|debatable|controversial|questionable)\b/i,
    /\b(?:love|hate|like|dislike|prefer|enjoy|can'?t\s+stand)\b/i,
    /\bit\s+(?:is|seems|appears)\s+(?:clear|obvious|evident)\s+that\b/i,
  ];

  const PREDICTION_CUES = [
    /\b(?:will|shall|going\s+to|gonna)\b/i,
    /\b(?:is|are|was|were)\s+(?:going\s+to|likely\s+to|expected\s+to|projected\s+to|predicted\s+to|poised\s+to|set\s+to)\b/i,
    /\b(?:may|might|could)\s+(?:become|lead|result|cause|trigger|face|see|experience)\b/i,
    /\b(?:forecast|prediction|outlook|prognosis|trajectory)\b/i,
    /\b(?:in\s+the\s+(?:near\s+)?future|soon|eventually|ultimately|in\s+coming\s+years)\b/i,
  ];

  const QUESTION_CUES = [
    /\?\s*$/,
    /^(?:what|why|how|when|where|who|which|whose|whom|is|are|was|were|do|does|did|can|could|should|would|will|may|might|if)\b/i,
  ];

  const INSTRUCTION_CUES = [
    /^(?:do|don'?t|please|make\s+sure|remember\s+to|always|never|be\s+sure\s+to|ensure|verify|check|avoid|try\s+to)\b/i,
    /\b(?:you\s+should|you\s+must|you\s+need\s+to|you\s+have\s+to|make\s+sure\s+you)\b/i,
    /\b(?:step\s+\d|first[,.]|then[,.]|finally[,.]|next[,.])\b/i,
  ];

  const GENERALIZATION_CUES = [
    /\b(?:everyone|everybody|nobody|no\s+one|nothing|everything|all\s+(?:people|experts|scientists|researchers))\b/i,
    /\b(?:always|never|completely|entirely|absolutely|totally|utterly|perfectly)\b/i,
    /\b(?:all\s+\w+s|every\s+single|each\s+and\s+every|none\s+of)\b/i,
    /\b(?:proven|guaranteed|undoubtedly|without\s+(?:a\s+)?doubt|undeniable|incontestable)\b/i,
  ];

  const NUMERICAL_CUES = [
    /\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:%|percent)\b/i,
    /\b\$?\s?\d+(?:,\d{3})*(?:\.\d+)?\s?(?:billion|million|trillion|thousand)\b/i,
    /\b\d+(?:,\d{3})*(?:\.\d+)?\b/,
    /\b(?:double|triple|quadruple|half|twice|three\s+times)\b/i,
    /\b(?:increase|decrease|rose|fell|grew|declined|dropped|surged|plummeted)\s+by\s+\d/i,
  ];

  const FACTUAL_CUES = [
    /\b(?:according\s+to|reported\s+by|stated\s+by|per|based\s+on)\b/i,
    /\b(?:study|studies|research|report|reports|survey|data|statistics|findings|results)\b/i,
    /\b(?:published|released|announced|found|showed|demonstrated|concluded)\b/i,
    /\b(?:in\s+\d{4}|on\s+\w+\s+\d{1,2})\b/i,
  ];

  // --- Classification logic ---

  function countMatches(text, patterns) {
    let count = 0;
    for (const p of patterns) {
      if (p.test(text)) count++;
    }
    return count;
  }

  function classifyClaim(text) {
    if (!text || typeof text !== 'string') {
      return { type: 'invalid', label: 'No text provided', confidence: 0, signals: [] };
    }
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return { type: 'empty', label: 'Empty input', confidence: 0, signals: [] };
    }
    if (trimmed.length > MAX_TEXT_LENGTH) {
      return { type: 'too_long', label: 'Input exceeds maximum length', confidence: 0, signals: [] };
    }

    const signals = [];
    const scores = {};

    const opinionScore = countMatches(trimmed, OPINION_CUES);
    const predictionScore = countMatches(trimmed, PREDICTION_CUES);
    const questionScore = countMatches(trimmed, QUESTION_CUES);
    const instructionScore = countMatches(trimmed, INSTRUCTION_CUES);
    const generalizationScore = countMatches(trimmed, GENERALIZATION_CUES);
    const numericalScore = countMatches(trimmed, NUMERICAL_CUES);
    const factualScore = countMatches(trimmed, FACTUAL_CUES);

    if (opinionScore > 0) { scores.opinion = opinionScore + 2; signals.push('opinion_language'); }
    if (predictionScore > 0) { scores.prediction = predictionScore + 1; signals.push('prediction_language'); }
    if (questionScore > 0) { scores.question = questionScore + 3; signals.push('question_structure'); }
    if (instructionScore > 0) { scores.instruction = instructionScore + 1; signals.push('instruction_language'); }
    if (generalizationScore > 0) { scores.generalization = generalizationScore + 2; signals.push('absolute_language'); }
    if (numericalScore > 0) { scores.numerical = numericalScore + 1; signals.push('numerical_statement'); }
    if (factualScore > 0) { scores.factual = factualScore + 1; signals.push('factual_language'); }

    // Determine top classification
    let bestType = 'factual';
    let bestScore = scores.factual || 0;

    const scoreEntries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (scoreEntries.length > 0) {
      bestType = scoreEntries[0][0];
      bestScore = scoreEntries[0][1];
    }

    // If no strong signals, default to possible factual
    if (bestScore === 0) {
      bestType = 'factual';
      bestScore = 0;
    }

    const labels = {
      factual: 'Possible factual claim',
      opinion: 'Likely opinion',
      prediction: 'Possible prediction',
      question: 'Question',
      instruction: 'Instruction or directive',
      generalization: 'Broad generalization',
      numerical: 'Numerical assertion',
    };

    return {
      type: bestType,
      label: labels[bestType] || 'Possible factual claim',
      confidence: bestScore,
      signals: signals,
      allScores: scores,
      text: trimmed,
    };
  }

  // --- Extract claims from a block of text ---

  function extractClaims(text) {
    if (!text || typeof text !== 'string') return [];
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
    return sentences.map(s => classifyClaim(s));
  }

  // --- Explain a classification ---

  function explainClassification(result) {
    if (!result || !result.type) return 'No analysis available.';
    const explanations = {
      factual: 'The passage contains language commonly associated with factual assertions, such as references to studies, reports, or specific dates. This does not confirm the claim is true — only that it reads as a factual statement.',
      opinion: 'The passage uses opinion-indicating language (e.g., "I think," "should be," value judgments). Opinions are not inherently wrong, but they should not be treated as verifiable facts.',
      prediction: 'The passage uses future-oriented or speculative language. Predictions cannot be verified until the predicted event occurs or does not.',
      question: 'The passage is structured as a question. Questions do not make claims but may imply them — investigate any implied assertion separately.',
      instruction: 'The passage reads as a directive or instruction. It tells the reader what to do rather than making a verifiable claim about the world.',
      generalization: 'The passage uses absolute or broad language ("everyone," "always," "never"). Such generalizations are rarely accurate without qualification.',
      numerical: 'The passage contains numerical data. Numbers can be precise but misleading — always check the source, denominator, and measurement method.',
      invalid: 'The input could not be analyzed because it was empty or exceeded the maximum supported length.',
      empty: 'No text was provided for analysis.',
      too_long: 'The provided text exceeds the maximum supported length and was not analyzed.',
    };
    return explanations[result.type] || explanations.factual;
  }

  global.ClaimAnalyzer = {
    classifyClaim: classifyClaim,
    extractClaims: extractClaims,
    explainClassification: explainClassification,
    MAX_TEXT_LENGTH: MAX_TEXT_LENGTH,
  };
})(typeof window !== 'undefined' ? window : this);
