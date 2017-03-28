import '../assets/stylesheets/base.scss'
import React, { Component } from 'react'
import 'whatwg-fetch'
import Ride from './Ride'

// must match server.js --- eventually change
var STOP_STAGE = {
  upcoming_stop: 0,
  current_stop: 1,
  past_stop: 2,
  future_stop: 3
},
  TRACKING_ID = 0




class App extends Component {

  componentWillMount(){
    this.setCurrentTime()
    // calls every location change
    this.trackLocation()
    this.setCaltrainData()
  }

  componentDidMount() {
    // calls set time every second
    window.setInterval(function () {
      this.setCurrentTime()
    }.bind(this), 1000)
    
  }

/* -------------- Time methods -------------- */
  setCurrentTime() {
    var date = new Date()
    this.setState({
      current_date: date
    })  
  }
  

  parseDate(date_sec) {
    var date = new Date(date_sec),
        hours = date.getHours(),
        minutes = date.getMinutes()
    if( hours > 12 ){ hours -= 12; }
    if( minutes < 10) { minutes = '0'+ minutes}
    var time = hours + ':' + minutes

    return time
  }

  convertSecToMins(date_sec){
    var date = new Date(date_sec),
        hours = date.getHours(),
        minutes = date.getMinutes(),
        time = hours*60+minutes
    return time    
  }


/* -------------- Location methods -------------- */
// I can call this every minute and recalculate ETAs

  trackLocation() {
    if (navigator.geolocation) {

      // gets called everytime we change position
      // might want to change to getPosition every  
      TRACKING_ID = navigator.geolocation.watchPosition(function(position) { //watchPosition(function(position) {
        var pos = {
          lat: position.coords.latitude.toFixed(5),
          lng: position.coords.longitude.toFixed(5)
        }

        this.setState({
          current_location : pos
        })


        if(!this.state.testing_state) { // only make api calls out of testing state
          console.log('about to set Route Data')
          this.setRouteData(this.state.num_calls)
        }
        
      }.bind(this), function(failure) {
        console.log('error with navigator.geolocation- '+ failure.message)

        /*
            try and use IDEO's location as current location and go from there
        */

        if(failure.message.indexOf("Only secure origins are allowed") == 0) {
          console.log('Secure Origin issue')
        }
        this.setState({
          fucked: 'were fucked'
        })
      }.bind(this));
    } else {
      console.log('browser doesnt support navigator.geolocation')
    }

  }

  // force get location
  // doesnt work
  forceGetLocation() {

    if (navigator.geolocation) { 
      console.log('forcing')

      navigator.geolocation.clearWatch(TRACKING_ID);
      // I believe its not working because we need to clear watch position
      navigator.geolocation.getCurrentPosition(function(position) {
        console.log('forced succesful')
        var pos = {
          lat: position.coords.latitude.toFixed(5),
          lng: position.coords.longitude.toFixed(5)
        }

        this.setState({
          current_location : pos
        })

        console.log('about to force Route Data')
        this.setRouteData(this.state.num_calls)
        this.trackLocation()
      }.bind(this), function(failure) {
        console.log('error with force navigator.geolocation---- '+ failure.message)
      });
      
    } else {
      console.log('browser doesnt support navigator.geolocation')
    }
  }



/* -------------- Route methods -------------- */

  setRouteData(num_calls) {
	  var data = {},
	      that = this
    if (!num_calls) {
      num_calls = 0
    }
    num_calls++
    fetch(this.getGMapsUrlWithCurrentLocation()).then(function(response) {

		  return response.json()
		}, function(error) {
			console.log('error- '+ error);
		}).then(function(data) {
      if(data) {
        var stop_etas = that.addEtaToStops(data),
            available_caltrains = that.getAvailableCaltrains(stop_etas),
            caltrain_keys = Object.keys(available_caltrains),
            available_caltrains_nb = available_caltrains[caltrain_keys[0]],
            available_caltrains_sb = available_caltrains[caltrain_keys[1]]

        that.setState({
          route_data: data,
          stop_etas: stop_etas, // stores date obj
          available_caltrains_nb: available_caltrains_nb,  //move to etas recalculation after
          available_caltrains_sb: available_caltrains_sb,
          num_calls : num_calls // for testing 
        })
      } else {
        console.log('didnt get any Route Data!!!!!!')
      }
		})
  }

// want to display start time as we test to check if its getting recalculated

