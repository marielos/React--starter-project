import '../assets/stylesheets/base.scss'
import React, { Component } from 'react'
import 'whatwg-fetch'
import Camera from './Camera.js'
require("../assets/stylesheets/flexboxgrid.css")

var MobileDetect = require('mobile-detect'),
md = new MobileDetect(navigator.userAgent)



/* ----------------------------------------- */

class App extends Component {

  componentWillMount(){
    this.setState({
       screenshot: null,
       posting: false
    })
  }

  componentDidMount() {
    // this.exGetLocalData()
  }


  testCallBackFn(data) {
    this.setState({
       screenshot: null,
       image_blob: null,
       posting: false
    })
    console.log(data)
  }






  /*  
  Example calls:  
    
   this.postRequestToServer('http://localhost:5000/upload_image', {image:image_blob}, this.testCallBackFn.bind(this))

  */
  postRequestToServer(path, data_blobs, callback_fn) {

    var formData  = new FormData();
    for(var name in data_blobs) {

      formData.append(name, data_blobs[name]);
    }

    fetch(path, {
      method: "POST",
      body: formData,
      headers: { 
        "Accept": 'application/json, */*', 
        // "Content-type": "multipart/form-data"               //"application/x-www-form-urlencoded; charset=UTF-8"  
      }
    })
      .then(function(response) {
        return response
      }, function(error) { console.log('error- '+ error) })
      .then(function(data) {
        if(data) {
          callback_fn(data)    
        } else {
          console.log('didnt get any data')
        }
      })
  }

  /*  
  Example calls:  
    this.getRequestToServer('/local_data', null, this.testCallBackFn.bind(this))

  */
  getRequestToServer(path, params, callback_fn) {
    var url = path + this.encodeParameters(params)
    console.log(url)
    fetch(url)
      .then(function(response) {
        return response.json()
      }, function(error) { console.log('error- '+ error) })
      .then(function(data) {
        if(data) {
          callback_fn(data)    
        } else {
          console.log('didnt get any data')
        }
      })
  }


  // params = [{key: value},...{key: value}]
  encodeParameters(params) {
    if (!params) return ''
    var encoded_params = '?'

    params.map(function(param_obj) {
      var key = encodeURIComponent(Object.keys(param_obj)[0]),
          value = encodeURIComponent(param_obj[key])
      encoded_params = encoded_params.concat(key +'='+ value +'&')
    })

    return encoded_params.substring(0, encoded_params.length-1)     // take out last &
  }



  showImage(image_or_canvas, is_image) {
    // get image from the camera module and preview it by updating screenshot

    var image_src = null
    if (is_image) {
      image_src = image_or_canvas.src
    } else {
      image_src = image_or_canvas.toDataURL("image/png")
    }
    // if (this.state.posting) return

    // change screenshot name
    this.setState({
      screenshot: image_src,
    })
  }







