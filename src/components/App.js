import '../assets/stylesheets/base.scss';
import React, { Component } from 'react';
import 'whatwg-fetch'
import { Router, Route, browserHistory } from 'react-router';


class App extends Component {

  componentWillMount(){
    this.setCurrentTime()
    // calls every location change
    this.trackLocation()
    this.getCaltrainData()
  }

  componentDidMount() {
    // calls set time every second
    window.setInterval(function () {
      this.setCurrentTime()
      this.setAvailableCaltrains()  //move to etas recalculation after
    }.bind(this), 1000)
    
  }


/* -------------- Caltrain data -------------- */

getCaltrainData(){
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

setAvailableCaltrains(){
  if (!this.state.stop_etas) return null
    var caltrainStopEta = this.state.stop_etas[this.state.stop_etas.length-1],
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
  
  validCaltrain  = this.addNbAndSb(validCaltrain)

  this.setState({
    available_caltrains: validCaltrain
  })
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

/* -------------- Time methods -------------- */
  setCurrentTime() {
    var date = new Date()
    this.setState({
      current_date: date,
      stop_etas: this.getStopETAs(null, date)
    })  
  }

  getCurrentTime() {
    //console.log('here')
    return this.parseDate(this.state.current_date)
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



/* -------------- Route methods -------------- */


  getGMapsUrlWithCurrentLocation() {
    var query_string = 'lat='+encodeURIComponent(this.state.current_location.lat) + '&lng='+encodeURIComponent(this.state.current_location.lng),
        url = '/route/etas?' + query_string

    return url
  }


  getRouteData() {
	  var data = {},
	      that = this
    fetch(this.getGMapsUrlWithCurrentLocation()).then(function(response) {

		  return response.json()
		}, function(error) {
			console.log('error- '+ error);
		}).then(function(data) {
			that.setState({
        stop_data: data,
        stop_etas: that.getStopETAs(data) // stores date obj
			})
		})
  }


  getStopNames() {
    var stop_names = [],
        route = this.state.stop_data.stops.route,
        num_stops = route.length
    for (var i=0; i<num_stops; i++) {
      stop_names.push(route[i].name)
    }
    return stop_names
  }


  getStopETAs(data, date) {
    // double check this safety checks, some might be redundant
    if (!this.state || !this.state.stop_data) return null
    if (!data) data = this.state.stop_data
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


/* -------------- Location methods -------------- */
// I can call this every minute and recalculate ETAs

  trackLocation() {
    var num_calls = 1
    if (navigator.geolocation) {

      // gets called everytime we change position
      // might want to change to getPosition every  
      navigator.geolocation.watchPosition(function(position) {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }

        this.setState({
          current_location : pos,
          num_calls : num_calls++
        })

        this.getRouteData()
        
      }.bind(this), function() {
        console.log('error with navigator.geolocation')
      });
    } else {
      console.log('browser doesnt support navigator.geolocation')
    }

  }

/*------------ Render methods -------------- */

  renderCaltrains() {
    if (!this.state.available_caltrains) return null
    return (
      this.state.available_caltrains.map( function(caltrainETA) {
        return <div className='col-xs' key={caltrainETA}> {caltrainETA} </div>
      })
    )
  }

  renderStops() {
    if (!this.state.stop_data) return null

    return (
      this.state.stop_data.stops.route.map( function(stop_obj) {
        return <div className='col-xs' key={this.getStopName(stop_obj)}> {this.getStopName(stop_obj)} - {this.getStopState(stop_obj)} - {this.getStopDistance(stop_obj)} </div>
      }.bind(this))
    )
  }

  getStopName(stop_obj) {
    return stop_obj.name
  }

  getStopState(stop_obj) {
    return stop_obj.arrived ? 'arrived' : 'future'
  }

  getStopDistance(stop_obj) {
    return stop_obj.distance
  }

  renderStopETAs() {
    if (!this.state.stop_etas) return null
    return (
      this.state.stop_etas.map( function(time, index) {
        return <div className='col-xs' key={index}> {this.parseDate(time)} </div>
      }.bind(this))
    )
  }


  renderCurrentLocation() {
    if (!this.state.current_location) return null

    return (
      <div className='row around-xs'>
          <div className='col-xs'>
            Current Location: [{this.state.current_location.lat}, {this.state.current_location.lng}]
          </div>
        </div>
    )

  }

  render() {
  	if (!this.state) return null

    return(
    	<div>
      	<div className='row around-xs'>
          {this.renderStops()}
        </div>
        <div className='row around-xs'>
          {this.renderStopETAs()}
        </div>
        <div className='row around-xs'>
          <div className='col-xs'>
            Current Time: {this.getCurrentTime()}
          </div>
        </div>
        {this.renderCurrentLocation()}
        {this.state.num_calls}
        <div className='row around-xs'>
          Caltrains: {this.renderCaltrains()}
        </div>
      </div>
    )
  }


};

export default App;
