import '../assets/stylesheets/base.scss'
import React, { Component } from 'react'
import {Motion, spring} from 'react-motion'
import Slider from 'react-rangeslider'

// import caltrain_check5 from './img/test.jpg'




// for testing purposes
var STOP_STAGE = {
  upcoming_stop: 0,
  current_stop: 1,
  past_stop: 2,
  future_stop: 3
}

var RIDE_STAGE = {
  stop: 0,
  ride: 1
}

var GLOBAL_current_leg_progress = 0,
	GLOBAL_left = 0





	/* ---------------------- TO DO ----------------------


		click to toggle stage of stop 

		create this.state.test_stop_etas


	*/



class Ride extends Component {
  
	componentDidMount() {
		this.setState({
			left: 0,
			testDate: this.props.currentDate,
			testState: false,
			isPaused: false
		})


		document.addEventListener('keydown', function(event) {
			if (event.keyCode == "32") { // spacebar has been pressed
				this.setState({
					isPaused: !this.state.isPaused
				})
			}
		}.bind(this))
	}


	getStopName(stop_obj) {  	
		return stop_obj.name
	}

	getStopAddress(stop_obj) {  	
		return stop_obj.address
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

/* -------------- TO DO -------------- 

	create methods to identify ride stage based on stages of stops
	eg. current stop = STOP, no upcoming, current = RIDE

	dim all stops in current stop



*/

	shouldDimStop(stop_obj) {
		// return '' // comment out later
		if (this.getRideState() == RIDE_STAGE.stop && stop_obj.stage != STOP_STAGE.current_stop) {
			return 'dim'
		}
		return ''
	}

	shouldShowEta(stop_obj) {
		if (stop_obj.stage === STOP_STAGE.past_stop || stop_obj.stage === STOP_STAGE.current_stop) {
			return 'hidden'
		} 
		return ''
	}

	shouldShowDot(stop_obj) {
		if (stop_obj.stage === STOP_STAGE.past_stop) {
			return 'hidden'
		} 
		return ''
	}

	getRideState() {
		if (this.getNextStop().stage ===  STOP_STAGE.current_stop) {
			return RIDE_STAGE.stop
		} else {
			return RIDE_STAGE.ride
		}
	}



// for testing purposes
	getStopDistance(stop_obj) {
		return stop_obj.distance
	}

	getStopStartTime(stop_obj) {
		return this.props.parseDate(stop_obj.start_time)
	}


	

/* -------------- Animation methods -------------- */


	getAnimationPosition() {
		if (!this.state.isPaused) {

			var next_stop = this.getNextStop(),
				past_stop = this.getPastStop(),
				date = this.state.testState ? this.state.testDate : this.props.currentDate

			if(!next_stop) {
				console.log('que paso?')
			}

			console.log(next_stop.name)

			GLOBAL_left = this.getAbsoluteRouteContainerPosition(past_stop, next_stop, date)
		}
	}



	// return ideal left position based on proportion of (time left=[ETA-current_time]/total leg time) * stop_distance, 
	getAbsoluteRouteContainerPosition(past_stop, next_stop, date) {

		if (document.getElementsByClassName('stop').length === 0) return 0

		if(!next_stop.leg_time) {
			console.log('leg-time issue!')
		}
		var stop_width = document.getElementsByClassName('stop')[0].getBoundingClientRect().width, 
			// stop_dot_width = document.getElementsByClassName('stop-dot')[0].getBoundingClientRect().width,	// what is this for??
			// past_line_width = document.getElementsByClassName('past-stop-line')[0].getBoundingClientRect().width, 
			past_margin_width = document.getElementsByClassName('past-margin-line')[0].getBoundingClientRect().width,
			index_past_stop = this.props.stopEtas.indexOf(past_stop), // -1 if no past position  
			past_stop_left_pos = past_margin_width - index_past_stop*stop_width, // - stop_width/2,// - stop_dot_width,
			current_leg_progress = 1-((next_stop.eta.getTime()-date.getTime())/next_stop.leg_time.getTime()),
			animation_left = current_leg_progress * stop_width,
			current_left_position = past_stop_left_pos - animation_left

		GLOBAL_current_leg_progress = current_leg_progress
	
		if (index_past_stop === -1) {
			return past_margin_width + stop_width  - animation_left
		}


		return current_left_position
	}



	renderTestInfo(stop_obj) {

		return null // comment out when testing

		return (
			<div>
				<div className='stop-eta'>
					{this.getStopDistance(stop_obj)}m	
				</div>
				<div className='stop-eta'>
					{this.getStopStartTime(stop_obj)}	
				</div>
			</div>
		)
	}

	renderStopAnnouncement(stop_obj) {
		if(stop_obj.stage === STOP_STAGE.past_stop || stop_obj.stage === STOP_STAGE.future_stop) return ''
		
		return (
			<div className={'stop_announcement'}>
				<div className='stop-announcement-title'> Upcoming Events </div>
				<div className='stop-announcement-text'> {stop_obj.announcement.text} </div>
				<div className='stop-announcement-time'> {stop_obj.announcement.time} </div>
			</div>
		)
	}

	renderStopName(stop_obj) {
		return (
			<div className={this.getStopClass(stop_obj) +' stop-name'}>
				<div className='text-container'>
					<div className='stop-address'> {this.getStopAddress(stop_obj)} </div>
					<div className='stop-poi'> {this.getStopName(stop_obj)} </div>
				</div>
			</div>
		)

	}

/* -------------- Render methods -------------- */
// want to display start time as we test to check if its getting recalculated
	renderStops() {
		if (!this.props.stopEtas) return null

		return (
		  this.props.stopEtas.map(function(stop_obj) {
		    return <div className={this.shouldDimStop(stop_obj) +' stop'} key={this.getStopName(stop_obj)}> 
		    			{this.renderStopName(stop_obj)}
		    			<div className='path-line'/>		    			
	    				<div className='stop_extras'>
			    			<div className={this.shouldShowDot(stop_obj) +' stop-dot'}/>
			    			<div className={this.shouldShowEta(stop_obj)  +' stop_eta'}>
			    				{this.props.parseDate(stop_obj.eta)}
			    			</div>
							{this.renderStopAnnouncement(stop_obj)}
			    			{this.renderTestInfo(stop_obj)}
		    			</div>
		    		</div>
		  }.bind(this))
		)
	}

	renderFirstFakeStop() {
		return(
				<div className='fake-stop stop'>
					<div className='stop-name'>
	    				<div className='text-container'>
	    				</div>
	    			</div>
					<div className='path-line'/>
					<div className='stop_extras'>
						<div className='fake-dot stop-dot'/>
						<div className='stop_eta'/>
					</div>
				</div>
		)
	}

	renderCaltrains() {
	    if (!this.props.availableCaltrainsNB || !this.props.availableCaltrainsSB) return null

	      var caltrain_etas_NB = this.props.availableCaltrainsNB.map( function(caltrainEtaNb) {
	        return <div className='caltrain-time' key={caltrainEtaNb}> {caltrainEtaNb} </div>
	      })
	      var caltrain_etas_SB = this.props.availableCaltrainsSB.map( function(caltrainEtaSb) {
	        return <div className=' caltrain-time' key={caltrainEtaSb}> {caltrainEtaSb} </div>
	      })
	    return (
	      	<div className='bottom-container'>

			<div className='driver-container '>
			<img className='driver-photo' src={require("./img/driver_photo.png")}  />
			<div className='driver-name'> Derek </div>
			</div>
		      	<div className='caltrain-container '>
		      	<img className='caltrain-check' src={require("./img/caltrain_check.png")} />
		      		<div className='caltrain-text'>
				        <div className='caltrain-heading'>  On time for Caltrain: </div>
				        <div className='caltrain-direction'> NB {caltrain_etas_NB} </div> 
				        	
				        <div className='caltrain-direction'> SB {caltrain_etas_SB}</div>
				        	
			        </div>
		        </div> 
		    </div>
	    )
	 }

	renderCurrentTime() {
		return (
		  <div className='time'>
		     {this.props.parseDate(this.state.testState ? this.state.testDate : this.props.currentDate)}
		  </div>
		)
	}
		
//			    	<div className='fixed-line path-line first-line'/>

	render() {	
		if (!this.state) return null
		this.getAnimationPosition()

		return(
			<div>
				<div className='vehicle-screen'>
					<div className='time'>
						{this.renderCurrentTime()}
					</div>
					<div className='chariot-id'> Chariot #10 </div>

					<div className='fixed-past-container'>
						<div className='path-line past-line past-stop-line'/>
						<div className='path-line past-line past-margin-line'/>
						<img className='van-pic' src={require("./img/van-pic.png")}/>
					</div>

			    	<Motion style={{left: GLOBAL_left}}>
			    		{({left}) => (
							<div className='route-container' style={{left: `${left}px` }}>
							  {this.renderFirstFakeStop()}
					          {this.renderStops()}
					        </div>
					    )}
				    </Motion>
				    
					{this.renderCaltrains()}
			    </div>


			    <div className='slider'>
			       <button onClick={this.toggleTestState.bind(this)}>
				       {this.state.testState ? 'Back to location base' : 'Switch to test state'}
				   </button> 
				   <div className=''>
						{GLOBAL_current_leg_progress}
					</div>
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

/*
	fix tezting environment to include leg_time, startime


*/
	toggleTestState() {
		if(this.state.testState) {
			this.setState({
				testState: false
			})
			// var first_stop = this.props.stopEtas[0]
			// first_stop.stage = STOP_STAGE.next_stop
			// first_stop['start_time'] = new Date()
	  //       first_stop['leg_time'] = new Date(stop.eta - new Date(stop.start_time))
		} else {
			this.setState({
				testState: true
			})
		}
	}

	getMinTime() {
		return this.props.currentDate.getTime() -10*60*1000 // now - 10 min 

		// return this.props.stopEtas[0].eta.getTime() -10*60*1000 // first eta - 10 min 
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
		var stop = this.getNextStop()
			// current_leg_progress = 1-((stop.eta.getTime()-test_date.getTime())/stop.leg_time.getTime())

			// stops = this.props.stopEtas,
			// num_stops = stops.length,
			// is_next_stop = true


		// for(var i=0; i<num_stops; i++) {
		// 	var stop = stops[i]

		// 	if (stop.eta > test_date) {		// at current, upcoming, or next stop,

				// if (!stop.start_time) {
				// 	console.log(stop.name + ' didnt have a start time')
	   //              stop['start_time'] = test_date
	   //              stop['leg_time'] = new Date(stop.eta - new Date(stop.start_time))
	   //          }


		if (stop.stage === STOP_STAGE.current_stop) {
			if (GLOBAL_current_leg_progress - .1 > 1) this.cycleStopStagesForward(test_date)
			// go to next stage if leaving current stop 

		} else if (stop.stage === STOP_STAGE.upcoming_stop) {
			if (GLOBAL_current_leg_progress + .1 > 1) this.cycleStopStagesForward(test_date)
			// go to next stage if upcoming stop has arrived

		} else {
			if (GLOBAL_current_leg_progress + .3 > 1) this.cycleStopStagesForward(test_date)
			// go to next stage if next stop is getting close
		} 
				// else if (stop.stage === STOP_STAGE.future_stop) {

				// }
			// 	break
			// }
		
	}



	cycleStopStagesForward(test_date) {
		var stops = this.props.stopEtas,
			num_stops = stops.length

		for(var i=0; i<num_stops; i++) {
			var stop = stops[i]

			if (stop.stage === STOP_STAGE.current_stop){
				stop.stage = STOP_STAGE.past_stop

			} else if (stop.stage === STOP_STAGE.upcoming_stop){
				stop.stage = STOP_STAGE.current_stop

			} else if (stop === this.getNextStop()){
				if (GLOBAL_current_leg_progress + .3 > 1) {
					stop.stage = STOP_STAGE.upcoming_stop
				}
			} 
		}
	}


	getPastStop() {
		var stops = this.props.stopEtas,
			num_stops = stops.length,
        	recent_past_stop = null

	    for (var i=0; i<num_stops; i++) {
	      var stop = stops[i]

	      if (stop.stage === STOP_STAGE.past_stop) {
	        recent_past_stop = stop
	      }
	    }
	    return recent_past_stop
	}

	getNextStop() {
		var stops = this.props.stopEtas,
			num_stops = stops.length

		for(var i=0; i< num_stops; i++) {
			var stop = stops[i]
			if(stop.stage === STOP_STAGE.current_stop || stop.stage === STOP_STAGE.upcoming_stop) {
				console.log('near stop')
				return stop
			}

			if (stop.stage === STOP_STAGE.future_stop) {
				console.log('next future')
				return stop
			}
		}

		// for(var i=0; i< num_stops; i++) {
		// 	var stop = stops[i]
		// 	if (stop.stage === STOP_STAGE.future_stop) {
		// 		console.log('next future')
		// 		return stop
		// 	}
		// }
		console.log('what is going on?')
	}

	getTestDateValue() {
		return this.state.testDate.getTime()
	}

	getTestDate() {
		return this.props.parseDate(this.state.testDate)
	}

}


export default Ride;