  addEtaToStops(route_data, date) { 
    if(!date) date = this.state.current_date

    // var seconds_between_stops = this.getSecondsBetweenStops(route_data),
    var stops = route_data.stops.route,
        legs = route_data.routes[0].legs,
        num_stops = stops.length,
        stop_etas = [],
        accumulated_seconds = 0
        // last_eta = date

    for (var i=0; i<num_stops; i++) {
      var next_date = new Date(date.getTime()),
          next_stop = stops[i],
          next_stop_leg_time = legs[i].duration.value

      accumulated_seconds += next_stop_leg_time
      next_date.setSeconds(next_date.getSeconds() +accumulated_seconds)
      next_stop.eta = next_date
      if (next_stop.start_time) {
        next_stop.leg_time = new Date(next_stop.eta - new Date(next_stop.start_time))
        console.log(next_stop.leg_time)
      }
      stop_etas.push(next_stop)
    }

    return stop_etas
  }

  getGMapsUrlWithCurrentLocation() {
    var query_string = 'lat='+encodeURIComponent(this.state.current_location.lat) + '&lng='+encodeURIComponent(this.state.current_location.lng),
        url = '/route/etas?' + query_string

    return url
  }


/* -------------- Caltrain data -------------- */

  setCaltrainData(){
    var data = {},
        that = this
    //console.log('here')
    fetch('/caltrain/etas').then(function(response) {
      return response.json()
    }, function(error) {
      console.log('error- '+ error);
    }).then(function(data) {
      that.setState({
        caltrain_data: data
      })
    })
  }

  // caltrain station must be named 'Palo Alto Caltrain'
  getCaltrainStop(stop_etas) {
    for (var i=0; i<stop_etas.length; i++) {
      var stop_obj = stop_etas[i]

      if (stop_obj.name == 'Palo Alto Caltrain') {
        return stop_obj
      }
    }
  }

  getAvailableCaltrains(stop_etas){
      var caltrainStopEta = this.getCaltrainStop(stop_etas),
          stationEtaTimeInMins = this.convertSecToMins(caltrainStopEta.eta),
          validNBCaltrain = [],
          validSBCaltrain = [],        
          caltrain_data = this.state.caltrain_data

    for (var i=0; i<caltrain_data.caltrains.length; i++){
      var caltrain = caltrain_data.caltrains[i],
          arrivalTimeHour,
          arrivalTimeMins,
          arrivalTime

      if (caltrain.arrival_time.length == 7) {
        arrivalTimeHour = Number(caltrain.arrival_time.substr(0, 1))
        arrivalTimeMins = Number(caltrain.arrival_time.substr(2, 2))
      }else {
        arrivalTimeHour = Number(caltrain.arrival_time.substr(0, 2))
        arrivalTimeMins = Number(caltrain.arrival_time.substr(3, 2))
      }
      var arrivalTimeInMins = arrivalTimeHour*60 + arrivalTimeMins
      if ((arrivalTimeInMins-stationEtaTimeInMins)<60 && (arrivalTimeInMins-stationEtaTimeInMins)>3){
        if (arrivalTimeHour > 12 ){ arrivalTimeHour -= 12; }
        if( arrivalTimeMins < 10) { arrivalTimeMins = '0'+ arrivalTimeMins}
        arrivalTime = arrivalTimeHour + ':' + arrivalTimeMins
        if (caltrain.platform_code == 'NB'){
          validNBCaltrain.push(arrivalTime)
        }else {
          validSBCaltrain.push(arrivalTime)
        }
      }
    }
    if (validNBCaltrain.length > 2){validNBCaltrain = validNBCaltrain.slice(0, 2)}
    if (validSBCaltrain.length > 2){validSBCaltrain = validSBCaltrain.slice(0, 2)}

    var validCaltrain = {
      NB: validNBCaltrain,
      SB: validSBCaltrain
    };
    return validCaltrain
  }


/* -------------- GetStop methods  -------------- */


  getCurrentStop() {
    var stops = this.state.stop_etas,
        num_stops = stops.length

    for (var i=0; i<num_stops; i++) {
      var stop = stops[i]
      if (stop.stage === STOP_STAGE.current_stop) {
        return stop
      }
    }
    return null
  }

  getNextStop() {
    var stops = this.state.stop_etas,
        num_stops = stops.length,
        mid_ride = this.checkIfMidRide(stops, num_stops),
        first_future = true

    if (mid_ride) { // get first future
      for (var i=0; i<num_stops; i++) {
        var stop = stops[i]
        if (stop.stage === STOP_STAGE.future_stop && first_future) {
          first_future = false
          return stop
        }
      }
    } else { // get upcoming or ?current?
      for (var i=0; i<num_stops; i++) {
        var stop = stops[i]
        if (stop.stage === STOP_STAGE.upcoming_stop || stop.stage === STOP_STAGE.current_stop) {
          return stop
        }
      }
    }
    return null
  }

