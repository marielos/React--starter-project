import '../assets/stylesheets/base.scss'
import React, { Component } from 'react'
import 'whatwg-fetch'



/* -------------- GLOBAL VARIABLES -------------- */
var TRACKING_ID = -1

/* ----------------------------------------- */

class App extends Component {

  componentWillMount(){

  }

  componentDidMount() {
    this.exGetExternalRecipeAPI()
  }


  testCallBackFn(data) {
    console.log(data)
  }

  // TODO
  postRequestToServer(path, params, callback_fn) {


  }




  /*  
  Example calls:  
    this.getRequestToServer('/local_data', null, this.testCallBackFn.bind(this))

  */
  getRequestToServer(path, params, callback_fn) {
    var that = this,   // to avoid scoping puzzles 
        url = path + this.encodeParameters(params)
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





/*--------------- Example request calls ---------------- */

exGetLocalData() {
  this.getRequestToServer('/local_data', null, this.testCallBackFn.bind(this))
}

exGetGoogleDirections() {
  var locations = {origin: {
                            "name": "SF Caltrain",
                            "lat": 37.443912,
                            "lng": -122.164960
                          },
                  destination: {
                            "name": "Ideo",
                            "lat": 37.44198, 
                            "lng": -122.16025
                          }
                  },
      params = [ 
                {origin: locations['origin'].lat +',' +locations['origin'].lng},
                {destination: locations['destination'].lat +',' +locations['destination'].lng}
               ]


  this.getRequestToServer('/googleDirections', params, this.testCallBackFn.bind(this))
}


exGetExternalRecipeAPI() {
  this.getRequestToServer('https://connected-simple-server.herokuapp.com/external_api', [{q: 'tomato soup'}], this.testCallBackFn.bind(this))

  // this.getRequestToServer('/external_api', [{q: 'tomato soup'}], this.testCallBackFn.bind(this))
}







  render() {
    return (<div> Super Simple Server </div> ) 
  }






  /* -------------- Location methods -------------- */
  trackLocation() {
    if (navigator.geolocation) {

      // gets called everytime we change position
      TRACKING_ID = navigator.geolocation.watchPosition(function(position) { 
        var pos = {
          lat: position.coords.latitude.toFixed(5),
          lng: position.coords.longitude.toFixed(5)
        }

        this.setState({
          current_location : pos
        })
        
      }.bind(this), function(failure) {
        console.log('error with navigator.geolocation- '+ failure.message)
        
      }.bind(this));
    } else {
      console.log('browser doesnt support navigator.geolocation')
    }

  }

  getLocation() {
    if (navigator.geolocation) { 
      // navigator.geolocation.clearWatch(TRACKING_ID); // only necessary if tracking previously

      navigator.geolocation.getCurrentPosition(function(position) {
        var pos = {
          lat: position.coords.latitude.toFixed(5),
          lng: position.coords.longitude.toFixed(5)
        }

        this.setState({
          current_location : pos
        })

      }.bind(this), function(failure) {
        console.log('error with force navigator.geolocation---- '+ failure.message)
      });
      
    } else {
      console.log('browser doesnt support navigator.geolocation')
    }
  }



};

export default App;
