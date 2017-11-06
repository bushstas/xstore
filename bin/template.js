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

// don't dispatch this
const init = () => {
	return DEFAULT_STATE;
}

// dispatch('{{Name}}_CHANGED')
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

// doAction('{{Name}}_CHANGE')
const change = ({dispatch}, data) => {
	dispatch('{{Name}}_CHANGED', data);
}

// doAction('{{Name}}_LOAD')
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