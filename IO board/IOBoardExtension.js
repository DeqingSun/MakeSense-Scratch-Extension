// IOboardExtension.js
// IO board Extension
//
// Deqing Sun, January 2015
//
//
// This is a Scratch Extension for IO board
(function() {

  var MAKESENSE = {
    type: 'hid',
    vendor: 0x04d8,
    product: 0xf3bb
  };

  var CHANNELS = [
    'Channel0', 'Channel1', 'Channel2', 'Channel3',
    'Channel4', 'Channel5', 'Channel6', 'Channel7'
  ];

  var ab = new Uint8Array(16);
  ab[0] = 3;
  ab[1] = 82;

  var device = null;
  var digital_input = [false, false, false, false, false, false, false, false];
  var analog_input = [0, 0, 0, 0, 0, 0, 0, 0];
  var pinmode = [0, 0, 0, 0, 0, 0, 0, 0]; //0:di 1:do 2:ai 3:ao
  var poller = null;
  var ext = this;
  var poll_needed = 0;
  var poll_phase = 8; //0~7 analog, 8 digital

  // Converts a byte into a value of the range -1 -> 1 with two decimal places of precision
  function convertByteStr(byte) {
    return (parseInt(byte, 16));
  }

  function stopPolling() {
    if (poller) clearInterval(poller);
    poller = null;
  }

  ext.whenMakeSense = function(name, op, val) {
    var sensorVal = input[CHANNELS.indexOf(name) + 2];
    if (op == '>') return sensorVal > val
    else if (op == '<') return sensorVal < val;
    else if (op == '=') return sensorVal == val;
  };


  ext.IO_digi_out = function(name, hl_str) {
    var channel_id = CHANNELS.indexOf(name);
    var hl = (hl_str == 'HIGH') ? "H" : "L";
    if (device) {
      //console.log("digi out");
      var bytes = new Uint8Array(16);
      bytes[0] = 1;
      bytes[1] = hl.charCodeAt(0);
      bytes[2] = channel_id + "0".charCodeAt(0);
      var ret_len = device.write(bytes.buffer);
      //console.log(ret_len);
    }
    pinmode[channel_id] = 1;
  };

  ext.readIOdigi = function(name) {
    var channel_id = CHANNELS.indexOf(name);
    if (pinmode[channel_id] != 0) {
      var bytes = new Uint8Array(16);
      bytes[0] = 1;
      bytes[1] = 'l'.charCodeAt(0);
      bytes[2] = channel_id + "0".charCodeAt(0);
      var ret_len = device.write(bytes.buffer);
      pinmode[channel_id] = 0;
    }
    return digital_input[channel_id];
  };

  ext.readIOanal = function(name) {
    var channel_id = CHANNELS.indexOf(name);
    if (pinmode[channel_id] != 2) {
      pinmode[channel_id] = 2;
    }
    return analog_input[channel_id];
  };


  ext._deviceConnected = function(dev) {



    if (device) return;
    //if(dev.info['interface_number'] != 1) return;
    console.log("dev conn");
    device = dev;
    device.open();
    //device.write(ab.buffer);

    poller = setInterval(function() {
      if (poll_needed > 0) {
        var input_raw = device.read(16);
        if (input_raw) {
          var input_arr = new Uint8Array(input_raw);
          if (input_arr[1] == 82) {
            var hex_value = parseInt(String.fromCharCode(input_arr[2], input_arr[3]), 16);
            for (var i = 0; i < 8; i++) {
              digital_input[i] = ((hex_value & (1 << i)) != 0);
            }
          } else if (input_arr[1] == 73) {
            var channel_id = parseInt(String.fromCharCode(input_arr[2]), 16);
            var hex_value = parseInt(String.fromCharCode(input_arr[3], input_arr[4]), 16);
            analog_input[channel_id] = hex_value;
          } else {
            console.log("unknown response");
            console.log(new Uint8Array(input_raw));
          }

          //input = new Uint8Array(input_raw);
        }
        poll_needed--;
      }
      do { //poll needed data
        poll_phase++;
        if (poll_phase > 8) poll_phase = 0;
      } while ((poll_phase <= 7 && pinmode[poll_phase] != 2));
      if (poll_phase <= 7) {
        var bytes = new Uint8Array(16);
        bytes[0] = 1;
        bytes[1] = "I".charCodeAt(0);
        bytes[2] = poll_phase + "0".charCodeAt(0);
        var ret_len = device.write(bytes.buffer);
        poll_needed += 1;
      } else if (poll_phase == 8) {
        var bytes = new Uint8Array(16);
        bytes[0] = 1;
        bytes[1] = "R".charCodeAt(0);
        var ret_len = device.write(bytes.buffer);
        poll_needed += 1;
      }
      //console.log(poll_phase);
      //device.write(ab.buffer);
    }, 20);
    //setInterval(function() { console.log(input); }, 100);
  };

  ext._deviceRemoved = function(dev) {
    if (device != dev) return;
    console.log("dev remove");
    device = null;
    stopPolling();
  };

  ext._shutdown = function() {
    if (poller) clearInterval(poller);
    poller = null;

    if (device) device.close();
    device = null;
  };

  ext._getStatus = function() {
    if (!device) return {
      status: 1,
      msg: 'Controller disconnected'
    };
    return {
      status: 2,
      msg: 'Controller connected'
    };
  };

  var descriptor = {
    blocks: [
      [' ', 'turn %m.channels to Digital Out %m.digi_hl', 'IO_digi_out', 'Channel0', 'HIGH'],
      ['b', 'IO %m.channels is digital HIGH', 'readIOdigi', 'Channel0'],
      ['r', 'get analog on %m.channels', 'readIOanal', 'Channel0'],
      ['h', 'when Make!Sense %m.channels %m.ops %n', 'whenMakeSense', 'Channel0', '>', 100]
    ],
    menus: {
      channels: CHANNELS,
      digi_hl: ['HIGH', 'low'],
      ops: ['<', '=', '>']
    }
  };

  ScratchExtensions.register('IO board', descriptor, ext, MAKESENSE);

})({});
