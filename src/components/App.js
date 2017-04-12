import '../assets/stylesheets/base.scss'
import React, { Component } from 'react'
import 'whatwg-fetch'
import Ride from './Ride'



/* -------------- Constants -------------- */

// must match server.js 
var STOP_STAGE = {
  upcoming_stop: 0,
  current_stop: 1,
  past_stop: 2,
  future_stop: 3
},
  TRACKING_ID = 0,
  UPCOMING_DISTANCE = 250, 
  ARRIVED_DISTANCE = 60

export {STOP_STAGE}

/* ----------------------------------------- */

class App extends Component {

  componentWillMount(){
    this.setCurrentTime()
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

  convertSecToMins(date_sec){
    var date = new Date(date_sec),
        hours = date.getHours(),
        minutes = date.getMinutes(),
        time = hours*60+minutes
    return time    
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

        // in future iterations, dont call this every change of location
        // Google API blocked our key due to too many API calls
        // call once but with traffic data, explained in server.js
        this.setRouteData(this.state.num_calls)
        
      }.bind(this), function(failure) {
        console.log('error with navigator.geolocation- '+ failure.message)
        
        /*
          use IDEO's location as current location and go from there
        */
        var ideo_pos = {
          lat: 37.442211,
          lng: -122.16097
        }

        this.setState({
          current_location : ideo_pos
        })
        this.setRouteData(this.state.num_calls)
        
      }.bind(this));
    } else {
      console.log('browser doesnt support navigator.geolocation')
    }

  }

  // for testing
  forceGetLocation() {

    if (navigator.geolocation) { 
      console.log('forcing')

      navigator.geolocation.clearWatch(TRACKING_ID);
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



/* -------------- Update Stop methods based on API response-------------- */
  // calls Google Directions API 
  // dont call too much!
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
     
        if (data.routes) {   
          var stop_etas = that.updateStops(data),
              available_caltrains = that.getAvailableCaltrains(stop_etas),
              available_caltrains_nb = null,
              available_caltrains_sb = null

          if (available_caltrains) {
            available_caltrains_nb = available_caltrains['NB']
            available_caltrains_sb = available_caltrains['SB']
          }
          
          that.setState({
            isAM: data.isAM,
            stop_etas: stop_etas, 
            available_caltrains_nb: available_caltrains_nb, 
            available_caltrains_sb: available_caltrains_sb,
            num_calls : num_calls // for testing 
          })

        } else {          // if we didnt get route directions 
          num_calls-=.9
          that.setState({
            stop_etas: data.stops.route, 
            num_calls : num_calls // for testing 
          })
        }
      
      } else {
        console.log('didnt get any Route Data!!!!!!')
      }
		})
  }



  updateStops(route_data, date) { 
    if(!date) date = this.state.current_date


    if (route_data.isAM !== this.state.isAM) {   // reset everything if were switching from AM <-> PM
      this.setState({
        stop_etas: null 
      })
    }

    var new_stops = route_data.stops.route,
        stop_etas = []
       

    // console.log(new_stops)


    // realize if switched from PM <-> AM
    if(this.state.stop_etas) {
      new_stops = this.setPreviousStageofStops(new_stops)
    } else {
      new_stops = this.setInitialStageofStops(new_stops)
    }


    var num_past_stops = new_stops.indexOf(this.getPastStop(new_stops)) +1
        
    // push old stops onto stop_eta
    for (var i=0; i<num_past_stops; i++) {    
      stop_etas.push(new_stops[i])
    }

    // pass stages onto new_stops
    new_stops = this.updateStageofStops(new_stops, num_past_stops)

    // push future stops onto stop_eta
    stop_etas = this.updateETAofStops(route_data, new_stops, stop_etas, date, num_past_stops)

    return stop_etas
  }

  updateETAofStops(route_data, new_stops, stop_etas, date, num_past_stops) {
    var legs = route_data.routes[0].legs,
        num_legs = legs.length,
        accumulated_seconds = 0,
        first_stop = true


    for (var i=0; i<num_legs; i++) {
      var new_eta = new Date(date.getTime()),
          new_stop = new_stops[i+num_past_stops],
          stop = this.state.stop_etas ? this.state.stop_etas[i+num_past_stops] : new_stop

        // set client side 
      stop.stage = new_stop.stage
        // set server side
      stop.distance = new_stop.distance
        
      var next_stop_leg_time = legs[i].duration.value
      accumulated_seconds += next_stop_leg_time
      new_eta.setSeconds(new_eta.getSeconds() +accumulated_seconds)

      var eta_diff
      if (stop.eta) {
        eta_diff = new_eta.getTime() - stop.eta.getTime()
      } else {
        eta_diff = 0
      }

      if (stop.stage === STOP_STAGE.current_stop) {
        if(!stop.have_arrived) {
          stop.eta = new Date()
          stop.have_arrived = true
        }
      } else {
        stop.eta = new_eta
      }

      if (first_stop && stop.leg_time) { //dont recalculate leg time after it is set 
        // console.log(stop.name)
        stop.leg_time = new Date(stop.leg_time.getTime() + eta_diff)
      } else {
        stop.leg_time = new Date(next_stop_leg_time*1000)
      }
      
      first_stop = false

      stop_etas.push(stop)
    }

    return stop_etas
  }

  getGMapsUrlWithCurrentLocation() {
    var num_past_stops = 0
    if (this.state.stop_etas) {
      num_past_stops = this.state.stop_etas.indexOf(this.getPastStop(this.state.stop_etas)) +1
    }
    var query_string =  'lat='+encodeURIComponent(this.state.current_location.lat) + 
                        '&lng='+encodeURIComponent(this.state.current_location.lng) + 
                        '&num_past_stops='+encodeURIComponent(num_past_stops),
        url = '/route/etas?' + query_string

    return url
  }


  // -------- updating stop STAGE and DISTANCE --------------

  updateStageofStops(new_stops, num_past_stops) {
    var next_stop = this.getNextStop(new_stops),
        old_stop = this.state.stop_etas ? this.state.stop_etas[num_past_stops] : next_stop,
        stop_distance = next_stop.distance,
        old_stop_distance = old_stop.distance

    if (next_stop.stage === STOP_STAGE.current_stop) {
      if ((stop_distance > old_stop_distance + 30) || (stop_distance >ARRIVED_DISTANCE+30) ) {     // have moved farther away since arriving
        return this.cycleStopStagesForward(new_stops)
      }

    } else if (next_stop.stage === STOP_STAGE.upcoming_stop) {
      if (stop_distance < ARRIVED_DISTANCE) {           // have moved into current_stop radius
        return this.cycleStopStagesForward(new_stops)
      } 

    } else if (next_stop.stage === STOP_STAGE.future_stop) {
      if (stop_distance < UPCOMING_DISTANCE) {          // have moved into upcoming_stop radius
        return this.cycleStopStagesForward(new_stops)
      }
    } 

    return new_stops // no need for a state change
  }


  cycleStopStagesForward(stops) {
    var next_stop = this.getNextStop(stops)

    for(var i=0; i<stops.length; i++) {
      var stop = stops[i]

      if (stop.stage === STOP_STAGE.current_stop){
        stop.stage = STOP_STAGE.past_stop
      } else if (stop.stage === STOP_STAGE.upcoming_stop){
        stop.stage = STOP_STAGE.current_stop
      } else if (stop === next_stop){
        if (stop.distance < UPCOMING_DISTANCE) {    // only make the first future stop upcoming if within the radius
          stop.stage = STOP_STAGE.upcoming_stop
        }
      } 
    }
    return stops
  }


  setPreviousStageofStops(new_stops) {
    for(var i=0; i<new_stops.length; i++) {
      var new_stop = new_stops[i],
          old_stop = this.state.stop_etas[i]

          new_stop.stage = old_stop.stage
    }
    return new_stops
  }


  setInitialStageofStops(new_stops) {
    for(var i=0; i<new_stops.length; i++) {
      var new_stop = new_stops[i]
          
          new_stop.stage = STOP_STAGE.future_stop
    }
    return new_stops
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
      var caltrainStopEta = this.getCaltrainStop(stop_etas)

      if (!caltrainStopEta) { // no caltrain stop
        return null
      }
      var stationEtaTimeInMins = this.convertSecToMins(caltrainStopEta.eta),
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
    if (validNBCaltrain.length) validNBCaltrain = validNBCaltrain[0]//.slice(0, 2)
    if (validSBCaltrain.length) validSBCaltrain = validSBCaltrain[0]//.slice(0, 2)

    var validCaltrain = {
      NB: validNBCaltrain,
      SB: validSBCaltrain
    };
    return validCaltrain
  }


/* -------------- GetStop methods  -------------- */

  getPastStop(stops_data) {
    var stops = stops_data ? stops_data : this.state.stop_etas,
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

  getNextStop(stops) {

    for(var i=0; i<stops.length; i++) {
      var stop = stops[i]

      if (stop.stage !== STOP_STAGE.past_stop) {
        return stop
      }
    }
    return stops[0]
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



  // make this render as much as possible without etas
  renderCurrentStage() {

    if (this.state.stop_etas){
      return this.renderRideStage()
    } else {
      return (<div className='loading'> LOADING </div>)
    }
  }

  renderRideStage() {
    return <Ride 
              currentDate={this.state.current_date}
              stopEtas={this.state.stop_etas} 
              availableCaltrainsNB={this.state.available_caltrains_nb}  
              availableCaltrainsSB={this.state.available_caltrains_sb}
              setRouteData={this.setRouteData.bind(this)}
              isAM={this.state.isAM}
              ref='Ride'
              forceAPICall={this.forceGetLocation.bind(this)}
              numAPICalls={this.state.num_calls}
            />
  }

  render() {
  	if (!this.state) return null

    return this.renderCurrentStage()   
  }

};

export default App;
