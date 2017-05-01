const Text = (function () {

  const wrapperStyle = "position:relative";

  const textAreaStyle = "position:absolute;width:100%;height:100%;resize:none;overflow:hidden;top:0;left:0;right:0;bottom:0;font-size:14px;box-sizing:border-box;";

  const backBoneStyle = "padding:6px 12px;margin: 0;font-family:inherit;white-space: pre-wrap;word-wrap: break-word;font-size:14px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;"

  function safe(str) {
    if (str === undefined || str === "" || str.trim() === "") {
      return "&nbsp;"
    }
    return escapeHtml(str.replace(/\n/g, "<br/>&nbsp;"));
  }

  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
      return entityMap[s];
    });
  }

  function Text(attrs) {
    attrs = { ...attrs, ...{ "style": textAreaStyle } };
    let serializeAttributes = Object.keys(attrs).map(k => `${k}="${attrs[k]}"`).join(" ")
    return `
      <div style="${wrapperStyle}">
        <textarea ${serializeAttributes}>${attrs.value}</textarea>
        <div style="${backBoneStyle}">${safe(attrs.value)}</div>
      </div>
    `
  }

  return Text;
}());

export default Text;