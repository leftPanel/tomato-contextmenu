const AlienMouseDown = (function () {
  // auto repeat mousedown event when hold the mouse
  const StartDelay = 500
    , RepeatDelay = 20;

  class AlienMouseDown {
    constructor() {
      this.handleMouseDown = this.handleMouseDown.bind(this);
      this.handleMouseUp = this.handleMouseUp.bind(this);
      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.timeoutHandler = null;
      this.withCtrl = false;
      this.withShift = false;
    }

    install() {
      document.addEventListener("mousedown", this.handleMouseDown);
    }

    uninstall() {
      document.removeEventListener("mousedown", this.handleMouseDown);
    }

    handleMouseDown(e) {
      let target = e.target
        , loop = () => {
          this.fireEvent(target);
          this.timeoutHandler = setTimeout(loop, RepeatDelay)
        };

      this.withCtrl = e.ctrlKey;
      this.withShift = e.shiftKey;

      this.fireEvent(target);
      clearTimeout(this.timeoutHandler)
      this.timeoutHandler = setTimeout(loop, StartDelay);
      document.addEventListener("mouseup", this.handleMouseUp);
      document.addEventListener("mousemove", this.handleMouseMove);
    }

    handleMouseUp(e) {
      document.removeEventListener("mouseup", this.handleMouseUp);
      document.removeEventListener("mousemove", this.handleMouseMove);
      clearTimeout(this.timeoutHandler);
      this.withCtrl = false;
      this.withShift = false;
    }

    handleMouseMove(e) {
      document.removeEventListener("mouseup", this.handleMouseUp);
      document.removeEventListener("mousemove", this.handleMouseMove);
      clearTimeout(this.timeoutHandler);
      this.withCtrl = false;
      this.withShift = false;
    }

    fireEvent(target) {
      target.dispatchEvent(new CustomEvent("alien-mousedown", {
        bubbles: true,
        cancelable: true,
        detail: {
          withCtrl: this.withCtrl,
          withShift: this.withShift
        }
      }));
    }
  }

  return new AlienMouseDown;
}())

export default AlienMouseDown;