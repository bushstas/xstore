# xstore [![npm](https://img.shields.io/npm/v/xstore.svg?style=flat-square)](https://www.npmjs.com/package/xstore)

Xstore is a state container



## Installation

### NPM

```sh
npm install --save xstore
```


## Usage

At first you should add so called handlers to store

```js
import React from 'react'
import ReactDOM from 'react-dom'
import Store from 'xstore'
import App from './components/App'

import user from './store_handlers/user'
import dictionary from './store_handlers/dictionary'

// handler name should not containt "_" sign
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

```js
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
  // {dispatch, doAction, getState, state}
  dispatch('USER_CHANGED', data);
}

const load = ({dispatch}, data) => {
  // {dispatch, doAction, getState, state}
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
```

This is example how to connect a component with the store

```js
import React from 'react'
import Store from 'xstore'

class ComponentToConnect extends React.Component {
  render() {
    let {user, dictionary} = this.props;
    return <div className="some-component">
      ....
    </div>
  }
}

const params = {
  has: 'user, dictionary'
}
export default Store.connect(ComponentToConnect, params);
```

Possible connect params

```js
{
  // store states which will be passed to component as props "user" and "dictionary"
  has: 'user, dictionary',
  // or
  has: ['user', 'dictionary'],

  // if you need just few certain fields from state
  has: 'user:name|status, dictionary:userStatuses',
  // or
  has: ['user:name|status', 'dictionary:userStatuses'],

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
  }
}
```

A list of xstore's available methods

```js
import Store from 'xstore'

// returns whole cloned state
let state = Store.getState();

// returns cloned state with name "user"
let userState = Store.getState('user');

// returns field "name" from state with name "user"
let userName = Store.getState('user.name');

// returns field with index = 0 from field "items" from state with name "user"
let someItem = Store.getState('user.items.0');

// call to add handlers
Store.addHandlers({
  user: userHandler,
  dictionary: dictionaryHandler
})

// call to dispatch action
// USER_LOAD means that store will dispatch action "load" of handler "user"
// the first argument can be "User_Load" or "user_load" or even "uSeR_lOaD"
Store.doAction('USER_LOAD', {id: userId});

// so if you have handler with name "catalog" you have to dispatch actions which look like
Store.doAction('CATALOG_LOAD');
Store.doAction('CATALOG_ADD_ITEM', {item});
```

Calling store's action from any place

```js
import Store from 'xstore'

Store.doAction('USER_CHANGE', {name: 'NewName'});
```

Dispatching store's changes from any place

```js
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
