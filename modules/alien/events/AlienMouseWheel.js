const AlienMouseWheel = new (function () {
  return class {
    constructor() {
      this.handleMouseWheel = this.handleMouseWheel.bind(this);
      this.handleDOMMouseScroll = this.handleDOMMouseScroll.bind(this);
    }

    install() {
      document.addEventListener("mousewheel", this.handleMouseWheel);
      document.addEventListener("DOMMouseScroll", this.handleDOMMouseScroll);
    }

    uninstall() {
      document.removeEventListener("mousewheel", this.handleMouseWheel);
      document.removeEventListener("DOMMouseScroll", this.handleDOMMouseScroll);
    }

    handleMouseWheel(e) {
      e.target.dispatchEvent(new CustomEvent("alien-mousewheel", {
        bubbles: true,
        cancelable: true,
        detail: {
          originalEvent: e
        }
      }));
    }

    handleDOMMouseScroll(e) {
      e.target.dispatchEvent(new CustomEvent("alien-mousewheel", {
        bubbles: true,
        cancelable: true,
        detail: {
          originalEvent: e
        }
      }));
    }
  }
}());

export default AlienMouseWheel