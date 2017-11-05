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

const changed = (state, data) => {
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
const change = ({dispatch}, data) => {
	dispatch('USER_CHANGED', data);
}

const load = ({dispatch}, data) => {
	axios.get('/api/load.php', data)
		.then(({data}) => {
			dispatch('USER_CHANGED', data);
		});
}

export default {
	actions: {
		load,
		change
	},
	reducers: {
		init,
		changed
	}
} 