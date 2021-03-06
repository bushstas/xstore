# xstore [![npm](https://img.shields.io/npm/v/xstore.svg?style=flat-square)](https://www.npmjs.com/package/xstore)

Xstore is a state container for React


## Installation

### NPM

```sh
npm install --save xstore
```


## Usage

At first you should add so called handlers to store

```javascript
import React from 'react'
import ReactDOM from 'react-dom'
import Store from 'xstore'
import App from './components/App'

import user from './store_handlers/user'
import dictionary from './store_handlers/dictionary'

// you can set default params here
// "flat" and "withPrefix" are only available options
Store.setDefaultParams({
  flat: true,
  withPrefix: true
});

// handler name should not contain "_" sign
Store.addHandlers({
  user,
  dictionary
});

ReactDOM.render(
  <App/>,
  document.getElementById('root')
);
```

An example of handler './store_handlers/user.js'.<br />
Add "init" reducer to set default state

```javascript
import axios from 'axios'

const DEFAULT_STATE = {
  name: 'user',
  status: 'alive'
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

// will be automatically executed when Store.reset() called
// use it when you need some additional functionality to reset state
// second argument is state that saved in the local storage
// dispatch('USER_RESET')
const reset = (state, savedInLocalStorage) => {
  if (savedInLocalStorage) {
    return savedInLocalStorage;
  }
  delete state.name;
  delete state.status;
  return state;
}

// dispatch('USER_CHANGED')
const changed = (state, data) => {
  // you need to return only state params that should be changed
  // store will automatically create new merged state object
  return data;
}

// dispatch('USER_FETCHING')
const fetching = (state) => {
  return {fetching: true};
}

/**
 ===============
 Actions
 ===============
*/

// doAction('USER_CHANGE')
const change = ({dispatch, then, doAction, and}, data) => {
  // {setState, dispatch, dispatchAsync, doAction, then, and, getState, state, reset, getSavedState}
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
  
  // you can use "return" statemant here
  return "whatever";
}

// doAction('USER_LOAD')
const load = ({setState, then, dispatchAsync}, data) => {
  // {setState, dispatch, dispatchAsync, doAction, then, and, getState, state, reset, getSavedState}
  
  // dispatchAsync is the same dispatch but with tiny timeout
  // use it if an action is called from "componentDidMount" method
  // so parental connect component still not mounted and cant update your component
  // this won't return new state
  dispatchAsync('USER_FETCHING');  

  const promise = axios.get('/api/load.php', data)
    .then(({data}) => {
      then('CHANGED', data);
      // or you can use setState
      setState(data);
    });

    // or shorter way
    const promise = axios.get('/api/load.php', data).then(setState);

  return promise;
}

// doAction('USER_SOME_ACTION')
const some_action = ({getSavedState}, data) => {
  // {setState, dispatch, dispatchAsync, doAction, then, and, getState, state, reset, getSavedState}
  const savedState = getSavedState('user');

  if (savedState) {
    return 'state is saved in the local storage';
  }
}

 // saving state in the local storage, so it will be restored after page reloaded
 const localStore = {
    // unique key (the only required field)
    key: 'user_state',
    // list of state fields that need to save
    // they will be merged with initial state
    // whole state will be saved if names not defined
    names: [
      'currentStatus',
      'currentPage',
      'someParam'
    ],
    // or use function to define state that should be saved
    // "names" have bigger priority than "getData"
    getData: (state) => {
      delete state.some;
      state.any = true;
      return state;
    },
    // you can do initial merging with this function
    getInitialData: (defaultState, stateFromLocalStorage) => {
      return {
        ...defaultState,
        ...stateFromLocalStorage
      };
    },
    // return false if you dont want to get state from local storage
    shouldLoad: () => {
      return true;
    },
    // return false if state should not be saved
    shouldSave: (state) => {
      return state.someValue === true;
    },
    // return true if state should be removed from the local storage
    shouldRemove: (state) => {
      return !state.someItem;
    },
    // if state is changing too frequently use timeout
    timeout: 100,
    // lifetime of stored data
    // Nmin, Nhour, Nday, Nmonth
    lifetime: '2hour'
  },

export default {
  localStore,
  onStateChange,
  actions: {
    load,
    change,
    some_action
  },
  reducers: {
    init,
    reset,
    changed,
    fetching
  }
} 
```

