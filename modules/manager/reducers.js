const managerReducers = {
  flowchartAttributes: (state = {}, { type, payload }) => {
    let newState = { ...state }
    switch (type) {
      case "load-flowchart-attributes-before":
        return {
          status: { pending: true }
        }
      case "load-flowchart-attributes-fail":
        return {
          status: { error: payload.error || true }
        }
      case "load-flowchart-attributes-ok":
        return {
          status: { ok: true },
          value: payload.value
        }
      case "change-attribute":
        let { id, groupName, name, value, valueText } = payload;
        if (!id) {
          let a = newState.value[groupName].find(x => x.name === name);
          if (a) {
            a.value = value;
            a.valueText = valueText;
          }
          return newState;
        }
        break;
      case "clean-up":
        return {}
    }
    return state;
  },

  activityAttributes: (state = {}, { type, payload }) => {
    if (!payload) {
      return state;
    }

    let { id } = payload
      , newState = { ...state };
    switch (type) {
      case "load-activity-attributes-before":
        newState[id] = {
          status: { pending: true }
        }
        return newState;
      case "load-activity-attributes-fail":
        newState[id] = {
          status: { error: payload.error || true }
        }
        return newState;
      case "load-activity-attributes-ok":
        newState[id] = {
          status: { ok: true },
          value: payload.value
        }
        return newState;
      case "change-attribute":
        let { groupName, name, value, valueText } = payload;
        if (id && newState[id]) {
          let a = newState[id].value[groupName].find(x => x.name === name);
          if (a) {
            a.value = value;
            a.valueText = valueText;
          }
          return newState;
        }
      case "remove-activity":
        delete newState[id];
        return newState;
      case "set-visible":
        if (id && newState[id]) {
          newState[id].value[payload.groupName].find(x => x.name === payload.name)._muted = !payload.show;
          return newState;
        }
        break;
      case "clean-up":
        return {}
      default: break;
    }
    return state;
  },

  sequenceflowAttributes: (state = {}, { type, payload }) => {
    if (!payload) {
      return state;
    }
    let { sourceId, targetId, id } = payload
      , newState = { ...state };
    id = id || [sourceId, targetId].join(",")
    switch (type) {
      case "load-sequenceflow-attributes-before":
        newState[id] = {
          status: { pending: true }
        }
        break;
        return newState;
      case "load-sequenceflow-attributes-fail":
        newState[id] = {
          status: { error: payload.error || true }
        }
        break;
        return newState;
      case "load-sequenceflow-attributes-ok":
        newState[id] = {
          status: { ok: true },
          value: payload.value
        }
        return newState;
      case "change-attribute":
        let { groupName, name, value, valueText } = payload;
        if (id && newState[id]) {
          let a = newState[id].value[groupName].find(x => x.name === name);
          if (a) {
            a.value = value;
            a.valueText = valueText;
          }
          return newState;
        }
        break;
      case "remove-sequenceflow":
        delete newState[id];
        return newState;
      case "set-visible":
        if (id && newState[id]) {
          newState[id].value[payload.groupName].find(x => x.name === payload.name)._muted = !payload.show;
          return newState;
        }
        break;
      case "clean-up":
        return {}
      default: break;
    }
    return state;
  },

  currentConfigureId: (state = null, { type, payload }) => {
    let { sourceId, targetId, id } = payload || {};
    id = id || [sourceId, targetId].join(",")
    switch (type) {
      case "focus-sequenceflow":
        return [payload.sourceId, payload.targetId].join(",");
      case "focus-activity":
        return payload.id;
      case "blur-sequenceflow":
      case "blur-activity":
      case "remove-activity":
      case "remove-sequenceflow":
        return id === state ? null : state;
      case "clean-up":
        console.log("clean the fuck up!!!!!!!!!!!!!!!!!!")
        return null;
    }
    return state;
  },

  dirty: (state = false, { type, payload }) => {
    switch (type) {
      case "clean-up":
      case "unset-dirty":
        return false;
      case "change-attribute":
      case "set-dirty":
        // throw "FUCK YOU"
        return true;
    }
    return state;
  }

};

export default managerReducer;