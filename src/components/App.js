import '../assets/stylesheets/base.scss';
import React, { Component } from 'react';

class App extends Component {



  componentDidMount() {
    this.setRouteStops();
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





  render() {
  	if (!this.state) return null
  		
    return(
      	<div className='row'>
          {this.state.stops.map( function(stop) {

            return <div className='col-xs' key={stop.name}> {stop.name} </div>
          }.bind(this))}
        </div>
    )
  }
};

export default App;
