import '../assets/stylesheets/base.scss'
import React, { Component } from 'react'



/* ----------------------------------------- */

const IMG_HEIGHT = 480,
	  IMG_WIDTH = 640,
	  CANVAS_HEIGHT = 580,
	  CANVAS_WIDTH = 640


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
			// video = document.getElementById('video-text-container')
			video = document.getElementById('video'),
			text = document.getElementById('text-input').value

		canvas.height = CANVAS_HEIGHT
		canvas.width = CANVAS_WIDTH
		context.font = '20px Sentinel'

		context.drawImage(video, 0, 0, IMG_WIDTH, IMG_HEIGHT)
		this.wrapText(context, text, 15, IMG_HEIGHT+30, CANVAS_WIDTH-30, 20)
		// context.fillText(text, 10, IMG_HEIGHT+50)

		// draw border
		context.moveTo(0,0)
		context.lineTo(CANVAS_WIDTH,0)
		context.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT)
		context.lineTo(0, CANVAS_HEIGHT)
		context.lineTo(0, 0)
		context.stroke()

		var data_url = canvas.toDataURL("image/png"),
			image_blob = this.dataURItoBlob(data_url)

		this.props.showImage(image_blob, data_url)
	}

	wrapText(context, text, x, y, maxWidth, lineHeight) {
		console.log(text)
        var words = text.split(' ');
        var line = '';

        for(var n = 0; n < words.length; n++) {
          var testLine = line + words[n] + ' ';
          var metrics = context.measureText(testLine);
          var testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
          }
          else {
            line = testLine;
          }
        }
        context.fillText(line, x, y);
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
			<div id='video-text-container'>
				<video id="video" width={IMG_WIDTH} height={IMG_HEIGHT}/>
				<input id='text-input' type='text' placeholder='write a caption for your image' maxLength="250"/>
			</div>

		)
	}

}

export default Camera;
