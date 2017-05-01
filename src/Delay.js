class Delay {
  constructor(job, delay) {
    this.done = false;
    this.job = job;
    this.cancelHanler = setTimeout(() => {
      job();
      this.done = true;
      this.job = null;
    }, delay)
  }

  skip() {
    if (!this.done) {
      this.job();
    }
  }

  cancel() {
    clearTimeout(this.cancelHanler);
  }
}

export default Delay;