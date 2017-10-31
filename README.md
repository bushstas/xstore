# xstore [![npm](https://img.shields.io/npm/v/xstore.svg?style=flat-square)](https://www.npmjs.com/package/xstore)

Xstore is a state container



## Installation

### NPM

```sh
npm install --save xstore
```


## Usage

Adding reducers and wrapping App component with StoreContainer.
Reducers and StoreContainer's "has" props should have the same names

```js
import React from 'react'
import ReactDOM from 'react-dom'
import StoreContainer, {addReducers} from 'xstore'
import App from './components/App'

import * as user from './reducers/user'
import * as dictionary from './reducers/dictionary'

addReducers({
  user,
  dictionary
});

ReactDOM.render(
  <StoreContainer has="user, dictionary">
    <App/>
  </StoreContainer>
)
```

Different way to add reducers
```js
import * as user from './reducers/user'
import * as dictionary from './reducers/dictionary'

const reducers = {
  user,
  dictionary
};

ReactDOM.render(
  <StoreContainer has="user, dictionary" reducers={reducers}>
    <App/>
  </StoreContainer>
)
```

If you pass "reducers" prop to StoreContainer, then you dont need pass "has" prop

```js
import * as user from './reducers/user'
import * as dictionary from './reducers/dictionary'

const reducers = {
  user,
  dictionary
};

ReactDOM.render(
  <StoreContainer reducers={reducers}>
    <App/>
  </StoreContainer>
)
```

This code wont cause any errors.
The first store will get data when the second store adds the reducers

```js
import * as user from './reducers/user'
import * as dictionary from './reducers/dictionary'

const reducers = {
  user,
  dictionary
};

ReactDOM.render(
  <div>
    <StoreContainer has={['user', 'dictionary']}>
      <App/>
    </StoreContainer>
    <StoreContainer reducers={reducers}>
      <App/>
    </StoreContainer>
  </div>
)
```

You can pass "has" prop = "\*". Then your component will have all store's data

```js
import StoreContainer, {addReducers} from 'xstore'
import * as user from './reducers/user'
import * as dictionary from './reducers/dictionary'

const reducers = {
  user,
  dictionary
};
addReducers(reducers);

ReactDOM.render(
  <div>
    <StoreContainer has="*">
      <App/>
    </StoreContainer>
  </div>
)
``` 

You can wrap few components with store, not only one. All of them will be subscribed to store changes. HTML elements will be ignored, so you can place them 

```js
import StoreContainer, {addReducers} from 'xstore'
import * as user from './reducers/user'
import * as dictionary from './reducers/dictionary'

const reducers = {
  user,
  dictionary
};
addReducers(reducers);

ReactDOM.render(
  <div>
    <StoreContainer has="*">
      <SomeComponent1/>
      <div>
        .....
      </div>
      <SomeComponent2>
    </StoreContainer>
  </div>
)
```

An example of reducer './reducers/user'. Action "init" is required to set default state

```js
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
```

Dispatching store's action.
Component wrapped with StoreContainer has prop "dispatch".
Props.user and props.dictionary come from store

```js
import React from 'react'

export default class App extends React.PureComponent {
  render() {
    return <div className="app">
      Name: {this.props.user.name}<br/>
      Status: {this.props.user.status}
      <div>
        <button onClick={() => {
          this.props.dispatch('user_set', {status: 'extended'});
        }}>
          Extend Status
        </button>

        <button onClick={() => {
          this.props.dispatch('user_load', {id: 1});
        }}>
          Load user
        </button>
      </div>
    </div>
  }
} 

```


Dispatching store's action from any place

```js
import {dispatch} from 'xstore'

dispatch('user_set', {name: 'NewName'});
```


Waiting for a store's item to come and then render

```js
import React from 'react'
import StoreContainer from 'xstore'
import SomeComponent from './components/SomeComponent'

<StoreContainer has="user, dictionary" shouldHave="dictionary">
  <SomeComponent/>
</StoreContainer>
```

## Creating reducers

```sh
npm install -g xstore
xstore create-reducer filename
```
or
```sh
npm run create-reducer filename
```
It will create file filename.js in the process directory if it doesn't exist.
The file will contain template code of a reducer

## License

MIT
