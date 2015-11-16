var running = false,
  scroll = null,
  runningObj = null,
  currStage = 'none',
  stages = {
    none: {
      run: function(active) {
        setStage('scrolling');
        stages['scrolling'].run(active);
      },
      stop: _.identity
    },   
    scrolling: {
      run: function(active) {
        scroll = initScroll(function() {
          setStage('running');
          stages['running'].run(active);
        });
        scroll.start();
      },
      stop: function() {
        scroll.stop();
        scroll = null;
        setStage('none');
      }
    },
    running: {
      run: function(active) {

        if ('active' === 'followers') {
          runningObj = initFollowing(function() {
            setStage('finished');
            stages['finished'].run(active);
          });
        } else {
          runningObj = initUnfollowAll(function() {
            setStage('finished');
            stages['finished'].run(active);
          });
        }

        runningObj.start();
      },
      stop: function() {
        runningObj.stop();
        runningObj = null;
        setStage('none');
      }
    },
    finished: {
      run: function() {},
      stop: function() {}
    }
  };


// The background page is asking us to change stage
if (window == top) {
  console.log('content script is now listening to events');
  chrome.extension.onRequest.addListener(function(req, sender, sendResponse) {
    if (req.fn === 'clickEvent') {
      sendResponse(clickAction(req.action));
    } else if (req.fn === 'nodesLeft') {
      sendResponse(leftItems(req.action));
    } else if (req.fn === 'currentUser') {
      sendResponse(currentUser());
    }
  });
}

function setStage(newStage) {
  currStage = newStage;
  chrome.runtime.sendMessage({stage: newStage}, function(response) {});
};

function leftItems(active) {
  var response = 0;

  if (active === 'followers') {
    response = nodesToUnfollow().length;
  } else {
    response = getFollowingQuota() < $('.not-following .Icon--follow').toArray().length ? getFollowingQuota() : $('.not-following .Icon--follow').toArray().length;
  }

  return response;
};


function clickAction(active) {
  console.log('click event!');
  if (currStage === 'finished') {
    console.log('script has finished');
    return;
  }

  if (running) {
    stages[currStage].stop(); 
    running = false; 
  } else {
    running = true;
    stages[currStage].run(active);
  }
};


function hasMoreItems() {
  var twMark = $('.GridTimeline-end.has-more-items');
  return twMark.length > 0;
};

function nodesToUnfollow() {
  return _.chain($('.ProfileCard-content'))
    .filter(function(e) { return _.isEmpty($(e).find('.FollowStatus')); })
    .map(function(e) { return $(e).find('.user-actions-follow-button')})
    .value();
};

function initUnfollowAll(cb) {
  var nodes = nodesToUnfollow(),
    currTimeout = null,
    successCallback = cb || _.identity;

  function unfollowNext() {         
    if (nodes.length > 0) {

      var currNode = nodes.shift();
      currNode.click();
      currTimeout = window.setTimeout(unfollowNext, 500);

    } else {
      currentTimer = null;
      successCallback();
    }       
  }

  return {
    start: function() {
      unfollowNext();
    },
    stop: function() {
      if (currTimeout) {
        window.clearTimeout(currTimeout);
      }
    },
    nodesLeft: function() {
      return nodes.length;
    }  
  };
};


function initScroll(cb) {
  var currentTimer = null,
    scrolling = true,
    successCallback = cb || _.identity;

  function scroll() {
    if (hasMoreItems()) {
      $('html, body').animate({
        scrollTop: $(".GridTimeline-end").offset().top
      }, 100);
      currentTimer = window.setTimeout(scroll, 500);
    } else {
      currentTimer = null;
      successCallback();
    } 
  }

  return {
    start: function() {
      scroll();
    },
    stop: function() {
      if (currentTimer) {
        window.clearTimeout(currentTimer);  
      }
    }
  }
};


function getFollowingQuota() {
  var quotas = localStorage.getItem('quotas') || {},
    dateStr = (new Date()).toLocaleDateString(),
    response = 1000;

  if (!quotas[dateStr]) {
    quotas[dateStr] = 1000;
    localStorage.setItem('quotas', quotas);
  } else {
    response = quotas[dateStr];
  }  

  return response;
};

function setFollowingQuota(modifier) {
  var quotas = localStorage.getItem('quotas') || {},
    dateStr = (new Date()).toLocaleDateString();

  if (!quotas[dateStr]) {
    quotas[dateStr] = 1000 + modifier;
  } else {
    quotas[dateStr] = quotas[dateStr] + modifier;
  }  

  localStorage.setItem('quotas', quotas);

  return;
};

function initFollowing (cb) {
  var clicking = true,
    currentTimer = null,
    successCallback = cb || _.identity,
    nodes = $('.not-following .Icon--follow').toArray();

  function clickFun(array) {
    var quota = getFollowingQuota();

    if (quota > 0) {
      var el = array.shift();
      el.click();
      setFollowingQuota(-1);
      //console.log(el, 'clicked');
      currentTimer = window.setTimeout(clickFun, 500);  
    } else {
      successCallback();
    }
  }

  return {
    start: function() {
      clickFun(nodes);
    },
    stop: function() {
      if (currentTimer) {
        window.clearTimeout(currentTimer);
      }
    },
    quota: function() {
      return getFollowingQuota();
    }
  };
};


function currentUser() {
  return $(".current-user a").attr("href").replace('/', '');
}




