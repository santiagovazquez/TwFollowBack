var bp = chrome.extension.getBackgroundPage();

var MainModel = Backbone.Model.extend({
  defaults: {
    activePage: null,
    running: false,
    ended: false
  },

  actions: {
    followers: {
      run: bp.startFollowing,
      stop: bp.stopFollowing
    },
    following: {
      run: bp.startUnfollowing,
      stop: bp.stopUnfollowing
    }
  },

  run: function() {
    this.actions[this.get('activePage')].run();
    this.set('running', true);
  },

  stop: function() {
    this.actions[this.get('activePage')].stop();
    this.set('running', false);
  }
});

var MainView = Backbone.View.extend({

  el: "#action-container",

  events: {
    "click #action-btn": "onActionClicked"
  },

  actions: {
    followers: {
      initial: 'Start Following',
      running: 'Stop Following',
      ended: 'Ended'
    },
    following: {
      initial: 'Start Unfollowing',
      running: 'Stop Unfollowing',
      ended: 'Ended'
    }
  },

  initialize: function() {
    this.listenTo(this.model, "change:running change:ended", this.render, this);
  },

  onActionClicked: function() {
    // if script has ended, do nothing
    if (this.model.get('ended')) {
      return;
    }

    // Stop action
    if (this.model.get('running')) {
      this.model.stop();
    } else { // Run action
      this.model.run();
    }
  },

  getState: function() {
    if (this.model.get('ended')) {
      return 'ended';
    }

    if (this.model.get('running')) {
      return 'running';
    }

    return 'initial';
  },

  render: function() {
    var text = this.actions[this.model.get('activePage')][this.getState()];
    $('#action-btn').text(text);
  }

});

function startup(activePage) {
  var mm = new MainModel({activePage: activePage}),
    mv = new MainView({model: mm});

  bp.isRunning(function(isRunning) {
    console.log('isRunning', isRunning);
    mm.set('running', isRunning);
  });

  mv.render();

  bp.addListener('ended', function() {
    mm.set({
      running: false,
      ended: true
    });
  });
}

window.onload = bp.executeWhenReady(startup);
