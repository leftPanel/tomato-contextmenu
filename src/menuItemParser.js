import tomato from './tomato'

const menuItemParser = ({ kind, text, disabled, active, callbackId, children }) => {
  let dataHasChildren = children ? "data-has-children" : "";
  switch (kind) {
    case "separator":
      return `<li class="divider" style="margin:3px 0;"></li>`;
    default:
      return `<li tabindex="0" class="${disabled && "disabled"} ${active && "active"}" data-callback-id="${callbackId}" style="position:relative;" ${dataHasChildren}>
        <a tabindex="-1" href="javascript:void(0);" style="outline:0;">${text}</a>
        ${children ? `<span class="glyphicon glyphicon-menu-right" style="position: absolute; top: 7px;right:2px;"></span>` : ""}
        ${children ? `<ul  class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu" style="position:absolute;left:auto;top:0;right:100%;display:none;margin:0;padding:3px 0;">${tomato.map(children, menuItemParser).join("")}</ul>` : ""}
      </li>`
  }
};

export default menuItemParser;