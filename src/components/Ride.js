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



	getStopName(stop_obj) {  	
		return stop_obj.name
	}

	getStopClass(stop_obj) {
		switch (stop_obj.stage) {
		  case STOP_STAGE.current_stop:
		      return "current"
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



	

/* -------------- Animation methods -------------- */


	getAnimationPosition() {
		if (this.state.testState) {
			return this.getAbsoluteRouteContainerPosition(this.getPastStopForTestDate(), this.getNextStopForTestDate(), this.state.testDate)
		} else {
			return this.getAbsoluteRouteContainerPosition(this.props.pastStop, this.props.nextStop, this.props.currentDate)
		}
	}

	// return ideal left position based on proportion of (time left=[ETA-current_time]/total leg time) * stop_distance, 
	getAbsoluteRouteContainerPosition(past_stop, next_stop, date) {

		if (document.getElementsByClassName('stop').length === 0) return 0

		var stop_width = document.getElementsByClassName('stop')[0].getBoundingClientRect().width, 
			stop_dot_width = document.getElementsByClassName('stop-dot')[0].getBoundingClientRect().width,
			index_past_stop = this.props.stopEtas.indexOf(past_stop), // -1 if no past position  
			past_stop_left_pos = index_past_stop*stop_width - stop_width/2 - stop_dot_width,
			current_leg_progress = 1-((next_stop.eta.getTime()-date.getTime())/next_stop.leg_time.getTime()),
			animation_progress = current_leg_progress * stop_width,
			current_left_position = past_stop_left_pos + animation_progress

		if (index_past_stop === -1) {
			return stop_width + stop_width/2 - animation_progress
		}

		return -1*current_left_position
	}




/* -------------- Render methods -------------- */

	renderStops() {
		if (!this.props.stopEtas) return null

		return (
		  this.props.stopEtas.map( function(stop_obj) {
		    return <div className='stop' key={this.getStopName(stop_obj)}> 
		    			<div className={this.getStopClass(stop_obj) +' stop-name'}>
		    				<div className='text-container'>
		    					{this.getStopName(stop_obj)}	
		    				</div>
		    			</div>
		    			<div className='path-line'>
		    			</div>
		    			
	    				<div className={stop_obj.stage === STOP_STAGE.past_stop ? 'hidden stop_extras' : 'stop_extras'}>
			    			<div className='stop-dot'>
			    			</div>
			    			<div className='stop_eta'>
			    				{this.props.parseDate(stop_obj.eta)}
			    			</div>
		    			</div>
		    			
			    		
		    			
		    		</div>
		  }.bind(this))
		)
	}

	renderCurrentTime() {
		return (
		  <div className='time'>
		     {this.props.parseDate(this.state.testState ? this.state.testDate : this.props.currentDate)}
		  </div>
		)
	}
		

	render() {	
		if (!this.state) return null
		const left = this.getAnimationPosition()

		return(
			<div>
				<div className='vehicle-screen'>
					{this.renderCurrentTime()}
					<div className='fixed-line path-line past-line'/>
			    	<div className='fixed-line path-line first-line'/>
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
		return this.props.stopEtas[0].eta.getTime() -60*60*1000 // first eta - 30 min 
	}

	getMaxTime() {
		return this.props.stopEtas[this.props.stopEtas.length-1].eta.getTime()
	}

	handleTimeChange(value) {
		this.setState({
	      testDate: new Date(value)
	    })
		this.updateStopStageForTestDate(new Date(value)) 
	}



	updateStopStageForTestDate(test_date) {
		var stops = this.props.stopEtas,
			num_stops = stops.length,
			is_next_stop = true

		for(var i=0; i<num_stops; i++) {
			var stop = stops[i]
			if(stop.eta < test_date) {						// past stop
				stop.stage = STOP_STAGE.past_stop
			} else {								
				if(is_next_stop) {
					stop.stage = STOP_STAGE.current_stop	// current stop
					is_next_stop = false
				} else {
					stop.stage = STOP_STAGE.future_stop		// future stop
				}
			}
		}
	}



	getPastStopForTestDate() {
		var stops = this.props.stopEtas,
			num_stops = stops.length,
			past_stop 

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


export default Ride;
