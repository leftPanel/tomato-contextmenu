import Store from '../common/Store';
import DocDiff from '../common/DocDiff';
import managerReducers from './reducers';
import Text from './Text';
import guid from './guid';
import watch from '../common/watch'

const Manager = (function () {
  return class {
    constructor({
      mountPoint,
      painter,
      activityAttributesLoader,
      sequenceFlowAttributesLoader,
      flowchartAttributesLoader,
      pickers
    }) {
      this.mountPoint = mountPoint;
      this.painter = painter;
      this.activityAttributesLoader = activityAttributesLoader;
      this.sequenceFlowAttributesLoader = sequenceFlowAttributesLoader;
      this.flowchartAttributesLoader = flowchartAttributesLoader;

      this.docDiff = new DocDiff(this.mountPoint);
      this.store = new Store(managerReducers, (preState, newState) => {
        // 修改表单
        let html = this.getForm(newState);
        this.docDiff.update(html);
      });

      this.handleChange = this.handleChange.bind(this);
      this.handleOpenPicker = this.handleOpenPicker.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);

      // this.loadFlowcharAttributes();

      this.installPainter();

      this.install();

      this.pickers = pickers;

    }

    loadFlowcharAttributes(flowchartId) {
      this.store.dispatch({
        type: "load-flowchart-attributes-before",
        payload: {},
      });
      this.flowchartAttributesLoader(flowchartId, (error, value) => {
        if (error) {
          this.store.dispatch({
            type: "load-flowchart-attributes-fail",
            payload: { error },
          });
          return;
        }
        this.store.dispatch({
          type: "load-flowchart-attributes-ok",
          payload: { value: JSON.parse(JSON.stringify(value)) },
        });
      });
    }

    checkShouldLoadActivityAttribute(id, type) {
      if (!this.store.touch().activityAttributes[id]) {
        this.store.dispatch({
          type: "load-activity-attributes-before",
          payload: { id },
        });
        this.activityAttributesLoader({ id, type }, (error, value) => {
          if (error) {
            this.store.dispatch({
              type: "load-activity-attributes-fail",
              payload: { id, error },
            });
            return;
          }
          this.store.dispatch({
            type: "load-activity-attributes-ok",
            payload: { id, value: JSON.parse(JSON.stringify(value)) },
          });
        });
      }
    }

    checkShouldLoadSequenceflowAttribute(sourceId, targetId) {
      if (this.store.touch().sequenceflowAttributes[`${sourceId},${targetId}`]) {
      } else {
        this.store.dispatch({
          type: "load-sequenceflow-attributes-before",
          payload: { sourceId, targetId },
        });
        this.sequenceFlowAttributesLoader({ sourceId, targetId }, (error, value) => {
          if (error) {
            this.store.dispatch({
              type: "load-sequenceflow-attributes-fail",
              payload: { sourceId, targetId, error },
            });
            return;
          }
          let safeValue = JSON.parse(JSON.stringify(value));
          // 连接有起点和终点两个属性，是只读的
          let [start, end] = [sourceId, targetId].map(nodeId => {
            return this.getActivityNameById(nodeId);
          });
          Object.keys(safeValue).forEach(groupName => {
            safeValue[groupName].forEach(attr => {
              if (attr.name === "startActivity") {
                attr.value = start || "-";
              }
              if (attr.name === "endActivity") {
                attr.value = end || "-";
              }
            })
          });
          this.store.dispatch({
            type: "load-sequenceflow-attributes-ok",
            payload: { sourceId, targetId, value: safeValue },
          });
        });
      }
    }

    installPainter() {
      // onAddNode, load attribute of activity
      this.painter.onAddNode = ({ id, type }) => {
        // console.info("add node:  ", id, type)
        /// try to load attribute list 
        // load attribute on add node would slow down 
        this.store.dispatch({ type: "set-dirty" })
      };
      // onFocusNode, show attributes on right
      this.painter.onFocusNode = (id, type) => {
        this.checkShouldLoadActivityAttribute(id, type);
        this.store.dispatch({
          type: "focus-activity",
          payload: { id: id }
        });
      }
      this.painter.onBlurNode = (id) => {
        this.store.dispatch({
          type: "blur-activity",
          payload: { id: id }
        });
      }
      this.painter.onRemoveNode = (id) => {
        this.store.dispatch({
          type: "remove-activity",
          payload: { id: id }
        });
        this.store.dispatch({ type: "set-dirty" })
      }

      this.painter.onAddConnection = (sourceId, targetId) => {
        this.store.dispatch({ type: "set-dirty" })

      }
      this.painter.onFocusConnection = (sourceId, targetId, sourceType, targetType) => {
        this.checkShouldLoadSequenceflowAttribute(sourceId, targetId);
        this.checkShouldLoadActivityAttribute(sourceId, sourceType);
        this.checkShouldLoadActivityAttribute(targetId, targetType);
        this.store.dispatch({
          type: "focus-sequenceflow",
          payload: { sourceId, targetId }
        });
      }
      this.painter.onBlurConnection = (sourceId, targetId) => {
        this.store.dispatch({
          type: "blur-sequenceflow",
          payload: { sourceId, targetId }
        });
      }
      this.painter.onRemoveConnection = (sourceId, targetId) => {
        this.store.dispatch({
          type: "remove-sequenceflow",
          payload: { sourceId, targetId }
        });
        this.store.dispatch({ type: "set-dirty" })
      }
    }

    getActivityNameById(activityId) {
      let { activityAttributes } = this.store.touch()
        , attr = activityAttributes[activityId]
        , { status, value } = attr || {}
        , { ok } = status || {};
      if (ok) {
        let att = this.flatStupidGroupArray(value).find(x => x.name === "name");
        if (att) {
          return att.value;
        }
      }
    }


    setSourceAndTargetNodeName() {
      let { sequenceflowAttributes } = this.store.touch();
      Object.keys(sequenceflowAttributes).forEach(sequenceflowId => {
        let attr = sequenceflowAttributes[sequenceflowId]
          , { status, value } = attr || {}
          , { ok } = status || {};
        if (ok) {
          let [start, end] = sequenceflowId.split(",").map(nodeId => {
            return this.getActivityNameById(nodeId);
          });
          Object.keys(value).forEach(groupName => {
            value[groupName].forEach(attr => {
              if (attr.name === "startActivity" && attr.value !== start) {
                // attr.value = start;
                this.store.dispatch({
                  type: "change-attribute",
                  payload: {
                    id: sequenceflowId,
                    groupName,
                    name: "startActivity",
                    value: start
                  }
                })
              }
              if (attr.name === "endActivity" && attr.value !== end) {
                // attr.value = end;
                this.store.dispatch({
                  type: "change-attribute",
                  payload: {
                    id: sequenceflowId,
                    groupName,
                    name: "endActivity",
                    value: end
                  }
                })
              }
            })
          });
        }
      });
    }

    setVisible(id, groupName, name, show) {
      this.store.dispatch({
        type: "set-visible",
        payload: {
          id,
          groupName,
          name,
          show
        }
      })
    }

    checkStartActivityNameAndEndActivityName({ id, name }) {
      let { sequenceflowAttributes } = this.store.touch();
      Object.keys(sequenceflowAttributes).forEach(sequenceflowId => {
        let attr = sequenceflowAttributes[sequenceflowId]
          , { status, value } = attr || {}
          , { ok } = status || {};
        if (ok) {
          let [sourceId, targetId] = sequenceflowId.split(",");

          if (sourceId === id) {
            this.store.dispatch({
              type: "change-attribute",
              payload: {
                id: sequenceflowId,
                groupName: "basics", // I'M ******* TIRED!
                name: "startActivity",
                value: name
              }
            })
          }
          if (targetId === id) {
            this.store.dispatch({
              type: "change-attribute",
              payload: {
                id: sequenceflowId,
                groupName: "basics",  // I'M ******* TIRED!
                name: "endActivity",
                value: name
              }
            })
          }
        }
      });
    }

    install() {
      this.unwatchChange = watch(this.mountPoint, "alien-change", "[data-listen-alien-change]", this.handleChange);
      this.unwatchKeyDown = watch(this.mountPoint, "keydown", "[data-listen-alien-change]", this.handleKeyDown);
      this.unWatchOpenPicker = watch(this.mountPoint, "click", "[data-open-picker]", this.handleOpenPicker);
    }

    uninstall() {
      if (this.unWatchOpenPicker) {
        this.unWatchOpenPicker();
      }
      if (this.unwatchChange) {
        this.unwatchChange();
      }
      if (this.unwatchKeyDown) {
        this.unwatchKeyDown();
      }
    }

    cleanUp() {
      // clean up reducers 
      this.store.dispatch({ type: "clean-up" })
    }

    isDirty() {
      return this.store.touch().dirty;
    }

    unsetDirty() {
      return this.store.dispatch({ type: "unset-dirty" })
    }

    handleChange(e, target) {
      let value = target.value
        , groupName = target.getAttribute("data-group-name")
        , name = target.name
        , valueText = value

      if (target instanceof HTMLSelectElement) {
        let valueTextList = [];
        let options = target.querySelectorAll("option")
        for (let i = 0; i < options.length; i++) {
          if (options[i].value === value) {
            valueTextList.push(options[i].innerHTML);
          }
        }
        if (valueTextList.length) {
          valueText = valueTextList.join(",");
        }
      }

      this.store.dispatch({
        type: "change-attribute",
        payload: {
          id: this.store.touch().currentConfigureId,
          groupName,
          name,
          value,
          valueText
        }
      });

      // 如果改变的是name属性，需要修改 1. 左边流程图里的文字，2. 连线的startActivity，endActivity 属性 
      // 如果是flowTip ， 1. 同上 
      // 如果是 flowType  1, 修改流程图里连线类型
      // 如果有ctrl属性，需要显示、隐藏某些域

      let id = this.store.touch().currentConfigureId;
      if (id) {
        let [sourceId, targetId] = id.split(",")
          , isSequenceflow = id.includes(",")
          , isActivity = !isSequenceflow;

        if (name === "name" && isActivity) {
          this.painter.setNodeName(id, value);
          this.checkStartActivityNameAndEndActivityName({
            id,
            name: value
          });
        }
        if (name === "flowTip" && isSequenceflow) {
          this.painter.setConnectionName(sourceId, targetId, value)
        }
        if (name === "flowType" && isSequenceflow) {
          console.log(value === 2 || value === "2", value)
          if (value === 2 || value === "2") {
            this.painter.setConnectionType(sourceId, targetId);
          } else {
            this.painter.unsertConnectionType(sourceId, targetId);
          }
        }
      }
      let attrReducer = this.store.touch().sequenceflowAttributes[id]
        || this.store.touch().activityAttributes[id]
        || this.store.touch().flowchartAttributes;
      if (attrReducer && attrReducer.value) {
        let attr = attrReducer.value[groupName].find(x => x.name === name);
        if (attr && attr.data && attr.data.editor && attr.data.editor.values) {
          let value = attr.value
            , groupName = attr.group;
          attr.data.editor.values.forEach(vs => { //1
            let v = vs.value
              , c = vs.ctrl;
            c.forEach(cl => { //2
              let n = cl.name
                , show = cl.show;
              if (v === value) {
                this.setVisible(id, groupName, n, show)//3
              }
            });
          });
        }
      }
    }

    handleKeyDown(e, target) {
      if (e.keyCode === 13 && target.closest && target.closest("form")) {
        e.preventDefault();
        let form = target.closest("form")
          , controls = form.querySelectorAll("textarea, input, button, select")
          , len = controls.length
          , i = 0
          , found = false;
        for (i = 0; i < len && !found; i++) {
          if (controls[i] === target) {
            found = true;
            if (controls[i + 1] && !e.shiftKey) {
              controls[i + 1].focus();
            }
            if (controls[i - 1] && e.shiftKey) {
              controls[i - 1].focus();
            }
          }
        }
      }
    }

    handleOpenPicker(e, target) {
      let groupName = target.getAttribute("data-group-name")
        , name = target.getAttribute("data-name")
        , id = this.store.touch().currentConfigureId // null is fine
        , value = target.getAttribute("data-value")
        , valueText = target.getAttribute("data-value-text")
        , type = target.getAttribute("data-type")
        , multiple = target.getAttribute("data-multiple") !== null
      this.pickers[type]({ value, valueText }, multiple, ({ value, valueText }) => {
        console.log(value, valueText, typeof value, typeof valueText);
        // [].join("|") === ""
        if (value === "" && valueText === "") {
          return;
        }
        // this value is a new value
        this.store.dispatch({
          type: "change-attribute",
          payload: {
            id,
            groupName,
            name,
            value,
            valueText
          }
        });
      })
    }

    getForm(state) {
      let { currentConfigureId } = state;
      if (!currentConfigureId) {
        //1. 如果没有，则显示流程图的属性
        var { flowchartAttributes } = state || {}
          , { status, value } = flowchartAttributes || {}
          , { pending, ok, error } = status || {};

        if (error) {
          return "<div data-reload-flowchart-attribute> 加载流程图属性列表出错, 点击重试</div>";
        }
        if (ok) {
          return this.renderForm(this.flatStupidGroupArray(value))
        }
        return "<div>正在加载流程图属性列表...</div>";
      }

      if (currentConfigureId && currentConfigureId.includes(",")) {
        //2. 如果包含了逗号，说明是一个连接嘛
        var { sequenceflowAttributes } = state
          , { status, value } = sequenceflowAttributes[currentConfigureId] || {}
          , { pending, ok, error } = status || {};

        if (error) {
          return "<div data-reload-flowchart-attribute> 加载流程属性列表出错, 点击重试</div>";
        }
        if (ok) {
          return this.renderForm(this.flatStupidGroupArray(value))
        }
        return "<div>正在加载流程属性列表...</div>";
      }

      if (currentConfigureId) {
        //3. 如果不是上面的情况，就当成activity的
        var { activityAttributes } = state
          , { status, value } = activityAttributes[currentConfigureId] || {}
          , { pending, ok, error } = status || {};

        if (error) {
          return "<div data-reload-flowchart-attribute> 加载节点属性列表出错, 点击重试</div>";
        }
        if (ok) {
          return this.renderForm(this.flatStupidGroupArray(value))
        }
        return "<div>正在加载节点属性列表...</div>";
      }


      return "";
    }

    flatStupidGroupArray(ga) {
      return Object.keys(ga).reduce((p, groupName) => {
        return p.concat(ga[groupName])
      }, [])
    }

    renderForm(controlList) {
      let html = controlList.map(control => this.renderControl(control, controlList)).join("");
      if (!html) {
        // 有时候这个节点一个属性都没有
        html = "没有可编辑的属性."
      }
      return `<form style="padding: 10px;">${html}</form>`
    }

    renderControl(control, controlList) {
      let { data, group, name, text, showInDesigner, _muted, description } = control;
      if (showInDesigner === "NO") {
        return "";
      }
      if (_muted) {
        return "";
      }

      let controlType = this.getControlType(data);
      switch (controlType) {
        case "TEXT":
          return this.textInputHtml(control);
        case "PICKER":
          return this.pickerHtml(control);
        case "STATIC-TEXT":
          return this.staticTextHtml(control);
        case "POP-SELECT":
          return this.popSelectHtml(control, controlList);
      }
      return "UNKOWN"
    }

    getControlType(data) {
      if (data && data.editor && data.editor.type === "combo") {
        return "PICKER";
      }
      if (data && data.editor === false) {
        return "STATIC-TEXT"
      }
      if (data && data.editor && data.editor.type === "pop-select()") {
        return "POP-SELECT"
      }
      return "TEXT";
    }

    pickerHtml(attr) {
      let htmlId = `${attr.group}-${attr.name}`
        , helpBlock = attr.description
          ? `<p class="help-block">${attr.description}</p>`
          : ""
        , optionsHtml = attr.data.editor.data.map(kv => {
          let selected = kv[0] === (attr.value === undefined
            ? attr.data.editor.value
            : attr.value)
            ? "selected"
            : "";
          return `<option value=${kv[0]} ${selected} >${kv[1]}</option>`
        }).join("");
      return `
      <div class="form-group" data-unique-key="${htmlId}">
        <label for="${htmlId}">${attr.text}</label>
        <select class="form-control" id="${htmlId}" name="${attr.name}"  data-listen-alien-change data-group-name="${attr.group}" >
          ${optionsHtml}
        </select>
        ${helpBlock}
      </div>
    `
    }

    textInputHtml(attr) {
      let htmlId = `${attr.group}-${attr.name}`
        , helpBlock = attr.description
          ? `<p class="help-block">${attr.description}</p>`
          : ""

      let TextControl = Text({
        "class": "form-control input-sm",
        id: htmlId,
        placeholder: attr.text,
        name: attr.name,
        "data-group-name": attr.group,
        "data-listen-alien-change": "",
        value: attr.value === undefined ? "" : attr.value
      });


      // return `
      //   <div class="input-group input-group-sm" style="display:table-row">
      //     <label class="input-group-addon" for="${htmlId}">${attr.text}</label>
      //     <input type="text" class="form-control" placeholder="Username" aria-describedby="sizing-addon3" id="${htmlId}">
      //   </div>
      // `

      return `
      <div class="form-group" data-unique-key="${htmlId}">
        <label for="${htmlId}">${attr.text}</label>
        ${TextControl}
        ${helpBlock}
      </div>
    `
    }

    staticTextHtml(attr) {
      let htmlId = `${attr.group}-${attr.name}`
        , helpBlock = attr.description
          ? `<p class="help-block">${attr.description}</p>`
          : ""
      return `
        <div class="form-group" data-unique-key="${htmlId}">
          <label>${attr.text}</label>
          <p class="form-control-static">${attr.value === undefined ? "" : attr.value}</p>
          ${helpBlock}
        </div>
      `
    }

    popSelectHtml(attr, controlList) {
      //用户(user)、角色(role)、岗位(position)、部门(dept)、节点列表(activity)
      let type = this.getPickerType(attr.data.editor.ref, controlList)
      let hint = this.getHint(type)
      let htmlId = `${attr.group}-${attr.name}`
        , helpBlock = attr.description
          ? `<p class="help-block">${attr.description}</p>`
          : ""
        , value = attr.value
        , valueText = attr.valueText
        , multiple = attr.data.editor.valueType === "multi"

      return `
        <div class="form-group" data-unique-key="${htmlId}">
          <label>${attr.text}</label>
          <div class="panel panel-default">
            <div class="panel-body">
              <div class="btn btn-default btn-xs" 
                data-open-picker 
                data-type="${type}" 
                ${typeof value === "undefined" ? "" : `data-value="${value}"`} 
                ${typeof valueText === "undefined" ? "" : `data-value-text="${valueText}"`}
                data-name="${attr.name}" 
                data-group-name="${attr.group}" 
              ${multiple ? "data-multiple" : ""}>选择${hint}</div>
              <div data-value="${attr.value}">${attr.valueText === undefined ? "" : attr.valueText}</div>
            </div>
          </div>
          ${helpBlock}
        </div>
      `
    }

    getPickerType(ref, controlList) {
      if (ref && ref.startsWith("$")) {
        return (controlList.find(x => x.name === ref.slice(1)) || {}).value; //SHIT 
      }
      return ref;
    }

    getHint(ref) {
      switch (ref) {
        case "user": return '用户';
        case "role": return "角色";
        case "position": return "岗位";
        case "dept": return "部门";
        case "activity": return "节点";
      }
      return ""
    };
  }
}());

export default Manager;