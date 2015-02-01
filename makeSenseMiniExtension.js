new (function() {


	// variables
	var recorder = null;
	var recording = false;
	var recordingLength = 0;
	var volume = null;
	var audioInput = null;
	var sampleRate = 44100;
	var audioContext = null;
	var context = null;


	var period_counter_pos = 0,period_counter_neg = 0;
	var last_period_pos = 0,last_period_neg = 0;
	var pos_neg_count=0;
	var temp = 0;
	var threshold = 1.0/20;
	var pos_output=false;

	var uart_phase=0;uartdata=0;
	
	var device_detected=false;
	var disable_detect_time_out;
	var value_now=0;

	console.log("Start Makesense Mini EXT");

	// feature detection 
	if (!navigator.getUserMedia)
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
		navigator.mozGetUserMedia || navigator.msGetUserMedia;

	if (navigator.getUserMedia){
		navigator.getUserMedia({audio:true}, success, function(e) {
			alert('Error capturing audio.');
		});
	} else alert('getUserMedia not supported in this browser.');


	function success(e){
		audioTracks = e.getAudioTracks();
		console.log(audioTracks);
		
		// creates the audio context
		audioContext = window.AudioContext || window.webkitAudioContext;
		context = new audioContext();

		// creates a gain node
		volume = context.createGain();
		
		var filter = context.createBiquadFilter();
		filter.type = 0;  // In this case it's a lowpass filter
		filter.frequency.value = 3000;

		// creates an audio node from the microphone incoming stream
		audioInput = context.createMediaStreamSource(e);

		// connect the stream to the gain node
		audioInput.connect(filter);

		// From the spec: This value controls how frequently the audioprocess event is 
		//dispatched and how many sample-frames need to be processed each call. 
		//Lower values for buffer size will result in a lower (better) latency. 
		//Higher values will be necessary to avoid audio breakup and glitches 
		var bufferSize = 2048;
		recorder = context.createScriptProcessor(bufferSize, 2, 2);

		recorder.onaudioprocess = function(e){
			//console.log ( "GET");//!!!!!!!!
			temp++;
			//outputElement.innerHTML = 'get data '+temp;
			//if (!recording) return;
			var left = e.inputBuffer.getChannelData (0);
			var right = e.inputBuffer.getChannelData (1);
			// we clone the samples
			sound_data=new Float32Array (left);
			var i;
			for(i=0;i<bufferSize;i++){
				var element=sound_data[i];
				if (pos_output){
					period_counter_pos++;
					if (element<-threshold) {
						pos_output=false;   //FALLING EDGE
						last_period_pos=period_counter_pos;
						period_counter_pos=0;
						
						var pos_neg_diff=last_period_neg-last_period_pos;
						
						if (pos_neg_diff<3 && pos_neg_diff>-3 ){
							pos_neg_count--;
							if (pos_neg_count<=-10) pos_neg_count=-10;
						}
						
						if (pos_neg_count<-5){
							var period=last_period_neg+last_period_pos;
							period_counter_pos=0;
							//detect_period, 1200HZ 36.75 2200HZ 20.05
							//console.log(period);
							if (period>16 && period<63){
								add_a_bit(period);
							}else{	//Not a valid bit
									
							}
						}
						
						//outputElement.innerHTML = 'period '+period;
						
					}
				}else{
					period_counter_neg++;
					if (element>threshold){   //RISING EDGE
						pos_output=true;
						last_period_neg=period_counter_neg;
						period_counter_neg=0;
						
						var pos_neg_diff=last_period_neg-last_period_pos;
						
						if (pos_neg_diff<3 && pos_neg_diff>-3 ){
							pos_neg_count++;
							if (pos_neg_count>=10) pos_neg_count=10;
						}
						
						if (pos_neg_count>5){
							var period=last_period_neg+last_period_pos;
							period_counter_pos=0;
							//detect_period, 1200HZ 36.75 2200HZ 20.05
							//console.log(period);
							if (period>16 && period<63){
								add_a_bit(period);
							}else{	//Not a valid bit
									
							}
						}
					}
				}
				//console.log(pos_neg_count);
			}
			//leftchannel.push (new Float32Array (left));
		   // rightchannel.push (new Float32Array (right));
			//recordingLength += bufferSize;
		}

		// we connect the recorder
		filter.connect (recorder);
		recorder.connect (context.destination); 
	}

	function add_a_bit(period){
		var uart_bit=0;
		if (period>30){	//between 26 and 39.5, no good reason
			uart_bit=1;
		}
		switch (uart_phase){
			case 0:
				if (uart_bit==0){
					uart_phase=1;
					uartdata=0;
				}
				break;							
			case 1:case 2:case 3:case 4:case 5:case 6:case 7:case 8:
				if (uart_bit==1)  uartdata|=(1<<(uart_phase-1));
				uart_phase++;
				break;
			case 9:
				if (uart_bit==1){	//this is a valid byte
				//	outputElement2.innerHTML = 'data '+uartdata;
				//	console.log(uartdata);
					value_now=uartdata;
					device_detected=true;
					clearTimeout(disable_detect_time_out);
					disable_detect_time_out=setTimeout(function(){device_detected=false},500);
				}
				
				uart_phase=0;	
			default:
				uart_phase=0;							
		}
		
	}

    var ext = this;
	
    ext._shutdown = function() {
    }

    ext._getStatus = function() {
        if(!device_detected) return {status: 1, msg: 'Controller disconnected'};
        return {status: 2, msg: 'Controller connected'};
    }

    ext.readMakeSenseMini = function(name) {
        var retval = value_now;
        return retval;
    }

    var descriptor = {
        blocks: [
            ['r', 'get MakeSenseMini', 'readMakeSenseMini', 'X']
        ],
    };
    ScratchExtensions.register('MakeSenseMini', descriptor, ext);
})();
