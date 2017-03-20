import '../assets/stylesheets/base.scss'
import React, { Component } from 'react'
import 'whatwg-fetch'
import Ride from './Ride'
import Stop from './Stop'

// must match server.js --- eventually change
var STOP_STAGE = {
  upcoming_stop: 0,
  current_stop: 1,
  past_stop: 2,
  future_stop: 3
}

var APP_STAGE = {
  upcoming: 0,
  stop: 1,
  ride: 2
}

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
    var date = new Date(),
        stop_etas = this.state && this.state.stop_data ? this.getStopETAs(this.state.stop_data, date) : null
    this.setState({
      current_date: date,
      stop_etas: stop_etas
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
      navigator.geolocation.watchPosition(function(position) {
        var pos = {
          lat: position.coords.latitude.toFixed(5),
          lng: position.coords.longitude.toFixed(5)
        }

        this.setState({
          current_location : pos
        })

        if(!this.state.testing_state) { // only make api calls out of testing state
          console.log('about to set Route Data')
          this.setRouteData(0)
        }
        
      }.bind(this), function() {
        console.log('error with navigator.geolocation')
      });
    } else {
      console.log('browser doesnt support navigator.geolocation')
    }

  }

  // force get location
  // doesnt work
  forceGetLocation() {
    if (navigator.geolocation) { 
      console.log('forcing')

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
        
      }.bind(this), function() {
        console.log('error with navigator.geolocation')
      });
      console.log('forced is fucked')
    } else {
      console.log('browser doesnt support navigator.geolocation')
    }
  }



/* -------------- Route methods -------------- */

  setRouteData(num_calls) {
	  var data = {},
	      that = this

    num_calls++
    fetch(this.getGMapsUrlWithCurrentLocation()).then(function(response) {

		  return response.json()
		}, function(error) {
			console.log('error- '+ error);
		}).then(function(data) {
      var stop_etas = that.getStopETAs(data),
          available_caltrains = that.getAvailableCaltrains(stop_etas),
          app_stage = that.getAppStage(data)
			that.setState({
        stop_data: data,
        stop_etas: stop_etas, // stores date obj
        available_caltrains: available_caltrains,  //move to etas recalculation after
        app_stage: app_stage,
        num_calls : num_calls // for testing 
			})
		})
  }

  getStopETAs(data, date) { 
    if(!date) date = this.state.current_date

    var seconds_between_stops = this.getSecondsBetweenStops(data),
        stop_etas = [],
        accumulated_seconds = 0

    for (var i=0; i<seconds_between_stops.length; i++) {
      accumulated_seconds += seconds_between_stops[i]
      var next_date = new Date(date.getTime())
      next_date.setSeconds(next_date.getSeconds() +accumulated_seconds)
      stop_etas.push(next_date)
    }

    return stop_etas
  }

  getGMapsUrlWithCurrentLocation() {
    var query_string = 'lat='+encodeURIComponent(this.state.current_location.lat) + '&lng='+encodeURIComponent(this.state.current_location.lng),
        url = '/route/etas?' + query_string

    return url
  }

  getSecondsBetweenStops(data) {
    var seconds_between_stops = [],
        route = data.routes[0],
        legs = route.legs,
        num_legs = legs.length

    for (var i=0; i<num_legs; i++) {
      seconds_between_stops.push(legs[i].duration.value)
    }

    return seconds_between_stops
  }


/* -------------- Caltrain data -------------- */

setCaltrainData(){
    var data = {},
        that = this

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

getAvailableCaltrains(stop_etas){
    var caltrainStopEta = stop_etas[stop_etas.length-1],
        stationEtaTimeInMins = this.convertSecToMins(caltrainStopEta),
        validCaltrain = [],        
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
      validCaltrain.push(caltrain.platform_code)
      validCaltrain.push(arrivalTime)     
    }
  }
  
  return this.addNbAndSb(validCaltrain)
}

addNbAndSb(data){
  var index = data.indexOf("SB")
  for (var i = index+2; i<data.length; i=i+1){
      data.splice(i,1);
    }   
  for (var i=2; i<data.length; i=i+1){
    if (data[i] == "NB"){
      data.splice(i,1);
    }    
  }
  return data
}

/*------------ Stage methods -------------- */

  getAppStage(stop_data) {
    // check to make sure only 1 of these gets called
    var stops = stop_data.stops.route,
        num_stops = stops.length

    if(this.state.testing_state) { //change nothing based on stop_obj stages (location)
      return this.state.app_stage
    }

    for (var i=0; i<num_stops; i++) {
        var stop_obj = stops[i]
        switch(stop_obj.stage) {
          case STOP_STAGE.upcoming_stop:
            return APP_STAGE.upcoming
          case STOP_STAGE.current_stop:
            return APP_STAGE.stop
          default:
            return APP_STAGE.ride
        }
    }
  }


  getCurrentStop() {
    var stops = this.state.stop_data.stops.route,
        num_stops = stops.length

    for (var i=0; i<num_stops; i++) {
      var stop = stops[i]
      if (stop.stage === STOP_STAGE.current_stop) {
        return stop
      }
    }
  }

