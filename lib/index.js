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

const getState = (fields = '', storage = STORAGES) => {
	return getClonedObject((() => {
		let [name, field] = fields.split('.');
		if (!name) return storage;
		if (!field) return storage[name];		
		return storage[name][field];
	})());	
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
			if ((/_/).test(name)) {
				if (process.env.NODE_ENV !== 'production') {
					logError(0, name);
				}
			} else {
				addHandler(handlers[name], name);
			}
		}
		return;
	}
	if (process.env.NODE_ENV !== 'production') {
		if (handlers !== null && handlers !== undefined) { 
			logError(1);
		}
	}
}

const addHandler = (handler, name) => {
	if (
		handler instanceof Object && 
		handler.reducers instanceof Object && 
		handler.actions instanceof Object
	) {
		let {reducers, actions} = handler;
		if (!REDUCERS[name]) {
			REDUCERS[name] = reducers;
			ACTIONS[name] = actions;
			STORAGES[name] = {};
			if (reducers.init instanceof Function) {
				STORAGES[name] = reducers.init() || {};
			}
			distributeChanges(name);
			return;
		}
		if (process.env.NODE_ENV !== 'production') {
			return logError(3, name);
		}
	}
	if (process.env.NODE_ENV !== 'production') {
		logError(2);
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
			return;
		}
		if (process.env.NODE_ENV !== 'production') {
			logError(5, action);
			return;
		}
	}
	if (process.env.NODE_ENV !== 'production') {
		logError(4, 'dispatch', action);
		showExistingActions('r');
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
		return actions[type]({
			dispatch,
			doAction,
			getState,
			state: getState(name)
		}, data);
	}
	if (process.env.NODE_ENV !== 'production') {
		logError(4, 'doAction', action);
		showExistingActions('a');
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

const setState = (updater) => {
	updater(getMergedState(updater));
}

const getMergedState = (updater) => {
	let keys = KEYS.get(updater);
	let needed = NEEDED.get(updater) || [];
	if (keys === '*') {
		keys = Object.keys(STORAGES); 
	}
	let isFlat = FLATS.has(updater);
	let isWithPrefix = WITH_PREFIXES.has(updater);
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

const subscribe = (updater, {has, handlers, flat, withPrefix}) => {
	if (has === '*') {
		SUBSCRIBERS_TO_ALL.push(updater);
		KEYS.set(updater, '*');
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
				SUBSCRIBERS[name].push(updater);
				if (needed instanceof Array && needed.length > 0) {
					properNeeded[name] = needed;
				}
			}
		});
		NEEDED.set(updater, properNeeded);		
		KEYS.set(updater, properNames);
	}
	if (flat) {
		FLATS.set(updater, true);
		if (withPrefix) {
			WITH_PREFIXES.set(updater, true);
		}
	}
	addHandlers(handlers);
	setState(updater);
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

const cleanStateFromInjectedItems = (updater, state) => {
	let shouldHaveProps = Object.keys(getMergedState(updater));
	for (let k in state) {
		if (shouldHaveProps.indexOf(k) == -1) {
			delete state[k];
		}
	}
}

const unsubscribe = (updater) => {
	let keys = KEYS.get(updater);
	if (keys instanceof Array) {
		keys.forEach(name => {
			removeSubscriber(SUBSCRIBERS[name], updater);
		});
	} else if (keys === '*') {
		removeSubscriber(SUBSCRIBERS_TO_ALL, updater);
	}
	KEYS.delete(updater);
	NEEDED.delete(updater);
}

const removeSubscriber = (list, subscriber) => {
	if (list instanceof Array) {
		let idx = list.indexOf(subscriber);
		if (idx > -1) {
			list.splice(idx, 1);
		}
	}
}

const parseShouldHave = (shouldHave) => {
	if (shouldHave instanceof Array) {
		return shouldHave;
	}
	if (typeof shouldHave == 'string') {
		shouldHave = shouldHave.split(',');
		let shouldHaveArr = [];
		for (let item of shouldHave) {
			if (item) {
				shouldHaveArr.push(item.trim());
			}
		}
		return shouldHaveArr;
	}
	return [];
}

const LOCAL_OBJECT_CHECKER = {};
const connect = (ComponentToConnect, connectProps) => {
	let ready = false;
	let {
		has,
		handlers,
		shouldHave,
		flat,
		withPrefix
	} = connectProps;

	if (!has && handlers instanceof Object) {
		has = Object.keys(handlers);
	}
	shouldHave = parseShouldHave(shouldHave);

	let doUnsubscribe,
		doCleanState,
		stateItemsQuantity;

	return class XStoreConnect extends React.Component {
		constructor() {
			super();
			this.state = {};
			const updater = (state) => {
				stateItemsQuantity = Object.keys(state).length;
				if (ready) {
					this.setState(state, LOCAL_OBJECT_CHECKER);
				} else {
					this.state = state;
				}
			}
			doUnsubscribe = () => {
				unsubscribe(updater);
			}
			doCleanState = () => {
				cleanStateFromInjectedItems(updater, this.state);
			}
			subscribe(updater, {has, handlers, flat, withPrefix});
		}

		setState(state, localObjectChecker) {
			if (state instanceof Object && localObjectChecker === LOCAL_OBJECT_CHECKER) {
				super.setState(state);
			}
		}

		componentDidMount() {
			ready = true;
		}

		componentWillUnmount() {
			ready = false;
			doUnsubscribe();		
		}

		render() {
			let {props, state} = this;
			let newStateKeysQuantity = Object.keys(state).length;
			if (stateItemsQuantity != newStateKeysQuantity) {
				doCleanState();
			}
			for (let item of shouldHave) {
				if (state[item] === undefined) {
					return null;
				}
			}
			let componentProps = {
				...props,
				...state,
				doAction,
				dispatch
			};
			return <ComponentToConnect {...componentProps}/>
		}
	}
}

if (process.env.NODE_ENV !== 'production') {
	var logError = (code, ...others) => {	
		let error = ([
			`xstore handler "${others[0]}" has forbidden symbol "_"`,
			`handlers passed to xstore is not an object`,
			`handler object passed to xstore doesnt have fields "actions" and "reducers" or they are not objects`,
			`handler "${others[0]}" already added to xstore`,
			`attempt to call ${others[0]} method of xstore with not existing action "${others[1]}"`,
			`reducer "${others[0]}" returned value which is not an object`
		])[code];
		if (error) {
			console.error(new Error(error));
		}
	}

	var showExistingActions = (type) => {
		console.log(`%cList of existing ${type == 'a' ? 'actions' : 'reducers'}:`, 'background: red; color: white');
		let a = type == 'a' ? ACTIONS : REDUCERS;
		for (let k in a) {
			let e = [];
			for (let j in a[k]) {
				e.push((k + '_' + j).toUpperCase());
			}
			console.log('%c' + k + ':', 'background: #bbb; color: black');
			console.log(e.join(', '));
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