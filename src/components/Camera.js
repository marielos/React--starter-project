import '../assets/stylesheets/base.scss'
import React, { Component } from 'react'
require("../assets/stylesheets/flexboxgrid.css")


// pass as prop
var MobileDetect = require('mobile-detect'),
md = new MobileDetect(navigator.userAgent)


/* ----------------------------------------- */

const IMG_HEIGHT = 480,
	  IMG_WIDTH = 640,
	  CANVAS_HEIGHT = 580,
	  CANVAS_WIDTH = 640


class Camera extends Component {

	componentWillMount(){
		this.setState({
			isIphone : md.is('iPhone')
		})
	}

	componentDidMount() {
		if (!this.state.isIphone) {
			this.recordVideo()
		}
	}

	recordVideo() {
		// Grab elements, create settings, etc.
		var video = document.getElementById('video');
		console.log('about to record video')
		// Get access to the camera!

		if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia ) {
			console.log(navigator.mediaDevices)
			console.log(navigator.mediaDevices.enumerateDevices())
		    // Not adding `{ audio: true }` since we only want video now
		    navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
		        video.src = window.URL.createObjectURL(stream)
		        video.play()

		    }.bind(this))
		} else {
			console.log('no mediaDevices')
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



	getImage() {
		if(this.state.isIphone) {

		} else {

		}
	}

	openCamera() {
		var elem = document.getElementById("image-input");
		elem.click()
	}


	takePhotoMobile(event) {
	
		if (event.target.files && event.target.files[0]) {
		    var reader = new FileReader();
		    reader.onload = function (e) {
		      var image = document.getElementById('img-preview')
		      image.setAttribute('src', e.target.result)

		      this.props.photoTaken(image) 
		    }.bind(this)
		    reader.readAsDataURL(event.target.files[0]);
		}
	}

	takePhotoDesktop() {
		var canvas = document.getElementById('img-preview'), //document.getElementById('canvas'),
			context = canvas.getContext('2d'),
			video = document.getElementById('video'),
		    video_height = video.getBoundingClientRect().height,
			video_width = video.getBoundingClientRect().width
				
		canvas.height = video_height
		canvas.width = video_width
		context.drawImage(video, 0, 0, video_width, video_height)

		this.props.photoTaken(canvas) 
	}


	renderMobile(){
		return(
			<div>
				{this.state && this.state.image_taken ? '' : <img id='img-preview' src={require('./placeholder1.png')}/> }
		  					
		  		<input id='image-input' type="file" name="image" accept="image/*" capture="user" onChange={this.takePhotoMobile.bind(this)}/>
		  		<button className='pic-button' onClick={this.openCamera.bind(this)}> 
		  			{this.state && this.state.image_taken ? 'Change Photo' : 'Take Photo' } 
		  		</button>
		  		<img id='img-holder'/>
		  	</div>
	  	)
	}


	renderDesktop() {
		return(
			<div className='main-container row'>
				<div className='box'>
					<video id="video" />
					<canvas id='canvas' />
					<canvas id='img-holder' />
					<button className='pic-button' onClick={this.takePhotoDesktop.bind(this)}> 
						{this.state && this.state.image_taken ? 'Update Photo' : 'Take Photo' } 
					</button>
				</div>
			</div>
		)
	}


	render() {
		return (
			<div id='camera-video-container'>
				{md.is('iPhone') ?
					this.renderMobile()
				:
					this.renderDesktop()
				}
			</div>

		)
	}

}

export default Camera;