/*------------ Render methods -------------- */

  renderCaltrains() {
    if (!this.state.available_caltrains) return null
      // need to change how this is stored. 
      // Better option ex: [{eta: 4:44, direction: NB}, {eta: 4:47, direction: SB}] 

      var caltrain_etas = this.state.available_caltrains.map( function(caltrainETA) {
        return <div className='col-xs' key={caltrainETA}> {caltrainETA} </div>
      })
    return (
      <div className='row around-xs box'>
        <div className='col-xs'> Caltrains: </div> 
        {caltrain_etas}
      </div> 
      
    )
  }

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

  renderCurrentTime() {
    if (!this.state) return null

    return (
      <div className='col-xs'>
         Time: {this.parseDate(this.state.current_date)}
      </div>
    )
  }


  renderCurrentStage() {
    switch (this.state.app_stage) {
      case APP_STAGE.stop:
        return this.renderStopStage()
      case APP_STAGE.upcoming:
        return this.renderUpcomingStage()
      case APP_STAGE.ride:
        return this.renderRideStage()
      default:
        return "LOADING"
    }
  }

  renderStopStage() {
    var current_stop = this.getCurrentStop()

    if (!current_stop) {
      console.log(this.state.stop_data)
    }
    return <Stop current_stop={this.getCurrentStop()}/>
  }

  renderRideStage() {
    return <Ride 
              stop_etas={this.state.stop_etas} 
              stops={this.state.stop_data.stops.route} 
              parseDate={this.parseDate}
            />
  }

  // might not be necessary
  renderUpcomingStage() {
    return <Ride 
              stop_etas={this.state.stop_etas} 
              stops={this.state.stop_data.stops.route} 
              parseDate={this.parseDate}
            />
  }

  renderTestingButtons() {
    var nextStageButton = function() {
      return (
        <div>
          <button onClick={this.nextStage.bind(this)}>
              Next Stage &gt; 
          </button> 
        </div>
      )
    }.bind(this)

    return (
        <div className='row box'>
          <button onClick={this.toggleLocationVClickThrough.bind(this)}>
            Switch to {this.state.testing_state ? ' location based' : ' click based'}
          </button> 
          {this.state.testing_state ? nextStageButton() : null}
        </div>
    )
  }

  render() {
  	if (!this.state) return null

    return(
    	<div>
        {this.renderCurrentStage()}
        {this.renderCaltrains()}
        <div className='row box'>
          {this.renderCurrentTime()}
          {this.renderCurrentLocation()}
          {this.renderAPICalls()}
        </div>
        

        {this.renderTestingButtons()}
        {this.state.app_stage}
        <button onClick={() => this.forceGetLocation()}>
            Force API Call
          </button> 
      </div>
    )
  }


/*------------ Testing methods -------------- */

// if all past change to all future
  nextStage() {
    var stops = this.state.stop_data.stops.route,
        num_stops = stops.length,
        next_app_stage,
        first_future = true,
        mid_ride = this.checkIfMidRide(stops, num_stops),
        all_past = this.checkIfAllPast(stops, num_stops)

    if (all_past) {
      for (var i=0; i<num_stops; i++) {
        var stop_obj = stops[i]
        stop_obj.stage = STOP_STAGE.future_stop
      }
      this.setState({
        app_stage: APP_STAGE.ride
      })
      return
    }

    switch(this.state.app_stage) {
      case APP_STAGE.upcoming:
        next_app_stage = APP_STAGE.stop
        break
      case APP_STAGE.stop:
        next_app_stage = APP_STAGE.ride
        break
      case APP_STAGE.ride:
        next_app_stage = APP_STAGE.upcoming
        break
      default:
    }


    if (mid_ride) {
      for (var i=0; i<num_stops; i++) {
        var stop_obj = stops[i]
        if(stop_obj.stage === STOP_STAGE.future_stop && first_future) { //first future stop
          stop_obj.stage = STOP_STAGE.upcoming_stop
          first_future = false
        }
      }
    } else { // theres an upcoming or a current stop 
      for (var i=0; i<num_stops; i++) {
          var stop_obj = stops[i]
          if (stop_obj.stage === STOP_STAGE.upcoming_stop) {
            stop_obj.stage = STOP_STAGE.current_stop
          } else if (stop_obj.stage === STOP_STAGE.current_stop) {
            stop_obj.stage = STOP_STAGE.past_stop
          }
      }
    }
    console.log(stops)
    this.setState({
      app_stage: next_app_stage
    })
  }


// // technically uneccesary 
//   previousStage() {
//     var stops = this.state.stop_data.stops.route,
//         num_stops = stops.length,
//         previous_app_stage,
//         first_past = true 

//     switch(this.state.app_stage) {
//       case APP_STAGE.upcoming:
//         previous_app_stage = APP_STAGE.ride
//         break
//       case APP_STAGE.stop:
//         previous_app_stage = APP_STAGE.upcoming
//         break
//       case APP_STAGE.ride:
//         previous_app_stage = APP_STAGE.stop
//         break
//       default:
//     }

//     for (var i=0; i<num_stops; i++) {
//         var stop_obj = stops[i]
//         switch(stop_obj.stage) {
//           case STOP_STAGE.past:
//             if (first_past){
//               stop_obj.stage = STOP_STAGE.current_stop
//               first_past = false
//             }
//             break
//           case STOP_STAGE.upcoming_stop:
//             stop_obj.stage = STOP_STAGE.future_stop
//             break
//           case STOP_STAGE.current_stop:
//             stop_obj.stage = STOP_STAGE.upcoming_stop
//             break
//           default:
//         }
//     }

//     this.setState({
//       app_stage: previous_app_stage
//     })
//   }

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

  toggleLocationVClickThrough() {
    if (this.state.testing_state) { //switching out of testing state, reload stop_data based on location
      this.setRouteData(this.state.num_calls)
    }
      this.setState({
        testing_state: !this.state.testing_state
      })
  }




};

export default App;
