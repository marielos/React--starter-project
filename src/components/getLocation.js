          

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

