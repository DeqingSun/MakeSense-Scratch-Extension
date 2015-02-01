
  
new (function() {
    var ext = this;
	var hasGP = false;
	var repGP;
	var axis_value = [0,0,0,0,0,0];
	

	function reportOnGamepad() {
		var gp = navigator.getGamepads()[0];
		//var html = "";
		//	html += "id: "+gp.id+"";

		//for(var i=0;i<gp.buttons.length;i++) {
		//	html+= "Button "+(i+1)+": ";
		//	if(gp.buttons[i].pressed) html+= " pressed";
		//	html+= "";
		//}

		for(var i=0;(i<gp.axes.length) && (i<6); i++) {
			axis_value[i]=gp.axes[i];
		}
	}

    var gamepadSupportAvailable = !!navigator.webkitGetGamepads || !!navigator.webkitGamepads || !!navigator.getGamepads;
	if (gamepadSupportAvailable){
		console.log("support gamepad");
		
		window.addEventListener("gamepadconnected", function(e) { 
			hasGP = true;
			console.log("connection event");
            repGP = window.setInterval(reportOnGamepad,100);
		}, false);
		window.addEventListener("gamepaddisconnected", function(e) {
			hasGP = false;
			console.log("disconnection event");
            window.clearInterval(repGP);	
		}, false);
	}else{
		console.log("Does not support gamepad");
	}

    ext._shutdown = function() {
		window.clearInterval(repGP);
    }

    ext._getStatus = function() {
		//console.log("_getStatus");
        if(!hasGP) return {status: 1, msg: 'Controller disconnected'};
        return {status: 2, msg: 'Controller connected'};
    }

    ext.readMakeSense = function(name) {
        var retval = null;
        switch(name) {
            case 'X': retval = (axis_value[0]); break;
            case 'Y': retval = (axis_value[1]); break;
            case 'Z': retval = (axis_value[2]); break;
            case 'X_Rotation': retval = (axis_value[3]); break;
            case 'Y_Rotation': retval = (axis_value[4]); break;
            case 'Z_Rotation': retval = (axis_value[5]); break;
        }
		//console.log(input[2]);
        return retval;
    }

    var descriptor = {
        blocks: [
            ['r', 'get MakeSense %m.readMakeSensePart', 'readMakeSense', 'X']
        ],
        menus: {
            readMakeSensePart: ['X', 'Y', 'Z', 'X_Rotation', 'Y_Rotation', 'Z_Rotation']
        }
    };
    ScratchExtensions.register('MakeSenseJoystick', descriptor, ext);
})();
