// ContextShield Popup Logic
// Handles popup interactions, displays page info, and routes actions.

'use strict';

(function () {
  var pageInfo = null;
  var isRestricted = false;

  document.addEventListener('DOMContentLoaded', function () {
    loadPageInfo();
    loadRecentActivity();
    bindActions();
    checkPendingSelection();
  });

  function loadPageInfo() {
    chrome.runtime.sendMessage({ type: 'CONTEXTSHIELD_GET_TAB_INFO' }, function (response) {
      if (response && !response.error) {
        pageInfo = response;
        isRestricted = response.isRestricted;
        displayPageInfo(response);
        updateStatus();
      } else {
        displayPageInfo(null);
        isRestricted = true;
        updateStatus();
      }
    });
  }

  function displayPageInfo(info) {
    var titleEl = document.getElementById('cs-page-title');
    var domainEl = document.getElementById('cs-page-domain');

    if (info && info.title) {
      titleEl.textContent = info.title;
      try {
        var domain = new URL(info.url).hostname;
        domainEl.textContent = domain;
      } catch (e) {
        domainEl.textContent = '';
      }
    } else {
      titleEl.textContent = 'No page available';
      domainEl.textContent = '';
    }
  }

  function updateStatus() {
    var statusEl = document.getElementById('cs-status-content');

    if (isRestricted) {
      statusEl.innerHTML = '<div class="cs-status-warn">This page is restricted (browser-internal or extension page). ContextShield works on regular webpages. Select text on a normal webpage and use the context menu to inspect it.</div>';
      document.getElementById('cs-btn-analyze').disabled = true;
    } else {
      // Check if text is selected
      chrome.runtime.sendMessage({ type: 'CONTEXTSHIELD_CHECK_SELECTION' }, function (response) {
        if (response && response.selection && response.selection.length > 0) {
          statusEl.innerHTML = '<div class="cs-status-info">Text is selected. Click "Inspect Selected Text" to analyze it, or use the right-click context menu.</div>';
          document.getElementById('cs-btn-inspect').classList.add('cs-has-selection');
        } else if (response && response.restricted) {
          statusEl.innerHTML = '<div class="cs-status-warn">Cannot access page content. Try selecting text and using the right-click context menu instead.</div>';
        } else {
          statusEl.innerHTML = '<div class="cs-status-info">Select text on the page, then click "Inspect Selected Text." Or use "Analyze Current Page" for a full page scan.</div>';
        }
      });
    }
  }

  function bindActions() {
    document.getElementById('cs-btn-inspect').addEventListener('click', handleInspect);
    document.getElementById('cs-btn-analyze').addEventListener('click', handleAnalyze);
    document.getElementById('cs-btn-compare').addEventListener('click', function () {
      chrome.tabs.create({ url: chrome.runtime.getURL('workspace.html?mode=compare') });
    });
    document.getElementById('cs-btn-workspace').addEventListener('click', function () {
      chrome.tabs.create({ url: chrome.runtime.getURL('workspace.html') });
    });
    document.getElementById('cs-btn-settings').addEventListener('click', function () {
      chrome.runtime.openOptionsPage();
    });
    document.getElementById('cs-btn-privacy').addEventListener('click', function () {
      chrome.tabs.create({ url: chrome.runtime.getURL('workspace.html?page=privacy') });
    });
    document.getElementById('cs-btn-help').addEventListener('click', function () {
      chrome.tabs.create({ url: chrome.runtime.getURL('workspace.html?page=help') });
    });
  }

  function handleInspect() {
    chrome.runtime.sendMessage({ type: 'CONTEXTSHIELD_CHECK_SELECTION' }, function (response) {
      if (response && response.selection && response.selection.length > 0) {
        var text = response.selection.substring(0, 50000);
        displayInlineAnalysis(text, pageInfo);
      } else {
        // Check pending selection from context menu
        chrome.storage.local.get('pendingSelection', function (result) {
          if (result.pendingSelection && result.pendingSelection.text) {
            displayInlineAnalysis(result.pendingSelection.text, {
              url: result.pendingSelection.sourceUrl,
              title: result.pendingSelection.sourceTitle,
            });
            chrome.storage.local.remove('pendingSelection');
          } else {
            var statusEl = document.getElementById('cs-status-content');
            statusEl.innerHTML = '<div class="cs-status-warn">No text selected. Select a passage on the webpage first, then click "Inspect Selected Text."</div>';
          }
        });
      }
    });
  }

  function handleAnalyze() {
    if (isRestricted) return;
    var statusEl = document.getElementById('cs-status-content');
    statusEl.innerHTML = '<div class="cs-status-info">Analyzing page…</div>';

    chrome.runtime.sendMessage({ type: 'CONTEXTSHIELD_ANALYZE_PAGE' }, function (response) {
      if (response && !response.error) {
        displayPageAnalysis(response);
      } else {
        statusEl.innerHTML = '<div class="cs-status-error">' + (response ? response.error : 'Analysis failed') + '</div>';
      }
    });
  }

  function displayInlineAnalysis(text, sourceInfo) {
    var resultsEl = ensureResultsSection();
    resultsEl.innerHTML = '';

    var classification = ClaimAnalyzer.classifyClaim(text);
    var gaps = ContextDetector.detectGaps(text);

    var passageEl = document.createElement('div');
    passageEl.className = 'cs-result-passage';

    var labelEl = document.createElement('span');
    labelEl.className = 'cs-result-label ' + getLabelClass(classification.type);
    labelEl.textContent = classification.label;
    passageEl.appendChild(labelEl);

    var textEl = document.createElement('div');
    textEl.className = 'cs-result-text';
    textEl.textContent = '"' + text.substring(0, 300) + (text.length > 300 ? '…' : '') + '"';
    passageEl.appendChild(textEl);

    if (gaps.length > 0) {
      gaps.forEach(function (gap) {
        var gapEl = document.createElement('div');
        gapEl.className = 'cs-gap-item';

        var gapLabel = document.createElement('div');
        gapLabel.className = 'cs-gap-label';
        gapLabel.textContent = gap.label;
        gapEl.appendChild(gapLabel);

        var gapQ = document.createElement('div');
        gapQ.className = 'cs-gap-question';
        gapQ.textContent = gap.questionToAsk;
        gapEl.appendChild(gapQ);

        passageEl.appendChild(gapEl);
      });
    } else {
      var noGaps = document.createElement('div');
      noGaps.className = 'cs-no-gaps';
      noGaps.textContent = 'No context-gap patterns detected. This does not mean the claim is verified.';
      passageEl.appendChild(noGaps);
    }

    resultsEl.appendChild(passageEl);

    // Save to history
    StorageManager.addInspection({
      text: text,
      classification: classification,
      gaps: gaps,
      sourceUrl: sourceInfo ? sourceInfo.url : '',
      sourceTitle: sourceInfo ? sourceInfo.title : '',
    });
  }

  function displayPageAnalysis(result) {
    var resultsEl = ensureResultsSection();
    resultsEl.innerHTML = '';

    var summary = document.createElement('div');
    summary.className = 'cs-result-passage';
    summary.innerHTML = '<span class="cs-result-label cs-label-factual">Page Analysis</span>' +
      '<div class="cs-result-text">' +
      'Passages examined: ' + result.passageCount + '<br>' +
      'Potential factual claims: ' + result.factualCount + '<br>' +
      'Numerical statements: ' + result.numericalCount + '<br>' +
      'Context-gap patterns: ' + result.gapCount + '<br>' +
      'Source links found: ' + result.linkCount +
      '</div>';
    resultsEl.appendChild(summary);

    if (result.passages && result.passages.length > 0) {
      result.passages.slice(0, 10).forEach(function (p) {
        var pEl = document.createElement('div');
        pEl.className = 'cs-result-passage';

        var label = document.createElement('span');
        label.className = 'cs-result-label ' + getLabelClass(p.classification.type);
        label.textContent = p.classification.label;
        pEl.appendChild(label);

        var tEl = document.createElement('div');
        tEl.className = 'cs-result-text';
        tEl.textContent = '"' + p.text.substring(0, 200) + (p.text.length > 200 ? '…' : '') + '"';
        pEl.appendChild(tEl);

        if (p.gaps && p.gaps.length > 0) {
          p.gaps.forEach(function (g) {
            var gEl = document.createElement('div');
            gEl.className = 'cs-gap-item';
            gEl.innerHTML = '<div class="cs-gap-label">' + g.label + '</div><div class="cs-gap-question">' + g.questionToAsk + '</div>';
            pEl.appendChild(gEl);
          });
        }

        resultsEl.appendChild(pEl);
      });
    }
  }

  function getLabelClass(type) {
    var classes = {
      factual: 'cs-label-factual',
      opinion: 'cs-label-opinion',
      prediction: 'cs-label-prediction',
      question: 'cs-label-question',
      generalization: 'cs-label-generalization',
      numerical: 'cs-label-numerical',
      instruction: 'cs-label-instruction',
    };
    return classes[type] || 'cs-label-factual';
  }

  function ensureResultsSection() {
    var existing = document.getElementById('cs-inline-results');
    if (existing) return existing;

    var section = document.createElement('section');
    section.className = 'cs-inline-results';
    section.id = 'cs-inline-results';
    document.getElementById('cs-popup').insertBefore(section, document.getElementById('cs-recent-section'));
    return section;
  }

  function loadRecentActivity() {
    StorageManager.getInspections().then(function (inspections) {
      var listEl = document.getElementById('cs-recent-list');
      if (!inspections || inspections.length === 0) {
        listEl.innerHTML = '<div class="cs-recent-empty">No recent inspections</div>';
        return;
      }

      listEl.innerHTML = '';
      inspections.slice(0, 5).forEach(function (insp) {
        var item = document.createElement('div');
        item.className = 'cs-recent-item';

        var label = document.createElement('div');
        label.className = 'cs-recent-item-label';
        label.textContent = insp.classification ? insp.classification.label : 'Inspection';
        item.appendChild(label);

        var text = document.createElement('div');
        text.className = 'cs-recent-item-text';
        text.textContent = insp.text.substring(0, 60) + '…';
        item.appendChild(text);

        var time = document.createElement('div');
        time.className = 'cs-recent-item-time';
        time.textContent = formatTime(insp.timestamp);
        item.appendChild(time);

        listEl.appendChild(item);
      });
    });
  }

  function formatTime(iso) {
    try {
      var d = new Date(iso);
      var now = new Date();
      var diff = (now - d) / 1000;
      if (diff < 60) return 'just now';
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
      return Math.floor(diff / 86400) + 'd ago';
    } catch (e) {
      return '';
    }
  }

  function checkPendingSelection() {
    chrome.storage.local.get('pendingSelection', function (result) {
      if (result.pendingSelection && result.pendingSelection.text) {
        // Clear it — it was meant for popup or workspace
        var age = Date.now() - (result.pendingSelection.timestamp || 0);
        if (age > 30000) {
          chrome.storage.local.remove('pendingSelection');
        }
      }
    });
  }
})();
