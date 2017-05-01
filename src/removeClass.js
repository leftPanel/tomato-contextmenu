function removeClass(el, className) {
  if (el.nodeType === 1) {

    if (el.classList) {
      el.classList.remove(className);
      return;
    }

    let list = el.className.split(/\s+/)
      , i, nl = [];

    for (i = 0; i < list.length; i++) {
      if (list[i] !== className) {
        nl.push(list[i]);
      }
    }
    el.className = nl.join(" ");
  }
}

export default removeClass;