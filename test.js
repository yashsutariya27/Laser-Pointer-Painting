var socket = io.connect('http://10.112.10.93:3000');

let currentId = null;
socket.on('reload', id => {
	if (currentId && currentId !== id) {
		window.location.reload()
		return;
	}
	currentId = id;
});


var myCapture, // camera
	myVida;    // VIDA

/*
	Here we are trying to get access to the camera.
*/
function initCaptureDevice() {
	try {
		myCapture = createCapture(VIDEO);
		myCapture.size(640, 480);
		myCapture.elt.setAttribute('playsinline', '');
		myCapture.hide();
		console.log(
			'[initCaptureDevice] capture ready. Resolution: ' +
			myCapture.width + ' ' + myCapture.height
		);
	} catch (_err) {
		console.log('[initCaptureDevice] capture error: ' + _err);
	}
}

function setup() {
	createCanvas(1280, 960); // we need some space...
	initCaptureDevice(); // and access to the camera

	/*
		VIDA stuff. One parameter - the current sketch - should be passed to the
		class constructor (thanks to this you can use Vida e.g. in the instance
		mode).
	*/
	myVida = new Vida(this); // create the object
	/*
		Turn off the progressive background mode (we will use a static background
		image).
	*/
	myVida.progressiveBackgroundFlag = false;
	/*
		The value of the threshold for the procedure that calculates the threshold
		image. The value should be in the range from 0.0 to 1.0 (float).
	*/
	myVida.imageFilterThreshold = 0.05;
	/*
		You may need a horizontal image flip when working with the video camera.
		If you need a different kind of mirror, here are the possibilities:
			[your vida object].MIRROR_NONE
			[your vida object].MIRROR_VERTICAL
			[your vida object].MIRROR_HORIZONTAL
			[your vida object].MIRROR_BOTH
		The default value is MIRROR_NONE.
	*/
	//myVida.mirror = myVida.MIRROR_HORIZONTAL;
	/*
		In order for VIDA to handle blob detection (it doesn't by default), we set
		this flag.
	*/
	myVida.handleBlobsFlag = true;
	/*
		Normalized values of parameters defining the smallest and highest allowable
		mass of the blob.
	*/
	//myVida.normMinBlobMass = 0.0002;  // uncomment if needed
	//myVida.normMaxBlobMass = 0.5;  // uncomment if needed
	/*
		Normalized values of parameters defining the smallest and highest allowable
		area of the blob boiunding box.
	*/
	myVida.normMinBlobArea = 0.002;  // uncomment if needed
	//myVida.normMaxBlobArea = 0.5;  // uncomment if needed
	/*
		If this flag is set to "true", VIDA will try to maintain permanent
		identifiers of detected blobs that seem to be a continuation of the
		movement of objects detected earlier - this prevents random changes of
		identifiers when changing the number and location of detected blobs.
	*/
	myVida.trackBlobsFlag = true;
	/*
		Normalized value of the distance between the tested blobs of the current
		and previous generation, which allows treating the new blob as the
		continuation of the "elder".
	*/
	//myVida.trackBlobsMaxNormDist = 0.3; // uncomment if needed
	/*
		VIDA may prefer smaller blobs located inside larger or the opposite: reject
		smaller blobs inside larger ones. The mechanism can also be completely
		disabled. Here are the possibilities:
			[your vida object].REJECT_NONE_BLOBS
			[your vida object].REJECT_INNER_BLOBS
			[your vida object].REJECT_OUTER_BLOBS
		The default value is REJECT_NONE_BLOBS.
	*/
	//myVida.rejectBlobsMethod = myVida.REJECT_NONE_BLOBS; // uncomment if needed
	/*
		If this flag is set to "true", VIDA will generate polygons that correspond
		approximately to the shape of the blob. If this flag is set to "false", the
		polygons will not be generated. Default vaulue is false. Note: generating
		polygons can be burdensome for the CPU - turn it off if you do not need it.
	*/
	myVida.approximateBlobPolygonsFlag = true;
	/*
	 Variable (integer) that stores the value corresponding to the number of
	 polygon points describing the shape of the blobs. The minimum value of this
	 variable is 3.
	*/
	myVida.pointsPerApproximatedBlobPolygon = 8;

	frameRate(30); // set framerate
	myVida.setBackgroundImage(myCapture);
}

function draw() {
	if (myCapture !== null && myCapture !== undefined) { // safety first
		//background(0, 0, 255);
		/*
			Call VIDA update function, to which we pass the current video frame as a
			parameter. Usually this function is called in the draw loop (once per
			repetition).
		*/
		myVida.update(myCapture);
		/*
			Now we can display images: source video (mirrored) and subsequent stages
			of image transformations made by VIDA.
		*/
		image(myVida.currentImage, 0, 0);
		//image(myVida.backgroundImage, 640, 0);
		//image(myVida.differenceImage, 0, 480);
		image(myVida.thresholdImage, 640, 480);
		// let's also describe the displayed images
		noStroke();
		fill(255, 255, 255);
		text('camera', 20, 20);
		text('vida: static background image', 660, 20);
		text('vida: difference image', 20, 500);
		text('vida: threshold image', 660, 500);
		/*
			In this example, we use the built-in VIDA function for drawing blobs. We
			use the version of the function with two parameters (given in pixels)
			which are the coordinates of the upper left corner of the graphic
			representation of the blobs. VIDA is also equipped with a version of this
			function with four parameters (the meaning of the first and second
			parameter does not change, and the third and fourth mean width and height
			respectively). For example, to draw the blobs on the entire available
			surface, use the function in this way:
				[your vida object].drawBlobs(0, 0, width, height);
		*/
		myVida.drawBlobs(640, 480);
	}
	else {
		/*
			If there are problems with the capture device (it's a simple mechanism so
			not every problem with the camera will be detected, but it's better than
			nothing) we will change the background color to alarmistically red.
		*/
		background(255, 0, 0);
	}
}

/*
	Capture current video frame and put it into the VIDA's background buffer.
*/
function touchEnded() {
	if (myCapture !== null && myCapture !== undefined) { // safety first
		myVida.setBackgroundImage(myCapture);
		console.log('background set');
	}
}