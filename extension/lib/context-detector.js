/**
 * ContextShield Context Gap Detector
 * Identifies patterns that may indicate missing context in a passage.
 * Every finding is a suggestion for investigation, not a verdict.
 */

(function (global) {
  'use strict';

  // --- Gap detection rules ---

  const GAP_RULES = [
    {
      id: 'missing_time_context',
      label: 'Missing time context',
      test: function (text) {
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
      test: function (text) {
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
      test: function (text) {
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
      test: function (text) {
        return /\b(?:everyone|everybody|nobody|no\s+one|all\s+(?:people|experts|scientists|researchers|citizens)|always|never|completely|entirely|absolutely)\b/i.test(text);
      },
      whyItMatters: 'Absolute terms like "everyone," "always," or "never" are rarely accurate. A single counterexample can invalidate a broad generalization.',
      questionToAsk: 'Is there any group or case this does not apply to?',
      suggestedAction: 'Look for exceptions, qualifiers, or evidence that narrows the claim.',
    },
    {
      id: 'unclear_source_trail',
      label: 'Unclear source trail',
      test: function (text) {
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
      test: function (text) {
        const causationTerms = /\b(?:causes?|caused\s+by|leads?\s+to|results?\s+in|due\s+to|because\s+of|responsible\s+for|drives?|driven\s+by|results?\s+from)\b/i;
        const correlationTerms = /\b(?:associated\s+with|linked\s+to|correlates?\s+with|related\s+to|coincided|followed\s+by|accompanied)\b/i;
        const hasTwoEvents = /\b(?:after|when|while|as|since)\b.{0,60}\b(?:increase|decrease|rose|fell|change|shift|surge|drop)\b/i;
        return (causationTerms.test(text) && hasTwoEvents.test(text)) || (correlationTerms.test(text) && causationTerms.test(text));
      },
      whyItMatters: 'Two events occurring together does not mean one caused the other. There may be a third factor, a reverse relationship, or pure coincidence.',
      questionToAsk: 'Is there evidence of a causal mechanism, or only a correlation?',
      suggestedAction: 'Check whether the original study controlled for confounding variables.',
    },
    {
      id: 'missing_comparison_group',
      label: 'Missing comparison group',
      test: function (text) {
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
      test: function (text) {
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

  function detectGaps(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) return [];
    const gaps = [];
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
      } catch (e) {
        // Rule failed — skip silently rather than crash
      }
    }
    return gaps;
  }

  function explainGap(gap) {
    if (!gap) return 'No gap explanation available.';
    return [
      'Observation: ' + gap.label + '.',
      'Why it matters: ' + gap.whyItMatters,
      'Question to ask: ' + gap.questionToAsk,
      'Suggested next step: ' + gap.suggestedAction,
    ].join('\n');
  }

  global.ContextDetector = {
    detectGaps: detectGaps,
    explainGap: explainGap,
    GAP_RULES: GAP_RULES,
  };
})(typeof window !== 'undefined' ? window : this);
