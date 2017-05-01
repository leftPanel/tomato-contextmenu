const AlienHover = new (function () {
  return class {
    constructor() {
      this.handleMouseOver = this.handleMouseOver.bind(this);
      this.handleMouseLeaveOnScope = this.handleMouseLeaveOnScope.bind(this);
      this.hoverScope = null;
    }

    install() {
      document.addEventListener("mouseover", this.handleMouseOver)
    }

    uninstall() {
      document.removeEventListener("mouseover", this.handleMouseOver)
    }

    handleMouseOver(e) {
      e.target.dispatchEvent(new CustomEvent("alien-hover", {
        bubbles: true,
        cancelable: true,
        detail: {
          setHoverScope: node => this.hoverScope = node
        }
      }));

      if (!this.hoverScope) {
        this.hoverScope = e.target;
      }

      this.hoverScope.addEventListener("mouseleave", this.handleMouseLeaveOnScope)
    }

    handleMouseLeaveOnScope(e) {
      e.target.dispatchEvent(new CustomEvent("alien-unhover", {
        bubbles: true,
        cancelable: true,
        detail: null
      }));
      this.hoverScope.removeEventListener("mouseleave", this.handleMouseLeaveOnScope)
    }
  }
}());

export default AlienHover;