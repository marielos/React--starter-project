import '../assets/stylesheets/base.scss'
import React, { Component } from 'react'
require("../assets/stylesheets/flexboxgrid.css")


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
		console.log('mounting camera module')

	

		if (!this.state.isIphone) {
			this.recordVideo()
		}

		// document.addEventListener('keydown', function(event) {
		// 	if (event.code === "Space") {
		// 		this.takePhoto()
		// 	}
		// }.bind(this))
	
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


	tookPicture(event) {
	
		if (event.target.files && event.target.files[0]) {
		    var reader = new FileReader();
		    reader.onload = function (e) {
		      var image = document.getElementById('img-review')
		      image.setAttribute('src', e.target.result)

		      this.takePhoto()
		    }.bind(this)
		    reader.readAsDataURL(event.target.files[0]);
		}
	}




// ------- seperate getting the dimensions to a different method--------- 

	takePhoto() {
		var canvas = document.getElementById('img_canvas'), //document.getElementById('canvas'),
			context = canvas.getContext('2d'),
			video = document.getElementById('video'),
		    video_height = video.getBoundingClientRect().height,
			video_width = video.getBoundingClientRect().width
				

// -------- test for phone ---------
		canvas.height = video_height
		canvas.width = video_width

		if(this.state.isIphone) {

			var image = document.getElementById('img-review'),
			image_height = image.getBoundingClientRect().height,
			image_width = image.getBoundingClientRect().width

			this.setState({
				img_src: image.src
			})
			context.drawImage(image, 0, 0, image_width, image_height)
		} else {
			context.drawImage(video, 0, 0, video_width, video_height)
		}

		this.createImageWithTextCanvas() 
	}


	createImageWithTextCanvas() {
		var canvas = document.createElement('canvas'), //document.getElementById('canvas'),
			context = canvas.getContext('2d'),
			photo = document.getElementById('img_canvas'),
		    photo_height = photo.height, //getBoundingClientRect().height,
			photo_width = photo.width, //getBoundingClientRect().width,
			canvas_height = photo_height +100

				
		canvas.height = canvas_height//this.state.img_height +100
		canvas.width = photo_width//this.state.img_width

		context.drawImage(photo, 0, 0, photo_width, photo_height)

		context.font = '20px Sentinel'

		this.wrapText(context, 15, photo_height+30, photo_width-30, 20)

		// draw border
		context.moveTo(0,0)
		context.lineTo(photo_width,0)
		context.lineTo(photo_width, canvas_height)
		context.lineTo(0, canvas_height)
		context.lineTo(0, 0)
		context.stroke()

		this.canvasToImage(canvas)
	}


	canvasToImage(canvas) {
		var data_url = canvas.toDataURL("image/png"),
			image_blob = this.dataURItoBlob(data_url)

		this.setState({
			image_taken: true
		})

		this.props.showImage(image_blob, data_url)
	}

	wrapText(context, x, y, maxWidth, lineHeight) {
		if (!this.state.image_taken) return

		var text = document.getElementById('text-input').value
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




// change the name of the input file button 
// 


	renderTextInput() {
		if (this.state && this.state.image_taken) {
			return (
				<input id='text-input' type='text' placeholder='write a caption for your image' maxLength="250" onChange={this.createImageWithTextCanvas.bind(this)}/>	
			)
		} else {
			return null
		}
	}

	renderMobile(){

	}


	renderDesktop() {
		return(
			<div className='main-container row'>
				<div className='box'>
					<video id="video" />
					<canvas id='canvas' />
					<canvas id='img_canvas' />
					{this.renderTextInput()}	
					<button className='pic-button' onClick={this.takePhoto.bind(this)}> 
						{this.state && this.state.image_taken ? 'Update Photo' : 'Take Photo' } 
					</button>
				</div>
			</div>
		)
	}


	render() {
		return (
			<div id='video-text-container'>
			
			{md.is('iPhone') ?
				<div>
					{this.state.img_src}
			  		<img id='img-review' src={require('./placeholder1.png')} height={IMG_HEIGHT}/>			
			  		<input id='image' type="file" name="image" accept="image/*" capture="user" onChange={this.tookPicture.bind(this)}/>
			  		<button onClick={this.takePhoto.bind(this)}> Submit Picture </button>
			  	</div>
			:
				this.renderDesktop()
			}
			</div>

		)
	}

}

export default Camera;
