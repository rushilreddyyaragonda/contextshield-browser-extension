/**
 * ContextShield Storage Manager
 * Manages local storage for settings, research notes, and inspection history.
 * Uses chrome.storage.local in extension context, localStorage as fallback.
 */

(function (global) {
  'use strict';

  var hasChromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

  function getStorageArea() {
    return hasChromeStorage ? chrome.storage.local : null;
  }

  function get(keys) {
    return new Promise(function (resolve) {
      var area = getStorageArea();
      if (area) {
        area.get(keys, function (result) {
          resolve(result || {});
        });
      } else {
        var result = {};
        if (typeof keys === 'string') {
          var val = localStorage.getItem('cs_' + keys);
          result[keys] = val ? JSON.parse(val) : null;
        } else if (Array.isArray(keys)) {
          keys.forEach(function (k) {
            var v = localStorage.getItem('cs_' + k);
            result[k] = v ? JSON.parse(v) : null;
          });
        } else {
          resolve({});
          return;
        }
        resolve(result);
      }
    });
  }

  function set(items) {
    return new Promise(function (resolve) {
      var area = getStorageArea();
      if (area) {
        area.set(items, function () {
          resolve(true);
        });
      } else {
        Object.keys(items).forEach(function (k) {
          localStorage.setItem('cs_' + k, JSON.stringify(items[k]));
        });
        resolve(true);
      }
    });
  }

  function remove(keys) {
    return new Promise(function (resolve) {
      var area = getStorageArea();
      if (area) {
        area.remove(keys, function () {
          resolve(true);
        });
      } else {
        if (typeof keys === 'string') {
          localStorage.removeItem('cs_' + keys);
        } else if (Array.isArray(keys)) {
          keys.forEach(function (k) { localStorage.removeItem('cs_' + k); });
        }
        resolve(true);
      }
    });
  }

  function clearAll() {
    return new Promise(function (resolve) {
      var area = getStorageArea();
      if (area) {
        area.clear(function () {
          resolve(true);
        });
      } else {
        var keys = [];
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key && key.startsWith('cs_')) keys.push(key);
        }
        keys.forEach(function (k) { localStorage.removeItem(k); });
        resolve(true);
      }
    });
  }

  // --- High-level helpers ---

  var DEFAULT_SETTINGS = {
    inspectionHistory: true,
    inPageAnnotations: true,
    maxTextLength: 50000,
    resultsLayout: 'detailed',
    contextMenuEnabled: true,
  };

  function getSettings() {
    return get('settings').then(function (result) {
      var stored = result.settings || {};
      return Object.assign({}, DEFAULT_SETTINGS, stored);
    });
  }

  function saveSettings(settings) {
    return getSettings().then(function (current) {
      return set({ settings: Object.assign({}, current, settings) });
    });
  }

  function addInspection(inspection) {
    return getSettings().then(function (settings) {
      if (!settings.inspectionHistory) return null;
      return get('inspections').then(function (result) {
        var inspections = result.inspections || [];
        var record = {
          id: 'insp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
          timestamp: new Date().toISOString(),
          text: (inspection.text || '').substring(0, 500),
          classification: inspection.classification || null,
          gaps: inspection.gaps || [],
          notes: inspection.notes || '',
          status: inspection.status || 'not_reviewed',
          sourceUrl: inspection.sourceUrl || '',
          sourceTitle: inspection.sourceTitle || '',
        };
        inspections.unshift(record);
        if (inspections.length > 200) inspections = inspections.slice(0, 200);
        return set({ inspections: inspections }).then(function () {
          return record;
        });
      });
    });
  }

  function getInspections() {
    return get('inspections').then(function (result) {
      return result.inspections || [];
    });
  }

  function deleteInspection(id) {
    return getInspections().then(function (inspections) {
      return set({ inspections: inspections.filter(function (i) { return i.id !== id; }) });
    });
  }

  function updateInspection(id, updates) {
    return getInspections().then(function (inspections) {
      var updated = inspections.map(function (i) {
        if (i.id === id) return Object.assign({}, i, updates);
        return i;
      });
      return set({ inspections: updated });
    });
  }

  function addNote(note) {
    return get('notes').then(function (result) {
      var notes = result.notes || [];
      var record = {
        id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        timestamp: new Date().toISOString(),
        text: note.text || '',
        url: note.url || '',
        date: note.date || '',
        status: note.status || 'not_reviewed',
        tags: note.tags || [],
      };
      notes.unshift(record);
      if (notes.length > 500) notes = notes.slice(0, 500);
      return set({ notes: notes }).then(function () {
        return record;
      });
    });
  }

  function getNotes() {
    return get('notes').then(function (result) {
      return result.notes || [];
    });
  }

  function deleteNote(id) {
    return getNotes().then(function (notes) {
      return set({ notes: notes.filter(function (n) { return n.id !== id; }) });
    });
  }

  function exportData() {
    return Promise.all([getInspections(), getNotes(), getSettings()]).then(function (results) {
      return {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        inspections: results[0],
        notes: results[1],
        settings: results[2],
      };
    });
  }

  function exportMarkdown() {
    return Promise.all([getInspections(), getNotes()]).then(function (results) {
      var inspections = results[0];
      var notes = results[1];
      var lines = [];
      lines.push('# ContextShield Research Export');
      lines.push('');
      lines.push('> This export distinguishes automated observations from manual user assessments.');
      lines.push('> Automated observations are generated by deterministic local rules.');
      lines.push('> Manual assessments are recorded by the user and are not verified truth labels.');
      lines.push('');
      lines.push('Exported: ' + new Date().toISOString());
      lines.push('');

      lines.push('## Inspections (' + inspections.length + ')');
      lines.push('');
      for (var i = 0; i < inspections.length; i++) {
        var insp = inspections[i];
        lines.push('### ' + (insp.classification ? insp.classification.label : 'Inspection') + ' — ' + insp.timestamp);
        lines.push('');
        lines.push('**Text:** ' + insp.text);
        lines.push('');
        if (insp.sourceUrl) lines.push('**Source:** ' + insp.sourceUrl);
        if (insp.gaps && insp.gaps.length > 0) {
          lines.push('');
          lines.push('**Context gaps detected:**');
          insp.gaps.forEach(function (g) {
            lines.push('- ' + g.label + ': ' + g.questionToAsk);
          });
        }
        if (insp.notes) {
          lines.push('');
          lines.push('**User notes:** ' + insp.notes);
        }
        lines.push('');
        lines.push('**Status:** ' + insp.status + ' (user-managed)');
        lines.push('');
        lines.push('---');
        lines.push('');
      }

      lines.push('## Research Notes (' + notes.length + ')');
      lines.push('');
      for (var n = 0; n < notes.length; n++) {
        var note = notes[n];
        lines.push('- **' + note.timestamp + '**: ' + note.text);
        if (note.url) lines.push('  URL: ' + note.url);
        if (note.status) lines.push('  Status: ' + note.status + ' (user-managed)');
        lines.push('');
      }

      return lines.join('\n');
    });
  }

  global.StorageManager = {
    get: get,
    set: set,
    remove: remove,
    clearAll: clearAll,
    getSettings: getSettings,
    saveSettings: saveSettings,
    addInspection: addInspection,
    getInspections: getInspections,
    deleteInspection: deleteInspection,
    updateInspection: updateInspection,
    addNote: addNote,
    getNotes: getNotes,
    deleteNote: deleteNote,
    exportData: exportData,
    exportMarkdown: exportMarkdown,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
  };
})(typeof window !== 'undefined' ? window : this);
