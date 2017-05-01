class Store {
  constructor(reducer, onTransition) {
    let state = {}
      , key = null
      , timeouthandler = null
      , preState = {}
      , cbs = [];

    for (key in reducer) {
      if (reducer.hasOwnProperty(key)) {
        state[key] = (reducer[key])(undefined, {});
        if (state[key] === undefined) {
          console.warn(`reducer ${key} return undefined.`)
        }
      }
    }

    this.dispatch = (action = {}, cb) => {
      let shouldUpdate = false
        , key = null
        , newState = {};

      for (key in reducer) {
        if (reducer.hasOwnProperty(key)) {
          newState[key] = (reducer[key])(state[key], action);

          if (newState[key] !== state[key]) {
            shouldUpdate = true;
          }
        }
      }
      if (timeouthandler === null) {
        preState = state;
      }
      state = newState;
      if (shouldUpdate) {
        update(cb);
      } else {
        console.warn("No modified reducer is found.  Update is ignored!")
      }
    };

    this.touch = () => {
      return JSON.parse(JSON.stringify(state));
    }

    let update = (cb) => {
      clearTimeout(timeouthandler);
      if (cb) cbs.push(cb);
      timeouthandler = setTimeout(() => {
        timeouthandler = null;
        doUpdate();
      }, 0);
    }

    let doUpdate = () => {
      if (typeof onTransition === "function") {
        onTransition(preState, state);
      }
      while(cbs.length) {
        cbs.shift()();
      }
    }
    update();
  }
}

export default Store;