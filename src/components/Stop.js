import '../assets/stylesheets/base.scss'
import React, { Component } from 'react'

class Stop extends Component {


	render() {
		return(
			<div>
				{this.props.stop}
			</div>
		)
	}

}

export default Stop;
