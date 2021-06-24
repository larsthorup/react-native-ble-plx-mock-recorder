import { applyMiddleware, compose, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';

import { deviceScanning } from './service/deviceScanning';

const trace = false;

export const initialState = {
  ble: {
    powerState: null,
    deviceSet: {}, // Note: eventually cache Object.keys(device) with reselect
    device: {},
  },
};

const reducerMap = {};

export const register = (type, reducer) => {
  const actionCreator = (args) => ({ type, ...args });
  actionCreator.type = type;
  if (reducer) {
    reducerMap[type] = reducer;
  }
  return actionCreator;
};

export const reducer = (state, action) => {
  if (typeof state === 'undefined') {
    return initialState;
  }

  const reducerForType = reducerMap[action.type];
  if (!reducerForType) {
    return state;
  }

  if (trace) { console.log('store', action); }
  return reducerForType(state, action);
};

export const configureStore = () => {
  const middleware = [thunkMiddleware];
  const store = createStore(reducer, compose(applyMiddleware(...middleware)));
  store.dispatch(deviceScanning);
  return store;
};

export const bleDeviceScanned = register('bleDeviceScanned', (state, { device }) => {
  const { id } = device;
  if (!state.ble.deviceSet[id]) {
    return {
      ...state,
      ble: {
        ...state.ble,
        deviceSet: {
          ...state.ble.deviceSet,
          [id]: true,
        },
        device: {
          ...state.ble.device,
          [id]: {
            device,
          },
        },
      },
    };
  } else {
    return state;
  }
});

export const blePowerStateChanged = register('blePowerStateChanged', (state, { powerState }) => {
  if (state.ble.powerState !== powerState) {
    return {
      ...state,
      ble: {
        ...state.ble,
        powerState,
      },
    };
  } else {
    return state;
  }
});

export const bleDeviceConnecting = register('bleDeviceConnecting', (state, { id, connecting }) => {
  if (state.ble.device[id].connecting !== connecting) {
    return {
      ...state,
      ble: {
        ...state.ble,
        device: {
          ...state.ble.device,
          [id]: {
            ...state.ble.device[id],
            connecting,
          },
        },
      },
    };
  } else {
    return state;
  }
});

export const bleDevicePolling = register('bleDevicePolling', (state, { id, polling }) => {
  if (state.ble.device[id].polling !== polling) {
    return {
      ...state,
      ble: {
        ...state.ble,
        device: {
          ...state.ble.device,
          [id]: {
            ...state.ble.device[id],
            polling,
          },
        },
      },
    };
  } else {
    return state;
  }
});

export const bleDeviceBatteryLevel = register('bleDeviceBatteryLevel', (state, { id, batteryLevel }) => {
  if (state.ble.device[id].batteryLevel !== batteryLevel) {
    return {
      ...state,
      ble: {
        ...state.ble,
        device: {
          ...state.ble.device,
          [id]: {
            ...state.ble.device[id],
            batteryLevel,
          },
        },
      },
    };
  } else {
    return state;
  }
});

export const bleDeviceSignal = register('bleDeviceSignal', (state, { id, signal }) => {
  if (state.ble.device[id].signal !== signal) {
    return {
      ...state,
      ble: {
        ...state.ble,
        device: {
          ...state.ble.device,
          [id]: {
            ...state.ble.device[id],
            signal,
          },
        },
      },
    };
  } else {
    return state;
  }
});
