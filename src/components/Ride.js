import '../assets/stylesheets/base.scss'
import React, { Component } from 'react'
import {Motion} from 'react-motion'
import Slider from 'react-rangeslider'
import 'whatwg-fetch'



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

	*/



class Ride extends Component {
  
	componentWillMount() {
		console.log('----- only see this once ------')
		this.setState({
			left: 0,
			testDate: this.props.currentDate,
			testStopEtas:  this.props.stopEtas,
			testState: false,
			isPaused: false
		})

	}


	componentDidMount() {
		// document.addEventListener('keydown', function(event) {
		// 	if (event.keyCode == "32") { // spacebar has been pressed
		// 		this.togglePause()
		// 	}
		// }.bind(this))
	}

	togglePause() {
		this.setState({
			isPaused: !this.state.isPaused
		})
	}

	continueToNextStop() {
		this.cycleStopStagesForward()
		this.togglePause()
	}

	parseDate(date_sec) {
	    var date = new Date(date_sec),
	        hours = date.getHours(),
	        minutes = date.getMinutes(),
	        seconds = date.getSeconds()
	    if( hours > 12 ){ hours -= 12; }
	    if( minutes < 10) { minutes = '0'+ minutes}
	    if( seconds < 10) { seconds = '0'+ seconds}
	    var time = hours + ':' + minutes //+ ':' + seconds

	    return time
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

	getStopEtas() {
		if (this.state.testState) {
			return this.state.testStopEtas
		} else {
			return this.props.stopEtas
		}
	}

	shouldDimStop(stop_obj) {
		if (this.getRideState() == RIDE_STAGE.stop && stop_obj.stage != STOP_STAGE.current_stop) {
			return 'hidden'
		}
		return ''
	}


	shouldShowDot(stop_obj, index) {
		if (index === 0) {	// first fake stop
			return 'invisible'
		}

		if (stop_obj.stage === STOP_STAGE.past_stop) {
			return 'gray-dot'
		} 
		return ''
	}

	shouldShowEta(stop_obj, index) {
		if (index === 0) {	// first fake stop
			return 'invisible'
		}

		if (!stop_obj.eta) {
			return 'invisible'
		}

		return ''
	}

	getRideState() {
		if (!this.getNextStop()) {
			console.log('da fuck?')
		}

		if (this.getNextStop().stage ===  STOP_STAGE.current_stop) {
			return RIDE_STAGE.stop
		} else {
			return RIDE_STAGE.ride
		}
	}



// // for testing purposes
	getStopDistance(stop_obj) {
		return stop_obj.distance
	}

	getStopLegTime(stop_obj) {
		if (!stop_obj.leg_time) return ''
			var minutes = stop_obj.leg_time.getMinutes(),
				seconds = stop_obj.leg_time.getSeconds()

			if( minutes < 10) { minutes = '0'+ minutes}
		    if( seconds < 10) { seconds = '0'+ seconds}

		return minutes+ ':' + seconds
	}

	shouldShowCaltrain() {
		if (this.props.isAM) return ''
		return 'invisible'
	}
	

/* -------------- Animation methods -------------- */


	getAnimationPosition() {
		if (!this.state.isPaused) {

			var next_stop = this.getNextStop(),
				past_stop = this.getPastStop(),
				date = this.state.testState ? this.state.testDate : this.props.currentDate

			GLOBAL_left = this.getAbsoluteRouteContainerPosition(past_stop, next_stop, date)
		}
	}



	// return ideal left position based on proportion of (time left=[ETA-current_time]/total leg time) * stop_distance, 
	getAbsoluteRouteContainerPosition(past_stop, next_stop, date) {

		if (document.getElementsByClassName('stop').length === 0) return 0
		
		if (!next_stop.leg_time) {
			console.log('leg-time issue!')
		}

		if (next_stop && !next_stop.eta) {
			console.log('adding a fake eta (in 5 min) to next stop')
			next_stop.eta = new Date()
			next_stop.eta.setMinutes(next_stop.eta.getMinutes() + 5) // in 5 minutes
			next_stop.leg_time = new Date(5*60*1000) // 5 minutes
		}


		/*
			what if we dont have any etas?
			assume every stop.eta is 5min (5*60*1000) away
		*/
		var stop_width = document.getElementsByClassName('stop')[0].getBoundingClientRect().width, 
			past_margin_width = document.getElementsByClassName('stop-margin')[0].getBoundingClientRect().width,
			index_past_stop = this.getStopEtas().indexOf(past_stop), // -1 if no past position  
			past_stop_left_pos = past_margin_width - index_past_stop*stop_width, 
			current_leg_progress = 1-((next_stop.eta.getTime()-date.getTime())/next_stop.leg_time.getTime())
			

			// dont mess with current leg process in test state, 
			// stop stages depend on it
		if (!this.state.testState){ 
			if (next_stop.stage === STOP_STAGE.current_stop) {
				current_leg_progress = 1 // stay at stop
			}
			current_leg_progress = Math.max(current_leg_progress, 0) // never have negative progress
		} 
		

		var animation_left = current_leg_progress * stop_width,
			current_left_position = past_stop_left_pos - animation_left

		GLOBAL_current_leg_progress = current_leg_progress

		// if(GLOBAL_current_leg_progress >10) {
		// 	console.log('why the face')
		// }

		if (index_past_stop === -1) {
			return past_margin_width + stop_width  - animation_left
		}

		return current_left_position 
	}



	renderTestInfo(stop_obj, index) {

		// return null // comment out when testing
		var shouldHide = ''
		if (index === 0) {	// first fake stop
			shouldHide = 'invisible'
		}
		return (
			<div className={'stop-test ' + shouldHide}>
				<div>
					{this.getStopDistance(stop_obj)}m	
				</div>
				<div>
					{this.getStopLegTime(stop_obj)}	
				</div>
			</div>
		)
	}

	renderStopAnnouncement(stop_obj, index) {
		if (this.props.isAM) return '' // no stop announcements :(


		if(stop_obj !== this.getNextStop()) return ''
		
		var shouldHide = ''
		if (index === 0) {	// first fake stop
			shouldHide = 'invisible'
		}


		return (
			<div className={'stop_announcement '+ shouldHide}>
				<div className='stop-announcement-title'> Upcoming Events </div>
				<div className='stop-announcement-text'> {stop_obj.announcement.text} </div>
				<div className='stop-announcement-time'> {stop_obj.announcement.time} </div>
			</div>
		)
	}

	renderStopName(stop_obj, index) {
		var shouldHide = ''
		if (stop_obj.stage === STOP_STAGE.past_stop && stop_obj !== this.getPastStop()) {
			shouldHide = ' hidden '
		}

		if (index === 0) {	// first fake stop
			shouldHide = 'invisible'
		}


		return (
			<div className={this.getStopClass(stop_obj) +' stop-name '+ this.shouldDimStop(stop_obj) + shouldHide}>
				<div className='text-container'>
					<div className='stop-text'> 
						<span className='stop-address'> {this.getStopAddress(stop_obj)} </span>
						<br/>
						<span className='stop-poi'> {this.getStopName(stop_obj)} </span>
					</div>
				</div>
			</div>
		)

	}



/* -------------- Render methods -------------- */
// want to display start time as we test to check if its getting recalculated
	renderStops() {
		if (!this.getStopEtas()) return null


		var stopEtasWithExtraStop = this.getStopEtas().slice(0, this.getStopEtas().length +1)

		stopEtasWithExtraStop.unshift(stopEtasWithExtraStop[0])
		// console.log(stopEtasWithExtraStop)

		return (
		  stopEtasWithExtraStop.map(function(stop_obj, index) {
		    return <div className='stop' key={index}> 
		    			{this.renderStopName(stop_obj, index)}
		    			<div className='path-line'/>		    			
	    				<div className='stop_extras'>
			    			<div className={this.shouldShowDot(stop_obj, index) +' stop-dot'}/>
			    			<div className={this.shouldShowEta(stop_obj, index) +' stop_eta ' + this.shouldDimStop(stop_obj)}>
			    				{stop_obj.eta ? this.parseDate(stop_obj.eta) : '---'}
			    			</div>
							{this.renderStopAnnouncement(stop_obj, index)}
		    			</div>
		    		</div>
		  }.bind(this))
		)
	}

	renderPastFakeStop() {
		return(
			<div className='fixed-past-container'>
			<img className='van-pic' src={require("./img/van-pic.png")}/>
				<div className='fake-stop stop'>
					<div className='stop-name'>
	    				<div className='text-container'>
	    				</div>
	    			</div>
					<div className='path-line past-line'/>
					<div className='stop_extras'>
						<div className='fake-dot stop-dot'/>
						<div className='stop_eta'/>
					</div>
				</div>


				<div className='fake-stop stop stop-margin'>
					<div className='stop-name'>
	    				<div className='text-container'>
	    				</div>
	    			</div>
					<div className='path-line past-line'/>
					<div className='stop_extras'>
						<div className='fake-dot stop-dot'/>
						<div className='stop_eta'/>
					</div>
				</div>


			</div>
		)
	}



	renderCaltrains() {
		var caltrain_etas_NB,
			caltrain_etas_SB

	    if (!this.props.availableCaltrainsNB || !this.props.availableCaltrainsSB) {
	    	caltrain_etas_NB = <div className='caltrain-time'> -- </div>
	    	caltrain_etas_SB = <div className='caltrain-time'> -- </div>
	    } else {
	      caltrain_etas_NB = this.props.availableCaltrainsNB.map( function(caltrainEtaNb) {
	        return <div className='caltrain-time' key={caltrainEtaNb}> {caltrainEtaNb} </div>
	      })
	      caltrain_etas_SB = this.props.availableCaltrainsSB.map( function(caltrainEtaSb) {
	        return <div className=' caltrain-time' key={caltrainEtaSb}> {caltrainEtaSb} </div>
	      })
	    }
	      
	    return (
	      	<div className='bottom-container'>

			<div className='driver-container '>
				<img className='driver-photo' src={require("./img/driver_photo.png")}  />
				<div className='driver-name'> Derek </div>
			</div>
		      	<div className={'caltrain-container '+ this.shouldShowCaltrain()}>
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


// change AM/PM
	renderCurrentTime() {
		return (
		  <div className={this.getRideState() === RIDE_STAGE.stop ? 'were-here time' : 'time'}>
		     {this.parseDate(this.state.testState ? this.state.testDate : this.props.currentDate)} {this.props.isAM ? ' AM' : ' PM'}
		  </div>
		)
	}
		
	render() {	
		if (!this.state) return null
		this.getAnimationPosition()

		return(
			<div>
				<div className='vehicle-screen'>
					{this.renderCurrentTime()}
					<div className='chariot-id'> 
							Chariot #10 
					</div>

					{this.renderPastFakeStop()}
					
			    	<Motion style={{left: GLOBAL_left}}>
			    		{({left}) => (
							<div className='route-container' style={{left: `${left}px` }}>
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
				   <button onClick={this.togglePause.bind(this)}>
				       {this.state.isPaused ? 'Continue ride' : 'Pause ride'}
				   </button> 
				   {this.state.isPaused ?
						<button onClick={this.continueToNextStop.bind(this)}>
					       Continue to next stop
					    </button> 
					    : ''
				   }
				   <button onClick={() => this.resetData()} className='reset-button'>
				        RESET AM DATA 
				   </button> 
				   <button onClick={() => this.resetData(true)} className='reset-button'>
				        RESET PM DATA 
				   </button> 
				   <div className='time'>
						{GLOBAL_current_leg_progress} 
						<br/>
						{this.getStopDistance(this.getNextStop())}m
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



	resetData(pm) {

	    var url = '/reset/am',
	    that = this
	    if (pm) {
	      url = 'reset/pm'
	    }

	    fetch(url).then(function(response) {
	          return response
	        }, function(error) {
	          console.log('error- '+ error);
	        }).then(function(data) {
	          console.log('successful reset')
	          this.props.setRouteData(0)
	        }.bind(this))
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
		} else {
			this.setState({
				testState: true
			})
		}
	}

	getMinTime() {
		return this.props.currentDate.getTime() //   -10*60*1000 // now - 10 min 

		// return this.getStopEtas()[0].eta.getTime() -10*60*1000 // first eta - 10 min 
	}

	getMaxTime() {
		return this.getStopEtas()[this.getStopEtas().length-1].eta.getTime()
	}

	handleTimeChange(value) {
		this.setState({
	      testDate: new Date(value)
	    })
		this.updateStopStageForTestDate(new Date(value)) 
	}


	updateStopStageForTestDate() {
		var stop = this.getNextStop()

		// if GLOBAL_current_leg_progress < 1 we need to cycle backwards
		if (stop.stage === STOP_STAGE.current_stop) {
			if (GLOBAL_current_leg_progress > 1.05) {
				this.cycleStopStagesForward()
			} else if (GLOBAL_current_leg_progress < .9) {
				this.cycleStopStagesBackward()
			}
			// go to next stage if leaving current stop 

		} else if (stop.stage === STOP_STAGE.upcoming_stop) {
			if (GLOBAL_current_leg_progress + .1 > 1) {
				this.cycleStopStagesForward()
			} else if (GLOBAL_current_leg_progress < .7) {
				this.cycleStopStagesBackward()
			}
			// go to next stage if upcoming stop has arrived

		} else if (stop.stage === STOP_STAGE.future_stop) {
			if (GLOBAL_current_leg_progress + .3 > 1) {
				this.cycleStopStagesForward()
			} else if (GLOBAL_current_leg_progress <= 0) {
				this.cycleStopStagesBackward()
			}
		} 
	}


	cycleStopStagesForward() {
		var stops = this.getStopEtas(),
			num_stops = stops.length

		for(var i=0; i<num_stops; i++) {
			var stop = stops[i]

			if (stop.stage === STOP_STAGE.current_stop){
				stop.stage = STOP_STAGE.past_stop

			} else if (stop.stage === STOP_STAGE.upcoming_stop){
				stop.stage = STOP_STAGE.current_stop
				// this.togglePause()

			} else if (stop === this.getNextStop()){
				if (GLOBAL_current_leg_progress < .9 && GLOBAL_current_leg_progress + .3 > 1) {
					stop.stage = STOP_STAGE.upcoming_stop
				}
			} 
		}
	}

	cycleStopStagesBackward() {
		var stops = this.getStopEtas(),
			num_stops = stops.length

		for(var i=0; i<num_stops; i++) {
			var stop = stops[i]

			if (stop.stage === STOP_STAGE.current_stop){
				stop.stage = STOP_STAGE.upcoming_stop

			} else if (stop.stage === STOP_STAGE.upcoming_stop){
				stop.stage = STOP_STAGE.future_stop

			} else if (stop === this.getPastStop()){
				if (GLOBAL_current_leg_progress < 0) {
					stop.stage = STOP_STAGE.current_stop
				}
			} 
		}
	}


	getPastStop() {
		var stops = this.getStopEtas(),
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
		var stops = this.getStopEtas(),
			num_stops = stops.length

		for(var i=0; i< num_stops; i++) {
			var stop = stops[i]

			if (stop.stage !== STOP_STAGE.past_stop) {
				return stop
			}
		}
		return stops[0]
	}

	getTestDateValue() {
		return this.state.testDate.getTime()
	}

	getTestDate() {
		return this.parseDate(this.state.testDate)
	}

}


export default Ride;
