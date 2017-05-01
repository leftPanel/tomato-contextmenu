import Painter from '../painter';
import Manager from '../manager';

import ClassNames from '../classNames'

const RIGHT_WIDTH = 365;

class FlowchartBuilder {
  constructor({
    mountPoint,
    nodeTemplatesLoader,
    activityAttributesLoader,
    sequenceFlowAttributesLoader,
    flowchartAttributesLoader,
    pickers, // picker is a method to show a picker in page
  }) {
    let { painterMountPoint, managerMountPoint } = this.layout(mountPoint);

    this.mountPoint = mountPoint;
    this.painterMountPoint = painterMountPoint;
    this.managerMountPoint = managerMountPoint;

    this.handleResize = this.handleResize.bind(this);
    this.handleResizeBefore = this.handleResizeBefore.bind(this);
    this.handleResizeCancel = this.handleResizeCancel.bind(this);
    this.handleResizeEnd = this.handleResizeEnd.bind(this);
    this.handleResizeStart = this.handleResizeStart.bind(this);

    this.initResizeEvent();

    this.painter = new Painter({
      mountPoint: painterMountPoint,
      nodeTemplatesLoader
    });

    this.manager = new Manager({
      mountPoint: managerMountPoint,
      painter: this.painter,
      activityAttributesLoader,
      sequenceFlowAttributesLoader,
      flowchartAttributesLoader,
      pickers
    });
  }

  // call from outside

  cleanUp() {
    // clear all data in manager/painter 
    this.manager.cleanUp();
    this.painter.cleanUp();
  }

  isDirty() {
    return this.manager.isDirty();
  }

  getData() {
    return this.painter.getData();
  }

  setData({ tpl, connections }) {
    tpl = tpl || "";
    connections = connections || "[]";
    return this.painter.setData({tpl, connections})
  }

  getFlowchartAttributes() {
    return this.manager.store.touch().flowchartAttributes
      ? this.manager.store.touch().flowchartAttributes.status.ok
        ? this.manager.store.touch().flowchartAttributes.value
        : null
      : null
  }

  getActivityAttributes(id) {
    return this.manager.store.touch().activityAttributes[id]
      ? this.manager.store.touch().activityAttributes[id].status.ok
        ? this.manager.store.touch().activityAttributes[id].value
        : null
      : null
  }

  getAllActivitiesAttributes() {
    // 坑在这里
    return this.manager.painter.getAllNodes().map(x => ({
      id: x.id,
      parentId: x.getAttribute("cmpid")
    })).map(({ id, type }) => {
      let attr = this.getActivityAttributes(id) || {}
        , name
        , mapped = Object.keys(attr).map(group => {
          return attr[group].map(att => {
            if (att.name === "name") {
              name = att.value
            }
            return {
              group: att.group,
              value: att.value,
              valueText: typeof att.valueText === "undefined"
                ? att.value
                : att.valueText,
              name: att.name
            }
          })
        })
      return {
        id,
        category: "ACTIVITY",
        items: {},
        "extends": { ref: type },
        name,
        attributes: mapped,
      };
    });
  }

  getSequenceflowAttributes(sourceId, targetId) {
    let id = `${sourceId},${targetId}`;
    console.log("FFFFFFFUCK: ", id, this.manager.store.touch().sequenceflowAttributes)
    return this.manager.store.touch().sequenceflowAttributes[id]
      ? this.manager.store.touch().sequenceflowAttributes[id].status.ok
        ? this.manager.store.touch().sequenceflowAttributes[id].value
        : null
      : null
  }

  getAllSequenceflowAttributes() {
    // 坑在这里
    return this.manager.painter.getAllConnections().map(({ sourceId, targetId }) => {
      let attr = this.getSequenceflowAttributes(sourceId, targetId) || {}
        , ref = "" // 流向的id, 需要由外面来填...
        , mapped = Object.keys(attr).map(group => {
          return attr[group].map(att => {
            return {
              group: att.group,
              value: att.value,
              valueText: typeof att.valueText === "undefined"
                ? att.value
                : att.valueText,
              name: att.name
            }
          })
        })
      return {
        id: `${sourceId}-${targetId}`,
        category: "SEQUENCE-FLOW",
        items: {},
        "extends": { ref: "" },
        targetId,
        sourceId,
        attributes: mapped,
      };
    });
  }

