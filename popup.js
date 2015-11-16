
function unfollowingSetup() {
  $('.unfollow-container').removeClass('hide');

  var clickAction = chrome.extension.getBackgroundPage().clickEvent,
    onStateChange = chrome.extension.getBackgroundPage().onStateChange,
    currStage = chrome.extension.getBackgroundPage().state;

  var stages = {
    none: {
      text: 'Start Unfollow'
    },   
    scrolling: {
      text: 'Stop Scrolling'
    },
    running: {
      text: 'Stop Unfollow'
    },
    finished: {
      text: 'Finished'
    }
  };

  $("#unfollowing-btn").text(stages[currStage].text);

  onStateChange(function(state) {
    $("#unfollowing-btn").text(stages[state].text);
  });

  $("#unfollowing-btn").on("click", function(ev) {
    ev.preventDefault();
    console.log('Popup: click event!');
    clickAction(); 
  });
};

function followingSetup() {
  $('.follow-container').removeClass('hide');


  var clickAction = chrome.extension.getBackgroundPage().clickEvent,
    onStateChange = chrome.extension.getBackgroundPage().onStateChange,
    currStage = chrome.extension.getBackgroundPage().state;

  var currStage = 'none',
    stages = {
      none: {
        text: 'Start Follow'
      },   
      scrolling: {
        text: 'Stop Scrolling'
      },
      running: {
        text: 'Stop Follow'
      },
      finished: {
        text: 'Finished'
      }
    };

  $("#following-btn").text(stages[currStage].text);

  onStateChange(function(state) {
    $("#following-btn").text(stages[state].text);
  });

  $("#following-btn").on("click", function(ev) {
    ev.preventDefault();
    clickAction(); 
  });  

}

function twitterActions() {
  var activeOpt = chrome.extension.getBackgroundPage().active;

  if (activeOpt === "followers") {
    followingSetup();
  } else if (activeOpt === "following") {
    unfollowingSetup();
  }
}

window.onload = twitterActions;
