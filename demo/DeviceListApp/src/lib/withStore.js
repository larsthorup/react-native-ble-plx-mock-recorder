import React from 'react';
import { Provider } from 'react-redux';

export const withStore = (element, store) => {
  return (
    <Provider store={store}>{element}</Provider>
  );
};