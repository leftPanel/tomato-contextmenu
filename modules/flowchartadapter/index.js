// static create(mountPoint): create a new flowchart from scratch, then get value via value() method
// static update(mountPoint, dataLoader): update a flowchart from remote, then get value from value()
// value(): get the modified data for post request
// static view(mountPoint, dataLoader): show a readonly flowchart



import FlowchartBuilder from '../flowchartbuilder'

const FlowchartAdapter = (function () {
  return class {
    constructor({
      mountPoint,
      readOnly,
      loaders,
      pickers,
      fromScratch
    }) {

      this.mountPoint = mountPoint;
      this.readOnly = readOnly;
      this.loaders = loaders;
      this.pickers = pickers;
      this.fromScratch = fromScratch;

      /*
       * attributeDefs:
       * store the attribute defintions of flowchart | sequenceflow | activities
       */
      this.attributeDefs = {};

      /*
        * attributeVals:
        * store the attribute values of flowchart | sequenceflow | activities via their ids
        */
      this.attributeVals = {};

      /*
       * prepare the loaders for the builder/creator/editor or anything
       * 
       */
      this.dataLoader = callback => {
        /*
        * 加载回来的数据理论上有下面几个域 attributes, connections, extends, id, items, tpl
          在这里需要把各个attributes的值存入到 attributeVals 中
        */
        this.loaders.dataLoader((error, value) => {
          if (error) {
            // do nothing
          } else if (value) {
            let { attributes, items, id } = value;
            // 保存流程图的属性, {[name]: value}, 使用一个特殊的键值flow-chart
            this.attributeVals[id] = flat2dArrayToObject(attributes);
            // 保存id用于更改
            this.id = id;
            console.log("store the FUCKING id: ", this.id)
            console.log("btw, the fucking data: ", value);
            console.log("the fucking this: ", this)
            // 保存节点和连线的属性值
            let activities = items["ACTIVITY"] || []
              , sequenceflows = items["SEQUENCE-FLOW"] || [];
            activities.forEach(({ attributes, id }) => {
              this.attributeVals[id] = flat2dArrayToObject(attributes);
            });
            sequenceflows.forEach(({ attributes, sourceId, targetId }) => {
              this.attributeVals[`${sourceId},${targetId}`] = flat2dArrayToObject(attributes)
            });
          }

          callback(error, value);
        });
      }

      this.flowchartAttributesLoader = (id, callback) => {
        /*
         * 这个方法用于加载流程图的属性的定义, 在这里拦截并从attributeVals中取出相应的值插入
         */
        if (this.attributeDefs["flow-chart"]) {
          // 使用缓存
          callback(null, fixAttributes(merge2dArrayWithObject(this.attributeDefs["flow-chart"], this.attributeVals[id])));
          return;
        } else {
          this.loaders.flowchartAttributeDefsLoader((error, value) => {
            if (error) {
              // do nothing 
            } else if (value) {
              let { attributes } = value;
              this.attributeDefs["flow-chart"] = attributes
              callback(null, fixAttributes(merge2dArrayWithObject(this.attributeDefs["flow-chart"], this.attributeVals[id])));
              return;
            }

            callback(error, value);
          })
        }
      }

      // 剩下的两个loader同理，但是有一点点的不同
      this.activityAttributesLoader = ({ id, type }, callback) => {
        // 从模版里取得type对应的属性定义, 从值里取得id对应的值
        if (this.attributeDefs[type]) {
          // 使用缓存
          callback(null, fixAttributes(merge2dArrayWithObject(this.attributeDefs[type], this.attributeVals[id])));
          return;
        } else {
          this.loaders.activityAttributeDefsLoader(type, (error, value) => {
            if (error) {
              // do nothing 
            } else if (value) {
              let { attributes } = value;
              this.attributeDefs[type] = attributes || {};
              callback(null, fixAttributes(merge2dArrayWithObject(this.attributeDefs[type], this.attributeVals[id])));
              return;
            }

            callback(error, value);
          })
        }
      }

      this.sequenceFlowAttributesLoader = ({ sourceId, targetId }, callback) => {
        let id = `${sourceId},${targetId}`;
        if (this.attributeDefs["sequence-flow"]) {
          // 使用缓存
          // 匹配开始节点和目标节点
          callback(null, fixAttributes(merge2dArrayWithObject(this.attributeDefs["sequence-flow"], this.attributeVals[id])));
          return;
        } else {
          this.loaders.sequenceFlowAttributeDefsLoader((error, value) => {
            if (error) {
              // do nothing 
            } else if (value) {
              let { attributes } = value;
              this.attributeDefs["sequence-flow"] = attributes
              let res = fixAttributes(merge2dArrayWithObject(this.attributeDefs["sequence-flow"], this.attributeVals[id]));
              // 匹配开始节点和目标节点
              // Object.keys(res).forEach(groupName => {
              //   let g = res[groupName].find(x => x.name === "startActivity")
              // })
              callback(null, res);
              return;
            }

            callback(error, value);
          })
        }
      }

      // 如果在当前的mountPoint上已经有了一个实例，就不要新建了
      if (this.mountPoint._flowchart) {
        this.flowchart = this.mountPoint._flowchart;
      } else {
        this.flowchart = new FlowchartBuilder({
          mountPoint: this.mountPoint,
          ...loaders,
          pickers
        });
        this.mountPoint._flowchart = this.flowchart;
      }

      this.flowchart.cleanUp();

      if (readOnly) {
        //1. set readonly
        this.flowchart.setReadOnly();
        //2. show an overlay over the editor buffer for  preventing any change
        let overlay = this.overlay();
        //3. start to load data 
        let theDesperateThis = this;
        this.dataLoader(function loaderCallback(error, value) { // value: {tpl, connections}
          if (error) {
            overlay.innerHTML = `加载数据出错, <a class='btn btn-link'>重试</a>`;
            overlay.addEventListener("click", function handleClick(e) {
              overlay.innerHTML = "正在加载数据..."
              theDesperateThis.dataLoader(loaderCallback);
              overlay.removeEventListener("click", handleClick)
            });
            return;
          }
          if (value) {
            if (overlay && overlay.parentNode) {
              overlay.parentNode.removeChild(overlay)
            }
            let { tpl, connections } = value;
            theDesperateThis.flowchart.setData({ tpl, connections });
            theDesperateThis.flowchart.manager.pickers = pickers;

            theDesperateThis.flowchart.manager.activityAttributesLoader = theDesperateThis.activityAttributesLoader;
            theDesperateThis.flowchart.manager.sequenceFlowAttributesLoader = theDesperateThis.sequenceFlowAttributesLoader;
            theDesperateThis.flowchart.manager.flowchartAttributesLoader = theDesperateThis.flowchartAttributesLoader;
            // theDesperateThis.flowchart.manager.loadFlowcharAttributes();
          }
        });
        return;
      } else {
        //1. unset readonly 
        this.flowchart.unsetReadOnly();
        if (fromScratch) {
          this.flowchart.manager.pickers = pickers;
          this.flowchart.manager.activityAttributesLoader = this.activityAttributesLoader;
          this.flowchart.manager.sequenceFlowAttributesLoader = this.sequenceFlowAttributesLoader;
          this.flowchart.manager.flowchartAttributesLoader = this.flowchartAttributesLoader;
          this.flowchart.manager.loadFlowcharAttributes(null);

        } else {
          //1. show an overlay over the editor buffer for  preventing any change
          let overlay = this.overlay();
          //2. start to load data 
          let theDesperateThis = this;
          this.dataLoader(function loaderCallback(error, value) { // value: {tpl, connections}
            if (error) {
              overlay.innerHTML = `加载数据出错, <a class='btn btn-link'>重试</a>`;
              overlay.addEventListener("click", function handleClick(e) {
                overlay.innerHTML = "正在加载数据..."
                theDesperateThis.dataLoader(loaderCallback);
                overlay.removeEventListener("click", handleClick)
              });
              return;
            }
            if (value) {
              if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay)
              }
              let { tpl, connections } = value;
              theDesperateThis.flowchart.setData({ tpl, connections });
              theDesperateThis.flowchart.manager.pickers = pickers;

              theDesperateThis.flowchart.manager.activityAttributesLoader = theDesperateThis.activityAttributesLoader;
              theDesperateThis.flowchart.manager.sequenceFlowAttributesLoader = theDesperateThis.sequenceFlowAttributesLoader;
              theDesperateThis.flowchart.manager.flowchartAttributesLoader = theDesperateThis.flowchartAttributesLoader;
              theDesperateThis.flowchart.manager.loadFlowcharAttributes(value.id);
            }
          });
        }
      }

    }

    overlay() {
      // this overlay can be replaced with something else later;
      let overlay = document.createElement("div");
      overlay.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;z-index:99999;display:table;vertical-align:middle;text-align:center;line-height:${this.mountPoint.offsetHeight}px;background:rgb(0,0,0);color:#fff;opacity:.3`
      overlay.innerHTML = "正在加载数据..."
      this.mountPoint.appendChild(overlay);
      return overlay;
    }

    static create(mountPoint, loaders, pickers) {
      return new this({
        mountPoint,
        readOnly: false,
        loaders,
        pickers,
        fromScratch: true,
      });
    }

    static update(mountPoint, loaders, pickers) {
      return new this({
        mountPoint,
        readOnly: false,
        loaders,
        pickers,
        fromScratch: false,
      });
    }

    static view(mountPoint, loaders) {
      return new this({
        mountPoint,
        readOnly: true,
        loaders,
        fromScratch: false,
      });
    }

    value() {
      let attr = this.flowchart.getFlowchartAttributes() || {}
        , name = ""
        , { tpl, connections } = this.flowchart.getData();
      Object.keys(attr).some(groupName => {
        return attr[groupName].some(att => {
          if (att.name === "name") {
            name = att.value;
            return true;
          }
        });
      });
      console.log("in the fucking value(): ", this, this.id)
      return {
        extends: {
          ref: this.attributeDefs["flow-chart"].id
        },
        items: {
          "ACTIVITY": this.flowchart.getAllActivitiesAttributes(),
          "SEQUENCE-FLOW": this.flowchart.getAllSequenceflowAttributes()
        },
        name: name,
        owner: this.attributeDefs["flow-chart"].owner,
        tpl,
        connections,
        attributes: Object.keys(attr).map(groupName => {
          return attr[groupName].map(att => {
            return {
              group: att.group,
              value: att.value,
              valueText: typeof att.valueText === "undefined"
                ? att.value
                : att.valueText,
              name: att.name
            }
          })
        }),
        id: this.id
      }
    }

    isDirty() {
      if (this.flowchart) {
        return this.flowchart.isDirty();
      }
      return false;
    }

    unsetDirty() {
      if (this.flowchart) {
        this.flowchart.manager.unsetDirty();
      }
    }

    cleanUp() {
      if (this.flowchart) {
        this.flowchart.cleanUp();
      }
    }
  }

  function flat2dArrayToObject(attributes) {
    return Object.keys(attributes).reduce((pre, groupName) => {
      return attributes[groupName].reduce((pre, attr) => {
        pre[attr.name] = {
          name: attr.name,
          value: attr.value,
          valueText: attr.valueText
        }
        return pre;
      }, pre)
    }, {});
  }

  function merge2dArrayWithObject(arr, obj) {
    if (!obj) {
      return arr;
    }

    let res = JSON.parse(JSON.stringify(arr))

    Object.keys(res).forEach(groupName => {
      res[groupName].forEach(attr => {
        if (obj[attr.name]) {
          attr.value = obj[attr.name].value;
          attr.valueText = obj[attr.name].valueText;
        }
      })
    });
    return res;
  }

  function fixAttributes(arr) {
    Object.keys(arr).forEach(groupName => {
      arr[groupName].forEach(attr => {
        let { name, value, data, group } = attr;
        //1. set  attribute's value 
        if (typeof value === "undefined") {
          if (data && data.editor && typeof data.editor.value !== undefined) {
            attr.value = data.editor.value
          }
        }
        //2. set groupName 
        if (group !== groupName) {
          attr.group = groupName;
        }

        //3. set _muted 
        if (data && data.editor && data.editor.values) {
          let value = attr.value
          attr.data.editor.values.forEach(vs => { //1
            let v = vs.value
              , c = vs.ctrl;
            c.forEach(cl => { //2
              let n = cl.name
                , show = cl.show;
              if (v === value) {
                setVisible(arr, groupName, n, show)//3
              }
            });
          });
        }

        //4. set valueText
        if (data && data.editor && data.editor.data) {
          data.editor.data.some(([v, t]) => {
            if (v === attr.value) {
              attr.valueText = t;
              return true;
            }
          });
        }

      })
    });
    return arr;
  }

  function setVisible(arr, groupName, name, show) {
    (arr[groupName].find(x => x.name === name) || {})._muted = !show;
  }


}());

export default FlowchartAdapter;