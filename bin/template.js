import axios from 'axios'

const DEFAULT_STATE = {
	param1: 'value1',
	param2: 'value2'
}

/**
 ===============
 Callback on change state
 ===============
*/
const onStateChange = (state) => {
  // ...some actions
}

/**
 ===============
 Reducers
 ===============
*/

// will be automatically called to initiate state
// the state will be an empty object if this reducer doesnt exist 
// dispatch it to reset state
// dispatch('USER_INIT')
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
	// dispatch returns new state
	let newState = dispatch('{{Name}}_CHANGED', data);
}

// doAction('{{Name}}_LOAD')
const load = ({dispatch}, data) => {
	axios.get('/api/load.php', data)
		.then(({data}) => {
			dispatch('{{Name}}_CHANGED', data);
		});
}

export default {
	onStateChange,
	actions: {
		load,
		change
	},
	reducers: {
		init,
		changed
	}
} 