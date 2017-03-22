import '../assets/stylesheets/base.scss';
import React, { Component } from 'react';
import {Motion, spring} from 'react-motion';
import Slider from 'react-rangeslider'

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
			left: 0,
			testDate: this.props.currentDate,
			testState: false
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
		     {this.props.parseDate(this.state.testState ? this.state.testDate : this.props.currentDate)}
		  </div>
		)
	}
		



	getAnimationPosition() {
		if (this.state.testState) {
			return this.getAbsoluteRouteContainerPosition(this.getPastStopForTestDate(), this.getNextStopForTestDate(), this.state.testDate)
		} else {
			return this.getAbsoluteRouteContainerPosition(this.props.pastStop, this.props.nextStop, this.props.currentDate)
		}
	}

	// return ideal left position based on proportion of (time left=[ETA-current_time]/total leg time) * stop_distance, 
	getAbsoluteRouteContainerPosition(past_stop, next_stop, date) {

		var stop_width = 180, // need to change this from a hard coded value to a calculated value based on width of .vehicle-screen
			stop_dot_width = 10,
			index_past_stop = this.props.stopEtas.indexOf(past_stop), // -1 if no past position  
			past_stop_left_pos = index_past_stop*stop_width - stop_width/2 - stop_dot_width,
			current_leg_progress = 1-((next_stop.eta.getTime()-date.getTime())/next_stop.leg_time.getTime()),
			animation_progress = current_leg_progress * stop_width,
			current_left_position = past_stop_left_pos + animation_progress
			// current_left_position = past_stop_left_pos

		if (index_past_stop === -1) {
			return stop_width
		}

		return -1*current_left_position
	}

	render() {	
		if (!this.state) return null
		const left = this.getAnimationPosition()


		return(
			<div>
				<div className='vehicle-screen'>
					{this.renderCurrentTime()}
					<div className='path-line past-line'/>
			    	
			    	<Motion style={{left: left}}>
			    		{({left}) => (
							<div className='route-container' style={{left: `${left}px` }}>
					          {this.renderStops()}
					        </div>
					    )}
				    </Motion>


				   
			    </div>
			    <div className='slider'>
			       <button onClick={this.toggleTestState.bind(this)}>
				       {this.state.testState ? 'Back to location base' : 'Switch to test state'}
				   </button> 
				   {this.state.testState ? 
					    <div>
						    <Slider
					          min={this.getMinTime()}
					          max={this.getMaxTime()}
					          tooltip={false}
					          value={this.getTestDateValue()}
					          onChange={this.handleTimeChange.bind(this)}
					        />
					        <div className='value'>{this.getTestDate()}</div>
				        </div>
				        : ''
			    	}
		        </div>
		    </div>


		)
	}


	/*------------ Testing methods -------------- */


	toggleTestState() {
		if(this.state.testState) {
			this.setState({
				testState: false
			})
		} else {
			this.setState({
				testState: true
			})
		}
	}

	getMinTime() {
		return this.props.stopEtas[0].eta.getTime()
	}

	getMaxTime() {
		return this.props.stopEtas[this.props.stopEtas.length-1].eta.getTime()
	}

	handleTimeChange(value) {
		console.log(value)
		this.setState({
	      testDate: new Date(value)
	    })
	}

	getPastStopForTestDate() {
		var stops = this.props.stopEtas,
			num_stops = stops.length

		for(var i=num_stops-1; i>=0; i--) {
			var stop = stops[i]
			if(stop.eta < this.state.testDate) {
				return stop
			}
		}
	}

	getNextStopForTestDate() {
		var stops = this.props.stopEtas,
			num_stops = stops.length

		for(var i=0; i< num_stops; i++) {
			var stop = stops[i]
			if(stop.eta > this.state.testDate) {
				return stop
			}
		}
	}

	getTestDateValue() {
		return this.state.testDate.getTime()
	}

	getTestDate() {
		return this.props.parseDate(this.state.testDate)
	}

}

// need to create a testing method
//  <div className='test-button'>
//   <button onClick={}>
//       Test Animation
//   </button> 
// </div>

export default Ride;
