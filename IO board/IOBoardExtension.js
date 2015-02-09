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
  var input = null;
  var poller = null;
  var ext = this;
  var poll_needed = 0;

  // Converts a byte into a value of the range -1 -> 1 with two decimal places of precision
  function convertByteStr(byte) {
    return (parseInt(byte, 16));
  }

  function stopPolling() {
    if (poller) clearInterval(poller);
    poller = null;
  }

  ext.readMakeSense = function(name) {
    return input[CHANNELS.indexOf(name) + 2];
  };

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
      console.log("digi out");
      var bytes = new Uint8Array(16);
      bytes[0] = 1;
      bytes[1] = hl.charCodeAt(0);
      bytes[2] = channel_id + "0".charCodeAt(0);
      var ret_len = device.write(bytes.buffer);
      console.log(ret_len);
    }
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
          input = new Uint8Array(input_raw);
        }
        poll_needed--;
      }
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

      ['r', 'get Make!Sense %m.channels', 'readMakeSense', 'Channel0'],
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