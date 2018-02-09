import React from 'react'

const STORAGES = {},
	  SUBSCRIBERS = {},
	  SUBSCRIBERS_TO_ALL = [],
	  REDUCERS = {},
	  ACTIONS = {},
	  CALLBACKS = {},
	  KEYS = new Map,
	  NEEDED = new Map,
	  FLATS = new Map,
	  WITH_PREFIXES = new Map,
	  LOCAL_STORES = {},
	  TIMEOUTS = {},
	  STORE_KEEPER = createStoreKeeper();

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
		if (handler.onStateChanged instanceof Function) {
			CALLBACKS[name] = handler.onStateChanged;
		}
		if (handler.localStore instanceof Object &&
			typeof handler.localStore.key == 'string') {
			LOCAL_STORES[name] = handler.localStore;
		}
		if (!REDUCERS[name]) {
			REDUCERS[name] = reducers;
			ACTIONS[name] = actions;
			STORAGES[name] = {};
			if (reducers.init instanceof Function) {
				STORAGES[name] = reducers.init() || {};
			}
			const ls = LOCAL_STORES[name];
			if (ls) {
				let localSavedData;
				if (typeof ls.lifetime == 'string') {
					localSavedData = STORE_KEEPER.getActual(ls.key, ls.lifetime);
				} else {
					localSavedData = STORE_KEEPER.get(ls.key);
				}
				if (localSavedData) {
					if (ls.getInitialData instanceof Function) {
						STORAGES[name] = ls.getInitialData(STORAGES[name], localSavedData);
						if (!(STORAGES[name] instanceof Object)) {
							STORAGES[name] = {};
						}
					} else {
						STORAGES[name] = {
							...STORAGES[name],
							...localSavedData
						}
					}
				}
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
			if (type == 'reset' || type == 'init') {
				STORAGES[name] = result;
				return distributeChanges(name);
			}
			return setLocalState(name, result);
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
	return STORAGES[name];
}

const reset = () => {
	for (let name in REDUCERS) {
		let r = REDUCERS[name];
		if (r.reset instanceof Function) {
			dispatchWith(name, 'reset');
		} else if (r.init instanceof Function) {
			dispatchWith(name, 'init');
		}
 	}
}

const distributeChanges = (name) => {
	let subscribers = SUBSCRIBERS[name];
	if (subscribers instanceof Array) {
		subscribers.forEach(setState);
	}
	SUBSCRIBERS_TO_ALL.forEach(setState);
	if (CALLBACKS[name] instanceof Function) {
		CALLBACKS[name](STORAGES[name]);
	}
	const ls = LOCAL_STORES[name];
	if (ls instanceof Object) {
			let {timeout} = ls;
			if (typeof timeout != 'number') {
				timeout = 10;
			}
			clearTimeout(TIMEOUTS[name]);
			TIMEOUTS[name] = setTimeout(() => {
			if (ls.names instanceof Array) {
				const dataToSave = {};
				for (let i = 0; i < ls.names.length; i++) {
					if (typeof STORAGES[name][ls.names[i]] != 'undefined') {
						dataToSave[ls.names[i]] = STORAGES[name][ls.names[i]];
					}
				}
				STORE_KEEPER.set(ls.key, dataToSave);
			} else if (ls.getData instanceof Function) {
				STORE_KEEPER.set(ls.key, ls.getData(STORAGES[name]));
			} else {
				STORE_KEEPER.set(ls.key, STORAGES[name]);
			}
		}, timeout);
	}
	return STORAGES[name];
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
			dispatchAsync,
			doAction,
			getState,
			setState: setLocalState.bind(null, name),
			state: getState(name),
			and: doActionWith.bind(null, name),
			then: dispatchWith.bind(null, name),
			reset
		}, data);
	}
	if (process.env.NODE_ENV !== 'production') {
		logError(4, 'doAction', action);
		showExistingActions('a');
	}
}

const setLocalState = (name, newState) => {
	for (let k in newState) {
		if (newState[k] instanceof Object || newState[k] !== STORAGES[name][k]) {
			STORAGES[name] = {
				...STORAGES[name],
				...newState
			};
			return distributeChanges(name);
		}
	}
	return STORAGES[name];
}

