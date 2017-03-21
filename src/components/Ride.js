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
  
	componentDidMount() {
	
	}

	renderStops() {
		if (!this.props.stops) return null

		return (
		  this.props.stops.map( function(stop_obj) {
		    return <div className='col-xs' key={this.getStopName(stop_obj)}> 
		    			<div className={this.getStopStage(stop_obj) + ' ' + this.isNextStop(stop_obj)}>
		    				{this.getStopName(stop_obj)}
		    			</div>
		    			<div>
		    				{this.getStopDistance(stop_obj)}m 
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


	// current or upcoming or 1st future 
	isNextStop(stop_obj) {
		if(stop_obj === this.props.nextStop) {
			return 'animate-stop'
		}
		return ''
	}

	// also css classes
	getStopStage(stop_obj) {
		switch (stop_obj.stage) {
		  case STOP_STAGE.upcoming_stop:
		      return "upcoming"
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


	renderStop() {
		return(
			<div className='box'>
				<div className='current animate-stop'>
					{this.props.currentStop.name}
				</div>
			</div>
		)
	}

	renderRide() {
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

	render() {
		console.log('-------------') 
		console.log('past_stop-') 
		console.log(this.props.pastStop)
		console.log('current_stop-') 
		console.log(this.props.currentStop)
		console.log('next_stop-') 
		console.log(this.props.nextStop)
		console.log('future_stop-') 
		console.log( this.props.futureStops)
		console.log('-------------') 

		if(this.props.currentStop) {
			return this.renderStop()
		} else {
			return this.renderRide()
		}
		
	}

}

export default Ride;
