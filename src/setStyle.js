function setStyle(el, style) {
  let text = el.style.cssText
    , rcss = parse(text)
    , mcss = {...rcss, ...style}
    
  el.style.cssText = stringify(mcss);
}

function parse(text) {
  let css = {}
    , list = text.split(/\s*;\s*/g)
    , i;

  for (i = 0; i < list.length; i++) {
    let [name, value] = list[i].split(/\s*:\s*/g);
    css[name] = value;
  }
  return css;
}

function stringify(css) {
  let text = ""
    , name;
  for (name in css) {
    if (css.hasOwnProperty(name)) {
      text += `${name}:${css[name]};`
    }
  }
  return text;
}


export default setStyle;