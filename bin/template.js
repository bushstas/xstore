import axios from 'axios'

const DEFAULT_STATE = {
	name: 'user',
	status: 'alive'
}

export const init = () => {
	return DEFAULT_STATE;
}


export const load = (state, dispatch, data) => {
	axios.get('/api/load.php', data)
		.then(({data}) => {
			dispatch('user_set', data);
		});
}

export const set = (state, dispatch, data) => {
	return {
		...state,
		...data
	}
}