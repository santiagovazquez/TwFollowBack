var GlobalModel = Backbone.Model.extend({
  defaults: {
    active: null, // followers or following
    selectedId: null, // selected tab id
    selectedUrl: null
  },

  clean: function() {
    this.set({
      active: null,
      selectedId: null,
      selectedUrl: null
    });
  },

  getActivePage: function(tab, cb) {
    var urlTests = [/https:\/\/twitter.com\/.+\/followers/, /https:\/\/twitter.com\/.*following/],
      validUrl = _.some(urlTests, function(regexp) { return regexp.test(tab.url); });

    if (!validUrl) {
      cb(null);
      return;
    }

    chrome.tabs.sendRequest(tab.id, {fn: 'currentUser'}, function(user) {
      if (tab.url.includes('followers') && !tab.url.includes(user + '/followers')) {
        cb('followers');
      } else if (tab.url.includes('twitter.com/following') || tab.url.includes(user + '/following')) {
        cb('following');
      } else {
        cb(null);
      }
    });
  },

  setCurrentTab: function(tab) {
    var me = this;

    this.getActivePage(tab, function(pageActive) {
      if (!pageActive) {
        me.clean();
        return;
      }

      me.set({
        selectedId: tab.id,
        selectedUrl: tab.url,
        active: pageActive
      });
    });
  }
});

var TabModel = Backbone.Model.extend({});

/**
 * Global Model
 */
var gm = new GlobalModel();
/**
 * Current Tab Model
 * A new instance is created when changing tab
 */
var currentTabModel;


/**
 * Visible actions
 *
 * - getActivePage: returns the current page @user/followers (to follow) or me/following (to unfollow)
 * - addListener: listen to a content_script event
 *
 * Content script wrappers
 *
 * - startFollowing: calls to content script start following function. Trigger endFollowing event when finished.
 * - stopFollowing: calls to content script stop following function.
 * - startUnfollowing: : calls to content script start unfollowing function. Trigger endUnfollowing event when finished.
 * - stopUnfollowing: calls to content script stop unfollowing function.
 *
 */

var getActivePage = function() {
  return gm.get("active");
};

var addListener = function(eventName, cb) {
  if (!!currentTabModel) {
    currentTabModel.on(eventName, cb);
  }
};

var callFn = function(fnName) {
  return function(cb) {
    console.log('BackgroundJS: sending event to content script!');
    chrome.tabs.sendRequest(gm.get("selectedId"), {fn: fnName}, cb || _.identity);
  };
};

var startFollowing = callFn('startFollowing');
var stopFollowing = callFn('stopFollowing');
var startUnfollowing = callFn('startUnfollowing');
var stopUnfollowing = callFn('stopUnfollowing');
var isRunning = callFn('isRunning');

// Popup startup script can be executed before having a tabId, so we must wait in that case
var executeWhenReady = function(cb) {
  if (gm.get('selectedId') && gm.get('active')) {
    cb(getActivePage());
  } else {
    console.log('waiting for tab to be selected!');
    gm.once('change:active', function() {
      console.log('calling callback!');
      cb(getActivePage());
    });
  }
};

/** On tab update **/
gm.on("change", function(model) {
  var changedAttrs = model.changedAttributes();

  if (!!changedAttrs.selectedId) {
    if (!!currentTabModel) {
      currentTabModel.destroy();
    }

    currentTabModel = new TabModel();
    chrome.pageAction.show(model.get('selectedId'));
  }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  console.log('onActivated', activeInfo);

  chrome.tabs.get(activeInfo.tabId, function(richTab) {
    gm.setCurrentTab(richTab);
  });

});

chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
  console.log('onUpdated', change, tab);

  if (change.status === "complete") {
    gm.setCurrentTab({id: tabId, url: tab.url});
  }
});

// Initialization
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  if (tabs.length > 0) {
    gm.setCurrentTab(tabs[0]);
  }
});

// Content script is telling me that an event has happened
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Sended from a content script and ! from an extension
  if (sender.tab) {
    if (!!currentTabModel) {
      currentTabModel.trigger(request.event, request.eventParams || null);
    }
  }
});










