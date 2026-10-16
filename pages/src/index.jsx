import "core-js/stable";
import "regenerator-runtime/runtime";
import React from "react";
import ReactDOM from "react-dom";
import { Home } from "./components/Home";
import { Provider } from "./modules/context";

const Root = () => (
  <Provider>
    <Home />
  </Provider>
);

ReactDOM.render(React.createElement(Root), document.querySelector("#root"));