  createImageWithTextCanvas() {
    var canvas = document.createElement('canvas'), //document.getElementById('canvas'),
      context = canvas.getContext('2d'),
      photo = document.getElementById('img-preview'), // 
      photo_height = photo.height, //getBoundingClientRect().height,
      photo_width = photo.width, //getBoundingClientRect().width,
      canvas_height = photo_height +100

        
    canvas.height = canvas_height//this.state.img_height +100
    canvas.width = photo_width//this.state.img_width

    context.drawImage(photo, 0, 0, photo_width, photo_height)

    context.font = '20px Sentinel'

    var text = document.getElementById('text-input').value
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

  wrapText(context, text, x, y, maxWidth, lineHeight) {
    
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

  canvasToImage(canvas) {
    var data_url = canvas.toDataURL("image/png"),
      image_blob = this.dataURItoBlob(data_url)

    this.setState({
      image_taken: true, // image sent
      image_blob: image_blob,
    }) 
  }


    confirmPhoto() {

      // take preview and text, convert it to image_blob and post it 






    this.postRequestToServer(
      'https://connected-simple-server.herokuapp.com/upload_image', 
      {image:this.state.image_blob}, 
      this.testCallBackFn.bind(this))

    // this.postRequestToServer('http://localhost:5000/upload_image', {image:image_blob}, this.testCallBackFn.bind(this))
    this.setState({
      posting: true
    })
  }

























  renderTextInput() {
      return (
        <input 
          className = {this.state && this.state.screenshot ? '': 'hide'}
          id='text-input' 
          type='text' 
          placeholder='write a caption for your image' 
          maxLength="250" 
          onChange={this.createImageWithTextCanvas.bind(this)}/>  
      )
  }



renderSubmitButton() {
  return (
      { !this.state.posting ?
        <button className='pic-button' onClick={this.confirmPhoto.bind(this)}> Post photo submission to Slack </button>
        :
        <div className='camera-announcement'> Posting to slack...</div>
      }
  )
}

renderPhoto() {
  if (this.state && this.state.screenshot) {
    return (
      <div className='row'>
        <div className='box'>
          <img className='preview-img' src={this.state.screenshot}/>
         
        </div>
      </div>
    )
  } else {

    return (
       <div className='row around-xs'>
        <div className='box'>
          <br/>
          <br/>
          Take a picture of your doodle. 
          <br/>
          <br/>
          Write a funny caption
          <br/>
          <br/>
          Upload it to slack so everyone can vote on it!
          <br/>
          <br/>
          Go to #slack-connection channel and vote on other submissions of the day!
        </div>
      </div>
    )
  }
}


// after a picture is taken, hide camera and call this.refs.Camera.openCamera
renderMobile() {
  return (
    <div className='row around-xs'>
      <div className='row'>

        <Camera
          className={this.state && this.state.screenshot ? 'hide': ''}
          photoTaken={this.showImage.bind(this)}
          ref='Camera'
        />
      </div>
      <div className='row'>
        {this.renderPhoto()}
        {this.renderTextInput()}
        {this.renderSubmitButton()}
      </div>
    </div>
  )
}


renderDesktop() {
  return (
      <div className='row around-xs'>
        <div className='col-xs-5 left'>
          <Camera
            photoTaken={this.showImage.bind(this)}
            ref='Camera'
          />
        </div>
        <div className='col-xs-5 left'>
          {this.renderPhoto()}
          {this.renderTextInput()}
          {this.renderSubmitButton()}

        </div>
      </div>
  )
}

render() {
  return (
            <div> 
              <h2 className='title'> 
                IDEO Doodle Continuum Transfunctioner
              </h2>
              {md.is('iPhone') ?
                this.renderMobile()
              :
                this.renderDesktop()
              }
            </div>
        ) 
}


             

/* --------------- Example request calls ---------------- */

// exGetLocalData() {
//   this.getRequestToServer('/local_data', null, this.testCallBackFn.bind(this))
// }

// exGetGoogleDirections() {
//   var locations = {origin: {
//                             "name": "SF Caltrain",
//                             "lat": 37.443912,
//                             "lng": -122.164960
//                           },
//                   destination: {
//                             "name": "Ideo",
//                             "lat": 37.44198, 
//                             "lng": -122.16025
//                           }
//                   },
//       params = [ 
//                 {origin: locations['origin'].lat +',' +locations['origin'].lng},
//                 {destination: locations['destination'].lat +',' +locations['destination'].lng}
//                ]


//   this.getRequestToServer('/googleDirections', params, this.testCallBackFn.bind(this))
// }


// exGetExternalRecipeAPI() {
//   this.getRequestToServer('https://connected-simple-server.herokuapp.com/external_api', [{q: 'tomato soup'}], this.testCallBackFn.bind(this))

// }


  /* -------------- Location methods -------------- */

  // trackLocation() {
  //   if (navigator.geolocation) {

  //     // gets called everytime we change position
  //     TRACKING_ID = navigator.geolocation.watchPosition(function(position) { 
  //       var pos = {
  //         lat: position.coords.latitude.toFixed(5),
  //         lng: position.coords.longitude.toFixed(5)
  //       }

  //       this.setState({
  //         current_location : pos
  //       })
        
  //     }.bind(this), function(failure) {
  //       console.log('error with navigator.geolocation- '+ failure.message)
        
  //     }.bind(this));
  //   } else {
  //     console.log('browser doesnt support navigator.geolocation')
  //   }

  // }

  // getLocation() {
  //   if (navigator.geolocation) { 
  //     // navigator.geolocation.clearWatch(TRACKING_ID); // only necessary if tracking previously

  //     navigator.geolocation.getCurrentPosition(function(position) {
  //       var pos = {
  //         lat: position.coords.latitude.toFixed(5),
  //         lng: position.coords.longitude.toFixed(5)
  //       }

  //       this.setState({
  //         current_location : pos
  //       })

  //     }.bind(this), function(failure) {
  //       console.log('error with force navigator.geolocation---- '+ failure.message)
  //     });
      
  //   } else {
  //     console.log('browser doesnt support navigator.geolocation')
  //   }
  // }



};

export default App;
