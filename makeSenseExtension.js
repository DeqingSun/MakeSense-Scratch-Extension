// makeSenseTest.js
// Make!Sense Scrtch Extension
//
// modified by Kreg Hanning, January 2015
//
// modified version of joystickExtension.js
// Shane M. Clements, November 2013
//
// This is a Scratch Extension for the Make!Sense Max board
  
(function() {

  var MAKESENSE = {
    type: 'hid',
    vendor: 0x04d8,
    product: 0xf46a
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

  // Converts a byte into a value of the range -1 -> 1 with two decimal places of precision
  function convertByteStr(byte) { return (parseInt(byte, 16)); }

  function stopPolling() {
    if(poller) clearInterval(poller);
    poller = null;
  }

  ext.readMakeSense = function(name) {
    return input[CHANNELS.indexOf(name)+2];
  };

  ext.whenMakeSense = function(name, op, val) {
    var sensorVal = input[CHANNELS.indexOf(name)+2];
    if (op == '>') return sensorVal > val
    else if (op == '<') return sensorVal < val;
    else if (op == '=') return sensorVal == val;
  };

  ext._deviceConnected = function(dev) {  //if we don't open, this will be called constantly
    console.log("ext._deviceConnected");
    console.log(dev);
    if(device) {
      if (dev.info["vendor_id"]==1240 && dev.info["product_id"]==62570 && dev.info['interface_number'] == 2) {
        //force reconnect
        device.close();
        device=null;
      }else{
        return;
      }
    }
    if(dev.info['interface_number'] != 2) return;
    device = dev;
    device.open();
    device.write(ab.buffer);

    poller = setInterval(pollDevice, 50);
    //setInterval(function() { console.log(input); }, 100);
  };
  
  var pollDevice = function(){
    if (device==null) {
      stopPolling();
      return;
    }
    var input_raw = device.read(16);
    if (input_raw!=null) {
      input = new Uint8Array(input_raw);
      console.log(input);
    }
    device.write(ab.buffer);
  }

  ext._deviceRemoved = function(dev) {
    console.log("ext._deviceRemoved");
    console.log(dev);
    console.log(device);
    
    if (dev.info["vendor_id"]==1240 && dev.info["product_id"]==62570 ) {
      device = null;
      stopPolling();
    }
    
    if(device != dev) return;
    device = null;
    stopPolling();
  };

  ext._shutdown = function() {
    if(poller) clearInterval(poller);
    poller = null;

    if(device) device.close();
    device = null;
  };

  ext._getStatus = function() {
    if(!device) return {status: 1, msg: 'Controller disconnected'};
    return {status: 2, msg: 'Controller connected'};
  };

  var descriptor = {
    blocks: [
      ['r', 'get Make!Sense %m.channels', 'readMakeSense', 'Channel0'],
      ['h', 'when Make!Sense %m.channels %m.ops %n', 'whenMakeSense', 'Channel0', '>', 100]
    ],
    menus: {
      channels: CHANNELS,
      ops: ['<', '=', '>']
    }
  };

  ScratchExtensions.register('Make!Sense', descriptor, ext, MAKESENSE);

})({});
