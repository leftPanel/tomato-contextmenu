var DocCom = (function () {
  function DocCom(rootNode) {
    this.rootNode = rootNode;
    this.oldTree = null;
    this.oldHtml = "";
  }

  DocCom.prototype.update = function (htmlString) {
    if (this.oldHtml === htmlString) {
      return;
    } else {
      this.oldHtml = htmlString;
    }
    var newTree = buildTreeFromHtmlString(htmlString)
      , commandQueue = compareTree(this.oldTree, newTree, this.rootNode);

    while (commandQueue.length > 0) {
      execute(commandQueue.shift());
    }

    this.oldTree = newTree;
  };

  // trimWhiteSpaceInHtmlString: remove white space in html;
  function trimWhiteSpaceInHtmlString(htmlString) {
    var doc = document.createElement("div");
    doc.innerHTML = htmlString.replace(/^[ \t\n]+|[ \t\n]+$/g, "");

    (function trimRecursive(node) {
      if (node.nodeType === 3 && node.nodeValue.match(/^[ \t\n]+$/) && node.parentNode) {
        node.parentNode.removeChild(node);
      }
      var len = node.childNodes && node.childNodes.length || 0;
      for (var i = 0; i < len; i++) {
        if (node.childNodes[i]) { // maybe have been removed
          trimRecursive(node.childNodes[i]);
        }
      }
    }(doc));

    return doc.innerHTML;
  }

  function buildTreeFromHtmlString(htmlString) {
    var doc = document.createElement("div");
    doc.innerHTML = trimWhiteSpaceInHtmlString(htmlString);
    if (doc.childNodes.length > 1) {
      throw "DocCom: Multiple node found."
    }
    return (function mapOneNode(refTree) {
      var target = getVisualNode(refTree)
        , len = refTree && refTree.childNodes && refTree.childNodes.length || 0;
      for (var i = 0; i < len; i++) {
        target.vChildNodes[i] = mapOneNode(refTree.childNodes[i])
      }
      return target;
    }(doc.firstChild));
  }

  function getVisualNode(realNode) {

    if (!realNode) {
      return null;
    }

    var vAttributes = {}
      , len = realNode.attributes && realNode.attributes.length || 0;
    for (var i = 0; i < len; i++) {
      if (realNode.attributes[i] && realNode.attributes[i].specified) {
        vAttributes[realNode.attributes[i].nodeName] = realNode.attributes[i].nodeValue
      }
    }
    return {
      vNodeName: realNode.nodeName,
      vNodeValue: realNode.nodeValue,
      isTextNode: !isElement(realNode),
      vChildNodes: [],
      vAttributes: vAttributes,
      originalNode: realNode,
      isChildNodeOfTextarea: realNode.parentNode instanceof HTMLTextAreaElement
    }
  }

  function compareTree(oldTree, newTree, parentNodeInDom) {
    var cmdQueue = [];
    if (oldTree === null && newTree === null) {
      return cmdQueue;
    } else if (oldTree !== null && newTree === null) {
      if (!oldTree.isChildNodeOfTextarea) { // iE8 error
        cmdQueue.push({
          parentNode: oldTree.originalNode.parentNode,
          methodName: "removeChild",
          parameters: [oldTree.originalNode]
        })
      }
    } else if (oldTree === null && newTree !== null) {
      cmdQueue.push({
        parentNode: parentNodeInDom,
        methodName: "appendChild",
        parameters: [newTree.originalNode]
      })
    } else if (oldTree.isTextNode && newTree.isTextNode) {
      if (oldTree.vNodeValue !== newTree.vNodeValue
        && (!oldTree.isChildNodeOfTextarea && !newTree.isChildNodeOfTextarea)) {
        cmdQueue.push({
          parentNode: oldTree.originalNode.parentNode,
          methodName: "replaceChild",
          parameters: [newTree.originalNode, oldTree.originalNode]
        });
      } else {
        // 如果不替换节点，需要把旧的dom引用保存到newTree中
        newTree.originalNode = oldTree.originalNode;
      }
    } else if (oldTree.vNodeName !== newTree.vNodeName
      || (oldTree.isTextNode || newTree.isTextNode)
      || (oldTree.originalNode.type !== newTree.originalNode.type)) {
      cmdQueue.push({
        parentNode: oldTree.originalNode.parentNode,
        methodName: "replaceChild",
        parameters: [newTree.originalNode, oldTree.originalNode]
      });
    } else {
      cmdQueue.push.apply(cmdQueue, compareSpecialElement(newTree, oldTree));

      newTree.originalNode = oldTree.originalNode;

      Array.prototype.push.apply(cmdQueue, compareAttributes(newTree, oldTree));
      Array.prototype.push.apply(cmdQueue, compareChildNodes(newTree, oldTree));
    }
    return cmdQueue;
  }

  function compareSpecialElement(newNode, oldNode) {
    var cmdQueue = []
      , shouldSetValue = false
      , shouldSetPointer = false

      , selectionStart
      , selectionEnd;

    switch (newNode.vNodeName.toLowerCase()) {
      case "option":
        cmdQueue.push(
          {
            parentNode: oldNode.originalNode,
            setterName: "selected",
            parameters: newNode.originalNode.selected
          }
        );
        break;
      case "textarea":
        // shouldSetValue = true
        shouldSetValue = false;
        var pos = getCursorPos(oldNode.originalNode)
        if (pos !== -1) {
          shouldSetPointer = true;
          selectionStart = pos.start;
          selectionEnd = pos.end;
        }
        break;
      case "input":
        if (isCheckableHtmlElement(newNode.originalNode)) {
          cmdQueue.push(
            {
              parentNode: oldNode.originalNode,
              setterName: "checked",
              parameters: newNode.originalNode.checked
            }
          );
        } else {
          shouldSetValue = true;
        }

        var pos = getCursorPos(oldNode.originalNode)

        if (pos !== -1) {
          shouldSetPointer = true;
          selectionStart = pos.start;
          selectionEnd = pos.end;
        }
        break;
      default:
        break;
    }

    if (oldNode.originalNode !== oldNode.originalNode.ownerDocument.activeElement) {
      shouldSetPointer = false;
    }


    if (shouldSetValue) {
      cmdQueue.push(
        {
          parentNode: oldNode.originalNode,
          setterName: "value",
          parameters: newNode.originalNode.value
        }
      );
    }

    if (shouldSetPointer) {
      Array.prototype.push.apply(cmdQueue, setCursorPos(oldNode.originalNode, selectionStart, selectionEnd))
    }
    return cmdQueue;
  }

  function compareAttributes(newNode, oldNode) {
    var cmdQueue = []
      , newAttrName = null
      , oldAttrName = null;

    for (newAttrName in newNode.vAttributes) {
      if (Object.prototype.hasOwnProperty.call(newNode.vAttributes, newAttrName)) {
        Array.prototype.push.apply(cmdQueue, compareOneAttribute(newNode, oldNode, newAttrName));
      }
    }
    for (oldAttrName in oldNode.vAttributes) {
      if (Object.prototype.hasOwnProperty.call(oldNode.vAttributes, oldAttrName)
        && !Object.prototype.hasOwnProperty.call(newNode.vAttributes, oldAttrName)) {
        cmdQueue.push({
          parentNode: oldNode.originalNode,
          methodName: "removeAttribute",
          parameters: [oldAttrName]
        })
      }
    }
    return cmdQueue;
  }

  function compareOneAttribute(newNode, oldNode, attrName) {
    var cmdQueue = []
      , oldValue = oldNode.vAttributes[attrName]
      , newValue = newNode.vAttributes[attrName];
    switch (attrName) {
      case "class":
        var newClassName = parseClassName(oldNode.originalNode.className, newValue, oldValue);
        if (newClassName !== oldNode.originalNode.className) {
          cmdQueue.push({
            parentNode: oldNode.originalNode,
            methodName: "setAttribute",
            parameters: [attrName, newClassName]
          });
        }
        break;
      case "style":
        var newStyle = parseStyle(oldNode.originalNode.getAttribute("style"), newValue, oldValue);

        if (newStyle !== oldNode.originalNode.getAttribute("style")) {
          cmdQueue.push({
            parentNode: oldNode.originalNode,
            methodName: "setAttribute",
            parameters: [attrName, newStyle]
          });
        }
        break;
      default:
        if (oldValue !== newValue) {
          cmdQueue.push({
            parentNode: oldNode.originalNode,
            methodName: "setAttribute",
            parameters: [attrName, newValue]
          });
        }
        break;
    }
    return cmdQueue;
  }

  function compareChildNodes(newNode, oldNode) {
    var cmdQueue = [];

    var newChildList = newNode.vChildNodes || []
      , oldChildList = oldNode.vChildNodes || []
      , hasUniqueKey = oldChildList.length > 0 && oldChildList[0].vAttributes.hasOwnProperty("data-unique-key")
      , len = null;

    if (hasUniqueKey) {
      // sort first;
      Array.prototype.push.apply(cmdQueue, sortWithUniqueKey(newNode, oldNode));
      oldChildList = oldNode.vChildNodes
    }

    var rawParentNode = oldNode.originalNode;

    len = Math.max(newChildList.length, oldChildList.length);
    for (var i = 0; i < len; i++) {
      var newChild = newChildList[i] || null
        , oldChild = oldChildList[i] || null;

      Array.prototype.push.apply(cmdQueue, compareTree(oldChild, newChild, rawParentNode))
    }

    return cmdQueue;
  }

  function mapArray(arr, fn) {
    var len = arr.length
      , i = 0
      , res = [];
    for (i = 0; i < len; i++) {
      res.push(fn(arr[i]))
    }
    return res;
  }

  function getUniqueKey(x) {
    return x.vAttributes["data-unique-key"]
  }

  function findIndex(arr, fn) {
    var len = arr.length
      , i = 0;
    for (i = 0; i < len; i++) {
      if (fn(arr[i])) {
        return i;
      }
    }
    return -1;
  }

  function sortWithUniqueKey(newNode, oldNode) {
    var newList = newNode.vChildNodes
      , oldList = oldNode.vChildNodes
      , len = newList.length
      , res = []
      , cmdQueue = []

      , stringifiedNewKeys = JSON.stringify(mapArray(newList, getUniqueKey))
      , stringifiedOldKeys = JSON.stringify(mapArray(oldList, getUniqueKey))

    if (stringifiedNewKeys === stringifiedOldKeys) {
      return [];
    }

    for (var i = 0; i < len; i++) {
      var newChildNode = newList[i]
        , key = newChildNode.vAttributes["data-unique-key"]
        , oldChildNodeIdx = findIndex(oldList, function (node) {
          getUniqueKey(node) === key
        })
        , oldChildNode = oldChildNodeIdx === -1
          ? newChildNode
          : oldList.splice(oldChildNodeIdx, 1).pop();
      res.push(oldChildNode);

      cmdQueue.push.apply(cmdQueue, [{
        parentNode: oldNode.originalNode,
        methodName: "appendChild",
        parameters: [oldChildNode.originalNode]
      }])
    }
    while (oldList.length > 0) {
      var nodeToRemove = oldList.pop();
      cmdQueue.push({
        parentNode: nodeToRemove.originalNode.parentNode,
        methodName: "removeChild",
        parameters: [nodeToRemove.originalNode]
      });
    }
    // modify oldNode.vChildNodes
    oldNode.vChildNodes.length = 0;
    for (var i = 0, l = res.length; i < l; i++) {
      oldNode.vChildNodes[i] = res[i];
    }
    return cmdQueue;
  }

  function execute(cmd) {
    if (cmd.setterName) {
      cmd.parentNode[cmd.setterName] = cmd.parameters;
      return;
    }
    cmd.parentNode[cmd.methodName].apply(cmd.parentNode, cmd.parameters);
  }
  function isElement(node) {
    return node.nodeType === 1;
  }
  function isCheckableHtmlElement(node) {
    return (node.tagName && node.tagName.toUpperCase()) === "INPUT"
      && (node.type === "checkbox" || node.type === "radio")
  }
  function isInteger(value) {
    return typeof value === 'number' &&
      isFinite(value) &&
      Math.floor(value) === value;
  }
  function formatStringListBy(str, separator) {
    return (str || "").replace(/^\s+|\s+$/g, '').split(separator)
  }
  function removeDup(arr) {
    var arr = Array.prototype.slice.call(arr, 0)
      , len = arr.length
      , i = 0
      , his = {};
    for (i = 0; i < len; i++) {
      if (Object.prototype.hasOwnProperty.call(his, arr[i])) {
        arr.splice(i, 1);
        len--;
      } else {
        his[arr[i]] = true;
      }
    }
    return arr;
  }
  function arrayDiff(refList, list) {
    // find element in refList but not in list, name it with "-"
    var i = 0
      , j = 0
      , rlen = refList.length
      , llen = list.length
      , refElem = null
      , newElem
      , res = { "-": [], "+": [] }
      , found = false;

    for (i = 0; i < rlen; i++) {
      refElem = refList[i];
      found = false;
      for (j = 0; j < llen && !found; j++) {
        if (list[j] === refElem) {
          found = true;
        }
      }
      if (!found) {
        res["-"].push(refElem)
      }
    }

    for (j = 0; j < llen; j++) {
      newElem = list[j];
      found = false;
      for (i = 0; i < rlen && !found; i++) {
        if (refList[i] === newElem) {
          found = true;
        }
      }
      if (!found) {
        res["+"].push(newElem)
      }
    }

    return res;

  }
  function arrayMinus(big, small) {
    var big = Array.prototype.slice.call(big, 0)
      , bl = big.length
      , sl = small.length
      , i = 0
      , j = 0
      , found
      , node = null;
    for (i = 0; i < bl; i++) {
      node = big[i];
      found = false;
      for (j = 0; j < sl; j++) {
        if (small[j] === node) {
          big.splice(i, 1);
          bl--;
          i--;
        }
      }
    }
    return big;
  }
  function parseClassName(rawClass, newClass, oldClass) {
    var rc = formatStringListBy(rawClass, /\s+/g)
      , nc = formatStringListBy(newClass, /\s+/g)
      , oc = formatStringListBy(oldClass, /\s+/g)
      , diff = arrayDiff(oc, rc)
      , removed = diff["-"]
      , added = diff["+"]
      , newList = added.concat(nc)
      , newList = arrayMinus(newList, removed)
      , newList = removeDup(newList);
    return newList.join(" ")
  }

  function parseStyle(rawStyle, newStyle, oldStyle) {
    var rs = formatStringListBy(rawStyle, /\s*;\s*/g)
      , ns = formatStringListBy(newStyle, /\s*;\s*/g)
      , os = formatStringListBy(oldStyle, /\s*;\s*/g)
      , diff = arrayDiff(os, rs)
      , removed = diff["-"]
      , added = diff["+"]
      , newList = added.concat(ns)
      , newList = arrayMinus(newList, removed)
      , newList = removeDup(newList);
    return newList.join(";");
  }

  function getCursorPos(input) {
    if ("selectionStart" in input && document.activeElement == input) {
      return {
        start: input.selectionStart,
        end: input.selectionEnd
      };
    }
    else if (input.createTextRange && document.activeElement == input) {
      var sel = document.selection.createRange();
      if (sel.parentElement() === input) {
        var rng = input.createTextRange();
        rng.moveToBookmark(sel.getBookmark());
        for (var len = 0;
          rng.compareEndPoints("EndToStart", rng) > 0;
          rng.moveEnd("character", -1)) {
          len++;
        }
        rng.setEndPoint("StartToStart", input.createTextRange());
        for (var pos = { start: 0, end: len };
          rng.compareEndPoints("EndToStart", rng) > 0;
          rng.moveEnd("character", -1)) {
          pos.start++;
          pos.end++;
        }
        return pos;
      }
    }
    return -1;
  }

  function setCursorPos(input, start, end) {
    if (arguments.length < 3) end = start;
    if ("selectionStart" in input) {
      // input.selectionStart = start;
      // input.selectionEnd = end;
      return [
        {
          parentNode: input,
          setterName: "selectionStart",
          parameters: start
        },
        {
          parentNode: input,
          setterName: "selectionEnd",
          parameters: end
        }
      ]
    }
    else if (input.createTextRange) {
      var rng = input.createTextRange();
      // rng.moveStart("character", start);
      // rng.collapse();
      // rng.moveEnd("character", end - start);
      // rng.select();
      return [
        {
          parentNode: rng,
          methodName: "moveStart",
          parameters: ["character", start]
        },
        {
          parentNode: rng,
          methodName: "collapse",
          parameters: []
        },
        {
          parentNode: rng,
          methodName: "moveEnd",
          parameters: ["character", end - start]
        },
        {
          parentNode: rng,
          methodName: "select",
          parameters: []
        }
      ]
    }
  }

  return DocCom;
}());

export default DocCom;