import '../assets/stylesheets/base.scss'
import React, { Component } from 'react'

class Stop extends Component {

// eventually add chariot ID data here
	render() {
		return(
			<div className='box'>
				<div className='current'>
					{this.props.current_stop}
				</div>
			</div>
		)
	}

}

export default Stop;
