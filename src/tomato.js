class Tomato {
  map(list, fn) {
    var l, i, res;
    for (l = list.length, i = 0, res = []; i < l; i++) {
      res.push(fn(list[i], i, list));
    }

    return res;
  }

  each(list, fn) {
    var l, i, li = list;
    for (l = li.length, i = 0; i < l; i++) {
      fn(li[i], i, li);
    }
  }

  consume(list, fn) {
    while (list.length) {
      fn(list.shift());
    }
  }

  findRight(list, fn) {
    let i;
    for (i = list.length - 1; i >= 0; i--) {
      if (fn(list[i], i, list)) {
        return list[i];
      }
    }
    return null;
  }

  closest(el, sel) {
    if (el.closest) {
      return el.closest(sel);
    }
    let e;
    for (e = el; e; e = e.parentNode) {
      if (this.matches(e, sel)) {
        return e;
      }
    }
    return null;
  }

  matches(el, sel) {
    let useRaw, res;
    this.each(
      ["matches", "matchesSelector", "msMatchesSelector", "oMatchesSelector", "webkitMatchesSelector"],
      function (fn) {
        if (el[fn]) {
          useRaw = true;
          res = el[fn](sel);
        }
      }
    );

    if (useRaw) {
      return res;
    }

    var els = (el.parentNode || el.ownerDocument || document).querySelectorAll(sel),
      i = els.length;
    while (--i >= 0 && els.item(i) !== el) { }
    return i > -1;
  }

  prev(el, sel) {
    let e;
    for (e = el.previousSibling; e; e = e.previousSibling) {
      if (e.nodeType === 1 && sel(e)) {
        return e;
      }
    }
    return null;
  }

  next(el, sel) {
    let e;
    for (e = el.nextSibling; e; e = e.nextSibling) {
      if (e.nodeType === 1 && sel(e)) {
        return e;
      }
    }
    return null;
  }

  lastChild(el, sel) {
    let e;

    for (e = el.lastChild; e; e = e.previousSibling) {
      if (e.nodeType === 1 && sel(e)) {
        return e;
      }
    }
    return null;
  }

  firstChild(el, sel) {
    let e;

    for (e = el.firstChild; e; e = e.nextSibling) {
      if (e.nodeType === 1 && sel(e)) {
        return e;
      }
    }
    return null;
  }
}

const tomato = new Tomato;

export default tomato;