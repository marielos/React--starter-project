import '../assets/stylesheets/base.scss';
import React, { Component } from 'react';

class Ride extends Component {


	render() {
		return(
			<div>
				{this.props.ride}
			</div>
		)
	}

}

export default Ride;
