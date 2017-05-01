// painter methods: 

// setNodeName(nodeId, nodeName);
// setConnectionName(sourceId, targetId, name);
// setConnectionType(sourceId, targetId, name);
// setData({tpl, connections});
// getData() -> ({tpl, connections});
// setReadOnly()
// unsetReadOnly()

// painter events:

// onAddNode({id, type});
// onFocusNode(nodeId);
// onBlurNode(nodeId);
// onRemoveNode(nodeId);


// onAddConnection(sourceId, targetId);
// onFocusConnection(sourceId, targetId);
// onBlurConnection(sourceId, targetId);
// onRemoveConnection(sourceId, targetId);

import watch from '../common/watch'
import ClassNames from '../classNames'
import uuid from '../uuid'
import contextMenu from '../contextMenu'
import Store from '../common/Store';
import DocDiff from '../common/DocDiff';
import toolbarReducers from './reducers';

const LEFT_WIDTH = 100
  , LegendColors = {
    "not-ready": "#727272",
    "fulfill": "#67bc69",
    "pending": "#fb3500",
    "queueing": "#fba500"
  }
  , LegendText = {
    "not-ready": "未办",
    "fulfill": "已办",
    "pending": "在办",
    "queueing": "待办"
  }

const Painter = (function () {
  class Painter {
    constructor({ mountPoint, nodeTemplatesLoader }) {
      // initialze
      this.mountPoint = mountPoint;
      this.nodeTemplatesLoader = nodeTemplatesLoader;
      // 1. mount the canvas to the mountPoint;
      let { templateMountPoint, painterToolbarMountPoint, canvasBufferMountPoint, canvasBufferWrapperMountPoint, canvasMountPoint } = this.layout(mountPoint);
      this.templateMountPoint = templateMountPoint;
      this.canvasMountPoint = canvasMountPoint;
      this.painterToolbarMountPoint = painterToolbarMountPoint;
      this.canvasBufferMountPoint = canvasBufferMountPoint;
      this.canvasBufferWrapperMountPoint = canvasBufferWrapperMountPoint;

      // install the template 
      this.installTemplate(nodeTemplatesLoader);

      // install toolbar 
      this.installToolbar()

      // init jsplumb
      this.initJsplumb();

      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleResize = this.handleResize.bind(this);

      // init event 
      this.initEvent();
    }

    layout(mountPoint) {
      let templateMountPoint = this.getDomNodeFromHtml(`
        <div style="position:absolute;top:0;left:0;width:${LEFT_WIDTH}px;bottom:0;overflow:auto;" class="${ClassNames.templateList}"></div>
      `),
        canvasMountPoint = this.getDomNodeFromHtml(`
        <div style="position:absolute;top:0;left:${LEFT_WIDTH}px;right:0;bottom:0;"></div>
      `),
        painterToolbarMountPoint = this.getDomNodeFromHtml(`
        <div style="position:absolute;top:0;left:0;width:100%;height:30px;z-index:2;" class="${ClassNames.toolbar}"></div>
      `),
        canvasBufferWrapperMountPoint = this.getDomNodeFromHtml(`
        <div style="position: absolute;top:0;left:0;width:100%;height:100%;overflow:auto;"></div>  
      `),
        canvasBufferMountPoint = this.getDomNodeFromHtml(`
        <div style="position: absolute;top:0;left:0;width:100%;height:100%;" class="${ClassNames.buffer}" data-listen-alien-dragover data-listen-alien-drop data-action="drop-template"></div>  
      `)
      mountPoint.appendChild(templateMountPoint);
      mountPoint.appendChild(canvasMountPoint);

      canvasMountPoint.appendChild(painterToolbarMountPoint);
      canvasMountPoint.appendChild(canvasBufferWrapperMountPoint);

      canvasBufferWrapperMountPoint.appendChild(canvasBufferMountPoint)
      return { templateMountPoint, painterToolbarMountPoint, canvasBufferMountPoint, canvasBufferWrapperMountPoint, canvasMountPoint }
    }

    installTemplate() {
      // show the loading message
      this.templateMountPoint.innerHTML = `
        <div>正在加载模版数据...</div>
      `;
      this.nodeTemplatesLoader((error, value) => {
        if (error) {
          this.templateMountPoint.innerHTML = `
            <div data-listen-click data-action="reload-template">加载模版数据失败, 重新加载.</div>
          `;
          return;
        }
        this.templateMountPoint.innerHTML = value.map(({ name, id, cls }) => {
          return `
            <div style="cursor:pointer;position:relative;">
              <div data-listen-alien-dragstart data-action="drag-template" id="${id}" data-name="${name}">
                <div class="${cls}"></div>
                <p style="text-align:center;">${name}</p>
              </div>
            </div>
          `
        }).join("");
      });
    }

    installToolbar() {
      // toolbar button has too manay states, I'd better keep them in reducers 
      this.toolbarDocDiff = new DocDiff(this.painterToolbarMountPoint);
      this.store = new Store(toolbarReducers, (preState, newState) => {
        const ButtonGroup = [
          [
            {
              text: "上移",
              disabled: newState.activeNodeCount === 0,
              listen: "alien-mousedown",
              action: "move-up"
            },
            {
              text: "下移",
              disabled: newState.activeNodeCount === 0,
              listen: "alien-mousedown",
              action: "move-down"
            },
            {
              text: "左移",
              disabled: newState.activeNodeCount === 0,
              listen: "alien-mousedown",
              action: "move-left"
            },
            {
              text: "右移",
              disabled: newState.activeNodeCount === 0,
              listen: "alien-mousedown",
              action: "move-right"
            }
          ],
          [
            {
              text: "删除",
              disabled: newState.activeNodeCount === 0 && !newState.hasActiveConnection,
              listen: "click",
              action: "remove"
            }
          ],
          [
            {
              text: "对齐",
              disabled: newState.allNodeCount === 0,
              listen: "click",
              action: "relayout"
            },
            {
              text: "全选",
              disabled: newState.allNodeCount === 0,
              listen: "click",
              action: "select-all"
            }
          ],
          [
            {
              text: "清空",
              disabled: newState.allNodeCount === 0,
              listen: "click",
              action: "clear"
            }
          ],
          [
            {
              text: "选择模式",
              active: newState.mode === "Select",
              listen: "click",
              action: "toggle-mode"
            },
            {
              text: "滚动模式",
              active: newState.mode === "Scroll",
              listen: "click",
              action: "toggle-mode"
            }
          ]
        ]
        let groups = ButtonGroup.map(bg => {
          let bs = bg.map(b => `
            <div class="btn btn-default btn-xs ${b.disabled ? "disabled" : ""} ${b.active ? "active" : ""}" data-listen-${b.listen} data-action="${b.action}">${b.text}</div>
          `).join("")
          return `
            <div class="btn-group" role="group" aria-label="">
              ${bs}
            </div>
          `
        }).join("")
          , html = `
          <div class="btn-toolbar" role="toolbar" aria-label="">
            ${groups}
          </div>
        `;
        this.toolbarDocDiff.update(html);
      });
    }

    initJsplumb() {
      let
        connector = ["Flowchart", { stub: [10, 20], gap: 10, cornerRadius: 5, alwaysRespectStubs: false }]
        , connectorOverlay = [ // same as above
          ["PlainArrow", { width: 20, length: 10, location: 1 }],
          ["Label", {
            location: 0.5,
            id: "label",
            cssClass: "aLabel"
          }]
        ]
        , connectorPaintStyle = {
          lineWidth: 3,
          strokeStyle: "#216477",
          joinstyle: "round",
          outlineColor: "transparent",
          outlineWidth: 10
        }
        // .. and this is the hover style. 
        , connectorHoverStyle = {
          lineWidth: 3,
          strokeStyle: "#769ba9",
        }

        , endpointHoverStyle = {
          fillStyle: "#216477",
          strokeStyle: "#216477",
          cursor: "pointer"
        }
        , connectionDashStyle = {
          dashstyle: "2 2",
        }
        // the definition of source endpoints (the small blue ones)
        , endpoint = {
          endpoint: "Dot",
          paintStyle: {
            strokeStyle: "#7AB02C",
            fillStyle: "transparent",
            radius: 5,
            lineWidth: 2
          },
          reattach: true,
          isSource: true,
          isTarget: true,
          maxConnections: -1,
          connector: connector,
          connectorStyle: connectorPaintStyle,
          hoverPaintStyle: endpointHoverStyle,
          connectorHoverStyle: connectorHoverStyle,
          dragOptions: {},
          dropOptions: { hoverClass: "hover", activeClass: "active" }
        }
        , anchors = ["TopCenter", "BottomCenter", "LeftMiddle", "RightMiddle"]
      this.config = {
        connector,
        connectorPaintStyle,
        connectorHoverStyle,
        connectionDashStyle,
        endpointHoverStyle,
        endpoint,
        anchors
      };
      this.jsplumb = jsPlumb.getInstance({
        // default drag options
        DragOptions: { cursor: 'pointer', zIndex: 2000 },
        // the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text; in this
        // case it returns the 'labelText' member that we set on each connection in the 'init' method below.
        ConnectionOverlays: connectorOverlay,
        Container: this.canvasBufferMountPoint
      });
      this.jsplumb.registerConnectionTypes({
        "default": {
          connector,
          overlays: connectorOverlay,
          paintStyle: connectorPaintStyle,
          hoverPaintStyle: connectorHoverStyle,
        },
        "dashed": {
          paintStyle: connectionDashStyle
        },
        "focused": {
          paintStyle: {
            lineWidth: 3,
            strokeStyle: "#61B7CF"
          }
        }
      });

      // bind connection 
      this.jsplumb.bind("connection", ({ connection }) => {
        connection.setType('default');
        connection.bind("click", (conn, e) => {
          console.log("click on connection")
          this.focusConnection(connection)
        });
        connection.bind("contextmenu", (con, e) => {
          if (this.readonly) {
            return;
          }
          e.preventDefault();
          this.focusConnection(con);
          contextMenu([
            {
              text: "删除",
              onClick: e => {
                this.jsplumb.detach(connection);
              }
            }
          ], e.clientX, e.clientY)
        })
        if (!this.isLoadingExtenalData && !this.isRelayouting) {
          this.onAddConnection(connection.sourceId, connection.targetId);
          this.focusConnection(connection);
        }

      });

      this.jsplumb.bind('connectionDetached', ({ connection }) => {
        this.removeConnection(connection);
      });
    }

    initEvent() {
      let unwatchers = [];
      unwatchers.push(watch(this.mountPoint, "click", "[data-listen-click]", (e, target) => {
        let action = target.getAttribute("data-action");
        switch (action) {
          case "reload-template":
            this.installTemplate();
            break;
          case "remove":
            this.removeActiveNodesAndConnection();
            break;
          case "select-all":
            this.selectNodes(this.getAllNodes());
            break;
          case "toggle-mode":
            this.store.dispatch({ type: "toggle-mode" });
            break;
          case "relayout":
            this.relayout();
            break;
          case "clear":
            this.clear();
            break;
        }
      }));

      unwatchers.push(watch(this.mountPoint, "alien-mousedownmovestart", `.${ClassNames.buffer}`, (e, target) => {
        if (this.store.touch().mode !== "Scroll") {
          return;
        }
        e.detail.canMouseDownMove();
      }, false));

      unwatchers.push(watch(this.mountPoint, "alien-mousedownmove", `.${ClassNames.buffer}`, (e, target) => {
        let { offsetX, offsetY } = e.detail;
        this.canvasBufferWrapperMountPoint.scrollLeft -= offsetX;
        this.canvasBufferWrapperMountPoint.scrollTop -= offsetY;
      }, false));

      unwatchers.push(watch(this.mountPoint, "alien-selectstart", `.${ClassNames.buffer}`, (e, target) => {
        if (this.store.touch().mode !== "Select") {
          return;
        }
        let nodes = this.getAllNodes();
        e.detail.canSelect();
        e.detail.setSeletable(nodes);
        this.diselectNodes(nodes)
      }, false));
      unwatchers.push(watch(this.mountPoint, "alien-selectenter", `.${ClassNames.node}`, (e, target) => {
        // select node;
        this.selectNodes([target])
      }));
      unwatchers.push(watch(this.mountPoint, "alien-selectleave", `.${ClassNames.node}`, (e, target) => {
        // diselect node;
        this.diselectNodes([target])
      }));

      unwatchers.push(watch(this.mountPoint, "alien-mousedown", "[data-listen-alien-mousedown]", (e, target) => {
        let action = target.getAttribute("data-action");
        let dx = 0
          , dy = 0
          , step = e.detail.withShift
            ? 100
            : e.detail.withCtrl
              ? 10
              : 1
        switch (action) {
          case "move-up":
            dy -= step;
            break;
          case "move-down":
            dy += step;
            break;
          case "move-left":
            dx -= step;
            break;
          case "move-right":
            dx += step;
            break;
        }

        this.moveActivedNodes(dx, dy, {})
      }));

      unwatchers.push(watch(this.mountPoint, "alien-dragstart", "[data-listen-alien-dragstart]", (e, target) => {
        let action = target.getAttribute("data-action");
        switch (action) {
          case "drag-template":
            let [id, name] = ["id", "data-name"].map(attr => target.getAttribute(attr))
            e.detail.canDrag();
            e.detail.setDragGhost(this.getDomNodeFromHtml(`
              <div class="${ClassNames.ghost}">${name}</div>
            `), 50, 30);
            e.detail.setTransferData({
              id,
              name,
              dx: 50,
              dy: 30
            });
            break;
        }
      }));

      unwatchers.push(watch(this.mountPoint, "alien-dragover", "[data-listen-alien-dragover]", (e, target) => {
        let action = target.getAttribute("data-action");
        switch (action) {
          case "drop-template":
            e.detail.canDrop();
            break;
        }
      }, false));

      unwatchers.push(watch(this.mountPoint, "alien-drop", "[data-listen-alien-drop]", (e, target) => {
        let action = target.getAttribute("data-action");
        switch (action) {
          case "drop-template":
            let { offsetX, offsetY, transferData } = e.detail
              , { id, dx, dy, name } = transferData
              , x = offsetX - dx
              , y = offsetY - dy
              , node = this.getDomNodeFromHtml(`
                <div style="position:absolute;top:${y}px;left:${x}px;" class="${ClassNames.node}" id="${uuid()}" cmpid="${id}">${name}</div>
              `);
            // console.log(offsetX - dx, offsetY - dy);
            this.canvasBufferMountPoint.appendChild(node);
            this.addNode(node);
            this.focusNode(node);
            break;
        }
      }, false));


      unwatchers.push(watch(this.mountPoint, "click", `.${ClassNames.buffer}`, (e, target) => {
        this.blurEverything();
      }, false));
      unwatchers.push(watch(this.mountPoint, "mousedown", `.${ClassNames.buffer}`, (e, target) => {
        this.diselectNodes(this.getAllNodes())
      }, false));
      unwatchers.push(watch(this.mountPoint, "contextmenu", `.${ClassNames.buffer}`, (e, target) => {
        if (this.readonly) {
          return;
        }
        this.blurEverything();
        e.preventDefault();
        let newState = this.store.touch();
        contextMenu([
          {
            text: "对齐",
            disabled: newState.allNodeCount === 0,
            onClick: e => this.relayout()
          },
          {
            text: "全选",
            disabled: newState.allNodeCount === 0,
            onClick: e => this.selectNodes(this.getAllNodes())
          },
          {
            kind: "separator"
          },
          {
            text: "清空",
            disabled: newState.allNodeCount === 0,
            onClick: e => this.clear()
          },
          {
            kind: "separator"
          },
          {
            text: "选择模式",
            active: newState.mode === "Select",
            onClick: e => this.store.dispatch({ type: "toggle-mode" })
          },
          {
            text: "滚动模式",
            active: newState.mode === "Scroll",
            onClick: e => this.store.dispatch({ type: "toggle-mode" })
          }
        ], e.clientX, e.clientY)
      }, false));

      unwatchers.push(watch(this.mountPoint, "contextmenu", `.${ClassNames.node}`, (e, target) => {
        if (this.readonly) {
          return;
        }
        e.preventDefault();
        this.focusNode(target);
        contextMenu([
          {
            text: "删除",
            onClick: e => {
              this.removeNode(target);
            }
          }
        ], e.clientX, e.clientY)
      }));

      unwatchers.push(watch(this.mountPoint, "alien-hover", `.${ClassNames.node}`, (e, target) => {
        e.detail.setHoverScope(target);
        target.classList.add(ClassNames.hoveredNode);
      }));
      unwatchers.push(watch(this.mountPoint, "alien-unhover", `.${ClassNames.node}`, (e, target) => {
        target.classList.remove(ClassNames.hoveredNode);
      }));

      document.addEventListener("keydown", this.handleKeyDown);

      window.addEventListener("resize", this.handleResize);

      this.unwatchers = unwatchers;
    }

    handleKeyDown(e) {

      if (e.target && e.target.tagName) {
        let tagName = e.target.tagName.toUpperCase();
        switch (tagName) {
          case "INPUT":
          case "TEXTAREA":
            return;
          case "DIV":
            if (e.target.isContentEditable) {
              return;
            }
        }
      }
      let keyCode = e.keyCode
        , withCtrl = e.ctrlKey
        , withShift = e.shiftKey
        , dx = 0
        , dy = 0
        , step = withShift
          ? 100
          : withCtrl
            ? 10
            : 1
      switch (keyCode) {
        case 38:
          dy -= step;
          break;
        case 40:
          dy += step;
          break;
        case 37:
          dx -= step;
          break;
        case 39:
          dx += step;
          break;
        case 46:
          this.removeActiveNodesAndConnection();
          break;
      }
      if (dx || dy) {
        this.moveActivedNodes(dx, dy, {})
      }

    }

    handleResize(e) {
      this.checkSize();
    }

    uninstall() {
      this.unwatchers.forEach(fn => fn && fn());
      this.unwatchers.length = 0;
      document.removeEventListener("keydown", this.handleKeyDown);
      window.removeEventListener("resize", this.handleResize);
    }

    focusConnection(connection) {
      if (this.isRelayouting || this.readonly) {
        return;
      }
      // 1. clear all focused node or connection 
      // 2. set focused type 
      this.jsplumb.select().each(con => {
        this.blurConnection(con);
      });
      this.getAllNodes().forEach(node => {
        this.blurNode(node);
      });
      let label = connection.getOverlay("label").getLabel()
      connection.addType("focused");
      connection.getOverlay("label").setLabel(label)
      if (!this.isLoadingExtenalData) {
        this.onFocusConnection(
          connection.sourceId,
          connection.targetId,
          this.getNodeById(connection.sourceId).getAttribute("cmpid"),
          this.getNodeById(connection.targetId).getAttribute("cmpid")
        );
      }
      this.store.dispatch({ type: "focus-connection" })
    }

    focusNode(node) {
      if (this.isRelayouting || this.readonly) {
        return;
      }
      let id = node.id;
      // 1. clear all focused node or connection 
      // 2. set focused type 
      this.jsplumb.select().each(con => {
        this.blurConnection(con);
      });
      this.getAllNodes().forEach(nd => {
        this.blurNode(nd);
      });
      node.classList.add(ClassNames.focusedNode);
      this.onFocusNode(node.id, node.getAttribute("cmpid"))
      this.countActiveNode();
    }

    blurNode(node) {
      if (this.isRelayouting) {
        return;
      }
      if (node.classList.contains(ClassNames.focusedNode)) {
        node.classList.remove(ClassNames.focusedNode);
        this.onBlurNode(node.id);
        this.countActiveNode();
      }
    }

    countActiveNode() {
      let count = this.getActiveNodes().length;
      this.store.dispatch({ type: "set-active-node-count", payload: count })
    }

    blurConnection(connection) {
      if (this.isRelayouting) {
        return;
      }
      if (connection.hasType("focused")) {
        let label = connection.getOverlay("label").getLabel()
        connection.removeType("focused");
        connection.getOverlay("label").setLabel(label)
        this.onBlurConnection(connection.sourceId, connection.targetId);
        this.store.dispatch({ type: "blur-connection" })
      }
    }

    blurEverything() {
      if (this.isRelayouting) {
        return;
      }
      this.jsplumb.select().each(con => {
        this.blurConnection(con);
      });
      this.getAllNodes().forEach(nd => {
        this.blurNode(nd);
      });
    }

    removeNode(node) {
      if (this.isRelayouting) {
        return;
      }
      let id = node.id;

      if (!this.isRelayouting && !this.isLoadingExtenalData) {
        this.onRemoveNode(id);
      }
      this.jsplumb.remove(node);
      this.store.dispatch({ type: "remove-node" });
      this.countActiveNode();
    }

    removeConnection(connection) {
      if (this.isRelayouting) {
        return;
      }
      let [sourceEndpoint, targetEndpoint] = connection.endpoints;
      let { sourceId, targetId } = connection;
      if (!this.isRelayouting && !this.isLoadingExtenalData) {
        this.onRemoveConnection(sourceId, targetId);
      }
      this.store.dispatch({ type: "remove-connection" })
    }

    moveActivedNodes(dx, dy, { ignore }) {
      let nodes = this.getActiveNodes();
      if (ignore) {
        nodes = nodes.filter(node => node !== ignore);
      }
      nodes.forEach(node => {
        node.style.top = parseFloat(node.style.top, 10) + dy + "px";
        node.style.left = parseFloat(node.style.left, 10) + dx + "px";
      });
      this.jsplumb.repaintEverything();
      this.checkSize();
    }

    selectNodes(nodes) {
      nodes.forEach(node => {
        if (!node.classList.contains(ClassNames.selectedNode)) {
          node.classList.add(ClassNames.selectedNode)
        }
      });
      this.countActiveNode();
    }

    diselectNodes(nodes) {
      nodes.forEach(node => {
        if (node.classList.contains(ClassNames.selectedNode)) {
          node.classList.remove(ClassNames.selectedNode)
        }
      });
      this.countActiveNode();
    }

    removeActiveNodesAndConnection() {
      let nodes = this.getActiveNodes()
        , connection = null;
      this.jsplumb.select().each(con => con.hasType("focused") ? connection = con : null);
      if (connection) {
        this.jsplumb.detach(connection);
      }
      nodes.forEach(n => this.removeNode(n));
    }

    relayout() {
      this.isRelayouting = true;
      // https://github.com/cpettitt/dagre/wiki
      // Create a new directed graph 
      var g = new dagre.graphlib.Graph();

      // Set an object for the graph label
      g.setGraph({
        marginx: 50,
        marginy: 50,
        ranksep: 50,
        edgesep: 80,
        nodesep: 80,
        rankdir: "LR",
        acyclicer: "greed",
        ranker: "longest-path" //network-simplex longest-path tight-tree
      });

      // Default to assigning a new object as a label for each new edge.
      g.setDefaultEdgeLabel(function () { return {}; });

      // Add nodes to the graph. The first argument is the node id. The second is
      // metadata about the node. In this case we're going to add labels to each of
      // our nodes.

      this.getAllNodes().forEach(node => {
        g.setNode(node.id, {
          id: node.id,
          width: node.offsetWidth,
          height: node.offsetHeight,
          focused: node.classList.contains(ClassNames.focusedNode),
          selected: node.classList.contains(ClassNames.selectedNode)
        })
      });

      // Add edges to the graph.
      let conList = [];
      this.jsplumb.select().each(con => {
        // console.log("get connection: ", con)
        conList.push(con);
      });

      conList.forEach(con => {
        // remove self connection 
        if (con.sourceId === con.targetId) {
          return;
        }
        let c = {
          v: con.sourceId,
          w: con.targetId
        };
        if (!g.edge(c)) { // ignore dupliacate
          g.setEdge(con.sourceId, con.targetId, {
            width: 20,
            height: 20,
            types: con.getType().join(" "), // types contains the information about focused 
            label: con.getOverlay("label").getLabel()
          });
        }
      });

      try {
        this.jsplumb.detachEveryConnection();
      } catch (err) {
        console.warn(err);
      }

      // do layout;
      dagre.layout(g);

      g.nodes().forEach(nodeId => {
        let { width, height, x, y, focused, selected } = g.node(nodeId);
        this.getNodeById(nodeId).style.left = x - width / 2 + "px";
        this.getNodeById(nodeId).style.top = y - height / 2 + "px";
        // node is not destroyed during relayout, so the classList is fine
      });
      g.edges().forEach(connectionId => {
        let sourceId = connectionId.v
          , targetId = connectionId.w
          , source = g.node(sourceId)
          , target = g.node(targetId)
          , edge = g.edge(connectionId)
          , points = edge.points.slice(0)
          , sourceAnchor = this.getAnchor(source, points.shift())
          , targetAnchor = this.getAnchor(target, points.pop())
          , sourceNode = this.getNodeById(sourceId)
          , targetNode = this.getNodeById(targetId)
          , sourceEndpoints = this.jsplumb.getEndpoints(sourceNode)
          , targetEndpoints = this.jsplumb.getEndpoints(targetNode)
          , sourceEndpoint = sourceEndpoints.find(x => x.anchor.type === sourceAnchor)
          , targetEndpoint = targetEndpoints.find(x => x.anchor.type === targetAnchor)

        if (sourceEndpoint && targetEndpoint) {
          try {
            let con = this.jsplumb.connect({
              sourceEndpoint,
              targetEndpoint,
            });
            con.setType(edge.types);
            con.getOverlay("label").setLabel(edge.label || "");
          } catch (err) {
            console.warn(err)
          }
        }
      });
      try {
        this.jsplumb.repaintEverything();
        this.checkSize();
      } catch (err) {
        console.warn(err)
      }

      this.isRelayouting = false;
    }

    clear() {
      this.getAllNodes().forEach(node => this.removeNode(node));
    }

    getAnchor({ x, y, width, height }, point) {
      //["TopCenter", "BottomCenter", "LeftMiddle", "RightMiddle"]
      if (point.x < x) { // left 
        return ("LeftMiddle")
      } else if (point.x > x) {
        return ("RightMiddle")
      } else {
        // center 
      }

      if (point.y < y) {
        return ("TopCenter")
      } else if (point.y > y) {
        return ("BottomCenter");
      } else {
        // middle
      }

      return "RightMiddle" // fallback
    }

    getAllConnections() {
      let cons = [];
      this.jsplumb.select().each(({ sourceId, targetId }) => {
        cons.push({ sourceId, targetId })
      });
      return cons;
    }

    getAllNodes() {
      return Array.from(this.canvasBufferMountPoint.querySelectorAll(`.${ClassNames.node}`));
    }

    getActiveNodes() {
      return this.getAllNodes().filter(node => {
        return this.isNodeActive(node)
      });
    }

    getNodeById(id) {
      return document.getElementById(id);
    }

    isNodeActive(node) {
      return (node.classList.contains(ClassNames.focusedNode)
        || node.classList.contains(ClassNames.selectedNode))
    }

    addNode(domNode) {
      let i = 0;
      for (i = 0; i < this.config.anchors.length; i++) {
        let anchor = this.config.anchors[i]
          , uuid = domNode.id + anchor // 方便于从字符串中恢复
          , endpoint = this.jsplumb.addEndpoint(domNode, this.config.endpoint, { anchor: anchor, uuid });
        endpoint.bind("mousedown", (ep, originalEvent) => {
          this.currentDraggingEndpoint = endpoint;
        });
      }

      let lastPos = null;

      this.jsplumb.draggable(domNode, {
        containment: "parent",
        start: ({ drag, el, e, pos }) => {
          lastPos = null;
        },
        drag: ({ drag, el, e, pos }) => {
          if (!lastPos) {
            lastPos = pos;
            return;
          }
          let dx = pos[0] - lastPos[0]
            , dy = pos[1] - lastPos[1]
          this.moveActivedNodes(dx, dy, { ignore: domNode });
          lastPos = pos;
        },
        stop: ({ drag, el, e, pos }) => {
          this.checkSize();
          lastPos = null;
        },
      });

      this.jsplumb.makeTarget(domNode, this.config.endpoint);

      domNode.addEventListener("mousedown", e => {
        this.focusNode(domNode);
      });

      if (!this.isLoadingExtenalData && !this.isRelayouting) {
        this.onAddNode({ id: domNode.id, type: domNode.getAttribute("cmpid") });
      }
      this.store.dispatch({ type: 'add-node' })

      this.checkSize();
    }

    checkSize() {
      // 确保所有节点在画布内
      let
        { maxRight, maxBottom } = this.getAllNodes().reduce((pre, node) => {
          let style = getComputedStyle(node, null)
            , styleLeft = parseFloat(style.getPropertyValue("left"), 10)
            , styleTop = parseFloat(style.getPropertyValue("top"), 10);

          if (styleLeft + node.offsetWidth < 0) {
            node.style.left = 0;
          }

          if (styleTop + node.offsetHeight < 0) {
            node.style.top = 0;
          }

          return {
            maxRight: Math.max(
              pre.maxRight,
              styleLeft + node.offsetWidth
            ),
            maxBottom: Math.max(
              pre.maxBottom,
              styleTop + node.offsetHeight
            )
          }
        }, { maxRight: 0, maxBottom: 0 })
        , canvasStyle = getComputedStyle(this.canvasBufferMountPoint, null)
        , width = parseFloat(canvasStyle.getPropertyValue("width"), 10)
        , height = parseFloat(canvasStyle.getPropertyValue("height"), 10);
      if (width < maxRight) {
        this.canvasBufferMountPoint.style.width = maxRight + 200 + "px";
      }
      if (height < maxBottom) {
        this.canvasBufferMountPoint.style.height = maxBottom + 200 + "px";
      }
    }

    getDomNodeFromHtml(html) {
      let div = document.createElement("div");
      div.innerHTML = html.replace(/^[^<]+|[^>]+$/g, "");
      return div.firstChild;
    }

    getDomNodesFromHtml(html) {
      let div = document.createElement("div");
      div.innerHTML = html.replace(/^[^<]+|[^>]+$/g, "");
      let list = [];
      while (div.lastChild) {
        list.push(div.removeChild(div.lastChild));
      }
      return list.filter(x => x.nodeType === 1);
    }

    getHtmlFromNode(node) {
      let clonedNode = node.cloneNode(true)
        , div = document.createElement("div");
      clonedNode.classList.remove("jsplumb-draggable");
      clonedNode.classList.remove("jsplumb-droppable");
      clonedNode.classList.add("designer-node"); //为了兼容旧的数据？
      div.appendChild(clonedNode);
      return div.innerHTML;
    }

    safeTextContent(str) {
      if (typeof str === "undefined" || str === null || str.trim().length === 0) {
        return "[未命名]"
      }
      return str;
    }

    toObject(connection) {
      let endpoints = connection.endpoints
        , text = connection.getOverlay("label").getLabel()
        , type = connection.getType().join(" ");
      return {
        sourceUuid: endpoints[0].getUuid(),
        targetUuid: endpoints[1].getUuid(),
        text: text,
        type: type,
        sourceId: connection.sourceId,
        targetId: connection.targetId
      };
    }
    /////////////////////////////// call from outside ///////////////////////////////////////////////

    hasNode(id) {
      return !!this.getNodeById(id);
    }

    cleanUp() {
      this.clear();
      this.store.dispatch({ type: "clean-up" })
    }

    setNodeName(nodeId, nodeName) {
      this.getNodeById(nodeId).textContent = this.safeTextContent(nodeName);
      this.jsplumb.repaintEverything();
    }
    setConnectionName(sourceId, targetId, name) {
      this.jsplumb.getConnections({ source: sourceId, target: targetId }).forEach(con => {
        con.getOverlay("label").setLabel(name)
      });
    }
    setConnectionType(sourceId, targetId /* dashed */) {
      this.jsplumb.getConnections({ source: sourceId, target: targetId }).forEach(con => {
        console.log("set: get connection: ", con)
        let label = con.getOverlay("label").getLabel()
        con.addType("dashed");
        con.getOverlay("label").setLabel(label)
      });
    }
    unsertConnectionType(sourceId, targetId) {
      this.jsplumb.getConnections({ source: sourceId, target: targetId }).forEach(con => {
        console.log("unset: get connection: ", con)
        let label = con.getOverlay("label").getLabel()
        con.removeType("dashed");
        con.getOverlay("label").setLabel(label)
        this.jsplumb.repaintEverything();
        console.log("con type: ", con.getType(), con.hasType("dashed"))
      });
    }
    setData({ tpl, connections }) {
      this.isLoadingExtenalData = true;
      let tmps = this.getDomNodesFromHtml(tpl)
      tmps.forEach(node => {
        this.canvasBufferMountPoint.appendChild(node);
        node.classList.add(ClassNames.node); //为了兼容旧的数据？
        node.style.position = "absolute";
        this.addNode(node);
      });
      // add all connections
      let cons = JSON.parse(connections);
      cons.forEach(con => {
        let connection = this.jsplumb.connect({ uuids: [con.sourceUuid, con.targetUuid], type: con.type });
        connection.setType(con.type);
        connection.getOverlay("label").setLabel(con.text || "");
      });
      this.isLoadingExtenalData = false;
    }
    getData() {
      let connections = [];
      this.jsplumb.select().each(con => connections.push(con));
      return {
        connections: JSON.stringify(connections.map(con => this.toObject(con))),
        tpl: this.getAllNodes().map(n => this.getHtmlFromNode(n)).join("")
      }
    }
    setReadOnly() {
      //1. set all endpoint disabeled to connect
      this.jsplumb.selectEndpoints().setEnabled(false);
      //2. blur everything and not allow focus anything 
      this.blurEverything();
      this.readonly = true;
      //3. hide the template list 
      this.templateMountPoint.style.display = "none";
      //4. store the `left` of the mountpoint 
      this.storedLeft = this.canvasMountPoint.style.left;
      //5. set the left of right panel to 0
      this.canvasMountPoint.style.left = 0;
      //6. hide the toolbar 
      this.painterToolbarMountPoint.style.display = "none";
      //7. create the legend from scratch
      this.legendMountPoint = this.getDomNodeFromHtml("<div style='position:absolute;z-index:3;'>" + ["not-ready", "fulfill", "pending", "queueing"].map(colorName => {
        return `<div style="display:inline-block;margin:6px;">
          <div style="display:inline-block; border-radius:4px;width:12px;height:12px;background:${LegendColors[colorName]};"></div>
          ${LegendText[colorName]}
        </div>`
      }).join("") + "</div>");
      // 8. add legend to right place 
      this.canvasMountPoint.insertBefore(this.legendMountPoint, this.canvasMountPoint.firstChild);
      //9. active the select mode
      if (this.store.touch().mode === "Select") {
        this.store.dispatch({ type: "toggle-mode" })
      }
    }
    unsetReadOnly() {
      //1. set all endpoint enable to connect
      this.jsplumb.selectEndpoints().setEnabled(true);
      //2. allow focus anything 
      this.readonly = false;
      //3. show the template list 
      this.templateMountPoint.style.display = "block";
      //4. store the `left` of the mountpoint 
      //5. set the left of right panel to storedLeft
      this.canvasMountPoint.style.left = this.storedLeft;
      //6. show the toolbar 
      this.painterToolbarMountPoint.style.display = "block";
      //7. destroy the legend
      // 8. remove legend from right place 
      if (this.legendMountPoint && this.legendMountPoint.parentNode) {
        this.legendMountPoint.parentNode.removeChild(this.legendMountPoint);
        this.legendMountPoint = null;
      }
      //9. mode ?
    }

    //////////////////////////// called / overwrite by outside /////////////////////////////////////////////////

    onAddNode({ id, type }) {
      console.log("add node:  ", id, type)
    }
    onFocusNode(nodeId) {
      console.log("focus node:  ", nodeId)
    }
    onBlurNode(nodeId) {
      console.log("blur node:  ", nodeId)
    }
    onRemoveNode(nodeId) {
      console.log("remove node:  ", nodeId)
    }

    onAddConnection(sourceId, targetId) {
      console.log("add connection: ", sourceId, targetId)
    }
    onFocusConnection(sourceId, targetId) {
      console.log("focus connection: ", sourceId, targetId)
    }
    onBlurConnection(sourceId, targetId) {
      console.log("blur connection: ", sourceId, targetId)
    }
    onRemoveConnection(sourceId, targetId) {
      console.log("remove connection: ", sourceId, targetId)
    }
  }

  return Painter;
}());

export default Painter;