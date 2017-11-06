import axios from 'axios'

const DEFAULT_STATE = {
	param1: 'value1',
	param2: 'value2'
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
	dispatch('{{Name}}_CHANGED', data);
}

const load = ({dispatch}, data) => {
	axios.get('/api/load.php', data)
		.then(({data}) => {
			dispatch('{{Name}}_CHANGED', data);
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