const canvas = new OffscreenCanvas(480, 360);


function handleSuccess(stream) {
	console.log(stream)
	//	video.srcObject = stream;
	//	canvas.width = video.videoWidth;
	//	canvas.height = video.videoHeight;
	//	canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
}

function handleError(error) {
	console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

navigator.mediaDevices.getUserMedia({
	audio: false,
	video: true
}).then(handleSuccess).catch(handleError);