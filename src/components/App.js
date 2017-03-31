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
  TRACKING_ID = 0,
  UPCOMING_DISTANCE = 250, //----- testing values are different than driving values
  ARRIVED_DISTANCE = 80




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
  

  parseDate(date_sec) {
    var date = new Date(date_sec),
        hours = date.getHours(),
        minutes = date.getMinutes(),
        seconds = date.getSeconds()
    if( hours > 12 ){ hours -= 12; }
    if( minutes < 10) { minutes = '0'+ minutes}
    if( seconds < 10) { seconds = '0'+ seconds}
    var time = hours + ':' + minutes + ':' + seconds

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
      TRACKING_ID = navigator.geolocation.watchPosition(function(position) { 
        var pos = {
          lat: position.coords.latitude.toFixed(5),
          lng: position.coords.longitude.toFixed(5)
        }

        this.setState({
          current_location : pos
        })

        this.setRouteData(this.state.num_calls)
        
      }.bind(this), function(failure) {
        console.log('error with navigator.geolocation- '+ failure.message)
        if(failure.message.indexOf("Only secure origins are allowed") == 0) {
          console.log('Secure Origin issue')
        }

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
     
        if (data.routes) {   
          var stop_etas = that.addEtaToStops(data),
              available_caltrains = that.getAvailableCaltrains(stop_etas),
              caltrain_keys = Object.keys(available_caltrains),
              available_caltrains_nb = available_caltrains[caltrain_keys[0]],
              available_caltrains_sb = available_caltrains[caltrain_keys[1]]

          that.setState({
            // route_data: data,
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



// should keep initial leg_time constant
// update stop_etas instead of returning new ones 
// keep recalculating leg_time of future stops but not of next_stop

  getNextStop(stops) {

    for(var i=0; i<stops.length; i++) {
      var stop = stops[i]

      if (stop.stage !== STOP_STAGE.past_stop) {
        return stop
      }
    }
    return stops[0]
  }

  addEtaToStops(route_data, date) { 
    if(!date) date = this.state.current_date

    var new_stops = route_data.stops.route,
        legs = route_data.routes[0].legs,
        num_stops = new_stops.length,
        stop_etas = [],
        accumulated_seconds = 0,
        num_past_stops = new_stops.indexOf(this.getPastStop(new_stops)) +1,
        first_stop = true

        // console.log(num_stops)
    // new_stops[num_past_stops].distance = 220 // fake upcoming 
    // based on the distance of next_stop decide to cycle stages forward 
    new_stops = this.updateStageofStops(new_stops, num_past_stops)

    
    for (var i=0; i<num_stops; i++) {
      var new_eta = new Date(date.getTime()),
          new_stop = new_stops[i],
          stop = this.state.stop_etas ? this.state.stop_etas[i] : new_stop

        // set client side 
      stop.stage = new_stop.stage


        // set server side
      stop.distance = new_stop.distance
          

          // set stop.eta & stop.leg_time
                        if(i >= num_past_stops) {

                          var next_stop_leg_time = legs[i-num_past_stops].duration.value
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
                            console.log(stop.name)
                            stop.leg_time = new Date(stop.leg_time.getTime() + eta_diff)
                          } else {
                            stop.leg_time = new Date(next_stop_leg_time*1000)
                          }
                          
                          first_stop = false
                        }


      stop_etas.push(stop)
    }

    return stop_etas
  }




  // -------- updating stop STAGE and DISTANCE --------------

      // use distance and set stage here instead of server and use same logic as test state
      // instead of current leg progress, we use distance and have a method of cycle forward 
      // only based on nextStop
      // if current_stop: new_distance > current_stop.distance + 30m -> cycle forward 
      // if upcoming: current_radius -> cycle forward
      // if future: upcoming_radius -> cycle forward 


  updateStageofStops(new_stops, num_past_stops) {
    var next_stop = this.getNextStop(new_stops),
        old_stop = this.state.stop_etas ? this.state.stop_etas[num_past_stops] : next_stop,
        stop_distance = next_stop.distance,
        old_stop_distance = old_stop.distance


    if (next_stop.stage === STOP_STAGE.current_stop) {

      if ((stop_distance > old_stop_distance + 30) || (stop_distance >ARRIVED_DISTANCE) ) {     // have moved farther away since arriving
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


  getGMapsUrlWithCurrentLocation() {
    var query_string = 'lat='+encodeURIComponent(this.state.current_location.lat) + '&lng='+encodeURIComponent(this.state.current_location.lng),
        url = '/route/etas?' + query_string

    return url
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
      return "LOADING"
    }
  }

  renderRideStage() {
    return <Ride 
              currentDate={this.state.current_date}
              stopEtas={this.state.stop_etas} 
              parseDate={this.parseDate}
              availableCaltrainsNB={this.state.available_caltrains_nb}  
              availableCaltrainsSB={this.state.available_caltrains_sb}
              setRouteData={this.setRouteData.bind(this)}
              ref='Ride'
            />
  }


  handleDistanceChange(event) {
    this.getNextStop(this.state.stop_etas).distance = event.target.value;
    var num_past_stops = this.state.stop_etas.indexOf(this.getPastStop(this.state.stop_etas)) +1

    this.updateStageofStops(this.state.stop_etas, num_past_stops) 

  }

  render() {
  	if (!this.state) return null

    return(
    	<div>
       <div className='row box'>
          {this.renderCurrentLocation()}
          {this.renderAPICalls()}
          {this.state.stop_etas ?
             <input type="text" onChange={this.handleDistanceChange.bind(this)}/>
             : ''
          }
          
          <button onClick={() => this.forceGetLocation()}>
            Force API Call
          </button> 
        </div>

        {this.renderCurrentStage()}
        
      </div>
    )
  }


};

export default App;
