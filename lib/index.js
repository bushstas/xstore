import React from 'react'

const STORAGES = {},
	  SUBSCRIBERS = {},
	  SUBSCRIBERS_TO_ALL = [],
	  REDUCERS = {},
	  REQUESTS = {},
	  KEYS = new Map;

export const addReducers = (reducers) => {
	if (reducers instanceof Object) {
		for (let name in reducers) {
			addReducer(reducers[name], name);
			
		}
	}
}

export const dispatch = (action, payload) => {
	let {name, type} = parseAction(action);
	let reducer = REDUCERS[name];
	if (
		typeof name == 'string' &&
		typeof type == 'string' &&
		reducer instanceof Function
	) {
		STORAGES[name] = reducer(
			STORAGES[name],
			{type, payload}
		);
		distributeChanges(name);
	}
}

export const request = (action, payload) => {
	let {name, type} = parseAction(action);
	if (
		REQUESTS[name] instanceof Object &&
		REQUESTS[name][type] instanceof Function
	) {
		REQUESTS[name][type](dispatch, payload);
	}
}

function parseAction(action) {
	let name, type;
	if (typeof action == 'string') {
		action = action.toLowerCase().split('_');
		if (action.length > 1) {
			name = action[0];
			action.splice(0, 1);
			type = action.join('_');
		}
	}
	return {type, name};
}

function addReducer(requests, name) {
	if (
		requests instanceof Object &&
		requests.reducer instanceof Function &&
		!REDUCERS[name]
	) {
		let {reducer} = requests;
		REDUCERS[name] = reducer;
		REQUESTS[name] = requests;
		STORAGES[name] = reducer(undefined, {}) || {};
		delete REQUESTS.reducer;
		distributeChanges(name);
	}
}

function distributeChanges(name) {
	let subscribers = SUBSCRIBERS[name];
	if (subscribers instanceof Array) {
		subscribers.forEach(setState);
	}
	SUBSCRIBERS_TO_ALL.forEach(setState);
}

function setState(component) {
	let newState = getMergedState(component);
	if (component.isReady()) {
		component.setState(newState);
	} else {
		component.state = newState;
	}
}

function getMergedState(component) {
	let keys = KEYS.get(component);
	if (keys === '*') {
		keys = Object.keys(STORAGES); 
	}
	let data = {};
	if (keys instanceof Array) {
		keys.forEach(name => {
			name = name.trim();
			data[name] = STORAGES[name] || {};
		});
	}
	return data;
}

function subscribe(component, use, reducers) {
	if (use === '*') {
		SUBSCRIBERS_TO_ALL.push(component);
		KEYS.set(component, '*');
	} else if (typeof use === 'string') {
		use = use.split(',');
	}
	if (use instanceof Array) {
		KEYS.set(component, use);
		use.forEach(name => {
			if (typeof name === 'string') {
				name = name.trim();
				if (!(SUBSCRIBERS[name] instanceof Array)) {
					SUBSCRIBERS[name] = [];
				}
				SUBSCRIBERS[name].push(component);					
			}
		});
	}
	addReducers(reducers);
	component.state = getMergedState(component);
}

function unsubscribe(component) {
	let keys = KEYS.get(component);
	if (keys instanceof Array) {
		keys.forEach(name => {
			removeSubscriber(SUBSCRIBERS[name], component);
		});
	} else if (keys === '*') {
		removeSubscriber(SUBSCRIBERS_TO_ALL, component);
	}
	this.keys.delete(component);
}

function removeSubscriber(list, subscriber) {
	if (list instanceof Array) {
		let idx = list.indexOf(subscriber);
		if (idx > -1) {
			list.splice(idx, 1);
		}
	}
}

export default class XStoreContainer extends React.PureComponent {
	constructor(props) {
		super();
		let {has, reducers} = props;
		if (!has && reducers instanceof Object) {
			has = Object.keys(reducers);
		}
		subscribe(
			this,
			has,
			reducers
		);
	}

	componentWillMount() {
		this._ready = true;
	}

	componentWillUnmount() {
		this._ready = false;
		unsubscribe(this);
	}

	isReady() {
		return this._ready;
	}

	render() {
		let {children, shouldHave} = this.props;
		if (!(children instanceof Array)) {
			children = [children];
		}
		if (shouldHave) {
			if (typeof shouldHave == 'string') {
				shouldHave = shouldHave.split(',');
				for (let i = 0; i < shouldHave.length; i++) {
					let item = shouldHave[i];
					if (typeof item == 'string') {
						item = item.trim();
						if (!this.state[item]) {
							return null;
						}
					}
				}
			}
		}
		return children.map((child, key) => {
			if (child.type instanceof Function) {
				let props = {
					key,
					...this.state,
					dispatch,
					request
				};
				return React.cloneElement(
					child, 
					props, 
					child.props.children
				);
			}
			return child;
		});
	}
}