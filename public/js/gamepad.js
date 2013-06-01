(function(window, document) {

  var Gamepad = function(cockpit) {
    console.log("Loading gamepad plugin.");
    this.cockpit = cockpit;
    this.ticking = false;
    this.gamepads = [];
    this.prevRawGamepadTypes = [];
    this.prevTimestamps = [];

    this.pitch = 0;
    this.roll = 0;
    this.yaw = 0;

    var gamepadSupportAvailable = (
        !! navigator.webkitGetGamepads ||
        !! navigator.webkitGamepads ||
        (navigator.userAgent.indexOf('Firefox/') != -1));
    if (!gamepadSupportAvailable) {
      console.log('Gamepad not supported.');
    } else {
      window.addEventListener('MozGamepadConnected',
                              this.onGamepadConnect.bind(this),
                              false);
      window.addEventListener('MozGamepadDisconnected',
                              this.onGamepadDisconnect.bind(this),
                              false);
      if (!! navigator.webkitGamepads || !! navigator.webkitGetGamepads) {
        this.startPolling();
      }

      // Setup a timer to send motion command
      setInterval(this.sendCommands.bind(this), 100);
    }
  };

  Gamepad.prototype.sendCommands = function() {
    // Yaw.
    var speed = 0;
    var direction = 'clockwise';
    if (Math.abs(this.yaw) > 0.05) {
      speed = Math.abs(this.yaw);
      direction = this.yaw > 0 ? 'clockwise' : 'counterClockwise';
    }
    this.cockpit.socket.emit('/pilot/move', {
      action: direction,
      speed: speed
    });

    speed = 0;
    direction = 'front';
    if (Math.abs(this.pitch) > 0.05) {
      speed = Math.abs(this.pitch);
      direction = this.pitch > 0 ? 'back' : 'front';
    }
    this.cockpit.socket.emit('/pilot/move', {
      action: direction,
      speed: speed
    });

    speed = 0;
    direction = 'right';
    if (Math.abs(this.roll) > 0.05) {
      speed = Math.abs(this.roll);
      direction = this.roll > 0 ? 'right' : 'left';
    }
    this.cockpit.socket.emit('/pilot/move', {
      action: direction,
      speed: speed
    });
  };

  Gamepad.prototype.onGamepadConnect = function(event) {
    this.gamepads.push(event.gamepad);
    //tester.updateGamepads(gamepadSupport.gamepads);
    this.startPolling();
  };

  Gamepad.prototype.onGamepadDisconnect = function(event) {
    for (var i in this.gamepads) {
      if (this.gamepads[i].index == event.gamepad.index) {
        this.gamepads.splice(i, 1);
        break;
      }
    }
    if (this.gamepads.length == 0) {
      this.stopPolling();
    }
    //tester.updateGamepads(gamepadSupport.gamepads);
  };

  Gamepad.prototype.startPolling = function() {
    if (!this.ticking) {
      this.ticking = true;
      this.tick();
    }
  };

  Gamepad.prototype.stopPolling = function() {
    this.ticking = false;
  };

  Gamepad.prototype.tick = function() {
    this.pollStatus();
    this.scheduleNextTick();
  };

  Gamepad.prototype.scheduleNextTick = function() {
    if (this.ticking) {
      requestAnimationFrame(this.tick.bind(this));
    }
  };

  Gamepad.prototype.pollStatus = function() {
    this.pollGamepads();
    for (var i in this.gamepads) {
      var gamepad = this.gamepads[i];
      if (gamepad.timestamp && (gamepad.timestamp == this.prevTimestamps[i])) {
        continue;
      }
      this.prevTimestamps[i] = gamepad.timestamp;
      this.updateDisplay(i);
    }
  };

  Gamepad.prototype.pollGamepads = function() {
    var rawGamepads = ((navigator.webkitGetGamepads &&
                        navigator.webkitGetGamepads())
                       || navigator.webkitGamepads);
    if (rawGamepads) {
      this.gamepads = [];
      var gamepadsChanged = false;
      for (var i = 0; i < rawGamepads.length; i++) {
        if (typeof rawGamepads[i] != this.prevRawGamepadTypes[i]) {
          gamepadsChanged = true;
          this.prevRawGamepadTypes[i] = typeof rawGamepads[i];
        }
        if (rawGamepads[i]) {
          this.gamepads.push(rawGamepads[i]);
        }
      }
      if (gamepadsChanged) {
        //tester.updateGamepads(gamepadSupport.gamepads);
      }
    }
  };

  Gamepad.prototype.updateDisplay = function(gamepadId) {
    var gamepad = this.gamepads[gamepadId];
    var roll = gamepad.axes[0];
    var pitch = gamepad.axes[1];
    var yaw = gamepad.axes[5];
    this.pitch = pitch;
    this.roll = roll;
    this.yaw = yaw;
  };


  window.Cockpit.plugins.push(Gamepad);

}(window, document));
