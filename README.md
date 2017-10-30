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

import user from './reducers/user'
import dictionary from './reducers/dictionary'

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
import user from './reducers/user'
import dictionary from './reducers/dictionary'

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
import user from './reducers/user'
import dictionary from './reducers/dictionary'

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
import user from './reducers/user'
import dictionary from './reducers/dictionary'

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
import user from './reducers/user'
import dictionary from './reducers/dictionary'

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
import user from './reducers/user'
import dictionary from './reducers/dictionary'

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

An example of reducer './reducers/user' 

```js
const INITIAL_STATE = {
  name: 'user',
  status: 'usual'
}

export default (state = INITIAL_STATE, action, payload) => {
  switch (action) {
    case 'changeStatus':
      return {
        ...state,
        status: payload.status
      }

    case 'rename':
      return {
        ...state,
        name: payload.name
      }
  }
  return state;
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
          this.props.dispatch('user', 'changeStatus', {status: 'extended'});
        }}>
          Kill
        </button>

        <button onClick={() => {
          this.props.dispatch('user', 'rename', {name: 'Peter'});
        }}>
          Rename
        </button>
      </div>
    </div>
  }
} 

```


Dispatching store's action from any place

```js
import {dispatch} from 'xstore'

dispatch('user', 'rename', {name: 'NewName'});
```


Waiting for an store's item to come and then render

```js
import React from 'react'
import StoreContainer from 'xstore'
import SomeComponent from './components/SomeComponent'

<StoreContainer has="user, dictionary" shouldHave="dictionary">
  <SomeComponent/>
</StoreContainer>
```


## License

MIT
