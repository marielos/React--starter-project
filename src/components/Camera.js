import '../assets/stylesheets/base.scss'
import React, { Component } from 'react'



/* ----------------------------------------- */

const HEIGHT = 480,
	  WIDTH = 640


class Camera extends Component {

	componentWillMount(){
		this.setState({
			why: 'too soon to know'
		})
	}

	componentDidMount() {
		this.recordVideo()
		document.addEventListener('keydown', function(event) {
			if (event.code === "Space") {
				this.takePhoto()
			}
		}.bind(this))
	
	}

	recordVideo() {

		// Grab elements, create settings, etc.
		var video = document.getElementById('video');

		// Get access to the camera!
		if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			console.log(navigator.mediaDevices)
			console.log(navigator.mediaDevices.enumerateDevices())
		    // Not adding `{ audio: true }` since we only want video now
		    navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
		        video.src = window.URL.createObjectURL(stream);
		        video.play();
		    });
		}


		// // List cameras and microphones.

		// navigator.mediaDevices.enumerateDevices()
		// .then(function(devices) {
		//   devices.forEach(function(device) {
		//     console.log(device.kind + ": " + device.label +
		//                 " id = " + device.deviceId);
		//   });
		// })
		// .catch(function(err) {
		//   console.log(err.name + ": " + err.message);
		// });
	}


	takePhoto() {
		var canvas = document.createElement('canvas'), //document.getElementById('canvas'),
			context = canvas.getContext('2d'),
			video = document.getElementById('video')

		canvas.height = HEIGHT
		canvas.width = WIDTH
		context.drawImage(video, 0, 0, 640, 480)


		var data_url = canvas.toDataURL("image/png"),
			image_blob = this.dataURItoBlob(data_url)

		this.props.showImage(image_blob, data_url)
	}


	dataURItoBlob(dataURI) {
	    // convert base64/URLEncoded data component to raw binary data held in a string
	    var byteString;
	    if (dataURI.split(',')[0].indexOf('base64') >= 0)
	        byteString = atob(dataURI.split(',')[1]);
	    else
	        byteString = unescape(dataURI.split(',')[1]);

	    // separate out the mime component
	    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

	    // write the bytes of the string to a typed array
	    var ia = new Uint8Array(byteString.length);
	    for (var i = 0; i < byteString.length; i++) {
	        ia[i] = byteString.charCodeAt(i);
	    }

	    return new Blob([ia], {type:mimeString});
	}


	render() {
		return (
			<video id="video" width={WIDTH} height={HEIGHT} ></video>
		)
	}

}

export default Camera;
