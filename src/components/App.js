import '../assets/stylesheets/base.scss';
import React, { Component } from 'react';
import 'whatwg-fetch'
import { Router, Route, browserHistory } from 'react-router';


class App extends Component {



  componentDidMount() {
    this.setRouteStops();
    this.getStopETAs();
  }

  setRouteStops() {
    var routeStops = [
      {
        name: 'IDEO',
        lat: 37.442309, 
        lng: -122.160738
      },
      {
        name: 'Med Wraps',
        lat: 37.425994, 
        lng: -122.144927
      },
      {
        name: 'Stanford',
        lat: 37.428057,
        lng: -122.165364
      }
    ]

    this.setState({
      stops : routeStops
    }) 
  }

  getStopETAs() {

  	  console.log('controller')
	  var data = {}
	  var that = this;

	  var response = fetch('/route/etas').then(function(response) {
		
		  return response.json()
		  
		}, function(error) {
			console.log('error- '+ error);
		  error.message //=> String
		}).then(function(data) {
			console.log(data)
			that.setState({
				data: data
			})
			return data
		})

  }


  render() {
  	if (!this.state) return null
    return(
    	
      	<div className='row'>

          {this.state.stops.map( function(stop) {

            return <div className='col-xs' key={stop.name}> {stop.name} </div>
          }.bind(this))}

          {this.state.data ? this.state.data.base : ''}
        </div>
    )
  }
};

export default App;
