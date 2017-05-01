const AlienResize = new (function () {
  // when mouse is hover the border of an element, dispatch alien-resize-before event, provide can-resize method
  // when mouse down, dispatch alien-resize-start event 
  // when mouse move, dispatch alien-resize event 
  // when mouse up, dispatch alien-resize-end event 
  const ERROR = 10;
  class AlienResize {
    constructor() {
      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.handleMouseDown = this.handleMouseDown.bind(this);
      this.handleMouseDownMove = this.handleMouseDownMove.bind(this);
      this.handleMouseUp = this.handleMouseUp.bind(this);

      this.startPoint = { x: null, y: null };
      this.resizeTarget = null;
      this.blockMouseDownHandler = false;
    }

    install() {
      document.addEventListener("mousemove", this.handleMouseMove);
    }

    uninstall() {
      document.removeEventListener("mousemove", this.handleMouseMove)
    }

    handleMouseMove(e) {
      if (this.blockMouseDownHandler) {
        return;
      }
      let { clientX, clientY } = e
        , { top, left, right, bottom } = e.target.getBoundingClientRect()
        , position = null // top, left, right, bottom 
        , canResize = false;

      if (clientY - top >= 0 && clientY - top <= ERROR) {
        position = "TOP";
      } else if (bottom - clientY >= 0 && bottom - clientY <= ERROR) {
        position = "BOTTOM";
      } else if (clientX - left >= 0 && clientX - left <= ERROR) {
        position = "LEFT";
      } else if (right - clientX >= 0 && right - clientX <= ERROR) {
        position = "RIGHT";
      }

      // clear up 
      if (this.resizeTarget) {
        document.removeEventListener("mousedown", this.handleMouseDown);
        this.resizeTarget.dispatchEvent(new CustomEvent("alien-resize-cancel", {
          bubbles: true,
          cancelable: true,
          detail: null
        }));
        this.resizeTarget = null;
      }

      if (position) {
        e.target.dispatchEvent(new CustomEvent("alien-resize-before", {
          bubbles: true,
          cancelable: true,
          detail: {
            canResize: () => canResize = true,
            position
          }
        }));
      }

      if (position && canResize) {
        document.addEventListener("mousedown", this.handleMouseDown);
        this.resizeTarget = e.target;
      }
    }

    handleMouseDown(e) {
      this.resizeTarget.dispatchEvent(new CustomEvent("alien-resize-start", {
        bubbles: true,
        cancelable: true,
        detail: null
      }));
      this.startPoint = {
        x: e.clientX,
        y: e.clientY
      };
      this.blockMouseDownHandler = true;
      document.addEventListener("mousemove", this.handleMouseDownMove);
      document.addEventListener("mouseup", this.handleMouseUp);
      document.addEventListener('selectstart', this.handleSelectStart);
      document.addEventListener("dragstart", this.handleDragStart)
    }

    handleSelectStart(e) {
      e.preventDefault();
    }
    handleDragStart(e) {
      e.preventDefault();
    }

    handleMouseDownMove(e) {
      e.preventDefault();
      this.resizeTarget.dispatchEvent(new CustomEvent("alien-resize", {
        bubbles: true,
        cancelable: true,
        detail: {
          offsetX: e.clientX - this.startPoint.x,
          offsetY: e.clientY - this.startPoint.y,
        }
      }));
    }

    handleMouseUp(e) {
      this.resizeTarget.dispatchEvent(new CustomEvent("alien-resize-end", {
        bubbles: true,
        cancelable: true,
        detail: null
      }));
      document.removeEventListener("mousemove", this.handleMouseDownMove);
      document.removeEventListener("mouseup", this.handleMouseUp);
      document.removeEventListener("mousedown", this.handleMouseDown);
      document.removeEventListener('selectstart', this.handleSelectStart);
      document.removeEventListener("dragstart", this.handleDragStart)
      this.startPoint = { x: null, y: null };
      this.resizeTarget = null;
      this.blockMouseDownHandler = false;
    }
  }

  return AlienResize;
}())

export default AlienResize;