// ContextShield Workspace Logic
// Full research workspace: inspect, compare, sources, notes, history, export.

'use strict';

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    initInspect();
    initCompare();
    initSources();
    initNotes();
    initHistory();
    initExport();
    initNavActions();

    // Check URL params for mode
    var params = new URLSearchParams(location.search);
    var mode = params.get('mode');
    if (mode === 'compare') switchTab('compare');
    if (mode === 'selection') {
      switchTab('inspect');
      chrome.storage.local.get('pendingSelection', function (result) {
        if (result.pendingSelection && result.pendingSelection.text) {
          document.getElementById('ws-inspect-input').value = result.pendingSelection.text;
          if (result.pendingSelection.sourceUrl) {
            document.getElementById('ws-source-url').value = result.pendingSelection.sourceUrl;
          }
          runInspect();
          chrome.storage.local.remove('pendingSelection');
        }
      });
    }
  });

  function initTabs() {
    var tabs = document.querySelectorAll('.ws-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        switchTab(tab.dataset.tab);
      });
    });
  }

  function switchTab(name) {
    document.querySelectorAll('.ws-tab').forEach(function (t) { t.classList.remove('active'); });
    document.querySelectorAll('.ws-tab-content').forEach(function (c) { c.classList.remove('active'); });
    var tab = document.querySelector('.ws-tab[data-tab="' + name + '"]');
    var content = document.getElementById('ws-tab-' + name);
    if (tab) tab.classList.add('active');
    if (content) content.classList.add('active');
  }

  // --- Inspect ---

  function initInspect() {
    document.getElementById('ws-inspect-run').addEventListener('click', runInspect);
    document.getElementById('ws-inspect-clear').addEventListener('click', function () {
      document.getElementById('ws-inspect-input').value = '';
      document.getElementById('ws-source-url').value = '';
      document.getElementById('ws-inspect-results').innerHTML = '<div class="ws-empty-state">Results will appear here after analysis.</div>';
    });
  }

  function runInspect() {
    var text = document.getElementById('ws-inspect-input').value.trim();
    var sourceUrl = document.getElementById('ws-source-url').value.trim();
    var resultsEl = document.getElementById('ws-inspect-results');

    if (!text) {
      resultsEl.innerHTML = '<div class="ws-empty-state">Enter a passage to analyze.</div>';
      return;
    }

    var classification = ClaimAnalyzer.classifyClaim(text);
    var gaps = ContextDetector.detectGaps(text);
    var explanation = ClaimAnalyzer.explainClassification(classification);

    var html = '<div class="ws-result-card">';
    html += '<span class="ws-result-label ws-label-' + classification.type + '">' + classification.label + '</span>';
    html += '<div class="ws-result-text">' + escapeHtml(text.substring(0, 2000)) + '</div>';

    if (gaps.length > 0) {
      html += '<div class="ws-gap-list">';
      gaps.forEach(function (gap) {
        html += '<div class="ws-gap-card">';
        html += '<div class="ws-gap-card-label">' + escapeHtml(gap.label) + '</div>';
        html += '<div class="ws-gap-card-why">' + escapeHtml(gap.whyItMatters) + '</div>';
        html += '<div class="ws-gap-card-question">Ask: ' + escapeHtml(gap.questionToAsk) + '</div>';
        html += '<div class="ws-gap-card-action">Next step: ' + escapeHtml(gap.suggestedAction) + '</div>';
        html += '</div>';
      });
      html += '</div>';
    } else {
      html += '<div class="ws-no-gaps">No context-gap patterns detected by the current rules. This does not mean the claim is verified or accurate.</div>';
    }

    html += '<div class="ws-explain-box"><strong>Why this classification:</strong> ' + escapeHtml(explanation) + '</div>';

    // Status selector
    html += '<div class="ws-status-row">';
    html += '<label>Your assessment:</label>';
    html += '<select class="ws-status-select" id="ws-status-select">';
    html += '<option value="not_reviewed">Not reviewed</option>';
    html += '<option value="needs_evidence">Needs evidence</option>';
    html += '<option value="evidence_located">Evidence located</option>';
    html += '<option value="partially_supported">Partially supported</option>';
    html += '<option value="conflicting_evidence">Conflicting evidence found</option>';
    html += '<option value="unresolved">Unresolved</option>';
    html += '</select>';
    html += '<button class="ws-save-note-btn" id="ws-save-inspection">Save</button>';
    html += '</div>';
    html += '</div>';

    resultsEl.innerHTML = html;

    // Save inspection
    document.getElementById('ws-save-inspection').addEventListener('click', function () {
      var status = document.getElementById('ws-status-select').value;
      StorageManager.addInspection({
        text: text,
        classification: classification,
        gaps: gaps,
        status: status,
        sourceUrl: sourceUrl,
      }).then(function (record) {
        if (record) {
          this.textContent = 'Saved';
          setTimeout(function () { }, 1500);
        } else {
          alert('Inspection history is disabled. Enable it in Settings to save inspections.');
        }
      }.bind(this));
    });
  }

  // --- Compare ---

  function initCompare() {
    document.getElementById('ws-compare-run').addEventListener('click', function () {
      var textA = document.getElementById('ws-compare-a').value.trim();
      var textB = document.getElementById('ws-compare-b').value.trim();
      var resultsEl = document.getElementById('ws-compare-results');

      if (!textA || !textB) {
        resultsEl.innerHTML = '<div class="ws-empty-state">Enter both passages to compare.</div>';
        return;
      }

      var result = ComparisonEngine.compare(textA, textB);

      if (!result.valid) {
        resultsEl.innerHTML = '<div class="ws-empty-state">' + escapeHtml(result.summary) + '</div>';
        return;
      }

      var html = '';

      if (result.identical) {
        html += '<div class="ws-compare-identical">The two passages are identical after normalization.</div>';
      } else {
        html += '<div class="ws-compare-summary">' + escapeHtml(result.summary) + '</div>';

        if (result.differences.length > 0) {
          result.differences.forEach(function (diff) {
            html += '<div class="ws-diff-card">';
            html += '<div class="ws-diff-label">' + escapeHtml(diff.label) + '</div>';
            html += '<div class="ws-diff-detail"><strong>A:</strong> ' + escapeHtml(diff.detailA) + '</div>';
            html += '<div class="ws-diff-detail"><strong>B:</strong> ' + escapeHtml(diff.detailB) + '</div>';
            html += '<div class="ws-diff-why">' + escapeHtml(diff.whyItMatters) + '</div>';
            html += '<div class="ws-diff-investigate">Investigate: ' + escapeHtml(diff.investigate) + '</div>';
            html += '</div>';
          });
        } else {
          html += '<div class="ws-no-gaps">No significant differences detected by the current rules. Surface-level comparison cannot guarantee the passages are consistent in meaning.</div>';
        }
      }

      html += '<div class="ws-explain-box"><strong>Limitation:</strong> Surface-level text comparison identifies structural and numerical differences but cannot reliably detect semantic contradictions. Two passages with very different wording may express the same idea, and two passages with similar wording may differ in meaning. Always read both passages in full context.</div>';

      resultsEl.innerHTML = html;
    });
  }

  // --- Sources ---

  function initSources() {
    document.getElementById('ws-sources-run').addEventListener('click', function () {
      var resultsEl = document.getElementById('ws-sources-results');
      resultsEl.innerHTML = '<div class="ws-empty-state">Inspecting current page…</div>';

      chrome.runtime.sendMessage({ type: 'CONTEXTSHIELD_ANALYZE_PAGE' }, function (response) {
        if (response && !response.error && response.sourceInfo) {
          displaySourceResults(response.sourceInfo, resultsEl);
        } else if (response && response.error) {
          resultsEl.innerHTML = '<div class="ws-empty-state">' + escapeHtml(response.error) + '</div>';
        } else {
          resultsEl.innerHTML = '<div class="ws-empty-state">Could not inspect the current page. The page may be restricted.</div>';
        }
      });
    });
  }

  function displaySourceResults(meta, container) {
    var html = '<div class="ws-result-card">';
    html += '<h3 style="font-size:15px;color:var(--primary);margin-bottom:12px;">Page Metadata</h3>';
    html += '<dl class="ws-source-meta">';
    if (meta.title) html += '<dt>Title</dt><dd>' + escapeHtml(meta.title) + '</dd>';
    if (meta.author) html += '<dt>Author</dt><dd>' + escapeHtml(meta.author) + '</dd>';
    if (meta.publishedDate) html += '<dt>Published</dt><dd>' + escapeHtml(meta.publishedDate) + '</dd>';
    if (meta.modifiedDate) html += '<dt>Modified</dt><dd>' + escapeHtml(meta.modifiedDate) + '</dd>';
    if (meta.siteName) html += '<dt>Site</dt><dd>' + escapeHtml(meta.siteName) + '</dd>';
    if (meta.canonicalUrl) html += '<dt>Canonical URL</dt><dd>' + escapeHtml(meta.canonicalUrl) + '</dd>';
    html += '<dt>URL</dt><dd>' + escapeHtml(meta.url) + '</dd>';
    html += '<dt>Links</dt><dd>' + meta.linkCount + ' total (' + meta.externalLinkCount + ' external)</dd>';
    html += '</dl>';
    html += '</div>';

    if (meta.links && meta.links.length > 0) {
      html += '<h3 style="font-size:15px;color:var(--primary);margin:16px 0 10px;">Source Links (' + meta.links.length + ')</h3>';
      html += '<ul class="ws-link-list">';
      meta.links.forEach(function (link) {
        html += '<li class="ws-link-item">';
        html += '<div class="ws-link-text">';
        html += '<div>' + escapeHtml(link.text) + '</div>';
        html += '<div class="ws-link-domain">' + escapeHtml(link.url) + '</div>';
        html += '</div>';
        if (link.isExternal) {
          html += '<span class="ws-link-external-tag">External</span>';
        } else {
          html += '<span class="ws-link-internal-tag">Same site</span>';
        }
        html += '</li>';
      });
      html += '</ul>';
    }

    html += '<div class="ws-explain-box" style="margin-top:16px;"><strong>Note:</strong> Metadata is extracted from the page DOM. A missing author or date does not necessarily mean a page is unreliable. Do not automatically trust or distrust a source based solely on metadata fields.</div>';

    container.innerHTML = html;
  }

  // --- Notes ---

  function initNotes() {
    document.getElementById('ws-note-add').addEventListener('click', function () {
      var text = document.getElementById('ws-note-text').value.trim();
      var url = document.getElementById('ws-note-url').value.trim();
      var status = document.getElementById('ws-note-status').value;

      if (!text) return;

      StorageManager.addNote({ text: text, url: url, status: status }).then(function () {
        document.getElementById('ws-note-text').value = '';
        document.getElementById('ws-note-url').value = '';
        loadNotes();
      });
    });

    loadNotes();
  }

  function loadNotes() {
    StorageManager.getNotes().then(function (notes) {
      var container = document.getElementById('ws-notes-list');
      if (!notes || notes.length === 0) {
        container.innerHTML = '<div class="ws-empty-state">Your saved notes will appear here.</div>';
        return;
      }

      var statusLabels = {
        not_reviewed: 'Not reviewed',
        needs_evidence: 'Needs evidence',
        evidence_located: 'Evidence located',
        partially_supported: 'Partially supported',
        conflicting_evidence: 'Conflicting evidence',
        unresolved: 'Unresolved',
      };

      var statusColors = {
        not_reviewed: 'background:#e8e0cc;color:#8a7e62',
        needs_evidence: 'background:#fdf6e8;color:#8a5a10',
        evidence_located: 'background:#e8f0e8;color:#2a6a3a',
        partially_supported: 'background:#eef3f8;color:#1e3a5f',
        conflicting_evidence: 'background:#fbeae8;color:#b03020',
        unresolved: 'background:#f0e8f5;color:#5a3a7a',
      };

      var html = '';
      notes.forEach(function (note) {
        html += '<div class="ws-note-card">';
        html += '<div class="ws-note-text">' + escapeHtml(note.text) + '</div>';
        if (note.url) html += '<div class="ws-note-meta"><a href="' + escapeHtml(note.url) + '" target="_blank" rel="noopener" style="color:var(--primary);">' + escapeHtml(note.url) + '</a></div>';
        html += '<div class="ws-note-meta">';
        html += '<span>' + formatTime(note.timestamp) + '</span>';
        html += '<span class="ws-note-status-tag" style="' + (statusColors[note.status] || statusColors.not_reviewed) + '">' + (statusLabels[note.status] || note.status) + '</span>';
        html += '<button class="ws-note-delete" data-id="' + note.id + '">Delete</button>';
        html += '</div>';
        html += '</div>';
      });

      container.innerHTML = html;

      container.querySelectorAll('.ws-note-delete').forEach(function (btn) {
        btn.addEventListener('click', function () {
          StorageManager.deleteNote(this.dataset.id).then(loadNotes);
        });
      });
    });
  }

  // --- History ---

  function initHistory() {
    loadHistory();
    document.getElementById('ws-clear-history').addEventListener('click', function () {
      if (confirm('Delete all inspection history? This cannot be undone.')) {
        StorageManager.set({ inspections: [] }).then(loadHistory);
      }
    });
  }

  function loadHistory() {
    StorageManager.getInspections().then(function (inspections) {
      var container = document.getElementById('ws-history-list');
      if (!inspections || inspections.length === 0) {
        container.innerHTML = '<div class="ws-empty-state">No inspections recorded yet.</div>';
        return;
      }

      var statusLabels = {
        not_reviewed: 'Not reviewed',
        needs_evidence: 'Needs evidence',
        evidence_located: 'Evidence located',
        partially_supported: 'Partially supported',
        conflicting_evidence: 'Conflicting evidence',
        unresolved: 'Unresolved',
      };

      var html = '';
      inspections.forEach(function (insp) {
        html += '<div class="ws-history-card">';
        html += '<div class="ws-history-header">';
        html += '<span class="ws-result-label ws-label-' + (insp.classification ? insp.classification.type : 'factual') + '">' + (insp.classification ? insp.classification.label : 'Inspection') + '</span>';
        if (insp.status && insp.status !== 'not_reviewed') {
          html += '<span style="font-size:11px;color:var(--muted);">Status: ' + (statusLabels[insp.status] || insp.status) + '</span>';
        }
        html += '<span class="ws-history-time">' + formatTime(insp.timestamp) + '</span>';
        html += '</div>';
        html += '<div class="ws-history-text">"' + escapeHtml(insp.text.substring(0, 200)) + (insp.text.length > 200 ? '…' : '') + '"</div>';
        if (insp.sourceUrl) html += '<div class="ws-history-source">' + escapeHtml(insp.sourceUrl) + '</div>';
        if (insp.gaps && insp.gaps.length > 0) {
          html += '<div style="font-size:11px;color:#8a5a10;margin-top:4px;">Gaps: ' + insp.gaps.map(function (g) { return escapeHtml(g.label); }).join(', ') + '</div>';
        }
        html += '<div class="ws-history-actions">';
        html += '<button class="ws-history-btn" data-text="' + escapeHtml(insp.text.substring(0, 500)) + '">Re-inspect</button>';
        html += '<button class="ws-history-btn ws-delete-btn" data-id="' + insp.id + '">Delete</button>';
        html += '</div>';
        html += '</div>';
      });

      container.innerHTML = html;

      container.querySelectorAll('.ws-history-btn[data-text]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          switchTab('inspect');
          document.getElementById('ws-inspect-input').value = this.dataset.text;
          runInspect();
        });
      });

      container.querySelectorAll('.ws-delete-btn[data-id]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          StorageManager.deleteInspection(this.dataset.id).then(loadHistory);
        });
      });
    });
  }

  // --- Export ---

  function initExport() {
    document.getElementById('ws-export-json').addEventListener('click', function () {
      StorageManager.exportData().then(function (data) {
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, 'contextshield-export.json');
      });
    });

    document.getElementById('ws-export-md').addEventListener('click', function () {
      StorageManager.exportMarkdown().then(function (md) {
        var blob = new Blob([md], { type: 'text/markdown' });
        downloadBlob(blob, 'contextshield-export.md');
      });
    });
  }

  function initNavActions() {
    document.getElementById('ws-settings').addEventListener('click', function () {
      chrome.runtime.openOptionsPage();
    });
  }

  // --- Utilities ---

  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatTime(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
})();
