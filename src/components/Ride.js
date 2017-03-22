import '../assets/stylesheets/base.scss';
import React, { Component } from 'react';
import {Motion, spring} from 'react-motion';

// for testing purposes
var STOP_STAGE = {
  upcoming_stop: 0,
  current_stop: 1,
  past_stop: 2,
  future_stop: 3
}


class Ride extends Component {
  
	componentDidMount() {
		this.setState({
			left: 0
		})
	}

	renderStops() {
		if (!this.props.stopEtas) return null

		return (
		  this.props.stopEtas.map( function(stop_obj) {
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
		
	// return ideal left position based on proportion of (time left=[ETA-current_time]/total leg time) * stop_distance, 
	getAbsoluteRouteContainerPosition() {

		var stop_width = 180, // need to change this from a hard coded value to a calculated value based on width of .vehicle-screen
			index_past_stop = this.props.stopEtas.indexOf(this.props.pastStop), // -1 if no past position  
			past_stop_left_pos = index_past_stop*stop_width,
			next_stop = this.props.nextStop,
			current_leg_progress = (next_stop.eta.getTime()-this.props.currentDate.getTime())/next_stop.leg_time.getTime(),
			animation_progress = current_leg_progress * stop_width,
			current_left_position = past_stop_left_pos + animation_progress

		if (index_past_stop === -1) {
			return stop_width
		}

		return -1*current_left_position
	}



	render() {	
		if (!this.state) return null
		const left = this.getAbsoluteRouteContainerPosition()


		return(
			<div className='vehicle-screen'>
				{this.renderCurrentTime()}
				<div className='path-line past-line'/>
		    	
		    	<Motion style={{left: spring(left)}}>
		    		{({left}) => (
						<div className='route-container' style={{left: `${left}px` }}>
				          {this.renderStops()}
				        </div>
				    )}
			    </Motion>

			   
		    </div>

		)
	}

}

// need to create a testing method
//  <div className='test-button'>
//   <button onClick={}>
//       Test Animation
//   </button> 
// </div>

export default Ride;
