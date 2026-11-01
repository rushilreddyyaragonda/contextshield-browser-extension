/**
 * ContextShield Analysis Engine (TypeScript)
 * Portal-side mirror of the extension's rule-based analysis logic.
 * Deterministic, local, no external APIs.
 */

export type ClaimType =
  | 'factual'
  | 'opinion'
  | 'prediction'
  | 'question'
  | 'instruction'
  | 'generalization'
  | 'numerical'
  | 'empty'
  | 'too_long'
  | 'invalid';

export interface ClassificationResult {
  type: ClaimType;
  label: string;
  confidence: number;
  signals: string[];
  text: string;
}

export interface ContextGap {
  id: string;
  label: string;
  whyItMatters: string;
  questionToAsk: string;
  suggestedAction: string;
}

const MAX_TEXT_LENGTH = 50000;

const OPINION_CUES: RegExp[] = [
  /\bi\s+(?:think|believe|feel|reckon|suppose|guess)\b/i,
  /\b(?:personally|in\s+my\s+(?:opinion|view)|honestly|frankly|admittedly)\b/i,
  /\b(?:should|ought\s+to|must)\b.{0,40}\b(?:be|do|have|go|stop|start)\b/i,
  /\b(?:good|bad|great|terrible|wonderful|awful|beautiful|ugly|best|worst)\s+(?:thing|idea|decision|choice|move)\b/i,
  /\b(?:unfair|unjust|wrong|right|immoral|ethical|unethical)\b/i,
  /\b(?:arguably|debatable|controversial|questionable)\b/i,
  /\b(?:love|hate|like|dislike|prefer|enjoy|can'?t\s+stand)\b/i,
  /\bit\s+(?:is|seems|appears)\s+(?:clear|obvious|evident)\s+that\b/i,
];

const PREDICTION_CUES: RegExp[] = [
  /\b(?:will|shall|going\s+to|gonna)\b/i,
  /\b(?:is|are|was|were)\s+(?:going\s+to|likely\s+to|expected\s+to|projected\s+to|predicted\s+to|poised\s+to|set\s+to)\b/i,
  /\b(?:may|might|could)\s+(?:become|lead|result|cause|trigger|face|see|experience)\b/i,
  /\b(?:forecast|prediction|outlook|prognosis|trajectory)\b/i,
  /\b(?:in\s+the\s+(?:near\s+)?future|soon|eventually|ultimately|in\s+coming\s+years)\b/i,
];

const QUESTION_CUES: RegExp[] = [
  /\?\s*$/,
  /^(?:what|why|how|when|where|who|which|whose|whom|is|are|was|were|do|does|did|can|could|should|would|will|may|might|if)\b/i,
];

const INSTRUCTION_CUES: RegExp[] = [
  /^(?:do|don'?t|please|make\s+sure|remember\s+to|always|never|be\s+sure\s+to|ensure|verify|check|avoid|try\s+to)\b/i,
  /\b(?:you\s+should|you\s+must|you\s+need\s+to|you\s+have\s+to|make\s+sure\s+you)\b/i,
  /\b(?:step\s+\d|first[,.]|then[,.]|finally[,.]|next[,.])\b/i,
];

const GENERALIZATION_CUES: RegExp[] = [
  /\b(?:everyone|everybody|nobody|no\s+one|nothing|everything|all\s+(?:people|experts|scientists|researchers))\b/i,
  /\b(?:always|never|completely|entirely|absolutely|totally|utterly|perfectly)\b/i,
  /\b(?:all\s+\w+s|every\s+single|each\s+and\s+every|none\s+of)\b/i,
  /\b(?:proven|guaranteed|undoubtedly|without\s+(?:a\s+)?doubt|undeniable|incontestable)\b/i,
];

const NUMERICAL_CUES: RegExp[] = [
  /\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:%|percent)\b/i,
  /\$?\s?\d+(?:,\d{3})*(?:\.\d+)?\s?(?:billion|million|trillion|thousand)\b/i,
  /\b\d+(?:,\d{3})*(?:\.\d+)?\b/,
  /\b(?:double|triple|quadruple|half|twice|three\s+times)\b/i,
  /\b(?:increase|decrease|rose|fell|grew|declined|dropped|surged|plummeted)\s+by\s+\d/i,
];

const FACTUAL_CUES: RegExp[] = [
  /\b(?:according\s+to|reported\s+by|stated\s+by|per|based\s+on)\b/i,
  /\b(?:study|studies|research|report|reports|survey|data|statistics|findings|results)\b/i,
  /\b(?:published|released|announced|found|showed|demonstrated|concluded)\b/i,
  /\b(?:in\s+\d{4}|on\s+\w+\s+\d{1,2})\b/i,
];

function countMatches(text: string, patterns: RegExp[]): number {
  let count = 0;
  for (const p of patterns) {
    if (p.test(text)) count++;
  }
  return count;
}

export function classifyClaim(text: string): ClassificationResult {
  if (!text || typeof text !== 'string') {
    return { type: 'invalid', label: 'No text provided', confidence: 0, signals: [], text: '' };
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { type: 'empty', label: 'Empty input', confidence: 0, signals: [], text: '' };
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    return { type: 'too_long', label: 'Input exceeds maximum length', confidence: 0, signals: [], text: '' };
  }

  const signals: string[] = [];
  const scores: Record<string, number> = {};

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

  const scoreEntries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  let bestType: ClaimType = 'factual';
  let bestScore = 0;

  if (scoreEntries.length > 0) {
    bestType = scoreEntries[0][0] as ClaimType;
    bestScore = scoreEntries[0][1];
  }

  const labels: Record<string, string> = {
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
    signals,
    text: trimmed,
  };
}

export function explainClassification(result: ClassificationResult): string {
  const explanations: Record<string, string> = {
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

// --- Context Gap Detection ---

interface GapRule {
  id: string;
  label: string;
  test: (text: string) => boolean;
  whyItMatters: string;
  questionToAsk: string;
  suggestedAction: string;
}

const GAP_RULES: GapRule[] = [
  {
    id: 'missing_time_context',
    label: 'Missing time context',
    test: (text) => {
      const changeTerms = /\b(?:grew|growth|declined|decline|increased|increase|decreased|decrease|rose|fell|surged|dropped|doubled|tripled|halved|skyrocketed|plummeted|soared)\b/i;
      const timeTerms = /\b(?:in\s+\d{4}|last\s+(?:year|month|quarter|week|decade)|this\s+(?:year|month|quarter)|from\s+\d{4}\s+to\s+\d{4}|between\s+\d{4}\s+and\s+\d{4}|over\s+the\s+(?:past|last)\s+\w+|since\s+\d{4}|in\s+the\s+(?:past|last)\s+\w+)\b/i;
      return changeTerms.test(text) && !timeTerms.test(text);
    },
    whyItMatters: 'A claim about growth, decline, or change is difficult to evaluate without knowing the timeframe. The same trend can look very different over a month versus a decade.',
    questionToAsk: 'Compared with which time period?',
    suggestedAction: 'Look for the original report and identify the exact measurement period.',
  },
  {
    id: 'missing_attribution',
    label: 'Missing attribution',
    test: (text) => {
      const vagueSources = /\b(?:experts(?:\s+say)?|scientists(?:\s+say)?|researchers(?:\s+say)?|studies\s+(?:show|suggest|indicate|find)|reports\s+(?:say|suggest|indicate)|officials(?:\s+say)?|sources\s+(?:say|claim)|people\s+(?:say|think|believe)|many\s+(?:believe|think|say)|it\s+(?:is|has\s+been)\s+(?:said|reported|claimed|argued|suggested))\b/i;
      const specificSources = /\b(?:according\s+to\s+[A-Z]|per\s+[A-Z]|stated\s+by\s+[A-Z]|Dr\.|Professor|by\s+(?:the\s+)?[A-Z][a-z]+\s+[A-Z])\b/;
      return vagueSources.test(text) && !specificSources.test(text);
    },
    whyItMatters: 'Vague references like "experts say" or "studies show" do not allow readers to verify the claim independently. The credibility of a claim depends on who made it and how.',
    questionToAsk: 'Which experts, and what specific research?',
    suggestedAction: 'Search for the named study, institution, or individual behind the claim.',
  },
  {
    id: 'unclear_numerical_comparison',
    label: 'Unclear numerical comparison',
    test: (text) => {
      const hasPercentage = /\b\d+(?:\.\d+)?\s*(?:%|percent)\b/i;
      const hasBaseline = /\b(?:from\s+\d|compared\s+(?:to|with)|baseline|prior\s+(?:year|period)|previous\s+(?:year|period|quarter|month)|up\s+from|down\s+from|versus|vs\.?)\b/i;
      const hasChangeWord = /\b(?:increase|decrease|more|less|higher|lower|greater|fewer|up|down|rise|fall|growth|decline)\b/i;
      return hasPercentage.test(text) && hasChangeWord.test(text) && !hasBaseline.test(text);
    },
    whyItMatters: 'A percentage increase or decrease can mean very different things depending on the baseline, denominator, population, and measurement period.',
    questionToAsk: 'Compared with which period or population?',
    suggestedAction: 'Find the original data source and identify the baseline used for the comparison.',
  },
  {
    id: 'broad_generalization',
    label: 'Broad generalization',
    test: (text) => /\b(?:everyone|everybody|nobody|no\s+one|all\s+(?:people|experts|scientists|researchers|citizens)|always|never|completely|entirely|absolutely)\b/i.test(text),
    whyItMatters: 'Absolute terms like "everyone," "always," or "never" are rarely accurate. A single counterexample can invalidate a broad generalization.',
    questionToAsk: 'Is there any group or case this does not apply to?',
    suggestedAction: 'Look for exceptions, qualifiers, or evidence that narrows the claim.',
  },
  {
    id: 'unclear_source_trail',
    label: 'Unclear source trail',
    test: (text) => {
      const hasFactualCue = /\b(?:data|statistics|study|studies|research|report|evidence|findings|results|analysis)\b/i;
      const hasSourceRef = /\b(?:according\s+to|source:|cited|referenced|link|url|http|www\.|et\s+al\.|doi)\b/i;
      const hasLink = /https?:\/\/|www\./i;
      return hasFactualCue.test(text) && !hasSourceRef.test(text) && !hasLink.test(text);
    },
    whyItMatters: 'A factual claim that references data or research without a source link or citation makes independent verification difficult.',
    questionToAsk: 'Where can I find the original source?',
    suggestedAction: 'Search for the referenced study or dataset by title and author.',
  },
  {
    id: 'correlation_causation',
    label: 'Possible correlation presented as causation',
    test: (text) => {
      const causationTerms = /\b(?:causes?|caused\s+by|leads?\s+to|results?\s+in|due\s+to|because\s+of|responsible\s+for|drives?|driven\s+by|results?\s+from)\b/i;
      const hasTwoEvents = /\b(?:after|when|while|as|since)\b.{0,60}\b(?:increase|decrease|rose|fell|change|shift|surge|drop)\b/i;
      const correlationTerms = /\b(?:associated\s+with|linked\s+to|correlates?\s+with|related\s+to|coincided|followed\s+by|accompanied)\b/i;
      return (causationTerms.test(text) && hasTwoEvents.test(text)) || (correlationTerms.test(text) && causationTerms.test(text));
    },
    whyItMatters: 'Two events occurring together does not mean one caused the other. There may be a third factor, a reverse relationship, or pure coincidence.',
    questionToAsk: 'Is there evidence of a causal mechanism, or only a correlation?',
    suggestedAction: 'Check whether the original study controlled for confounding variables.',
  },
  {
    id: 'missing_comparison_group',
    label: 'Missing comparison group',
    test: (text) => {
      const comparativeWords = /\b(?:higher|lower|better|worse|more|less|greater|fewer|above|below|superior|inferior|outperform|underperform)\b/i;
      const hasComparison = /\b(?:than|compared\s+(?:to|with)|relative\s+to|versus|vs\.?|as\s+(?:opposed\s+to|against))\b/i;
      return comparativeWords.test(text) && !hasComparison.test(text);
    },
    whyItMatters: 'Comparative terms like "higher" or "better" are meaningless without knowing what something is being compared to.',
    questionToAsk: 'Higher or better than what?',
    suggestedAction: 'Identify the comparison group or baseline the claim is measured against.',
  },
  {
    id: 'potentially_outdated',
    label: 'Potentially outdated information',
    test: (text) => {
      const recentTerms = /\b(?:recently|latest|new|current|now|today|this\s+year|modern)\b/i;
      const hasOldDate = /\b(?:19[5-9]\d|20[0-1]\d|20[2-3]\d)\b/;
      const recentDate = /\b20(?:2[3-9]|3\d)\b/;
      return recentTerms.test(text) && hasOldDate.test(text) && !recentDate.test(text);
    },
    whyItMatters: 'Claims referencing "recent" data alongside an older date may rely on information that is no longer current.',
    questionToAsk: 'Is this information still current, or has newer data been published?',
    suggestedAction: 'Search for updated reports or more recent data on the same topic.',
  },
];

export function detectGaps(text: string): ContextGap[] {
  if (!text || typeof text !== 'string' || text.trim().length === 0) return [];
  const gaps: ContextGap[] = [];
  for (const rule of GAP_RULES) {
    try {
      if (rule.test(text)) {
        gaps.push({
          id: rule.id,
          label: rule.label,
          whyItMatters: rule.whyItMatters,
          questionToAsk: rule.questionToAsk,
          suggestedAction: rule.suggestedAction,
        });
      }
    } catch {
      // skip failed rules
    }
  }
  return gaps;
}

// --- Demo article data ---

export interface DemoPassage {
  id: string;
  text: string;
  context: string;
}

export const DEMO_ARTICLE: DemoPassage[] = [
  {
    id: 'p1',
    text: 'A recent study by researchers at a major university found that daily exercise can improve cognitive performance by 35%.',
    context: 'Paragraph 1 — Lead claim',
  },
  {
    id: 'p2',
    text: 'Experts agree that this is the most important health discovery of the decade.',
    context: 'Paragraph 2 — Expert consensus claim',
  },
  {
    id: 'p3',
    text: 'I think everyone should start exercising immediately if they want to stay sharp.',
    context: 'Paragraph 3 — Opinion',
  },
  {
    id: 'p4',
    text: 'The researchers observed 200 participants over a six-month period, comparing a treatment group with a control group.',
    context: 'Paragraph 4 — Methodology',
  },
  {
    id: 'p5',
    text: 'Sales of fitness equipment surged after the report was released.',
    context: 'Paragraph 5 — Correlation claim',
  },
  {
    id: 'p6',
    text: 'The study will likely change how doctors recommend exercise to their patients in the coming years.',
    context: 'Paragraph 6 — Prediction',
  },
  {
    id: 'p7',
    text: 'According to Dr. Tanaka, the lead researcher, "The results are promising but preliminary. More research is needed."',
    context: 'Paragraph 7 — Attributed quote',
  },
];

// --- Comparison Engine (TypeScript) ---

export interface ComparisonDifference {
  type: string;
  label: string;
  detailA: string;
  detailB: string;
  whyItMatters: string;
  investigate: string;
}

export interface ComparisonResult {
  valid: boolean;
  identical: boolean;
  differences: ComparisonDifference[];
  overlapRatio: number;
  summary: string;
}

export function comparePassages(textA: string, textB: string): ComparisonResult {
  if (!textA || !textB || textA.trim().length === 0 || textB.trim().length === 0) {
    return { valid: false, identical: false, differences: [], overlapRatio: 0, summary: 'Both passages must contain text.' };
  }

  const normA = textA.toLowerCase().trim().replace(/\s+/g, ' ');
  const normB = textB.toLowerCase().trim().replace(/\s+/g, ' ');

  if (normA === normB) {
    return { valid: true, identical: true, differences: [], overlapRatio: 100, summary: 'The two passages are identical after normalization.' };
  }

  const differences: ComparisonDifference[] = [];

  // Numbers
  const numsA = extractNumbers(textA);
  const numsB = extractNumbers(textB);
  const numSetB = new Set(numsB);
  const differingNumbers = numsA.filter(n => !numSetB.has(n));
  if (differingNumbers.length > 0) {
    differences.push({
      type: 'numbers',
      label: 'Differing numbers or quantities',
      detailA: numsA.join(', ') || '(none)',
      detailB: numsB.join(', ') || '(none)',
      whyItMatters: 'Different numbers in two passages about the same topic may indicate different sources, timeframes, or measurement methods.',
      investigate: 'Check whether the two passages refer to the same measurement period, population, and units.',
    });
  }

  // Dates
  const datesA = extractDates(textA);
  const datesB = extractDates(textB);
  const dateSetB = new Set(datesB);
  const differingDates = datesA.filter(d => !dateSetB.has(d));
  if (differingDates.length > 0) {
    differences.push({
      type: 'dates',
      label: 'Differing dates or time periods',
      detailA: datesA.join(', ') || '(none)',
      detailB: datesB.join(', ') || '(none)',
      whyItMatters: 'Different dates may indicate the passages refer to different events, or the same event described at different times.',
      investigate: 'Verify whether the dates refer to the same event or different events.',
    });
  }

  // Negation
  const negA = extractNegation(textA);
  const negB = extractNegation(textB);
  if (negA.length !== negB.length) {
    differences.push({
      type: 'negation',
      label: 'Differing negation or polarity',
      detailA: negA.join(', ') || '(none)',
      detailB: negB.join(', ') || '(none)',
      whyItMatters: 'One passage may assert something while the other denies it. Negation differences can reverse the meaning of a claim.',
      investigate: 'Determine whether the passages make opposite claims about the same subject.',
    });
  }

  // Token overlap
  const tokensA = normA.split(/\s+/).filter(t => t.length > 2);
  const tokensB = normB.split(/\s+/).filter(t => t.length > 2);
  const setB = new Set(tokensB);
  const shared = tokensA.filter(t => setB.has(t));
  const overlapRatio = tokensA.length + tokensB.length > 0
    ? Math.round((shared.length / Math.max(tokensA.length, tokensB.length)) * 100)
    : 0;

  if (differences.length === 0 && overlapRatio < 50) {
    differences.push({
      type: 'wording',
      label: 'Substantially different wording',
      detailA: tokensA.slice(0, 10).join(', ') || '(none)',
      detailB: tokensB.slice(0, 10).join(', ') || '(none)',
      whyItMatters: 'The passages use very different language. This does not automatically mean they contradict each other.',
      investigate: 'Read both passages in full context before concluding they conflict.',
    });
  }

  return {
    valid: true,
    identical: false,
    differences,
    overlapRatio,
    summary: differences.length + ' difference' + (differences.length === 1 ? '' : 's') + ' detected. Token overlap: ' + overlapRatio + '%. Surface-level comparison cannot reliably identify semantic contradictions.',
  };
}

function extractNumbers(text: string): string[] {
  const numbers: string[] = [];
  const seen = new Set<string>();
  const patterns = [
    /\$?\s?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:billion|million|trillion|thousand|percent|%|bn|m|k)?\b/gi,
  ];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(text)) !== null) {
      const raw = m[0].trim();
      if (!seen.has(raw)) {
        seen.add(raw);
        numbers.push(raw);
      }
    }
  }
  return numbers;
}

function extractDates(text: string): string[] {
  const dates: string[] = [];
  const seen = new Set<string>();
  const patterns = [
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    /\b\d{4}\b/g,
  ];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(text)) !== null) {
      if (!seen.has(m[0])) {
        seen.add(m[0]);
        dates.push(m[0]);
      }
    }
  }
  return dates;
}

function extractNegation(text: string): string[] {
  const negations: string[] = [];
  const pattern = /\b(?:not|no|never|none|nobody|nothing|neither|nor|cannot|can'?t|don'?t|doesn'?t|didn'?t|won'?t|isn'?t|aren'?t|wasn'?t|weren'?t|hasn'?t|haven'?t|hadn'?t|shouldn'?t|wouldn'?t|couldn'?t)\b/gi;
  let m;
  while ((m = pattern.exec(text)) !== null) {
    negations.push(m[0]);
  }
  return negations;
}
