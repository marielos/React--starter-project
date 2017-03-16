import '../assets/stylesheets/base.scss';
import React, { Component } from 'react';
import 'whatwg-fetch'
import { Router, Route, browserHistory } from 'react-router';


class App extends Component {

  componentWillMount(){
    this.setCurrentTime()
  }

  componentDidMount() {
    this.getRouteData()
    
    // calls set time every second
    window.setInterval(function () {
      this.setCurrentTime()
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
      console.log(data)
      that.setState({
        availableCaltrains: that.getAvailableCaltrains(data)
      })

    //console.log(data)
    }) 
}

getAvailableCaltrains(data){
  //var date = new Date()
  //hours = date.getHours()
  //minutes = date.getMinutes()
  //var stationEtaTimeInMins = this.getStationEtaTimeInMins()
  var stationEtaTimeInMins = this.state.stop_etas_in_mins[this.state.stop_etas_in_mins.length-1]
  if (!stationEtaTimeInMins) return null
    console.log(stationEtaTimeInMins)
  var validCaltrain = [],
      availableCaltrain = [],
      arrivalTime,
      arrivalTimeHour,
      arrivalTimeMins,
      arrivalTimeInMins
  for (var i=0; i<data.caltrains.length; i++){
    var caltrain = data.caltrains[i]
    if (caltrain.arrival_time.length == 7) {
      arrivalTimeHour = Number(caltrain.arrival_time.substr(0, 1))
      arrivalTimeMins = Number(caltrain.arrival_time.substr(2, 2))
    }else {
      arrivalTimeHour = Number(caltrain.arrival_time.substr(0, 2))
      arrivalTimeMins = Number(caltrain.arrival_time.substr(3, 2))
    }
    arrivalTimeInMins = arrivalTimeHour*60 + arrivalTimeMins
    if ((arrivalTimeInMins-stationEtaTimeInMins)<60 && (arrivalTimeInMins-stationEtaTimeInMins)>3){
      if (arrivalTimeHour > 12 ){ arrivalTimeHour -= 12; }
      if( arrivalTimeMins < 10) { arrivalTimeMins = '0'+ arrivalTimeMins}
      arrivalTime = arrivalTimeHour + ':' + arrivalTimeMins
      validCaltrain.push(caltrain.platform_code)
      validCaltrain.push(arrivalTime)     
    }

  }
  
  availableCaltrain  = this.addNbAndSb(validCaltrain)
  //availableCaltrain = this.convertClockFormat(availableCaltrain)
  
  //console.log(availableCaltrain)
  return availableCaltrain
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
/*
getStationEtaTimeInMins(data){

  if (!this.state.stop_etas) return null

  var stationEtaTimeInMins,
      stationEtaTimeHour,
      stationEtaTimeMins,
      currentHours = this.state.current_date.getHours(),
      stationETA = this.state.stop_etas[this.state.stop_etas.length-1]
  if (stationETA.length == 4){
    stationEtaTimeHour = Number(stationETA.substr(0, 1))
    stationEtaTimeMins = Number(stationETA.substr(2, 2))
  }else{
    stationEtaTimeHour = Number(stationETA.substr(0, 2))
    stationEtaTimeMins = Number(stationETA.substr(3, 2))
  }

  if (currentHours>12){
    stationEtaTimeInMins = 12*60 + stationEtaTimeHour*60 + stationEtaTimeMins
  }else{
    stationEtaTimeInMins = stationEtaTimeHour*60 + stationEtaTimeMins
  }
  //console.log(stationEtaTimeInMins)
  return stationEtaTimeInMins
}
*/
/* -------------- Time methods -------------- */
  setCurrentTime() {
    this.setState({
      current_date: new Date()
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

  getRouteData() {
	  var data = {},
	      that = this
    console.log('here')
    fetch('/route/etas').then(function(response) {
		  return response.json()
		}, function(error) {
			console.log('error- '+ error);
		}).then(function(data) {
			
			that.setState({
				stop_names: that.getStopNames(data),
        stop_etas: that.getStopETAs(data)
			})
      that.getCaltrainData()
      //console.log(data)
		})
  }


  getStopNames(data) {
    var stop_names = [],
        route = data.stops.route,
        num_stops = route.length
    for (var i=0; i<num_stops; i++) {
      stop_names.push(route[i].name)
    }
    return stop_names
  }


  getStopETAs(data) {
    var seconds_between_stops = this.getSecondsBetweenStops(data),
        stop_etas = [''],
        stopEtasInMins = []

    for (var i=0; i<seconds_between_stops.length; i++) {
      // add seconds to date and then re-parse?
      // keep an incremental counter of seconds between stops 
      var next_date = this.state.current_date,
          next_date_seconds = next_date.setSeconds(next_date.getSeconds() +seconds_between_stops[i]),
          next_eta = this.parseDate(next_date_seconds),
          next_eta_in_mins = this.convertSecToMins(next_date_seconds)
      stopEtasInMins.push(next_eta_in_mins) 
      stop_etas.push(next_eta)
    }
    this.setState({
        stop_etas_in_mins: stopEtasInMins
      })
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

  
/* -------------- Render methods -------------- */

  renderCaltrains() {
    if (!this.state.availableCaltrains) return null
      //console.log(this.state.availableCaltrains)
    return (
      this.state.availableCaltrains.map( function(caltrainETA) {
        return <div className='col-xs' key={caltrainETA}> {caltrainETA} </div>
      })
    )
  }

  renderStops() {
    if (!this.state.stop_names) return null

    return (
      this.state.stop_names.map( function(stop) {
        return <div className='col-xs' key={stop}> {stop} </div>
      }.bind(this))
    )
  }

  renderTimeBetweenStops() {
    if (!this.state.stop_etas) return null

    return (
      this.state.stop_etas.map( function(time, index) {
        return <div className='col-xs' key={index}> {time} </div>
      }.bind(this))
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
          {this.renderTimeBetweenStops()}
        </div>
        <div className='row around-xs'>
          <div className='col-xs'>
            Current Time: {this.getCurrentTime()}
          </div>
        </div>
        <div className='row around-xs'>
          Caltrains: {this.renderCaltrains()}
        </div>

      </div>
    )
  }


};

export default App;
