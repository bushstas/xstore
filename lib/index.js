import React from 'react'

const STORAGES = {},
	  SUBSCRIBERS = {},
	  SUBSCRIBERS_TO_ALL = [],
	  REDUCERS = {},
	  ACTIONS = {},
	  KEYS = new Map;

const getState = (fields = '', storeage = STORAGES) => {
	let [name, field1, field2, field3 = ''] = fields.split('.');
	let item;
	if (!name) {
		item = storeage;
	} else if (!field1) {
		item = storeage[name];
	} else if (storeage[name] instanceof Object) {
		item = storeage[name][field1];
	}
	if (field2 && item instanceof Object) {
		return getState(field2 + '.' + field3, item);
	}
	return getClonedObject(item);
}

const getClonedObject = (object) => {
	if (object instanceof Object) {
		return Object.assign({}, object);
	}
	return object;
}

const addHandlers = (handlers) => {
	if (handlers instanceof Object) {
		for (let name in handlers) {
			addHandler(handlers[name], name);
		}
	}
}

const dispatch = (action, data) => {
	let {name, type} = parseAction(action);
	let reducers = REDUCERS[name];
	if (
		reducers instanceof Object &&
		reducers[type] instanceof Function
	) {
		let result = reducers[type](
			STORAGES[name],
			data
		);
		if (result instanceof Object) {
			STORAGES[name] = result;
			distributeChanges(name);
		}
	}
}

const doAction = (action, data) => {
	let {name, type} = parseAction(action);
	let actions = ACTIONS[name];
	if (
		actions instanceof Object &&
		actions[type] instanceof Function
	) {
		actions[type](dispatch, data);
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

function addHandler(handlers, name) {
	if (
		handlers instanceof Object && 
		handlers.reducers instanceof Object && 
		handlers.actions instanceof Object
	) {
		let {reducers, actions} = handlers;
		if (!REDUCERS[name]) {
			REDUCERS[name] = reducers;
			ACTIONS[name] = actions;
			STORAGES[name] = {};
			if (reducers.init instanceof Function) {
				STORAGES[name] = reducers.init() || {};
			}
			distributeChanges(name);
		}
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

function subscribe(component, use, handlers) {
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
	addHandlers(handlers);
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
	KEYS.delete(component);
}

function removeSubscriber(list, subscriber) {
	if (list instanceof Array) {
		let idx = list.indexOf(subscriber);
		if (idx > -1) {
			list.splice(idx, 1);
		}
	}
}

export default {
	addHandlers,
	dispatch,
	doAction,
	getState
}

export class XStoreContainer extends React.PureComponent {
	constructor(props) {
		super();
		let {has, handlers} = props;
		if (!has && handlers instanceof Object) {
			has = Object.keys(handlers);
		}
		subscribe(
			this,
			has,
			handlers
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
		return (
			<div>
				{children.map((child, key) => {
					if (child.type instanceof Function) {
						let props = {
							key,
							...this.state,
							doXStoreAction: doAction
						};
						return React.cloneElement(
							child, 
							props, 
							child.props.children
						);
					}
					return child;
				})}
			</div>
		)
	}
}