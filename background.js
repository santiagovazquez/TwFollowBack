

// When the extension is installed or upgraded ...
chrome.runtime.onInstalled.addListener(function() {
  // Replace all rules ...
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    // With a new rule ...
    chrome.declarativeContent.onPageChanged.addRules([
      {
        // That fires when a page's URL contains a 'g' ...
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostEquals: 'twitter.com', schemes: ['https'], urlContains: '/followers' }
          }),
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostEquals: 'twitter.com', schemes: ['https'], urlContains: '/following' }
          })
        ],
        // And shows the extension's page action.
        actions: [ new chrome.declarativeContent.ShowPageAction() ]
      }
    ]);
  });
});


/*
var accountsToFollow;
var accountsToUnfollow;
*/
// Global accessor that the popup uses.
/*var addresses = {};
var selectedAddress = null;
var selectedId = null;

function updateAddress(tabId) {
  chrome.tabs.sendRequest(tabId, {}, function(address) {
    addresses[tabId] = address;
    if (!address) {
      chrome.pageAction.hide(tabId);
    } else {
      chrome.pageAction.show(tabId);
      if (selectedId == tabId) {
        updateSelected(tabId);
      }
    }
  });
}

function updateSelected(tabId) {
  selectedAddress = addresses[tabId];
  if (selectedAddress)
    chrome.pageAction.setTitle({tabId:tabId, title:selectedAddress});
}

chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
  if (change.status == "complete") {
    updateAddress(tabId);
  }
});

chrome.tabs.onSelectionChanged.addListener(function(tabId, info) {
  selectedId = tabId;
  updateSelected(tabId);
});

// Ensure the current selected tab is set up.
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  updateAddress(tabs[0].id);
});*/

var active = null; // followers or following
var selectedId = null; // selected tab id
var stateChangeListeners = [];
var state = 'none';
var nodesLeft = 0;

var onStateChange = function(cb) {
  stateChangeListeners.push(cb);
};

var clickEvent = function() {
  console.log('BackgroundJS: sending click event to content script!');
  chrome.tabs.sendRequest(selectedId, {fn: 'clickEvent', action: active}, _.identity);  
}; 

var getNodesLeft = function() {
  chrome.tabs.sendRequest(selectedId, {fn: 'nodesLeft', action: active}, function(n) {
    nodesLeft = n;
  });  
};

var currentUser = function() {
};

function updateTab(tabId) {
  selectedId = tabId;
  stateChangeListeners = [];

  chrome.tabs.get(tabId, function(richTab) { 
    chrome.tabs.sendRequest(selectedId, {fn: 'currentUser'}, function(user) {
      if (richTab.url && richTab.url.includes('followers') && !richTab.url.includes(user + '/followers')) {
        active = 'followers';
      } else if (richTab.url && (richTab.url.includes('twitter.com/following') || richTab.url.includes(user + '/following'))) {
        active = 'following';
      } else {
        active = null;
      }
    });      
  });
}

chrome.tabs.onSelectionChanged.addListener(function(tabId, info) {
  updateTab(tabId);
});

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  if (tabs.length > 0) {
    updateTab(tabs[0].id);  
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
  if (change.status == "complete") {
    updateTab(tabId);
  }
});

// Content script is telling me that the state has changed
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Sended from a content script and ! from an extension
  if (sender.tab) {
    _.each(stateChangeListeners, function(cb) {
      state = request.stage;
      cb(request.stage);
    });
  }
});










