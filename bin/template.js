import axios from 'axios'

const DEFAULT_STATE = {
	name: 'user',
	status: 'alive'
}

const load = (dispatch, payload) => {
	axios.get('/api/load.php', payload)
		.then(({data}) => {
			dispatch('user_set', data);
		});
}

const reducer = (state = DEFAULT_STATE, action) => {
	let {type, payload} = action;

	switch (type) {
		case 'change_status':
			return {
				...state,
				status: payload.status
			}

		case 'set':
			return {
				...state,
				...payload
			}

	}
	return state;
}

export default {
	load,
	reducer
}