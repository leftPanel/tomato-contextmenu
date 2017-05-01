function getClosestLiElement(el) {
  if (el.closest) {
    return el.closest("li");
  }
  let e = null;
  for (e = el; e; e = e.parentNode) {
    if (e.tagName && e.tagName.toUpperCase() === "LI") {
      return e;
    }
  }
  return null;
}

export default getClosestLiElement;