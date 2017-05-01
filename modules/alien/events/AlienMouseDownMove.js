const AlienMouseDownMove = new (function () {
  const TIME = 20
  , DECREASE = .9;

  class AlienMouseDownMove {
    constructor() {
      // bind event listener
      this.handleMouseDown = this.handleMouseDown.bind(this);
      this.handleSelectStart = this.handleSelectStart.bind(this);
      this.handleDragStart = this.handleDragStart.bind(this);
      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.handleMouseUp = this.handleMouseUp.bind(this);

      // some data shared by listeners
      this.lastPoint = { x: null, y: null }; // mouse move;
      this.lastOffset = { x: null, y: null };
      this.mouseDownMoveTarget = null;
      this.timeoutHandler = null;
    }

    install() {
      document.addEventListener("mousedown", this.handleMouseDown)
    }

    uninstall() {
      document.removeEventListener("mousedown", this.handleMouseDown)
    }

    handleMouseDown(e) {
      // important!
      clearTimeout(this.timeoutHandler)

      let canMouseDownMove = false;
      e.target.dispatchEvent(new CustomEvent("alien-mousedownmovestart", {
        bubbles: true,
        cancelable: true,
        detail: {
          canMouseDownMove: () => canMouseDownMove = true
        }
      }));
      if (!canMouseDownMove) {
        return;
      }
      this.mouseDownMoveTarget = e.target;
      this.lastPoint = {
        x: e.clientX,
        y: e.clientY
      }
      document.addEventListener("mousemove", this.handleMouseMove);
      document.addEventListener("mouseup", this.handleMouseUp);
      document.addEventListener('selectstart', this.handleSelectStart);
      document.addEventListener("dragstart", this.handleDragStart)
    }

    handleMouseMove(e) {
      e.preventDefault();
      this.lastOffset = {
        x: e.clientX - this.lastPoint.x,
        y: e.clientY - this.lastPoint.y
      };
      this.lastPoint = {
        x: e.clientX,
        y: e.clientY
      }
      clearTimeout(this.timeoutHandler);
      this.dispatchOneEvent(this.lastOffset.x, this.lastOffset.y)
      this.timeoutHandler = setTimeout(() => {
        this.lastOffset = { x: 0, y: 0 };
        this.timeoutHandler = null;
      }, TIME);
    }

    handleMouseUp(e) {
      clearTimeout(this.timeoutHandler);
      this.timeoutHandler = null;
      // to make the auto-scroll more sensitive, enlarge it fist;
      this.lastOffset = {
        x: this.lastOffset.x * 3,
        y: this.lastOffset.y * 3
      }
      this.repeatDispatchEvent();
      document.removeEventListener("mousemove", this.handleMouseMove);
      document.removeEventListener("mouseup", this.handleMouseUp);
      document.removeEventListener('selectstart', this.handleSelectStart);
      document.removeEventListener("dragstart", this.handleDragStart)
    }

    repeatDispatchEvent() {
      // auto dispatch after mouse up 
      let lastOffset = this.lastOffset
        , { x, y } = lastOffset;

      if (Math.abs(x) > 1 || Math.abs(y) > 1) {
        this.dispatchOneEvent(x *= DECREASE, y *= DECREASE);

        this.lastOffset = { x, y };

        this.timeoutHandler = setTimeout(() => {
          this.repeatDispatchEvent()
        }, TIME); 
      } else {
        // clear it 
        this.lastPoint = { x: null, y: null }; // mouse move;
        this.lastOffset = { x: null, y: null };
        this.mouseDownMoveTarget = null;
        this.timeoutHandler = null;
      }
    }

    dispatchOneEvent(x, y) {
      if (!this.mouseDownMoveTarget) {
        return;
      }
      this.mouseDownMoveTarget.dispatchEvent(new CustomEvent("alien-mousedownmove", {
        bubbles: true,
        cancelable: true,
        detail: {
          offsetX: x,
          offsetY: y
        }
      }));
    }

    handleSelectStart(e) {
      e.preventDefault();
    }

    handleDragStart(e) {
      e.preventDefault();
    }
  }

  return AlienMouseDownMove;
}());

export default AlienMouseDownMove;