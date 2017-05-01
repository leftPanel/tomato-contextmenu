function hasClass(el, className) {
  if (el.nodeType !== 1) {
    return false;
  }

  if (el.classList) {
    return el.classList.contains(className);
  }

  let list = el.className.split(/\s+/)
    , i;

  for (i = 0; i < list.length; i++) {
    if (list[i] === className) {
      return true;
    }
  }
  return false;
}

export default hasClass;