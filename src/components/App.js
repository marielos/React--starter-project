import '../assets/stylesheets/base.scss'
import React, { Component } from 'react'
import 'whatwg-fetch'
import Camera from './Camera.js'
import EXIF from 'exif-js'

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




/* ----------------------------- Preview Image From Camera  ----------------------------- */


  showImage(canvas, orientation) {

    // change screenshot name


    this.setState({
      screenshot: canvas.toDataURL("image/png"),
      orientation: orientation
    })
  }

  changePhoto() {
    this.setState({
      screenshot: null,
      orientation: null
    })
  }






/* ----------------------------- Submit Image & Text Functions ----------------------------- */

  createImageWithTextCanvas() {
    var canvas = document.createElement('canvas'), //document.getElementById('canvas'),
      context = canvas.getContext('2d'),
      photo = document.getElementById('preview-img'), // 
      photo_height = photo.height, //getBoundingClientRect().height,
      photo_width = photo.width, //getBoundingClientRect().width,
      canvas_height = photo_height +100

        


    // EXIF.getData(photo, function() {
    //   console.log('got data')
    //   var orientation = EXIF.getTag(this, "Orientation")
    //   console.log('photo preview orientation')
    //   console.log(orientation)
    // })



    canvas.height = canvas_height
    canvas.width = photo_width

    context.drawImage(photo, 0, 0, photo_width, photo_height)

    context.font = '20px Sentinel'


    var text = document.getElementById('text-input').value
    this.wrapText(context, text, 15, photo_height+30, photo_width-30, 20)

    // draw border
    context.moveTo(0,0)
    context.lineTo(photo_width,0)
    context.lineTo(photo_width, canvas_height)
    context.lineTo(0, canvas_height)
    context.lineTo(0, 0)
    context.stroke()



    console.log('done drawing')
    console.log('canvas state orientation')
    console.log(this.state.orientation)
    canvas = this.refs.Camera.rotateCanvas(canvas, this.state.orientation)
    console.log('about to convert to blob ')

    return this.canvasToImageBlob(canvas)
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

  canvasToImageBlob(canvas) {
    var data_url = canvas.toDataURL("image/png"),
      image_blob = this.dataURItoBlob(data_url)

    this.setState({
      image_taken: true, // image sent
    }) 
    return image_blob
  }


  confirmPhoto() {

      // take preview and text, convert it to image_blob and post it 
    var image_text_blob = this.createImageWithTextCanvas()

    this.postRequestToServer(
      'https://connected-simple-server.herokuapp.com/upload_image', 
      {image:image_text_blob}, 
      this.testCallBackFn.bind(this))

    // this.postRequestToServer('http://localhost:5000/upload_image', {image:image_blob}, this.testCallBackFn.bind(this))
    this.setState({
      posting: true
    })
  }



/* ----------------------------- Render Functions ----------------------------- */


  renderPhoto() {
    if (this.state && this.state.screenshot) {
      return (
        <div className='vertical-container'>
            <div className='img-container'>
              <img id='preview-img' src={this.state.screenshot}/>
            </div>
            <button 
              className='pic-button'
              onClick={this.changePhoto.bind(this)}
            > Change Photo </button>
          
        </div>
      )
    } else {

      return (
         <div className=''>
          
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
      )
    }
  }


  // after a picture is taken, hide camera and call this.refs.Camera.openCamera
  renderMobile() {
    return (
      <div className='vertical-container'>
        <div className={this.state && this.state.screenshot ? 'hide': ''}>
          <Camera
            photoTaken={this.showImage.bind(this)}
            ref='Camera'
          />
        </div>
          {this.renderPhoto()}
          {this.renderTextInput()}
          {this.renderSubmitButton()}
      </div>
    )
  }


  renderTextInput() {
      return (
            <input 
              className = {this.state && this.state.screenshot ? '': 'hide'}
              id='text-input' 
              type='text' 
              placeholder='write a caption for your image' 
              maxLength="250" 
              /> 
      )
  }



  renderSubmitButton() {

    return (
        <div className='vertical-container'>

          {!this.state.posting ?
            <button 
              className={this.state && this.state.screenshot ? 'pic-button' : 'hide'}
              onClick={this.confirmPhoto.bind(this)}
            > Post photo to Slack </button>
            :
            <div className='camera-announcement'> Posting to slack...</div>
          }
      
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
                  <div className='row center-xs'>
                    <div className='col-xs6'>
                      {this.renderMobile()}
                    </div>
                  </div>
                }
              </div>
          ) 
  }



/* ----------------------------- Get and Post Request Functions ----------------------------- */

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
   

};

export default App;
