import htmlTrim from './htmlTrim'

const DocDiff = function () {
  return class {
    constructor(mountPoint) {
      let html = htmlTrim(mountPoint.innerHTML)
        , tree = getTreeFromHtml(html);

      this.mountPoint = mountPoint;
      this.mountPoint.innerHTML = "";
      this.html = "";
      this.tree = getTreeFromHtml(this.html);
      this.tree.raw = this.mountPoint;
      this.update(html);
    }
    update(html) {
      html = htmlTrim(html);
      if (html === this.html) {
        return;
      }
      let tree = getTreeFromHtml(html);
      diff(this.tree, tree);
      this.tree = tree;
      this.html = html;
      this.tree.raw = this.mountPoint;
      return this;
    }
  };
  function getTreeFromHtml(html) {
    let div = document.createElement("div");
    div.innerHTML = html;
    return getNode(div);
  }
  function getNode(node) {
    let el = node;
    return {
      name: node.nodeName,
      value: node.nodeValue || "",
      type: node.nodeType === 1 ? "element" : node.nodeType === 3 ? "text" : "unknown",
      attributes: node.nodeType === 1 ? getAttributes(el) : {},
      children: getChildren(node),
      raw: node
    };
  }
  function getAttributes(el) {
    let attrs = el.attributes,
      length = attrs.length,
      res = {},
      i = 0;
    for (i = 0; i < length; i++) {
      res[attrs[i].nodeName] = attrs[i].nodeValue;
    }
    return res;
  }
  function getChildren(el) {
    let nodes = el.childNodes,
      length = nodes.length,
      res = [],
      i = 0;
    if (isTextarea(el)) {
      return [];
    }
    for (i = 0; i < nodes.length; i++) {
      res.push(getNode(nodes[i]));
    }
    return res;
  }
  function isTextarea(el) {
    return el instanceof HTMLTextAreaElement;
  }
  function shouldSetValue(el) {
    // text box whose content would be changed by non-script
    if (isTextarea(el)) {
      return true;
    }
    if (el instanceof HTMLInputElement) {
      switch (el.type) {
        case "radio":
        case "checkbox":
        case "button":
        case "file":
        case "image":
        case "reset":
        case "submit":
          return false;
        default:
          return true;
      }
    }
    return false;
  }
  function shouldSetCheckedState(el) {
    if (el instanceof HTMLInputElement) {
      switch (el.type) {
        case "radio":
        case "checkbox":
          return true;
        default:
          return false;
      }
    }
    return false;
  }
  function shouldSetPointer(el) {
    return shouldSetValue(el) && document.activeElement === el;
  }
  function shouldSetSelectedState(el) {
    return el instanceof HTMLOptionElement;
  }
  function shouldSortChildren(oldTree, newTree) {
    if (oldTree && newTree) {
      if (oldTree.children.length && newTree.children.length) {
        if (oldTree.children[0].attributes.hasOwnProperty("data-unique-key") && newTree.children[0].attributes.hasOwnProperty("data-unique-key")) {
          return true;
        }
      }
    }
    return false;
  }
  function shouldReplace(oldNode, newNode) {
    // 0. type is not eq
    if (oldNode.type !== newNode.type) {
      return true;
    }
    // 1. both text node but textContent is not the same 
    if (oldNode.type === "text" && newNode.type === "text" && oldNode.value !== newNode.value) {
      return true;
    }
    //2. both element node but nodeName is not the same 
    if (oldNode.type === "element" && newNode.type === "element" && oldNode.name !== newNode.name) {
      return true;
    }
    //3. both element node is `input` but type is not the same 
    if (oldNode.raw instanceof HTMLInputElement && newNode.raw instanceof HTMLInputElement && oldNode.raw.type !== newNode.raw.type) {
      return true;
    }
    return false;
  }
  function diff(oldTree, newTree) {
    // clean up the oldTree's children
    cleanArray(oldTree.children);
    let i = 0,
      length1 = oldTree.children.length,
      length2 = newTree.children.length,
      length = Math.max(length1, length2);
    if (shouldSortChildren(oldTree, newTree)) {
      sort(oldTree, newTree);
      length1 = oldTree.children.length;
      length2 = newTree.children.length;
      length = Math.max(length1, length2);
    } else {
      // fill with null or undefined;
      oldTree.children.length = length;
      newTree.children.length = length;
    }
    // console.log("the length is ", length);
    for (i = 0; i < length; i++) {
      diffOne(oldTree, newTree, i);
    }
  }
  function cleanArray(array) {
    let i = 0;
    for (i = 0; i < array.length; i++) {
      if (array[i] === null || array[i] === undefined) {
        // null or undefined
        array.splice(i, 1);
        i--;
      }
    }
  }
  function findNodeIndexByKey(nodeList, key) {
    let found = false,
      i = 0;
    for (i = 0; i < nodeList.length && !found; i++) {
      if (nodeList[i] && nodeList[i].attributes["data-unique-key"] === key) {
        found = true;
        return i;
      }
    }
    return null;
  }
  function sort(oldTree, newTree) {
    let oldList = oldTree.children,
      newList = newTree.children,
      oldNode = null,
      newNode = null,
      len = Math.max(oldList.length, newList.length),
      oldListIndex = null,
      i = 0,
      key = null;
    for (i = 0; i < len; i++) {
      newNode = newList[i];
      if (newNode) {
        key = newNode.attributes["data-unique-key"];
        oldListIndex = findNodeIndexByKey(oldList, key);
        // console.log("found: ", oldListIndex, oldList.length, key);
        if (oldListIndex === null) {
          // console.log("insert a placeholder: ", i);
          oldList.splice(i, 0, null);
        } else if (oldListIndex !== i) {
          // console.assert(oldList[i], "what kind of situation?");
          oldTree.raw.insertBefore(oldList[oldListIndex].raw, oldList[i].raw);
          let t = oldList.splice(oldListIndex, 1).pop();
          oldList.splice(i, 0, t);
        }
      } else {
        newList[i] = null;
      }
    }
    for (i = newList.length; i < oldList.length; i++) {
      newList[i] = null; // fill with null;
    }
  }
  function diffOne(oldTree, newTree, index) {
    let oldNode = oldTree.children[index] || null,
      newNode = newTree.children[index] || null;
    // console.log("consume: ", oldNode, newNode);
    if (oldNode === null && newNode === null) {
      return;
    }
    if (oldNode !== null && newNode === null) {
      // remove the oldNode from dom and oldTree;
      // console.log("remove: ", oldNode.raw);
      removeNode(oldNode, index, oldTree);
      return;
    }
    if (oldNode === null && newNode !== null) {
      // insert the newNode to right place
      // console.log("insert: ", newNode.raw);
      insertNode(oldTree, newNode, index);
      return;
    }
    if (oldNode && newNode && shouldReplace(oldNode, newNode)) {
      // replace the oldNode with newNode
      // console.log("replace: ", oldNode.raw, newNode.raw);
      replaceNode(oldTree, newTree, index);
      return;
    }
    // merge node
    if (oldNode && newNode) {
      mergeNode(oldNode, newNode);
    }
    return;
  }
  function removeNode(node, index, parent) {
    if (parent.raw) {
      parent.raw.removeChild(node.raw);
    }
    // parent.children.splice(index, 1, null);
    delete parent.children[index];
  }
  function insertNode(parent, toBeInsert, index) {
    let theNodeToBeInserted = toBeInsert,
      preSibling = parent.children[index - 1];
    if (parent.raw) {
      if (index > 0) {
        parent.raw.insertBefore(toBeInsert.raw, preSibling.raw.nextSibling);
      } else {
        parent.raw.insertBefore(toBeInsert.raw, parent.raw.firstChild);
      }
    }
    console.assert(!parent.children[index], "insert: should be null: ");
    // parent.children.splice(index, 1, theNodeToBeInserted)
    parent.children[index] = theNodeToBeInserted;
  }
  function replaceNode(oldTree, newTree, index) {
    oldTree.raw.replaceChild(newTree.children[index].raw, oldTree.children[index].raw);
    oldTree.children[index] = newTree.children[index];
  }
  function mergeNode(oldNode, newNode) {
    let oldElement = oldNode.raw;
    let newElement = newNode.raw;
    if (shouldSetSelectedState(oldElement)) {
      oldElement.selected = newElement.selected;
    }
    if (shouldSetCheckedState(oldElement)) {
      oldElement.checked = newElement.checked;
    }
    let pointer = { start: 0, end: 0 };
    if (shouldSetValue(oldElement)) {
      if (shouldSetPointer(oldElement)) {
        pointer = storePointer(oldElement);
      }
      setValue(oldElement, newElement);
      if (shouldSetPointer(oldElement)) {
        reStorePointer(oldElement, pointer);
      }
    }
    // diff attributes
    diffAttributes(oldNode, newNode);
    // diff child 
    diff(oldNode, newNode);
    // store the dom reference if keep the old `raw`
    newNode.raw = oldNode.raw;
  }
  function diffAttributes(oldNode, newNode) {
    let name;
    for (name in newNode.attributes) {
      if (newNode.attributes.hasOwnProperty(name)) {
        diffOneAttribute(oldNode, newNode, name);
      }
    }
    for (name in oldNode.attributes) {
      if (oldNode.attributes.hasOwnProperty(name) && !newNode.attributes.hasOwnProperty(name)) {
        oldNode.raw.removeAttribute(name);
      }
    }
  }
  function diffOneAttribute(oldNode, newNode, name) {
    let oldValue = oldNode.attributes[name],
      newValue = newNode.attributes[name];
    switch (name) {
      case "className": // ?
      case "class":
        newValue = parseClassName(oldNode.raw.getAttribute(name), oldValue, newValue);
        break;
      case "style":
        newValue = parseStyle(oldNode.raw.getAttribute(name), oldValue, newValue);
        break;
    }
    if (oldValue !== newValue) {
      oldNode.raw.setAttribute(name, newValue);
    }
  }
  function formatStringListBy(str, separator) {
    return (str || "").replace(/^\s+|\s+$|\s(?=\s)/g, "").split(separator);
  }
  function removeDup(arr) {
    var arr = Array.prototype.slice.call(arr, 0),
      len = arr.length,
      i = 0,
      his = {};
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
    var i = 0,
      j = 0,
      rlen = refList.length,
      llen = list.length,
      refElem = null,
      newElem,
      res = { "-": [], "+": [] },
      found = false;
    for (i = 0; i < rlen; i++) {
      refElem = refList[i];
      found = false;
      for (j = 0; j < llen && !found; j++) {
        if (list[j] === refElem) {
          found = true;
        }
      }
      if (!found) {
        res["-"].push(refElem);
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
        res["+"].push(newElem);
      }
    }
    return res;
  }
  function arrayMinus(big, small) {
    var big = Array.prototype.slice.call(big, 0),
      bl = big.length,
      sl = small.length,
      i = 0,
      j = 0,
      found,
      node = null;
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
  function parseClassName(rawClass, oldClass, newClass) {
    var rc = formatStringListBy(rawClass, /\s+/g),
      nc = formatStringListBy(newClass, /\s+/g),
      oc = formatStringListBy(oldClass, /\s+/g),
      diff = arrayDiff(oc, rc),
      removed = diff["-"],
      added = diff["+"],
      newList = added.concat(nc),
      newList = arrayMinus(newList, removed),
      newList = removeDup(newList);
    return newList.join(" ");
  }
  function parseStyle(rawStyle, oldStyle, newStyle) {
    var rs = formatStringListBy(rawStyle, /\s*;\s*/g),
      ns = formatStringListBy(newStyle, /\s*;\s*/g),
      os = formatStringListBy(oldStyle, /\s*;\s*/g),
      diff = arrayDiff(os, rs),
      removed = diff["-"],
      added = diff["+"],
      newList = added.concat(ns),
      newList = arrayMinus(newList, removed),
      newList = removeDup(newList);
    return newList.join(";");
  }
  function storePointer(el) {
    let pointer = {
      start: 0,
      end: 0
    };
    if ("selectionStart" in el && document.activeElement == el) {
      return {
        start: el.selectionStart,
        end: el.selectionEnd
      };
    } else if (el.createTextRange && document.activeElement == el) {
      var sel = document.selection.createRange();
      if (sel.parentElement() === el) {
        var rng = el.createTextRange();
        rng.moveToBookmark(sel.getBookmark());
        for (var len = 0; rng.compareEndPoints("EndToStart", rng) > 0; rng.moveEnd("character", -1)) {
          len++;
        }
        rng.setEndPoint("StartToStart", el.createTextRange());
        for (pointer = { start: 0, end: len }; rng.compareEndPoints("EndToStart", rng) > 0; rng.moveEnd("character", -1)) {
          pointer.start++;
          pointer.end++;
        }
        return pointer;
      }
    }
    return pointer;
  }
  function setValue(target, source) {
    target.value = source.value;
  }
  function reStorePointer(el, { start, end }) {
    el = el;
    if ("selectionStart" in el) {
      el.selectionStart = start;
      el.selectionEnd = end;
    } else if (el.createTextRange) {
      let rng = el.createTextRange();
      rng.moveStart("character", start);
      rng.collapse();
      rng.moveEnd("character", end - start);
      rng.select();
    }
  }
}();

export default DocDiff;