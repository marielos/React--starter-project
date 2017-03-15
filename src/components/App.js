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


/* -------------- Time methods -------------- */
  setCurrentTime() {
    this.setState({
      current_date: new Date()
    })
  }

  getCurrentTime() {
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



/* -------------- Route methods -------------- */

  getRouteData() {
	  var data = {},
	      that = this

    fetch('/route/etas').then(function(response) {
		  return response.json()
		}, function(error) {
			console.log('error- '+ error);
		}).then(function(data) {
			
			that.setState({
				stop_names: that.getStopNames(data),
        stop_etas: that.getStopETAs(data)
			})

      console.log(data)
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
        stop_etas = ['']

    for (var i=0; i<seconds_between_stops.length; i++) {
      // add seconds to date and then re-parse?
        // keep an incremental counter of seconds between stops 
      var next_date = this.state.current_date,
          next_eta = this.parseDate(next_date.setSeconds(next_date.getSeconds() +seconds_between_stops[i]) )
      stop_etas.push(next_eta)
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

  
/* -------------- Render methods -------------- */

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

      </div>
    )
  }


};

export default App;
