import React, { createContext } from "react";
import { LOAD_USER } from "./actions";

const initialState = {
  user: undefined,
};

const UIContext = createContext(initialState);

function Reducer(state, action) {
  switch (action.type) {
    case LOAD_USER: {
      const { user } = action;
      return { ...state, user };
    }

    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

function Provider({ children }) {
  const [state, dispatch] = React.useReducer(Reducer, initialState);
  // NOTE: *might* need to memoize this value
  const value = { state, dispatch };
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

function useContext() {
  const context = React.useContext(UIContext);
  if (context === undefined) {
    throw new Error();
  }
  return context;
}

function useStore() {
  const { state } = useContext();
  return { store: state };
}

function useDispatch() {
  const { dispatch } = useContext();
  return { dispatch };
}

export { Provider, useStore, useDispatch };
