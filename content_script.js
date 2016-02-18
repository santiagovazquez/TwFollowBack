var ContentScriptModel = Backbone.Model.extend({

  defaults: {
    currInterval: null
  },

  currentUser: function() {
    return $(".current-user a").attr("href").replace('/', '');
  },

  getNodesToFollow: function() {
    return $('.GridTimeline .not-following .Icon--follow').toArray();
  },

  scrollToNode: function(node) {
    $('html, body').animate({
      scrollTop: $(node).parents('.ProfileCard').offset().top - 46
    }, 100);
  },

  getMoreProfiles: function() {
    $('html, body').animate({
      scrollTop: $(".GridTimeline-end").offset().top
    }, 100);
  },

  // 1.Obtengo los nodos a seguir
  // 2.Tomo el primero
  // 3.Scrolleo hasta ese
  // 4.Lo sigo
  // 5.Vuelvo a 1.
  startFollowing: function() {
    var me = this,
      clickFun = function() {
        var hasMoreItems = me.hasMoreItems(),
          nodes = me.getNodesToFollow(),
          currNode,
          followLimit = me.reachFollowLimit();

        if (followLimit) {
          me.stopFollowing();
          me.trigger('ended');
          return;
        }

        if (hasMoreItems && nodes.length === 0) {
          me.getMoreProfiles();
        } else if (nodes.length > 0) {
          currNode = nodes.shift();
          me.scrollToNode(currNode);
          currNode.click();
        } else {
          me.stopFollowing();
          me.trigger('ended');
        }
      };

    if (!!this.get('currentInterval')) {
      console.log('script is already running');
      return;
    }

    this.set('currentInterval', setInterval(clickFun, 500));
  },

  stopFollowing: function() {
    var currInterval = this.get('currentInterval');
    clearInterval(currInterval);

    this.set('currentInterval', null);
  },

  isRunning: function() {
    return !!this.get('currentInterval');
  },

  startUnfollowing: function() {
    var me = this,
      unfollowNext = function() {
        var hasMoreItems = me.hasMoreItems(),
          nodes = me.nodesToUnfollow(), currNode;

        if (hasMoreItems && nodes.length === 0) {
          me.getMoreProfiles();
        } else if (nodes.length > 0) {
          var currNode = nodes.shift();
          me.scrollToNode(currNode);
          currNode.click();
        } else {
          me.stopUnfollowing();
          me.trigger('ended');
        }
      };

    if (!!this.get('currentInterval')) {
      console.log('script is already running');
      return;
    }

    this.set('currentInterval', setInterval(unfollowNext, 500));
  },

  stopUnfollowing: function() {
    this.stopFollowing();
  },

  hasMoreItems: function () {
    var twMark = $('.GridTimeline-end.has-more-items');
    return twMark.length > 0;
  },

  nodesToUnfollow: function() {
    return _.chain($('.ProfileCard-content').toArray())
      .filter(function(e) { return _.isEmpty($(e).find('.FollowStatus')); })
      .map(function(e) { return $(e).find('.user-actions-follow-button')})
      .filter(function(e) { return !$(e).parent().hasClass('pending') && !$(e).parent().hasClass('not-following');})
      .value();
  },

  reachFollowLimit: function() {
    return _($('.alert-messages').text()).contains('You are unable to follow more people');
  }
});

var csm = new ContentScriptModel();

// Let background know that the script has ended
csm.on('ended', function() {
  chrome.runtime.sendMessage({event: 'ended'}, function(response) {});
});

// The background page is asking us to change stage
if (window == top) {
  console.log('content script is now listening to events');
  chrome.extension.onRequest.addListener(function(req, sender, sendResponse) {
    var action = csm[req.fn],
      actionResponse = !!action ? _.bind(action, csm)() : null;
    if (!!action) {
      console.log('sending response:', actionResponse);
      sendResponse(actionResponse);
    } else {
      throw new Error('invalid action');
    }
  });
}

//function setStage(newStage) {
//  currStage = newStage;
//  chrome.runtime.sendMessage({stage: newStage}, function(response) {});
//};
//
//
//
//
//
//
//function initScroll(cb) {
//  var currentTimer = null,
//    scrolling = true,
//    successCallback = cb || _.identity;
//
//  function scroll() {
//    if (hasMoreItems()) {
//      $('html, body').animate({
//        scrollTop: $(".GridTimeline-end").offset().top
//      }, 100);
//      currentTimer = window.setTimeout(scroll, 500);
//    } else {
//      currentTimer = null;
//      successCallback();
//    }
//  }
//
//  return {
//    start: function() {
//      scroll();
//    },
//    stop: function() {
//      if (currentTimer) {
//        window.clearTimeout(currentTimer);
//      }
//    }
//  };
//};
//

