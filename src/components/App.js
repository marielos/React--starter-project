import '../assets/stylesheets/base.scss'
import React, { Component } from 'react'
import 'whatwg-fetch'
import Camera from './Camera.js'



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



  showImage(image_blob, image_url) {
    if (this.state.posting) return

    this.setState({
      screenshot: image_url,
      image_blob: image_blob
    })
  }

  confirmPhoto() {
    this.postRequestToServer('https://connected-simple-server.herokuapp.com/upload_image', {image:this.state.image_blob}, this.testCallBackFn.bind(this))
    // this.postRequestToServer('http://localhost:5000/upload_image', {image:image_blob}, this.testCallBackFn.bind(this))
    this.setState({
      posting: true
    })
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


    // var url = path + this.encodeParameters(params)
    // console.log(path)
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




renderPhoto() {
  if (this.state && this.state.screenshot) {
    return (
      <div>
        <img src={this.state.screenshot}/>
        { !this.state.posting ?
          <button onClick={this.confirmPhoto.bind(this)}> Post photo submission to Slack </button>
          :
          <div className='camera-announcement'> Posting to slack...</div>
        }

        <div className='camera-announcement'> Not satisfied? Take another one with SPACEBAR </div>
      </div>
    )
  } else {
    return (
       <div className='camera-announcement'>Take a photo with SPACEBAR </div>
    )
  }
}



render() {
  return (
            <div> 
            Super Simple React Conenction - SPACEBAR for camera
              <Camera
                showImage={this.showImage.bind(this)}
              />

              {this.renderPhoto()}
              
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
