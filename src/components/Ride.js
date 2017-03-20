import '../assets/stylesheets/base.scss';
import React, { Component } from 'react';

// for testing purposes
var STOP_STAGE = {
  upcoming_stop: 0,
  current_stop: 1,
  past_stop: 2,
  future_stop: 3
}


class Ride extends Component {
  
  renderStops() {
    if (!this.props.stops) return null

    return (
      this.props.stops.map( function(stop_obj) {
        return <div className='col-xs' key={this.getStopName(stop_obj)}> 
        			<div className={this.getStopStage(stop_obj)}>
        				{this.getStopName(stop_obj)}
        			</div>
        			<div>
        				{this.getStopStage(stop_obj)} - {this.getStopDistance(stop_obj)}m 
        			</div>
        		</div>
      }.bind(this))
    )
  }

  renderStopETAs() {
    if (!this.props.stop_etas) return null
    return (
      this.props.stop_etas.map( function(time, index) {
        return <div className='col-xs' key={index}> {this.props.parseDate(time)} </div>
      }.bind(this))
    )
  }

  getStopName(stop_obj) {  	
    return stop_obj.name
  }

  // also css classes
  getStopStage(stop_obj) {
    switch (stop_obj.stage) {
      case STOP_STAGE.upcoming_stop:
          return "upcoming"
      // case STOP_STAGE.current_stop:
      //   return "current"
      case STOP_STAGE.past_stop:
        return "past"
      case STOP_STAGE.future_stop:
        return "future"
      default:
        return "da fuck?"
    }
  }

  getStopDistance(stop_obj) {
    return stop_obj.distance
  }

	render() {
		return(
			<div className='box'>
				<div className='row around-xs'>
		          {this.renderStops()}
		        </div>
		        <div className='row around-xs'>
		          {this.renderStopETAs()}
		        </div>
			</div>
		)
	}

}

export default Ride;
