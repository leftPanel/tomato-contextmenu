function addClass(el, className) {
  if (el.nodeType === 1) {
    if (el.classList) {
      el.classList.add(className);
      return;
    }
    el.className += ` ${className} `
  }
}

export default addClass;