// ContextShield Background Service Worker
// Handles context menu registration, message routing, and lifecycle.

'use strict';

// Create context menu item on install/update
chrome.runtime.onInstalled.addListener(function (details) {
  chrome.contextMenus.create({
    id: 'contextshield-inspect',
    title: 'Inspect selection with ContextShield',
    contexts: ['selection'],
  });

  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.local.get('settings', function (result) {
      if (!result.settings) {
        chrome.storage.local.set({
          settings: {
            inspectionHistory: true,
            inPageAnnotations: true,
            maxTextLength: 50000,
            resultsLayout: 'detailed',
            contextMenuEnabled: true,
          },
        });
      }
    });
  }
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === 'contextshield-inspect' && info.selectionText) {
    var text = info.selectionText.substring(0, 50000);
    // Store the selection temporarily so popup can pick it up
    chrome.storage.local.set({
      pendingSelection: {
        text: text,
        sourceUrl: tab ? tab.url : '',
        sourceTitle: tab ? tab.title : '',
        timestamp: Date.now(),
      },
    }, function () {
      // Open the popup by sending a message to the content script,
      // or open workspace as a tab
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'CONTEXTSHIELD_ANALYZE_SELECTION',
          text: text,
          sourceUrl: tab ? tab.url : '',
          sourceTitle: tab ? tab.title : '',
        }, function (response) {
          if (chrome.runtime.lastError) {
            // Content script not available (restricted page) — open workspace
            chrome.tabs.create({
              url: chrome.runtime.getURL('workspace.html?mode=selection&from=contextmenu'),
            });
          }
        });
      } else {
        chrome.tabs.create({
          url: chrome.runtime.getURL('workspace.html?mode=selection&from=contextmenu'),
        });
      }
    });
  }
});

// Message handler for communication between popup, content script, and workspace
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (!message || typeof message.type !== 'string') {
    sendResponse({ error: 'Invalid message format' });
    return;
  }

  switch (message.type) {
    case 'CONTEXTSHIELD_GET_TAB_INFO':
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs && tabs.length > 0) {
          sendResponse({
            url: tabs[0].url,
            title: tabs[0].title,
            id: tabs[0].id,
            isRestricted: isRestrictedUrl(tabs[0].url),
          });
        } else {
          sendResponse({ error: 'No active tab' });
        }
      });
      return true;

    case 'CONTEXTSHIELD_CHECK_SELECTION':
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs && tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'CONTEXTSHIELD_GET_SELECTION',
          }, function (response) {
            if (chrome.runtime.lastError) {
              sendResponse({ selection: null, restricted: true });
            } else {
              sendResponse(response || { selection: null });
            }
          });
        } else {
          sendResponse({ selection: null });
        }
      });
      return true;

    case 'CONTEXTSHIELD_ANALYZE_PAGE':
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs && tabs.length > 0) {
          if (isRestrictedUrl(tabs[0].url)) {
            sendResponse({ error: 'Cannot analyze restricted pages' });
            return;
          }
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'CONTEXTSHIELD_PAGE_ANALYSIS',
          }, function (response) {
            if (chrome.runtime.lastError) {
              sendResponse({ error: 'Content script not available on this page' });
            } else {
              sendResponse(response);
            }
          });
        } else {
          sendResponse({ error: 'No active tab' });
        }
      });
      return true;

    case 'CONTEXTSHIELD_OPEN_WORKSPACE':
      chrome.tabs.create({
        url: chrome.runtime.getURL('workspace.html'),
      });
      sendResponse({ ok: true });
      return true;

    case 'CONTEXTSHIELD_OPEN_OPTIONS':
      chrome.runtime.openOptionsPage();
      sendResponse({ ok: true });
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

function isRestrictedUrl(url) {
  if (!url) return true;
  return url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('moz-extension://') ||
    url.startsWith('https://chrome.google.com/webstore') ||
    url.startsWith('https://chromewebstore.google.com');
}
