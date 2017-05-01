// import polyfill from './polyfill'

import AlienDragAndDrop from './events/AlienDragAndDrop';
import AlienMouseDown from './events/AlienMouseDown';
import AlienResize from './events/AlienResize';
import AlienSelect from './events/AlienSelect';
import AlienChange from './events/AlienChange';
import AlienMouseDownMove from './events/AlienMouseDownMove';
import AlienMouseWheel from './events/AlienMouseWheel';
import AlienHover from './events/AlienHover';

const Alien = new (function () {
  return class {

    constructor() {
      this.events = {
        "dragAndDrop": AlienDragAndDrop,
        "mousedown": AlienMouseDown,
        "resize": AlienResize,
        "select": AlienSelect,
        "change": AlienChange,
        "mousedownmove": AlienMouseDownMove,
        "mousewheel": AlienMouseWheel,
        "hover": AlienHover
      }
    }

    install(typesOrType) {
      if (typeof typesOrType === "undefined") {
        for (let type in this.events) {
          if (Object.prototype.hasOwnProperty.call(this.events, type)) {
            this.events[type].install();
          }
        }
        return;
      }
      if (typeof typesOrType === "string") {
        typesOrType = [typesOrType];
      }
      for (let i = 0; i < typesOrType.length; i++) {
        this.events[typesOrType[i]].install();
      }
    }

    uninstall(typesOrTypeOrNothing) {
      if (typeof typesOrTypeOrNothing === "undefined") {
        for (let type in this.events) {
          if (Object.prototype.hasOwnProperty.call(this.events, type)) {
            this.events[type].uninstall();
          }
        }
        return;
      }
      if (typeof typesOrTypeOrNothing === "string") {
        typesOrTypeOrNothing = [typesOrTypeOrNothing];
      }
      for (let i = 0; i < typesOrTypeOrNothing.length; i++) {
        this.events[typesOrTypeOrNothing[i]].uninstall();
      }
    }
  }
}());

export default Alien;