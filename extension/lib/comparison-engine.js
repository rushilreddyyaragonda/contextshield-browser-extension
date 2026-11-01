/**
 * ContextShield Comparison Engine
 * Compares two text passages and identifies differences that may warrant investigation.
 * Surface-level text comparison — cannot reliably detect semantic contradictions.
 */

(function (global) {
  'use strict';

  function normalize(text) {
    if (!text || typeof text !== 'string') return '';
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  function extractNumbers(text) {
    if (!text) return [];
    var numbers = [];
    var patterns = [
      /\$?\s?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:billion|million|trillion|thousand|percent|%|bn|m|k)?\b/gi,
      /(\d+(?:\.\d+)?)\s*(?:%|percent)\b/gi,
    ];
    var seen = {};
    for (var p of patterns) {
      var m;
      while ((m = p.exec(text)) !== null) {
        var raw = m[0].trim();
        if (!seen[raw]) {
          seen[raw] = true;
          numbers.push(raw);
        }
      }
    }
    return numbers;
  }

  function extractDates(text) {
    if (!text) return [];
    var dates = [];
    var patterns = [
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
      /\b\d{4}\b/g,
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\b(?:19|20)\d{2}\b/g,
    ];
    var seen = {};
    for (var p of patterns) {
      var m;
      while ((m = p.exec(text)) !== null) {
        if (!seen[m[0]]) {
          seen[m[0]] = true;
          dates.push(m[0]);
        }
      }
    }
    return dates;
  }

  function extractEntities(text) {
    if (!text) return [];
    var entities = [];
    var pattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/g;
    var m;
    var stopWords = ['The', 'This', 'That', 'These', 'Those', 'It', 'They', 'We', 'You', 'He', 'She', 'His', 'Her', 'Their', 'Our', 'My', 'A', 'An'];
    var seen = {};
    while ((m = pattern.exec(text)) !== null) {
      var e = m[0].trim();
      if (stopWords.indexOf(e) === -1 && !seen[e] && e.length > 2) {
        seen[e] = true;
        entities.push(e);
      }
    }
    return entities;
  }

  function extractNegation(text) {
    if (!text) return [];
    var negations = [];
    var pattern = /\b(?:not|no|never|none|nobody|nothing|neither|nor|cannot|can'?t|don'?t|doesn'?t|didn'?t|won'?t|isn'?t|aren'?t|wasn'?t|weren'?t|hasn'?t|haven'?t|hadn'?t|shouldn'?t|wouldn'?t|couldn'?t)\b/gi;
    var m;
    while ((m = pattern.exec(text)) !== null) {
      negations.push(m[0]);
    }
    return negations;
  }

  function extractQuantifiers(text) {
    if (!text) return [];
    var quantifiers = [];
    var pattern = /\b(?:all|some|many|few|most|several|none|every|each|both|half|majority|minority)\b/gi;
    var m;
    while ((m = pattern.exec(text)) !== null) {
      quantifiers.push(m[0]);
    }
    return quantifiers;
  }

  function extractGeographic(text) {
    if (!text) return [];
    var geoTerms = /\b(?:United\s+States|USA|U\.S\.|UK|U\.K\.|Britain|Europe|European\s+Union|EU|Asia|Africa|China|Japan|India|Russia|Germany|France|Canada|Australia|Brazil|Mexico|Korea|Middle\s+East|Africa|South\s+America|North\s+America|Pacific|Atlantic)\b/gi;
    var results = [];
    var m;
    var seen = {};
    while ((m = geoTerms.exec(text)) !== null) {
      if (!seen[m[0]]) {
        seen[m[0]] = true;
        results.push(m[0]);
      }
    }
    return results;
  }

  function tokenize(text) {
    return normalize(text).split(/\s+/).filter(function (t) { return t.length > 2; });
  }

  function sharedTokens(tokensA, tokensB) {
    var setB = {};
    for (var i = 0; i < tokensB.length; i++) setB[tokensB[i]] = true;
    var shared = [];
    var seen = {};
    for (var j = 0; j < tokensA.length; j++) {
      if (setB[tokensA[j]] && !seen[tokensA[j]]) {
        seen[tokensA[j]] = true;
        shared.push(tokensA[j]);
      }
    }
    return shared;
  }

  function uniqueTokens(tokensA, tokensB) {
    var setB = {};
    for (var i = 0; i < tokensB.length; i++) setB[tokensB[i]] = true;
    var unique = [];
    var seen = {};
    for (var j = 0; j < tokensA.length; j++) {
      if (!setB[tokensA[j]] && !seen[tokensA[j]]) {
        seen[tokensA[j]] = true;
        unique.push(tokensA[j]);
      }
    }
    return unique;
  }

  function compare(textA, textB) {
    if (!textA || !textB || textA.trim().length === 0 || textB.trim().length === 0) {
      return { valid: false, differences: [], summary: 'Both passages must contain text.' };
    }

    var normA = normalize(textA);
    var normB = normalize(textB);
    var differences = [];

    // Identical check
    if (normA === normB) {
      return {
        valid: true,
        identical: true,
        differences: [],
        summary: 'The two passages are identical after normalization.',
      };
    }

    // Numbers
    var numsA = extractNumbers(textA);
    var numsB = extractNumbers(textB);
    var numSetB = {};
    for (var i = 0; i < numsB.length; i++) numSetB[numsB[i]] = true;
    var numSetA = {};
    for (var j = 0; j < numsA.length; j++) numSetA[numsA[j]] = true;
    var differingNumbers = numsA.filter(function (n) { return !numSetB[n]; });
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
    var datesA = extractDates(textA);
    var datesB = extractDates(textB);
    var dateSetB = {};
    for (var d = 0; d < datesB.length; d++) dateSetB[datesB[d]] = true;
    var differingDates = datesA.filter(function (dt) { return !dateSetB[dt]; });
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

    // Named entities
    var entA = extractEntities(textA);
    var entB = extractEntities(textB);
    var entSetB = {};
    for (var e = 0; e < entB.length; e++) entSetB[entB[e]] = true;
    var uniqueEntA = entA.filter(function (en) { return !entSetB[en]; });
    if (uniqueEntA.length > 0) {
      differences.push({
        type: 'entities',
        label: 'Different named entities',
        detailA: uniqueEntA.join(', ') || '(none)',
        detailB: entB.filter(function (en) {
          var setA = {}; entA.forEach(function (x) { setA[x] = true; });
          return !setA[en];
        }).join(', ') || '(none)',
        whyItMatters: 'Different people, organizations, or places may indicate the passages discuss different subjects or different aspects of a subject.',
        investigate: 'Confirm whether the entities refer to the same subjects.',
      });
    }

    // Negation
    var negA = extractNegation(textA);
    var negB = extractNegation(textB);
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

    // Geographic
    var geoA = extractGeographic(textA);
    var geoB = extractGeographic(textB);
    var geoSetB = {};
    geoB.forEach(function (g) { geoSetB[g] = true; });
    var uniqueGeo = geoA.filter(function (g) { return !geoSetB[g]; });
    if (uniqueGeo.length > 0) {
      differences.push({
        type: 'geographic',
        label: 'Different geographic references',
        detailA: geoA.join(', ') || '(none)',
        detailB: geoB.join(', ') || '(none)',
        whyItMatters: 'Different locations may indicate the passages refer to different regions, which can produce different statistics or outcomes.',
        investigate: 'Check whether the claims apply to the same geographic area.',
      });
    }

    // Quantifiers
    var quantA = extractQuantifiers(textA);
    var quantB = extractQuantifiers(textB);
    var quantSetB = {};
    quantB.forEach(function (q) { quantSetB[q] = true; });
    var uniqueQuant = quantA.filter(function (q) { return !quantSetB[q]; });
    if (uniqueQuant.length > 0) {
      differences.push({
        type: 'quantifiers',
        label: 'Different qualifiers or quantifiers',
        detailA: quantA.join(', ') || '(none)',
        detailB: quantB.join(', ') || '(none)',
        whyItMatters: 'Words like "all," "some," or "most" significantly change the scope of a claim.',
        investigate: 'Check whether the two passages make claims of different scope.',
      });
    }

    // Token overlap
    var tokensA = tokenize(textA);
    var tokensB = tokenize(textB);
    var shared = sharedTokens(tokensA, tokensB);
    var uniqueA = uniqueTokens(tokensA, tokensB);
    var uniqueB = uniqueTokens(tokensB, tokensA);
    var overlapRatio = tokensA.length + tokensB.length > 0
      ? Math.round((shared.length / Math.max(tokensA.length, tokensB.length)) * 100)
      : 0;

    if (differences.length === 0 && overlapRatio < 50) {
      differences.push({
        type: 'wording',
        label: 'Substantially different wording',
        detailA: uniqueA.slice(0, 10).join(', ') || '(none)',
        detailB: uniqueB.slice(0, 10).join(', ') || '(none)',
        whyItMatters: 'The passages use very different language. This does not automatically mean they contradict each other — they may simply describe different aspects of a topic.',
        investigate: 'Read both passages in full context before concluding they conflict.',
      });
    }

    return {
      valid: true,
      identical: false,
      differences: differences,
      overlapRatio: overlapRatio,
      sharedTokens: shared.slice(0, 15),
      uniqueTokensA: uniqueA.slice(0, 10),
      uniqueTokensB: uniqueB.slice(0, 10),
      summary: differences.length + ' difference' + (differences.length === 1 ? '' : 's') + ' detected. ' +
        'Token overlap: ' + overlapRatio + '%. ' +
        'Surface-level comparison cannot reliably identify semantic contradictions.',
    };
  }

  global.ComparisonEngine = {
    compare: compare,
    extractNumbers: extractNumbers,
    extractDates: extractDates,
    extractEntities: extractEntities,
  };
})(typeof window !== 'undefined' ? window : this);