const doActionWith = (name, action, data) => {
	return doAction(name + '_' + action, data);
}

const dispatchWith = (name, action, data) => {
	return dispatch(name + '_' + action, data);
}

const dispatchAsync = (action, data) => {
	setTimeout(() => {
		dispatch(action, data);
	}, 10);
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
	let newState = getMergedState(updater);
	updater(newState);
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
	FLATS.delete(updater);
	WITH_PREFIXES.delete(updater);
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
	return null;
}

const LOCAL_OBJECT_CHECKER = {};
const connect = (ComponentToConnect, connectProps) => {
	let ready = false;
	let {
		has,
		handlers,
		shouldHave,
		flat,
		withPrefix,
		pure
	} = connectProps;

	if (!has && handlers instanceof Object) {
		has = Object.keys(handlers);
	}
	shouldHave = parseShouldHave(shouldHave);
	const reactComponent = pure ? React.PureComponent : React.Component;
	return class XStoreConnect extends reactComponent {
		constructor() {
			super();
			const updater = (state) => {
				if (!this.state) {
					this.state = state;
					return;
				}
				this.stateItemsQuantity = Object.keys(state).length;
				if (ready && this.refs.c) {
					this.setState(state, LOCAL_OBJECT_CHECKER);
				} else {
					this.state = {
						...this.state,
						...state
					};
				}
			}
			this.doUnsubscribe = (localObjectChecker) => {
				if (localObjectChecker === LOCAL_OBJECT_CHECKER) {
					unsubscribe(updater);
				}
			}
			this.doCleanState = (localObjectChecker) => {
				if (localObjectChecker === LOCAL_OBJECT_CHECKER) {
					cleanStateFromInjectedItems(updater, this.state);
				}
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
			this.doUnsubscribe(LOCAL_OBJECT_CHECKER);
		}

		render() {
			let {props, state} = this;
			let newStateKeysQuantity = Object.keys(state).length;
			if (this.stateItemsQuantity != newStateKeysQuantity) {
				this.doCleanState(LOCAL_OBJECT_CHECKER);
			}
			if (shouldHave instanceof Array) {
				for (let i = 0; i < shouldHave.length; i++) {
					if (state[shouldHave[i]] === undefined) {
						return null;
					}
				}
			}
			let componentProps = {
				...props,
				...state,
				doAction,
				dispatch,
				dispatchAsync
			};
			return <ComponentToConnect ref="c" {...componentProps}/>
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
	dispatchAsync,
	doAction,
	getState,
	connect,
	reset
};


function createStoreKeeper() {
	const KEY = 'xstore_saved_';
	const PERIODS	= {
		month: 2592000, 
		day: 86400,
		hour: 3600,
		min: 60
	};
	function g(k) {
		return KEY + k
	}
	function gm(p) {
		let n = ~~p.replace(/[^\d]/g, ''),
			m = p.replace(/\d/g, '');
		if (!n || !PERIODS[m]) {
			return 0;
		}
		return PERIODS[m] * n * 1000;
	}
	function gi(k) {
		let lk = g(k),
			i = localStorage.getItem(lk);
		if (!i) {
			return null;
		}
		try {
			i = JSON.parse(i);
		} catch (e) {
			return null;
		}
		return i;
	}
	function ia(sm, p) {
		let nm = Date.now(),
			pm = gm(p);
			if (typeof sm == 'string') {
				sm = Number(sm);
			}
			return !!pm && !!sm && nm - sm < pm;
	}	
	return {
		set: function(k, v) {
			let lk = g(k),
				i = JSON.stringify({'data': v, 'timestamp': Date.now().toString()});
				localStorage.setItem(lk, i);
		},
		get: function(k) {
			let i = gi(k);
			if (i instanceof Object && i.data) {
				return i.data;
			}
			return null;
		},
		getActual: function(k, p) {
			let i = gi(k);
			if (i instanceof Object && !!i.data && ia(i.timestamp, p)) {
				return i.data;
			}
			return null;
		},
		remove: function(k) {
			let lk = g(k);
			localStorage.removeItem(lk)
		}
	}
}