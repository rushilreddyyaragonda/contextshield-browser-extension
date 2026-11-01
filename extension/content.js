// ContextShield Content Script
// Runs on webpages. Handles selection capture, page analysis, and in-page annotations.
// Only acts on explicit user requests — never analyzes or transmits automatically.

(function () {
  'use strict';

  // Prevent double-injection
  if (window.__contextShieldInjected) return;
  window.__contextShieldInjected = true;

  var annotationPanel = null;
  var annotationShadow = null;

  // Listen for messages from background/popup
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message || typeof message.type !== 'string') {
      sendResponse({ error: 'Invalid message' });
      return;
    }

    switch (message.type) {
      case 'CONTEXTSHIELD_GET_SELECTION':
        var selection = window.getSelection();
        var text = selection ? selection.toString().trim() : '';
        sendResponse({ selection: text });
        break;

      case 'CONTEXTSHIELD_ANALYZE_SELECTION':
        if (message.text) {
          displayAnnotationPanel(message.text, message.sourceUrl, message.sourceTitle);
          sendResponse({ ok: true });
        } else {
          sendResponse({ error: 'No text provided' });
        }
        break;

      case 'CONTEXTSHIELD_PAGE_ANALYSIS':
        var result = performPageAnalysis();
        sendResponse(result);
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  });

  function performPageAnalysis() {
    // Load analysis libraries — they're injected via manifest's scripts array
    // But content scripts don't automatically get the lib files.
    // We need to inline the analysis here or load them.
    // Since we can't use script tags in MV3 content scripts, we'll use
    // a simplified inline version that communicates via the analysis logic.

    // Check if libraries are available (they're loaded via <script> in popup/workspace,
    // but content scripts run in isolated world — we need our own copy)
    var analyzer = getAnalyzer();
    var detector = getDetector();
    var inspector = getSourceInspector();

    var bodyText = '';
    if (document.body) {
      bodyText = document.body.innerText.substring(0, 100000);
    }

    // Split into sentences
    var sentences = bodyText.split(/(?<=[.!?])\s+/).filter(function (s) {
      return s.trim().length > 15 && s.trim().length < 1000;
    });

    var passageCount = sentences.length;
    var factualCount = 0;
    var numericalCount = 0;
    var gapCount = 0;
    var passages = [];

    for (var i = 0; i < Math.min(sentences.length, 100); i++) {
      var text = sentences[i].trim();
      var classification = analyzer.classifyClaim(text);
      var gaps = detector.detectGaps(text);

      if (classification.type === 'factual') factualCount++;
      if (classification.type === 'numerical') numericalCount++;
      gapCount += gaps.length;

      if (gaps.length > 0 || classification.type === 'numerical' || classification.type === 'generalization') {
        passages.push({
          text: text,
          classification: classification,
          gaps: gaps,
        });
      }
    }

    var sourceInfo = inspector.inspectPage();

    return {
      passageCount: passageCount,
      factualCount: factualCount,
      numericalCount: numericalCount,
      gapCount: gapCount,
      linkCount: sourceInfo ? sourceInfo.linkCount : 0,
      passages: passages.slice(0, 20),
      sourceInfo: sourceInfo,
    };
  }

  function displayAnnotationPanel(text, sourceUrl, sourceTitle) {
    // Check settings for in-page annotations
    chrome.storage.local.get('settings', function (result) {
      var settings = result.settings || {};
      if (settings.inPageAnnotations === false) {
        // If annotations disabled, open workspace instead
        chrome.storage.local.set({
          pendingSelection: {
            text: text,
            sourceUrl: sourceUrl,
            sourceTitle: sourceTitle,
            timestamp: Date.now(),
          },
        }, function () {
          chrome.runtime.sendMessage({ type: 'CONTEXTSHIELD_OPEN_WORKSPACE' });
        });
        return;
      }

      removeAnnotationPanel();
      createAnnotationPanel(text, sourceUrl, sourceTitle);
    });
  }

  function createAnnotationPanel(text, sourceUrl, sourceTitle) {
    var analyzer = getAnalyzer();
    var detector = getDetector();

    var classification = analyzer.classifyClaim(text);
    var gaps = detector.detectGaps(text);

    var host = document.createElement('div');
    host.id = 'contextshield-annotation-host';
    host.style.cssText = 'position:fixed !important; top:20px !important; right:20px !important; z-index:2147483647 !important; width:380px !important; max-height:500px !important; overflow-y:auto !important;';

    annotationShadow = host.attachShadow({ mode: 'closed' });

    var style = document.createElement('style');
    style.textContent = getAnnotationCSS();
    annotationShadow.appendChild(style);

    var panel = document.createElement('div');
    panel.className = 'cs-annot-panel';

    var header = document.createElement('div');
    header.className = 'cs-annot-header';
    header.innerHTML = '<span class="cs-annot-title">ContextShield</span><button class="cs-annot-close" aria-label="Close">×</button>';
    panel.appendChild(header);

    var labelEl = document.createElement('div');
    labelEl.className = 'cs-annot-label cs-label-' + classification.type;
    labelEl.textContent = classification.label;
    panel.appendChild(labelEl);

    var textEl = document.createElement('div');
    textEl.className = 'cs-annot-text';
    textEl.textContent = '"' + text.substring(0, 400) + (text.length > 400 ? '…' : '') + '"';
    panel.appendChild(textEl);

    if (sourceTitle) {
      var srcEl = document.createElement('div');
      srcEl.className = 'cs-annot-source';
      srcEl.textContent = 'Source: ' + sourceTitle;
      panel.appendChild(srcEl);
    }

    if (gaps.length > 0) {
      gaps.forEach(function (gap) {
        var gapEl = document.createElement('div');
        gapEl.className = 'cs-annot-gap';
        gapEl.innerHTML = '<div class="cs-gap-label">' + gap.label + '</div>' +
          '<div class="cs-gap-why">' + gap.whyItMatters + '</div>' +
          '<div class="cs-gap-question">Ask: ' + gap.questionToAsk + '</div>' +
          '<div class="cs-gap-action">Next step: ' + gap.suggestedAction + '</div>';
        panel.appendChild(gapEl);
      });
    } else {
      var noGaps = document.createElement('div');
      noGaps.className = 'cs-annot-nogaps';
      noGaps.textContent = 'No context-gap patterns detected. This does not verify the claim.';
      panel.appendChild(noGaps);
    }

    var explain = document.createElement('div');
    explain.className = 'cs-annot-explain';
    explain.textContent = ClaimAnalyzer.explainClassification(classification);
    panel.appendChild(explain);

    annotationShadow.appendChild(panel);
    host.appendChild(annotationShadow);
    document.body.appendChild(host);
    annotationPanel = host;

    // Close button
    var closeBtn = annotationShadow.querySelector('.cs-annot-close');
    closeBtn.addEventListener('click', removeAnnotationPanel);

    // Save to history
    try {
      var inspection = {
        text: text,
        classification: classification,
        gaps: gaps,
        sourceUrl: sourceUrl,
        sourceTitle: sourceTitle,
      };
      chrome.storage.local.get('settings', function (result) {
        var settings = result.settings || {};
        if (settings.inspectionHistory !== false) {
          chrome.storage.local.get('inspections', function (res) {
            var inspections = res.inspections || [];
            inspections.unshift({
              id: 'insp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
              timestamp: new Date().toISOString(),
              text: text.substring(0, 500),
              classification: classification,
              gaps: gaps,
              notes: '',
              status: 'not_reviewed',
              sourceUrl: sourceUrl || '',
              sourceTitle: sourceTitle || '',
            });
            if (inspections.length > 200) inspections = inspections.slice(0, 200);
            chrome.storage.local.set({ inspections: inspections });
          });
        }
      });
    } catch (e) {
      // Storage save failed — non-critical
    }
  }

  function removeAnnotationPanel() {
    if (annotationPanel && annotationPanel.parentNode) {
      annotationPanel.parentNode.removeChild(annotationPanel);
    }
    annotationPanel = null;
    annotationShadow = null;
  }

  function getAnnotationCSS() {
    return [
      '.cs-annot-panel { background:#f7f4ed; border:1px solid #d4ccb8; border-radius:8px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif; font-size:13px; color:#1a1a1a; box-shadow:0 4px 20px rgba(0,0,0,0.15); }',
      '.cs-annot-header { background:#1e3a5f; color:#f7f4ed; padding:8px 12px; border-radius:7px 7px 0 0; display:flex; justify-content:space-between; align-items:center; }',
      '.cs-annot-title { font-weight:700; font-size:13px; }',
      '.cs-annot-close { background:none; border:none; color:#f7f4ed; font-size:18px; cursor:pointer; padding:0 4px; line-height:1; }',
      '.cs-annot-label { display:inline-block; padding:3px 10px; border-radius:3px; font-size:11px; font-weight:600; margin:10px 12px 6px; }',
      '.cs-label-factual { background:#e3edf6; color:#1e3a5f; }',
      '.cs-label-opinion { background:#fdf0e0; color:#8a5a10; }',
      '.cs-label-prediction { background:#f0e8f5; color:#5a3a7a; }',
      '.cs-label-question { background:#e8f0e8; color:#2a5a2a; }',
      '.cs-label-generalization { background:#fbeae8; color:#8a2a20; }',
      '.cs-label-numerical { background:#e0f0f5; color:#1a5a7a; }',
      '.cs-label-instruction { background:#f5e8e0; color:#7a4a2a; }',
      '.cs-annot-text { padding:0 12px 8px; font-style:italic; color:#4a4238; line-height:1.5; font-size:12px; }',
      '.cs-annot-source { padding:0 12px 6px; font-size:11px; color:#8a7e62; }',
      '.cs-annot-gap { margin:6px 12px; padding:6px 10px; background:#fdf6e8; border-left:3px solid #c4952e; border-radius:2px; }',
      '.cs-gap-label { font-size:11px; font-weight:600; color:#8a5a10; }',
      '.cs-gap-why { font-size:11px; color:#4a4238; margin-top:3px; }',
      '.cs-gap-question { font-size:11px; color:#1e3a5f; margin-top:2px; font-weight:500; }',
      '.cs-gap-action { font-size:10px; color:#6b6256; margin-top:2px; }',
      '.cs-annot-nogaps { padding:4px 12px 8px; font-size:11px; color:#6b6256; }',
      '.cs-annot-explain { padding:8px 12px; border-top:1px solid #e0d9c8; font-size:10px; color:#6b6256; line-height:1.5; border-radius:0 0 7px 7px; }',
    ].join('\n');
  }

  // --- Inline analysis copies for content script isolated world ---

  function getAnalyzer() {
    if (typeof ClaimAnalyzer !== 'undefined') return ClaimAnalyzer;
    // Minimal inline copy
    return {
      classifyClaim: function (text) {
        if (!text || !text.trim()) return { type: 'empty', label: 'Empty input', signals: [] };
        var t = text.trim();
        if (/\?\s*$/.test(t) || /^(what|why|how|when|where|who|which|is|are|was|were|do|does|did|can|could|should|would|will)\b/i.test(t)) return { type: 'question', label: 'Question', signals: ['question_structure'] };
        if (/\b(i\s+think|i\s+believe|personally|should|ought|must|good|bad|great|terrible|unfair|wrong|right)\b/i.test(t)) return { type: 'opinion', label: 'Likely opinion', signals: ['opinion_language'] };
        if (/\b(will|shall|going\s+to|may|might|could\s+become|in\s+the\s+future|soon|eventually)\b/i.test(t)) return { type: 'prediction', label: 'Possible prediction', signals: ['prediction_language'] };
        if (/\b(everyone|everybody|always|never|completely|entirely|absolutely|all\s+people|all\s+experts)\b/i.test(t)) return { type: 'generalization', label: 'Broad generalization', signals: ['absolute_language'] };
        if (/\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:%|percent|billion|million|trillion)\b/i.test(t) || /\b\d+(?:,\d{3})*(?:\.\d+)?\b/.test(t)) return { type: 'numerical', label: 'Numerical assertion', signals: ['numerical_statement'] };
        if (/^(do|don.?t|please|make\s+sure|remember|ensure|verify|check|avoid)\b/i.test(t) || /\byou\s+(should|must|need\s+to)\b/i.test(t)) return { type: 'instruction', label: 'Instruction or directive', signals: ['instruction_language'] };
        return { type: 'factual', label: 'Possible factual claim', signals: ['factual_language'] };
      },
      explainClassification: function (r) {
        var m = {
          factual: 'The passage contains language commonly associated with factual assertions. This does not confirm the claim is true.',
          opinion: 'The passage uses opinion-indicating language. Opinions should not be treated as verifiable facts.',
          prediction: 'The passage uses future-oriented language. Predictions cannot be verified until the predicted event occurs.',
          question: 'The passage is structured as a question. Questions do not make claims but may imply them.',
          instruction: 'The passage reads as a directive. It tells the reader what to do rather than making a verifiable claim.',
          generalization: 'The passage uses absolute language. Broad generalizations are rarely accurate without qualification.',
          numerical: 'The passage contains numerical data. Always check the source, denominator, and measurement method.',
          empty: 'No text was provided for analysis.',
        };
        return m[r.type] || m.factual;
      },
    };
  }

  function getDetector() {
    if (typeof ContextDetector !== 'undefined') return ContextDetector;
    return {
      detectGaps: function (text) {
        if (!text) return [];
        var gaps = [];
        if (/\b(grew|growth|declined|increased|decreased|rose|fell|surged|dropped|doubled)\b/i.test(text) && !/\b(in\s+\d{4}|last\s+year|this\s+year|from\s+\d{4}|over\s+the\s+past|since\s+\d{4})\b/i.test(text)) {
          gaps.push({ id: 'missing_time', label: 'Missing time context', whyItMatters: 'A claim about change is hard to evaluate without a timeframe.', questionToAsk: 'Compared with which time period?', suggestedAction: 'Find the original measurement period.' });
        }
        if (/\b(experts\s+say|scientists\s+say|studies\s+show|research\s+shows|it\s+is\s+said|reports\s+say)\b/i.test(text) && !/\b(according\s+to\s+[A-Z]|Dr\.|Professor)\b/.test(text)) {
          gaps.push({ id: 'missing_attr', label: 'Missing attribution', whyItMatters: 'Vague references do not allow independent verification.', questionToAsk: 'Which experts, and what specific research?', suggestedAction: 'Search for the named study or individual.' });
        }
        if (/\b\d+(?:\.\d+)?\s*(?:%|percent)\b/i.test(text) && /\b(increase|decrease|more|less|higher|lower)\b/i.test(text) && !/\b(from\s+\d|compared|baseline|prior\s+year|previous)\b/i.test(text)) {
          gaps.push({ id: 'unclear_num', label: 'Unclear numerical comparison', whyItMatters: 'A percentage can mean different things depending on the baseline.', questionToAsk: 'Compared with which period or population?', suggestedAction: 'Find the original data and baseline.' });
        }
        if (/\b(everyone|everybody|nobody|always|never|completely|all\s+people)\b/i.test(text)) {
          gaps.push({ id: 'broad_gen', label: 'Broad generalization', whyItMatters: 'Absolute terms are rarely accurate. A single counterexample can invalidate them.', questionToAsk: 'Is there any group or case this does not apply to?', suggestedAction: 'Look for exceptions or qualifiers.' });
        }
        if (/\b(data|statistics|study|research|report|evidence)\b/i.test(text) && !/https?:\/\/|www\.|according\s+to|source:/i.test(text)) {
          gaps.push({ id: 'no_source', label: 'Unclear source trail', whyItMatters: 'A factual claim without a source makes verification difficult.', questionToAsk: 'Where can I find the original source?', suggestedAction: 'Search for the referenced study or dataset.' });
        }
        return gaps;
      },
    };
  }

  function getSourceInspector() {
    if (typeof SourceInspector !== 'undefined') return SourceInspector;
    return {
      inspectPage: function () {
        var links = [];
        var anchors = document.querySelectorAll('a[href]');
        var seen = {};
        for (var i = 0; i < Math.min(anchors.length, 50); i++) {
          var a = anchors[i];
          if (!a.href || a.href.startsWith('javascript:') || seen[a.href]) continue;
          seen[a.href] = true;
          links.push({ url: a.href, text: (a.textContent || '').trim().substring(0, 120) });
        }
        return {
          title: document.title || '',
          url: location.href,
          linkCount: links.length,
          links: links,
        };
      },
    };
  }
})();
