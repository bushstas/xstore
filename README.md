# xstore [![npm](https://img.shields.io/npm/v/xstore.svg?style=flat-square)](https://www.npmjs.com/package/xstore)

Xstore is a state container



## Installation

### NPM

```sh
npm install --save xstore
```


## Usage

Adding handlers and wrapping App component with XStoreContainer.
Reducers and XStoreContainer's "has" props should have the same names

```js
import React from 'react'
import ReactDOM from 'react-dom'
import Store, {XStoreContainer} from 'xstore'
import App from './components/App'

import user from './store_handlers/user'
import dictionary from './store_handlers/dictionary'

Store.addHandlers({
  user,
  dictionary
});

ReactDOM.render(
  <XStoreContainer has="user, dictionary">
    <App/>
  </XStoreContainer>
)
```

Different way to add handlers
```js
import user from './store_handlers/user'
import dictionary from './store_handlers/dictionary'

const handlers = {
  user,
  dictionary
};

ReactDOM.render(
  <XStoreContainer has="user, dictionary" handlers={handlers}>
    <App/>
  </XStoreContainer>
)
```

If you pass "handlers" prop to XStoreContainer, then you dont need pass "has" prop

```js
import user from './store_handlers/user'
import dictionary from './store_handlers/dictionary'

const handlers = {
  user,
  dictionary
};

ReactDOM.render(
  <XStoreContainer handlers={handlers}>
    <App/>
  </XStoreContainer>
)
```

This code wont cause any errors.
The first store will get data when the second store adds the handlers

```js
import user from './store_handlers/user'
import dictionary from './store_handlers/dictionary'

const handlers = {
  user,
  dictionary
};

ReactDOM.render(
  <div>
    <XStoreContainer has={['user', 'dictionary']}>
      <App/>
    </XStoreContainer>
    <XStoreContainer handlers={handlers}>
      <App/>
    </XStoreContainer>
  </div>
)
```

You can pass "has" prop = "\*". Then your component will have all store's data

```js
import Store, {XStoreContainer} from 'xstore'
import user from './store_handlers/user'
import dictionary from './store_handlers/dictionary'

const handlers = {
  user,
  dictionary
};
Store.addHandlers(handlers);

ReactDOM.render(
  <div>
    <XStoreContainer has="*">
      <App/>
    </XStoreContainer>
  </div>
)
``` 

You can wrap few components with store, not only one. All of them will be subscribed to store changes. HTML elements will be ignored, so you can place them 

```js
import Store, {XStoreContainer} from 'xstore'
import user from './store_handlers/user'
import dictionary from './store_handlers/dictionary'

const handlers = {
  user,
  dictionary
};
Store.addHandlers(handlers);

ReactDOM.render(
  <div>
    <XStoreContainer has="*">
      <SomeComponent1/>
      <div>
        .....
      </div>
      <SomeComponent2>
    </XStoreContainer>
  </div>
)
```

An example of handler './store_handlers/user.js'. Reducer "init" is required to set default state

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
```

This is one way to dispatch xstore's action.
Component wrapped with "XStoreContainer" has prop "doXStoreAction".
this.props.user and this.props.dictionary come from store

```js
import React from 'react'

export default class App extends React.PureComponent {
  render() {
    return <div className="app">
      Name: {this.props.user.name}<br/>
      Status: {this.props.user.status}
      <div>
        <button onClick={() => {this.props.doXStoreAction('USER_CHANGE', {status: 'extended'})}}>
          Extend Status
        </button>

        <button onClick={() => {this.props.doXStoreAction('USER_LOAD', {id: 1})}}>
          Load user
        </button>
      </div>
    </div>
  }
} 
```

This is another way to dispatch xstore's action.

```js
import React from 'react'
import Store from 'xstore'

export default class App extends React.PureComponent {
  render() {
    return <div className="app">
      Name: {this.props.user.name}<br/>
      Status: {this.props.user.status}
      <div>
        <button onClick={() => {Store.doAction('USER_CHANGE', {status: 'extended'})}}>
          Extend Status
        </button>

        <button onClick={() => {Store.doAction('USER_LOAD', {id: 1})}}>
          Load user
        </button>
      </div>
    </div>
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


Dispatching xstore's action from any place

```js
import Store from 'xstore'

Store.doAction('USER_CHANGE', {name: 'NewName'});
```


Waiting for a store's item to come and then render

```js
import React from 'react'
import {XStoreContainer} from 'xstore'
import SomeComponent from './components/SomeComponent'

<XStoreContainer has="user, dictionary" shouldHave="dictionary">
  <SomeComponent/>
</XStoreContainer>
```

## Creating handlers (initial state, reducers and actions in one file)

```sh
npm install -g xstore
xstore create-handler filename
```
or
```sh
npm run create-handler filename
```
It will create file filename.js in the process directory if it doesn't exist.
The file will contain template code of a handler

## License

MIT
