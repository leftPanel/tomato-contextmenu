function getDomNodefromHtml(html) {
  var div = document.createElement('div')
  , i;
  div.innerHTML = html;

  for (i = 0; i < div.childNodes.length; i ++) {
    if (div.childNodes[i].nodeType === 1) {
      return div.childNodes[i];
    }
  }
  return null;
}

export default getDomNodefromHtml;