  setReadOnly() {
    if (this.readonly) {
      return;
    } else {
      this.readonly = true;
      //1. set painter to readonly mode
      this.painter.setReadOnly();
      //2. uninstall the manager;
      this.manager.uninstall();

      if (this.managerMountPoint && this.managerMountPoint.parentNode) {
        this.managerMountPoint.parentNode.removeChild(this.managerMountPoint);
      }
      //3. store the this.painterMountPoint
      this.restoreRight = this.painterMountPoint.style.right;
      this.painterMountPoint.style.right = 0;
    }

  }

  unsetReadOnly() {
    if (this.readonly) {
      this.readonly = false;
      //1. set painter to write mode
      this.painter.unsetReadOnly();
      //2. install the manager;
      this.mountPoint.appendChild(this.managerMountPoint);
      this.manager.install();

      //3. restore the this.painterMountPoint's right
      this.painterMountPoint.style.right = this.restoreRight;
    }
  }

  //////////////////////////

  layout(mountPoint) {
    let
      painterMountPoint = this.getDomNodeFromHtml(`
        <div style="position:absolute;height:100%;left:0;top:0;right:${RIGHT_WIDTH}px;">
        </div>
      `)
      , managerMountPoint = this.getDomNodeFromHtml(`
        <div style="position:absolute;height:100%;right:0;top:0;width:${RIGHT_WIDTH}px;overflow:auto;">
        </div>
      `);
    mountPoint.appendChild(painterMountPoint);
    mountPoint.appendChild(managerMountPoint);
    return { painterMountPoint, managerMountPoint }
  }

  uninstall() {
    this.managerMountPoint.removeEventListener("alien-resize-before", this.handleResizeBefore);
    this.managerMountPoint.removeEventListener("alien-resize-cancel", this.handleResizeCancel);
    this.managerMountPoint.removeEventListener("alien-resize-end", this.handleResizeEnd);
    this.managerMountPoint.removeEventListener("alien-resize-start", this.handleResizeStart)
    this.managerMountPoint.removeEventListener("alien-resize", this.handleResize);

    this.manager.uninstall();
    this.painter.uninstall();
  }

  handleResizeBefore(e) {
    if (e.detail.position === "LEFT") {
      this.managerMountPoint.style.cursor = "e-resize";
      e.detail.canResize();
    }
  }

  handleResizeCancel(e) {
    this.managerMountPoint.style.cursor = "";
  }

  handleResizeEnd(e) {
    this.managerMountPoint.style.cursor = "";
  }

  handleResizeStart(e) {
    this.orgWidth = parseFloat(getComputedStyle(this.managerMountPoint, null).getPropertyValue("width"));
  }

  handleResize(e) {
    if (this.orgWidth - e.detail.offsetX > 500) {
      return;
    }
    if (this.orgWidth - e.detail.offsetX < 100) {
      return;
    }
    this.painterMountPoint.style.right = this.orgWidth - e.detail.offsetX + "px";
    this.managerMountPoint.style.width = this.orgWidth - e.detail.offsetX + "px";
  }

  initResizeEvent() {
    this.managerMountPoint.addEventListener("alien-resize-before", this.handleResizeBefore);
    this.managerMountPoint.addEventListener("alien-resize-cancel", this.handleResizeCancel);
    this.managerMountPoint.addEventListener("alien-resize-end", this.handleResizeEnd);
    this.managerMountPoint.addEventListener("alien-resize-start", this.handleResizeStart)
    this.managerMountPoint.addEventListener("alien-resize", this.handleResize);
  }

  getDomNodeFromHtml(html) {
    let div = document.createElement("div");
    div.innerHTML = html.replace(/^[^<]+|[^>]+$/g, "");
    return div.firstChild;
  }
}

export default FlowchartBuilder;