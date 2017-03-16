import '../assets/stylesheets/base.scss';
import React, { Component } from 'react';
import 'whatwg-fetch'
import { Router, Route, browserHistory } from 'react-router';


class App extends Component {

  componentWillMount(){
    this.setCurrentTime()
    // calls every location change
    this.setLocation()
  }

  componentDidMount() {
    // this.getRouteData()

    // calls set time every second
    window.setInterval(function () {
      this.setCurrentTime()
    }.bind(this), 1000)
    
    // calls setLocation every 15 seconds
    // window.setInterval(function () {
    //   this.setLocation()
    //   this.getRouteData()
    // }.bind(this), 15000)
    
  }


/* -------------- Time methods -------------- */
  setCurrentTime() {
    var date = new Date()
    this.setState({
      current_date: date,
      stop_etas: this.getStopETAs(null, date)
    })
    // update ETAs
    

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
        data: data,
				stop_names: that.getStopNames(data),
        stop_etas: that.getStopETAs(data)
			})

      // console.log(data)
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


  getStopETAs(data, date) {
    if (!this.state || !this.state.data) return null
    if (!data) data = this.state.data
    if(!date) date = this.state.current_date
    var seconds_between_stops = this.getSecondsBetweenStops(data),
        stop_etas = [],
        accumulated_seconds = 0

    for (var i=0; i<seconds_between_stops.length; i++) {
      accumulated_seconds += seconds_between_stops[i]
      var next_date = new Date(date.getTime()),
          next_eta = this.parseDate(next_date.setSeconds(next_date.getSeconds() +accumulated_seconds) )
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


/* -------------- Location methods -------------- */
// I can call this every minute and recalculate ETAs

  setLocation() {
    var num_calls = 1
    if (navigator.geolocation) {

      // gets called everytime we change position
      navigator.geolocation.watchPosition(function(position) {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }


    

        this.setState({
          current_location : pos,
          num_calls : num_calls++
        })

        // get route data once after current position is determined
        // if(!this.state.data) {
          this.getRouteData()
        // }
        
      }.bind(this), function() {
        console.log('error with navigator.geolocation')
      });
    } else {
      console.log('browser doesnt support navigator.geolocation')
    }

  }







  
/* -------------- Render methods -------------- */

  renderStops() {
    if (!this.state.stop_names) return null

    return (
      this.state.stop_names.map( function(stop) {
        return <div className='col-xs' key={stop}> {stop} </div>
      })
    )
  }

  renderStopETAs() {
    if (!this.state.stop_etas) return null

    return (
      this.state.stop_etas.map( function(time, index) {
        return <div className='col-xs' key={index}> {time} </div>
      })
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
            Current Time7: {this.getCurrentTime()}
          </div>
        </div>
        {this.renderCurrentLocation()}
        {this.state.num_calls}
      </div>
    )
  }


};

export default App;