  getPastStop() {
    var stops = this.state.stop_etas,
        num_stops = stops.length,
        recent_past_stop = null
    for (var i=0; i<num_stops; i++) {
      var stop = stops[i]

      if (stop.stage === STOP_STAGE.past_stop) {
        recent_past_stop = stop
      }
    }
    return recent_past_stop
  }

  getFutureStops() { // next 3 future spots after next stop
    var stops = this.state.stop_etas,
        num_stops = stops.length,
        next_stop = this.getNextStop(),
        future_stops = []

    if (!next_stop) return future_stops // return empty if at the end of the line, no next stop

    for (var i=stops.indexOf(next_stop)+ 1; i<num_stops; i++) {
      if (future_stops.length < 3) {
        future_stops.push(stops[i])
      }
    }
    return future_stops
  }

  checkIfMidRide(stops, num_stops) {
    for (var i=0; i<num_stops; i++) {
      var stop_obj = stops[i]
      if(stop_obj.stage ===  STOP_STAGE.current_stop ||  stop_obj.stage ===  STOP_STAGE.upcoming_stop) {
        return false
      }
    }
    return true
  }

  checkIfAllPast(stops, num_stops) {
    for (var i=0; i<num_stops; i++) {
      var stop_obj = stops[i]
      if(stop_obj.stage !==  STOP_STAGE.past_stop) {
        return false
      }
    }
    return true
  }

/*------------ Render methods -------------- */

 

  renderCurrentLocation() {
    if (!this.state.current_location) return null

    return (
      <div className='col-xs'>
        Location: [{this.state.current_location.lat}, {this.state.current_location.lng}]
      </div> 
    )
  }

  renderAPICalls() {
    if (!this.state) return null

    return (
      <div className='col-xs'>
         API calls: {this.state.num_calls}
      </div>
    )
  }

  renderCurrentStage() {
    if (this.state.stop_etas){
      return this.renderRideStage()
    } else {
      return "LOADING"
    }
  }

  renderRideStage() {
    return <Ride 
              currentDate={this.state.current_date}
              stopEtas={this.state.stop_etas} 
              parseDate={this.parseDate}
              nextStop={this.getNextStop()}
              currentStop={this.getCurrentStop()}
              pastStop={this.getPastStop()}
              futureStops={this.getFutureStops()}
              availableCaltrainsNB={this.state.available_caltrains_nb}  
              availableCaltrainsSB={this.state.available_caltrains_sb}
            />
  }

  render() {
  	if (!this.state) return null

    return(
    	<div>
        {this.renderCurrentStage()}
        <div className='row box'>
          {this.renderCurrentLocation()}
          {this.renderAPICalls()}
          <button onClick={() => this.forceGetLocation()}>
            Force API Call
          </button> 
        </div>
        <div className='row'>
        {this.state.fucked}
        </div>
      </div>
    )
  }



// Only show this once it works 


/*------------ Testing methods -------------- */

// // if all past change to all future
//   nextStage() {
//     var stops = this.state.stop_etas,
//         num_stops = stops.length,
//         // next_app_stage,
//         first_future = true,
//         mid_ride = this.checkIfMidRide(stops, num_stops),
//         all_past = this.checkIfAllPast(stops, num_stops)

//     this.getFutureStops()

//     if (all_past) {
//       for (var i=0; i<num_stops; i++) {
//         var stop_obj = stops[i]
//         stop_obj.stage = STOP_STAGE.future_stop
//       }
//       return null
//     }


//     if (mid_ride) {
//       for (var i=0; i<num_stops; i++) {
//         var stop_obj = stops[i]
//         if(stop_obj.stage === STOP_STAGE.future_stop && first_future) { //first future stop
//           stop_obj.stage = STOP_STAGE.upcoming_stop
//           first_future = false
//         }
//       }
//     } else { // theres an upcoming or a current stop 
//       for (var i=0; i<num_stops; i++) {
//           var stop_obj = stops[i]
//           if (stop_obj.stage === STOP_STAGE.upcoming_stop) {
//             stop_obj.stage = STOP_STAGE.current_stop
//           } else if (stop_obj.stage === STOP_STAGE.current_stop) {
//             stop_obj.stage = STOP_STAGE.past_stop
//           }
//       }
//     }
//   }

  // toggleLocationVClickThrough() {
  //   if (this.state.testing_state) { //switching out of testing state, reload stop_data based on location
  //     this.setRouteData(this.state.num_calls)
  //   }
  //     this.setState({
  //       testing_state: !this.state.testing_state
  //     })
  // }




};

export default App;
