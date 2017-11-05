import React from 'react'

const STORAGES = {},
	  SUBSCRIBERS = {},
	  SUBSCRIBERS_TO_ALL = [],
	  REDUCERS = {},
	  ACTIONS = {},
	  KEYS = new Map,
	  NEEDED = new Map,
	  FLATS = new Map,
	  WITH_PREFIXES = new Map;

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

const addHandler = (handlers, name) => {
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

const distributeChanges = (name) => {
	let subscribers = SUBSCRIBERS[name];
	if (subscribers instanceof Array) {
		subscribers.forEach(setState);
	}
	SUBSCRIBERS_TO_ALL.forEach(setState);
}

const doAction = (action, data) => {
	let {name, type} = parseAction(action);
	let actions = ACTIONS[name];
	if (
		actions instanceof Object &&
		actions[type] instanceof Function
	) {
		actions[type]({
			dispatch,
			doAction,
			getState,
			state: getState(name)
		}, data);
	}
}

const parseAction = (action) => {
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

const setState = (component) => {
	let newState = getMergedState(component);
	if (component.isReady()) {
		component.setState(newState);
	} else {
		component.state = newState;
	}
}

const getMergedState = (component) => {
	let keys = KEYS.get(component);
	let needed = NEEDED.get(component) || [];
	if (keys === '*') {
		keys = Object.keys(STORAGES); 
	}
	let isFlat = FLATS.has(component);
	let isWithPrefix = WITH_PREFIXES.has(component);
	let data = {};
	if (keys instanceof Array) {
		keys.forEach(name => {
			let storage = STORAGES[name];
			let neededData = {};
			if (storage instanceof Object) {
				if (
					needed[name] instanceof Array &&
					needed[name].length > 0
				) {					
					for (let item of needed[name]) {
						if (typeof storage[item] != 'undefined') {
							let k = isWithPrefix ? name + '_' + item : item;
							neededData[k] = storage[item];
						}
					}
				} else {
					if (isWithPrefix) {
						for (let item in storage) {
							neededData[name + '_' + item] = storage[item];
						}
					} else {
						neededData = storage;
					}
				}
			}
			if (!isFlat) {
				data[name] = neededData;
			} else {
				data = {
					...data,
					...neededData
				};
			}
		});
	}
	return data;
}

const subscribe = (component, {has, handlers, flat, withPrefix}) => {
	if (has === '*') {
		SUBSCRIBERS_TO_ALL.push(component);
		KEYS.set(component, '*');
	} else if (typeof has === 'string') {
		has = has.split(',');
	}
	if (has instanceof Array) {
		let properNames = [];
		let properNeeded = {};
		has.forEach(item => {
			if (typeof item === 'string') {
				let {name, needed} = getAllNeededForSubscriber(item);
				properNames.push(name);
				if (!(SUBSCRIBERS[name] instanceof Array)) {
					SUBSCRIBERS[name] = [];
				}
				SUBSCRIBERS[name].push(component);
				if (needed instanceof Array && needed.length > 0) {
					properNeeded[name] = needed;
				}
			}
		});
		NEEDED.set(component, properNeeded);		
		KEYS.set(component, properNames);
	}
	if (flat) {
		FLATS.set(component, true);
		if (withPrefix) {
			WITH_PREFIXES.set(component, true);
		}
	}
	addHandlers(handlers);
	component.state = getMergedState(component);
}

const getAllNeededForSubscriber = (item) => {
	let needed = [];
	let [name, strNeeded] = item.split(':');
	name = name.trim();
	if (typeof strNeeded == 'string') {
		let arrNeeded = strNeeded.split('|');
		for (let n of arrNeeded) {
			n = n.replace(/ /g, '');
			if (n) needed.push(n);
		}
	}
	return {name, needed};
}

const unsubscribe = (component) => {
	let keys = KEYS.get(component);
	if (keys instanceof Array) {
		keys.forEach(name => {
			removeSubscriber(SUBSCRIBERS[name], component);
		});
	} else if (keys === '*') {
		removeSubscriber(SUBSCRIBERS_TO_ALL, component);
	}
	KEYS.delete(component);
	NEEDED.delete(component);
}

const removeSubscriber = (list, subscriber) => {
	if (list instanceof Array) {
		let idx = list.indexOf(subscriber);
		if (idx > -1) {
			list.splice(idx, 1);
		}
	}
}

const connect = (ComponentToConnect, connectProps) => {
	let ready = false;
	let {
		has,
		handlers,
		shouldHave: shouldHaveString,
		flat,
		withPrefix
	} = connectProps;

	if (!has && handlers instanceof Object) {
		has = Object.keys(handlers);
	}
	let shouldHave = [];
	if (typeof shouldHaveString == 'string') {
		shouldHaveString = shouldHaveString.split(',');
		if (shouldHaveString instanceof Array) {
			for (let item of shouldHaveString) {
				if (item) {
					shouldHave.push(item.trim());
				}
			}
		}
	}
	
	return class XStoreConnect extends React.Component {
		constructor() {
			super();
			subscribe(this, {has, handlers, flat, withPrefix});
		}

		componentWillMount() {
			ready = true;
		}

		componentWillUnmount() {
			ready = false;
			unsubscribe(this);
		}

		isReady() {
			return ready;
		}

		render() {
			for (let item of shouldHave) {
				if (!(this.state[item] instanceof Object)) {
					return null;
				}
			}
			let props = {
				...this.props,
				...this.state,
				doAction,
				dispatch
			};
			return <ComponentToConnect {...props}/>
		}
	}
}

export default {
	addHandlers,
	dispatch,
	doAction,
	getState,
	connect
};