This is example how to connect a component with the store

```javascript
import React from 'react'
import Store from 'xstore'

class ComponentToConnect extends React.Component {
  render() {
    let {user, dictionary} = this.props;
    return (
      <div className="some-component">
        ....
      </div>
    )
  }

  // connected component has prop doAction
  handleSomeAction(value) {
    this.props.doAction('USER_DO_SOME_ACTION', value);
  }

  // connected component has prop dispatch
  handleSomeChanges(data) {
    this.props.dispatch('USER_SOMETHING_CHANGED', data);
  }
}

const params = {
  has: 'user, dictionary'
}
export default Store.connect(ComponentToConnect, params);
// or shorter way
export default Store.connect(ComponentToConnect, 'user, dictionary');
```

Possible connect params

```javascript
{
  // store states which will be passed to component as props "user" and "dictionary"
  has: 'user, dictionary',
  // or
  has: ['user', 'dictionary'],

  // if you need just few certain fields from state
  has: 'user:name|status, dictionary:userStatuses',
  // or
  has: ['user:name|status', 'dictionary:userStatuses'],

  // you can also pass "*" that means it should have all stores
  has: '*',

  // component won't be rendered till it doesnt receive these props from the store
  shouldHave: 'user,dictionary',
  // or
  shouldHave: ['user', 'dictionary'],

  // all needed states will be merged and flattened
  // so component will have props "name", "status", "userStatuses" instead of "user" and "dictionary"
  flat: true,

  // needed to add a prefix for flattening
  // so component will have props "user_name", "user_status", "dictionary_userStatuses"
  withPrefix: true,

  // you can add handlers this way
  // if you pass all handlers needed for a component right here
  // then you dont need to pass "has" prop
  handlers: {
    user,
    dictionary
  },

  // makes connect component not pure
  // by default connect components are all pure
  pure: false
}
```

A list of xstore's available methods

```javascript
import Store from 'xstore'

// returns whole cloned state
let state = Store.getState();

// returns cloned state with name "user"
let userState = Store.getState('user');

// returns field "name" from state with name "user"
let userName = Store.getState('user.name');

// set params by default
Store.setDefaultParams({
  flat: true,
  withPrefix: true
});

// call to add handlers
Store.addHandlers({
  user: userHandler,
  dictionary: dictionaryHandler
})

// call to do store's action
// USER_LOAD means that store will call action "load" of handler "user"
// the first argument can be "User_Load" or "user_load" or even "uSeR_lOaD"
Store.doAction('USER_LOAD', {id: userId});

// call to dispatch store's changes and redraw components
Store.dispatch('USER_LOADED', data);

// so if you have handler with name "catalog" you have to call actions which look like
Store.dispatch('CATALOG_FETCH_SUCCESS');
// so reducer should have name "fetch_success"

Store.doAction('CATALOG_ADD_ITEM', {item});
// so action should have name "add_item"

Store.reset();
// calls "reset" reducer (if such exists) of every single handler to reset all states
// if "reset" reducer doesnt exist then "init" reducer is to be called instead
```

Calling store's action from any place

```javascript
import Store from 'xstore'

Store.doAction('USER_CHANGE', {name: 'NewName'});
```

Dispatching store's changes from any place

```javascript
import Store from 'xstore'

Store.dispatch('USER_CHANGED', data);
```

## Creating handlers (initial state, reducers and actions in one file)

```sh
npm install -g xstore
xstore create-handler filename
```
or add to your scripts in package.json this command
```sh
{
  scripts: {
    "create-handler": "node node_modules/xstore/bin/exec.js"
  }
}
npm run create-handler filename
```
It will create file filename.js in the process directory if it doesn't exist.
The file will contain template code of a handler

## License

MIT
