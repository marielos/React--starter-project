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
		if (!this.props.stop_etas) return null

		return (
		  this.props.stop_etas.map( function(stop_obj) {
		    return <div className='stop' key={this.getStopName(stop_obj)}> 
		    			<div className={this.getStopStage(stop_obj) + ' ' + this.isNextStop(stop_obj)}>
		    				{this.getStopName(stop_obj)}
		    			</div>
		    			<div className='path-line'>
		    			</div>
		    			<div className='stop-dot'>
		    			</div>
		    			<div>
		    				{this.props.parseDate(stop_obj.eta)}
		    			</div>
		    			
		    		</div>
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


// for testing purposes
	getStopDistance(stop_obj) {
		return stop_obj.distance
	}



	renderCurrentTime() {
		return (
		  <div className='time'>
		     {this.props.parseDate(this.props.currentDate)}
		  </div>
		)
	}

	renderRide() {
		return(
			<div className='vehicle-screen'>
				{this.renderCurrentTime()}
				<div className='route-container'>
		          {this.renderStops()}
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

	
		return this.renderRide()
		
		
	}

}

export default Ride;
