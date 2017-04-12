import '../assets/stylesheets/base.scss'
import React, { Component } from 'react'
import {Motion} from 'react-motion'
import 'whatwg-fetch'
import {STOP_STAGE} from './App'


/* -------------- Constants -------------- */

var RIDE_STAGE = {
  stop: 0,
  ride: 1
}

var GLOBAL_current_leg_progress = 0,
	GLOBAL_left = 0

/* --------------------------------------- */

class Ride extends Component {
  
	componentWillMount() {
		this.setState({
			left: 0,
			testDate: this.props.currentDate,
			testStopEtas:  this.shallowCopyOfStopEtas(this.props.stopEtas), 
			testState: false,
			isPaused: false
		})
	}

	shallowCopyOfStopEtas(etas) {

		function shallowCopy( original )  {
		    // First create an empty object with
		    // same prototype of our original source
		    var clone = Object.create( Object.getPrototypeOf( original ) )
		    var i , keys = Object.getOwnPropertyNames( original )

		    for ( i = 0 ; i < keys.length ; i ++ ) {
		        // copy each property into the clone
		        Object.defineProperty(clone, keys[ i ], Object.getOwnPropertyDescriptor(original, keys[ i ])) 
		    }

		    return clone ;
		}

		var etas_copy = []

	    for(var i=0; i<etas.length; i++) {
	      var stop_copy = shallowCopy(etas[i]) 
	      etas_copy.push(stop_copy)
	    }
	    return etas_copy
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


/* -------------- Get Methods -------------- */

	getTestDate() {
		return this.parseDate(this.state.testDate)
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

/* -------------- CSS class Methods -------------- */

	shouldDimStop(stop_obj) {
		if (this.getRideState() == RIDE_STAGE.stop && stop_obj.stage != STOP_STAGE.current_stop) {
			return ' hidden '
		}
		return ''
	}


	shouldShowDot(stop_obj, index) {
		if (index === 0) {	// first fake stop
			return ' invisible '
		}

		if (stop_obj.stage === STOP_STAGE.past_stop) {
			return ' gray-dot '
		} 
		return ''
	}

	shouldShowEta(stop_obj, index) {
		if (index === 0) {	// first fake stop
			return ' invisible '
		}

		if (!stop_obj.eta) {
			return ' invisible '
		}

		if (stop_obj.stage === STOP_STAGE.past_stop) {
			return ' hidden '
		}

		return ''
	}


	shouldShowCaltrain() {
		if (this.props.isAM) return ''
		return ' invisible '
	}
	

/* -------------- Animation methods -------------- */


	getAnimationPosition() {
		if (!this.state.isPaused) {

			var next_stop = this.getNextStop(),
				past_stop = this.getPastStop(),
				date = this.state.testState ? this.state.testDate : this.props.currentDate

			GLOBAL_left = this.getAbsoluteRouteContainerPositionV2(past_stop, next_stop, date)
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
			
		if (next_stop.stage === STOP_STAGE.current_stop) {
			current_leg_progress = 1 // stay at stop
		}
			
		if (this.state.testState) {	// animate middle stages
			if (next_stop.stage === STOP_STAGE.upcoming_stop){
				current_leg_progress = .8

			} else if (next_stop.stage === STOP_STAGE.future_stop){
				current_leg_progress = .3
			} 
		}


		current_leg_progress = Math.min(Math.max(current_leg_progress, 0),1) // never have negative progress, or more than 1 
		

		var animation_left = current_leg_progress * stop_width,
			current_left_position = past_stop_left_pos - animation_left

		GLOBAL_current_leg_progress = current_leg_progress

		if (index_past_stop === -1) {
			return past_margin_width + stop_width  - animation_left
		}

		return current_left_position 
	}



	// return ideal left position based on proportion of (time left=[ETA-current_time]/total leg time) * stop_distance, 
	getAbsoluteRouteContainerPositionV2(past_stop, next_stop, date) {

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
			advance_width = stop_width*.2,
			index_past_stop = this.getStopEtas().indexOf(past_stop), // -1 if no past position  
			past_stop_left_pos = past_margin_width - index_past_stop*stop_width, 
			current_leg_progress = 1-((next_stop.eta.getTime()-date.getTime())/next_stop.leg_time.getTime())
			
		if (next_stop.stage === STOP_STAGE.current_stop) {
			current_leg_progress = 1 // stay at stop
		}
			
		if (this.state.testState) {	// animate middle stages
			if (next_stop.stage === STOP_STAGE.upcoming_stop){
				current_leg_progress = .8

			} else if (next_stop.stage === STOP_STAGE.future_stop){
				current_leg_progress = .1
			} 
		}


		current_leg_progress = Math.min(Math.max(current_leg_progress, 0),1) // never have negative progress, or more than 1 		
		GLOBAL_current_leg_progress = current_leg_progress

		var animation_left = current_leg_progress * (stop_width-advance_width),
			current_left_position = past_stop_left_pos - animation_left - advance_width


		if (index_past_stop === -1) {
			current_left_position =  past_margin_width + stop_width  - animation_left - advance_width
		}

		return current_left_position 
	}



/* -------------- Render methods -------------- */


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
	    				{this.renderStopExtras(stop_obj, index)}
		    		</div>
		  }.bind(this))
		)
	}

	renderStopExtras(stop_obj, index) {
		return (
			<div className='stop_extras'>
    			<div className={this.shouldShowDot(stop_obj, index) +' stop-dot'}/>
    			<div className={this.shouldShowEta(stop_obj, index) +' stop_eta ' + this.shouldDimStop(stop_obj)}>
    				{stop_obj.eta ? this.parseDate(stop_obj.eta) : '---'}
    			</div>
				{this.renderStopAnnouncement(stop_obj, index)}
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

	renderPastFakeStop() {
		return(
			<div>
				<img className='van-pic' src={require("./img/van-pic.png")}/>

				<div className='fixed-past-container'>
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
			</div>
		)
	}

	renderTestInfo(stop_obj, index) {

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
		if (!stop_obj) return ''
		if (!stop_obj.announcement) return ''
		
		var fake = '',
			shouldHide = stop_obj !== this.getNextStop() ? ' hidden ' : ''

		if (index === 0) {	// first fake stop
			fake = ' invisible '
		}

		return (
			<div className={'stop_announcement '+ shouldHide + fake}>
				<div className='stop-announcement-text'> {stop_obj.announcement.text} </div>
				<div className='stop-announcement-time'> {stop_obj.announcement.time} </div>
			</div>
		)
	}


	renderBottomBar() {

	    var caltrain_etas_NB = <div className='caltrain-time'> {this.props.availableCaltrainsNB} </div>,
	    	caltrain_etas_SB = <div className='caltrain-time'> {this.props.availableCaltrainsSB} </div>
	      
	    return (
	      	<div className='bottom-container row around-xs'>

	      		<div className={'caltrain-container col-xs '+ this.shouldShowCaltrain()}>
	      			<img className='caltrain-photo' src={require("./img/caltrain.png")}  />
		      		<div className='caltrain-text'>
		      			<div className='row around-xs invisible'>
				        	<div className='caltrain-heading col-xs bold'> Caltrain connections </div>
				        </div>
				        <div className='row around-xs'>
					        <div className='caltrain-direction col-xs'> 
					        	<span className='direction-letter'>N</span>
					        	<img className='direction-img' src={require("./img/north.png")}/>
					        	{caltrain_etas_NB} Express
					        </div> 
					    </div>
					    <div className='row around-xs'>
					        <div className='caltrain-direction col-xs'> 
					        	<span className='direction-letter'>S</span>
					        	<img className='direction-img south-arrow' src={require("./img/south.png")}/>
					        	{caltrain_etas_SB} Bullet
					        </div> 
					    </div>
					    
			        </div>
		        </div> 


				<div className='col-xs time-container'>
					<div className='time-text'> 
						{this.parseDate(this.state.testState ? this.state.testDate : this.props.currentDate)} {this.props.isAM ? ' AM' : ' PM'}
					</div>
				</div>


				<div className='driver-container col-xs'>
					<img className='driver-photo' src={require("./img/driver_photo.png")}  />
					<div className='chariot-container'>
						<div className='driver-name row'> 
							<div className='driver-name'> Derek </div>
						</div>
						<div className='chariot-id row bold'> Chariot #10 </div>
					</div>
				</div>
		    </div>
	    )
	 }

	renderCurrentTime() {
		return (
		  <div className='time'>
		     {this.parseDate(this.state.testState ? this.state.testDate : this.props.currentDate)} {this.props.isAM ? ' AM' : ' PM'}
		  </div>
		)
	}
		
	render() {	
		if (!this.state) return null
		var progress = GLOBAL_current_leg_progress*100
		this.getAnimationPosition()

		return(
			<div className='main-container'>

			<div className='testing-container'>
				<div className='row around-xs'>
					<div className='test-col col-xs'>
						
						<div className='row bottom-xs test-info-container'>
							<div className='col-xs'>
								<div className='row around-xs'>
									<button onClick={() => this.resetData()} className='pure-button button-error col-xs'>
								    	AM 
								   </button> 
								   <button onClick={() => this.resetData(true)} className='pure-button button-error col-xs'>
								        PM 
								   </button> 
							   </div>
							   <div className='row around-xs'>
									<button className={this.state.testState ? 'pure-button invisible col-xs pause-button' : 'pure-button col-xs pause-button'} onClick={this.togglePause.bind(this)}>
								       {this.state.isPaused ? 'Continue' : 'Pause'}
								   </button> 
							   </div>
							</div>
						</div>

						<div className='test-title'> Routes </div>
					</div>

					<div className='test-col col-xs'>
						
						<div className='row bottom-xs test-info-container'>
							<div className='col-xs'>
								
									{this.state.testState ?
										<div className='row around-xs'>
											<button onClick={() => this.cycleStopStagesBackward()} className='pure-button col-xs'>
										    	Previous
										    </button> 
										    <button onClick={() => this.cycleStopStagesForward()} className='pure-button col-xs'>
										        Next
										    </button> 
										</div>
									    :
									    <div className='row around-xs'>
										    <div className={this.state.isPaused ? 'dim col-xs test-info ' : 'col-xs test-info'}>
											{progress.toFixed(1)} %
											</div>
											<div className='col-xs test-info'>
												{this.getStopDistance(this.getNextStop())}m away
											</div>
										</div>
									}
									
								
								<div className='row around-xs'>
									<button className='pure-button col-xs test-state-button' onClick={this.toggleTestState.bind(this)}>
								       {this.state.testState ? 'Back to location base' : 'Switch to test state'}
								   </button> 
							   </div>
							</div>
						</div>

						<div className='test-title'> Current Leg Progress </div>
					</div>

					<div className='test-col col-xs'>
						
						<div className='row bottom-xs test-info-container'>
							<div className='col-xs'>
								<div className='test-info'>
									{this.props.numAPICalls} 
								</div>
								<div className='row around-xs'>
									<button className= {this.state.testState ? 'pure-button invisible col-xs force-api-button' : 'pure-button col-xs force-api-button'}  onClick={() => this.props.forceAPICall()} >
								        Force API call
								   </button> 
							   </div>
							</div>
						</div>
						<div className='test-title'> API Calls </div>
					</div>
				</div>

  				
		    </div>

		    <div className='vehicle-screen'>
				{this.renderPastFakeStop()}
		    	<Motion style={{left: GLOBAL_left}}>
		    		{({left}) => (
						<div className='route-container' style={{left: `${left}px` }}>
				          {this.renderStops()}
				        </div>
				    )}
			    </Motion>
			    
				{this.renderBottomBar()}
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
				testState: true,
				testStopEtas: this.shallowCopyOfStopEtas(this.props.stopEtas),
				isPaused: false
			})
		}
	}

	togglePause() {
		if (!this.state.testState) {
			this.setState({
				isPaused: !this.state.isPaused
			})
		}
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

	cycleStopStagesForward() {
		var stops = this.getStopEtas(),
			num_stops = stops.length,
			last_stop = this.getStopEtas()[this.getStopEtas().length-1]

		// set testDate
		for(var i=0; i<num_stops; i++) {
			var stop = stops[i]

			if (stop.stage === STOP_STAGE.current_stop){
				stop.stage = STOP_STAGE.past_stop

				this.setState({
					testDate: new Date(stop.eta.getTime() + 1*60*1000)
				})

				if (stop === last_stop) {
					this.resetStopStages()
				}

				return
			} else if (stop.stage === STOP_STAGE.upcoming_stop){
				stop.stage = STOP_STAGE.current_stop
				this.setState({
					testDate: stop.eta
				})

			} else if (stop === this.getNextStop()){
					stop.stage = STOP_STAGE.upcoming_stop
					this.setState({
						testDate: new Date(stop.eta.getTime() - 1*60*1000)
					})
			} 
		}
	}

	cycleStopStagesBackward() {
		var stops = this.getStopEtas(),
			num_stops = stops.length

		for(var i=num_stops-1; i>=0; i--) {
			var stop = stops[i]

			if (stop.stage === STOP_STAGE.current_stop){
				stop.stage = STOP_STAGE.upcoming_stop
				this.setState({
					testDate: new Date(stop.eta.getTime() - 1*60*1000)
				})

				return
			} else if (stop.stage === STOP_STAGE.upcoming_stop){
				stop.stage = STOP_STAGE.future_stop
				this.setState({
					testDate: new Date(stop.eta.getTime() - 2*60*1000)
				})

				return
			} else if (stop === this.getPastStop()){
				// if (GLOBAL_current_leg_progress < 0) {
				stop.stage = STOP_STAGE.current_stop
				this.setState({
					testDate: new Date(stop.eta.getTime())
				})
				return
				// }
			} 
		}
	}

	resetStopStages() {
		var stops = this.getStopEtas(),
			num_stops = stops.length

		for(var i=0; i<num_stops; i++) {
			var stop = stops[i]

			stop.stage = STOP_STAGE.future_stop
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



}


export default Ride;
