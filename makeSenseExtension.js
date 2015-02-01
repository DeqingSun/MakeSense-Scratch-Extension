// joystickExtension.js
// Shane M. Clements, November 2013
// Joystick Scratch Extension
//
// This is an extension for development and testing of the Scratch Javascript Extension API.
  
new (function() {
    var device = null;
    var input = null;
    var poller = null;
    var ext = this;

    ext._deviceConnected = function(dev) {
        if(device) return;
		
		console.log("OK");

        device = dev;
        device.open();

        poller = setInterval(function() {

			var input_raw = device.read(16);
			if (1) input=new Uint8Array(input_raw);
			//console.log(input_raw.byteLength);
			//console.log(input[0]);
			
			var ab = new Uint8Array(16);
			ab[0]=1;
			ab[1]=82;
            device.write(ab.buffer);
        }, 10);

        //setInterval(function() { console.log(input); }, 100);
    };

    ext._deviceRemoved = function(dev) {
        if(device != dev) return;
        device = null;
        stopPolling();
    };

    function stopPolling() {
        if(poller) clearInterval(poller);
        poller = null;
    }

    ext._shutdown = function() {
        if(poller) clearInterval(poller);
        poller = null;

        if(device) device.close();
        device = null;
    }

    ext._getStatus = function() {
		//console.log("_getStatus");
        if(!device) return {status: 1, msg: 'Controller disconnected'};
        return {status: 2, msg: 'Controller connected'};
    }

    // Converts a byte into a value of the range -1 -> 1 with two decimal places of precision
    function convertByteStr(byte) { return (parseInt(byte, 16)); }
    ext.readMakeSense = function(name) {
        var retval = null;
        switch(name) {
            case 'Channel0': retval = (input[2]); break;
            case 'Channel1': retval = (input[3]); break;
			case 'Channel2': retval = (input[4]); break;
			case 'Channel3': retval = (input[5]); break;
			case 'Channel4': retval = (input[6]); break;
            case 'Channel5': retval = (input[7]); break;
			case 'Channel6': retval = (input[8]); break;
			case 'Channel7': retval = (input[9]); break;
        }
		//console.log(input[2]);
        return retval;
    }

    var descriptor = {
        blocks: [
            ['r', 'get MakeSense %m.readMakeSensePart', 'readMakeSense', 'Channel0']
        ],
        menus: {
            readMakeSensePart: ['Channel0', 'Channel1', 'Channel2', 'Channel3', 'Channel4', 'Channel5', 'Channel6', 'Channel7']
        }
    };
    ScratchExtensions.register('MakeSense', descriptor, ext, {type: 'hid', vendor:0x94D8, product:0x0055});
})();
