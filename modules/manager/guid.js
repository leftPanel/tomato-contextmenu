const guid = (function () {

  let guidLib = {};

  function guid(prefix = "guid", connector = "-") {
    if (typeof guidLib[prefix] !== "number") {
      guidLib[prefix] = 0;
    } else {
      guidLib[prefix]++;
    }

    return `${prefix}${connector}${guidLib[prefix]}`
  }

  return guid;
}());

export default guid;