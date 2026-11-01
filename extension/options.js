// ContextShield Options Page Logic

'use strict';

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    loadSettings();
    bindControls();
  });

  function loadSettings() {
    StorageManager.getSettings().then(function (settings) {
      document.getElementById('opt-history').checked = settings.inspectionHistory;
      document.getElementById('opt-annotations').checked = settings.inPageAnnotations;
      document.getElementById('opt-context-menu').checked = settings.contextMenuEnabled;
      document.getElementById('opt-max-length').value = settings.maxTextLength;
      document.getElementById('opt-layout').value = settings.resultsLayout;
    });
  }

  function bindControls() {
    // Toggle settings
    ['opt-history', 'opt-annotations', 'opt-context-menu'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        var key = id === 'opt-history' ? 'inspectionHistory' :
          id === 'opt-annotations' ? 'inPageAnnotations' : 'contextMenuEnabled';
        var updates = {};
        updates[key] = this.checked;
        StorageManager.saveSettings(updates).then(function () {
          showFeedback('Setting saved.', 'success');
        });
      });
    });

    document.getElementById('opt-max-length').addEventListener('change', function () {
      var val = parseInt(this.value, 10);
      if (val >= 1000 && val <= 100000) {
        StorageManager.saveSettings({ maxTextLength: val }).then(function () {
          showFeedback('Maximum text length saved.', 'success');
        });
      } else {
        showFeedback('Value must be between 1,000 and 100,000.', 'error');
      }
    });

    document.getElementById('opt-layout').addEventListener('change', function () {
      StorageManager.saveSettings({ resultsLayout: this.value }).then(function () {
        showFeedback('Results layout saved.', 'success');
      });
    });

    // Export
    document.getElementById('opt-export-json').addEventListener('click', function () {
      StorageManager.exportData().then(function (data) {
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, 'contextshield-export.json');
      });
    });

    document.getElementById('opt-export-md').addEventListener('click', function () {
      StorageManager.exportMarkdown().then(function (md) {
        var blob = new Blob([md], { type: 'text/markdown' });
        downloadBlob(blob, 'contextshield-export.md');
      });
    });

    // Clear all data
    document.getElementById('opt-clear-data').addEventListener('click', function () {
      if (confirm('Delete ALL locally stored data — inspections, notes, and settings? This cannot be undone.')) {
        if (confirm('Confirm again: This will permanently delete all your research data.')) {
          StorageManager.clearAll().then(function () {
            showFeedback('All data has been deleted.', 'success');
            loadSettings();
          });
        }
      }
    });
  }

  function showFeedback(message, type) {
    var el = document.getElementById('opts-feedback');
    el.textContent = message;
    el.className = 'opts-feedback show ' + type;
    setTimeout(function () {
      el.className = 'opts-feedback';
    }, 3000);
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
