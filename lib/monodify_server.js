'use strict';

module.exports = MonodifyServer;

function MonodifyServer(io, spotify) {
  this.io = io;
  this.spotify = spotify;
  this.sockets = [];
  this.tries = {};
  this.resetTimeouts = {};
  this.muted = false;

  this.io.sockets.on('connection', this.handleConnection.bind(this));
}

MonodifyServer.prototype.startPolling = function() {
  if (!this.currentStateInterval) {
    this.currentStateInterval = setInterval(this.getCurrentState.bind(this), 500);
  }
};

MonodifyServer.prototype.stopPolling = function() {
  clearInterval(this.currentStateInterval);
  delete this.currentStateInterval;
};

MonodifyServer.prototype.handleConnection = function(socket) {
  this.sockets.push(socket);
  this.getCurrentState();
  this.getCurrentTrack();
  this.getCurrentArtwork();
  this.startPolling();

  var self = this;

  ['next', 'previous', 'playPause', 'volumeUp', 'volumeDown'].forEach(function(event) {
    socket.on(event, function() {
      self.spotify[event].call(undefined, self.getCurrentState.bind(self));
    });
  });

  socket.on('disconnect', this.handleDisconnect.bind(this, socket));
  socket.on('setVolume', this.setVolume.bind(this));
  socket.on('muteUnmute', this.muteUnmute.bind(this));
  socket.on('jumpTo', this.jumpTo.bind(this));
  socket.on('playTrack', this.playTrack.bind(this));
};

MonodifyServer.prototype.handleDisconnect = function(socket) {
  this.sockets = this.sockets.filter(function(closedSocket) {
    return closedSocket !== socket;
  });

  if (this.sockets.length === 0) this.stopPolling();
};

MonodifyServer.prototype.setVolume = function(volume) {
  this.muted = false;
  this.spotify.setVolume(volume, this.getCurrentState.bind(this));
};

MonodifyServer.prototype.muteUnmute = function() {
  if (this.muted) {
    this.muted = false;
    this.spotify.unmuteVolume(this.getCurrentState.bind(this));
  } else {
    this.muted = true;
    this.spotify.muteVolume(this.getCurrentState.bind(this));
  }
};

MonodifyServer.prototype.jumpTo = function(second) {
  this.spotify.jumpTo(second, this.getCurrentState.bind(this));
};

MonodifyServer.prototype.playTrack = function(spotifyUrl) {
  this.spotify.playTrack(spotifyUrl);
};

MonodifyServer.prototype.getCurrentTrack = function() {
  var sendTrack = this.emitToAllSockets.bind(this, 'currentTrack');

  if (this.currentTrack) {
    sendTrack(this.currentTrack);
    return;
  }

  this.spotify.getTrack(function(err, track) {
    if (err) {
      this.retry(this.getCurrentTrack);
      return;
    }

    this.currentTrack = track;
    sendTrack(this.currentTrack);
  }.bind(this));
};

MonodifyServer.prototype.getCurrentState = function() {
  this.spotify.getState(function(err, state) {
    if (!err) {
      state.muted = this.muted;
      this.emitToAllSockets('currentState', state);
      if (!this.currentTrack || this.currentTrack.id !== state.track_id) {
        this.trackHasChanged();
      }
    }
  }.bind(this));
};

MonodifyServer.prototype.getCurrentArtwork = function() {
  var self = this;
  var sendArtwork = this.emitToAllSockets.bind(this, 'currentArtwork');

  var request = require('request').defaults({
    encoding: null
  });


  if (this.currentArtwork) {
    sendArtwork(this.currentArtwork);
    return;
  }

  this.spotify.getArtwork(function(err, artworkUri) {
    // for some weird reason the artwork path applescript likes to return undefined
    // every once in a while, just ignore that and retry
    if (err || typeof artworkUri === 'undefined') {
      if (err) console.error(err);
      self.retry(self.getCurrentArtwork);
      return;
    }

    request.get(artworkUri, function(error, response, body) {
      if (err) {
        console.error(err);
        self.retry(self.getCurrentArtwork);
        return;
      }
      if (!error && response.statusCode === 200) {
        self.currentArtwork = new Buffer(body).toString('base64');
        sendArtwork(self.currentArtwork);
      }
    });
  });
};

MonodifyServer.prototype.emitToAllSockets = function(name, data) {
  this.sockets.forEach(function(socket) {
    socket.emit(name, data);
  });
};

MonodifyServer.prototype.trackHasChanged = function() {
  delete this.currentTrack;
  delete this.currentArtwork;
  this.getCurrentTrack();
  this.getCurrentArtwork();
};

MonodifyServer.prototype.retry = function(fn, timeout) {
  this.tries[fn] = this.tries[fn] || 0;

  if (this.tries[fn]++ >= 5) return;

  setTimeout(fn.bind(this), timeout || 250);
  if (this.resetTimeouts[fn]) clearTimeout(this.resetTimeouts[fn]);

  this.resetTimeouts[fn] = setTimeout(function() {
    this.tries[fn] = 0;
  }.bind(this), 10000);
};
