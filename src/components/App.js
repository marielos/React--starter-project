import '../assets/stylesheets/base.scss';
import React, { Component } from 'react';
import 'whatwg-fetch'
import { Router, Route, browserHistory } from 'react-router';


class App extends Component {



  componentDidMount() {
    this.getStopETAs();
  }

  getStopETAs() {
	  var data = {}
	  var that = this;

    fetch('/route/etas').then(function(response) {
		  return response.json()
		}, function(error) {
			console.log('error- '+ error);
		}).then(function(data) {
			
			that.setState({
				stop_names: that.getStopNames(data),
        time_between_stops: that.getTimeBetweenStops(data)
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

  getTimeBetweenStops(data) {
    var time_between_stops = [],
        route = data.routes[0],
        legs = route.legs,
        num_legs = legs.length

    for (var i=0; i<num_legs; i++) {
      time_between_stops.push(legs[i].duration.text)
    }

    return time_between_stops
  }


  render() {
  	if (!this.state) return null
    return(
    	<div>
      	<div className='row'>
          {this.state.stop_names.map( function(stop) {

            return <div className='col-xs' key={stop}> {stop} </div>
          }.bind(this))}
        </div>
        <div className='row'>
          {this.state.time_between_stops.map( function(time, index) {

            return <div className='col-xs' key={index}> {time} </div>
          }.bind(this))}
        </div>
      </div>
    )
  }
};

export default App;
