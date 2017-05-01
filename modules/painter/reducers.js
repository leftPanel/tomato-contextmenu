const toolbarReducers = {
  mode: (state = "Scroll", { type, payload }) => {
    switch (type) {
      case "toggle-mode":
        if (state === "Scroll") {
          return "Select";
        }
        return "Scroll";
      case "clean-up":
        return "Scroll"
    }
    return state;
  },

  readOnly: (state = false, { type, payload }) => {
    switch (type) {
      case "set-read-only":
        return true;
      case "unset-read-only":
        return false;
      case "clean-up":
        return false
    }
    return state;
  },

  activeNodeCount: (state = 0, { type, payload }) => {
    switch (type) {
      case "set-active-node-count":
        return payload;
      case "clean-up":
        return 0
    }
    return state;
  },
  hasActiveConnection: (state = false, { type, payload }) => {
    switch (type) {
      case "focus-connection":
        return true;
      case "blur-connection":
      case "remove-connection":
        return false;
      case "clean-up":
        return false
    }
    return state;
  },
  allNodeCount: (state = 0, { type, payload }) => {
    switch (type) {
      case "add-node":
        return ++state;
      case "remove-node":
        return (--state) || 0;
      case "clean-up":
        return 0
    }
    return state;
  }
};

export default toolbarReducers