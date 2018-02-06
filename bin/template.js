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

// doAction('USER_CHANGE')
const change = ({dispatch, then, doAction, and}, data) => {
  // {dispatch, doAction, then, and, getState, state, reset}
  // dispatch returns new state
  let newState = dispatch('USER_CHANGED', data);
  // or the same but shorter
  let newState = then('CHANGED', data);
  // "then" calls dispatch with own handler "user"

  doAction('USER_DO_SOME_ON_CHANGE', data);
  // or the same but shorter
  and('DO_SOME_ON_CHANGE', data);
  // "and" calls doAction with own handler "user"

  // be carefull, "reset" calls Store.reset() which resets all states
}


// doAction('USER_LOAD')
const load = ({then}, data) => {
  // {dispatch, doAction, then, and, getState, state}
  axios.get('/api/load.php', data)
    .then(({data}) => {
      then('CHANGED', data);
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