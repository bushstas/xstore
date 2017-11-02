import axios from 'axios'

const DEFAULT_STATE = {
	name: 'user',
	status: 'alive'
}

/**
 ===============
 Reducers
 ===============
*/
const init = () => {
	return DEFAULT_STATE;
}

const set = (state, data) => {
	return {
		...state,
		...data
	}
}

/**
 ===============
 Actions
 ===============
*/
const change = (dispatch, data) => {
	dispatch('user_set', data);
}

const load = (dispatch, data) => {
	axios.get('/api/load.php', data)
		.then(({data}) => {
			dispatch('user_set', data);
		});
}

export default {
	actions: {
		load,
		change
	},
	reducers: {
		init,
		set
	}
} 