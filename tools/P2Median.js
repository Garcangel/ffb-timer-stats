export class P2Median {
  constructor() {
    // five markers: min (q0), q1 (0.25), q2 (0.5), q3 (0.75), max (q4)
    this.n = 0;
    this.q = []; // marker heights
    this.np = [0, 0.25, 0.5, 0.75, 1]; // desired quantiles
    this.ni = [0, 0, 0, 0, 0]; // marker positions
    this.di = [0, 0.25, 0.5, 0.75, 1]; // desired positions (as multiples of count-1)
  }
  update(x) {
    if (this.n < 5) {
      this.q.push(x);
      this.n++;
      if (this.n === 5) {
        this.q.sort((a, b) => a - b);
        this.ni = [0, 1, 2, 3, 4];
      }
      return;
    }
    // locate cell k
    let k =
      x < this.q[0] ? 0
      : x >= this.q[4] ? 3
      : x < this.q[1] ? 0
      : x < this.q[2] ? 1
      : x < this.q[3] ? 2
      : 3;
    if (x < this.q[0]) this.q[0] = x;
    if (x > this.q[4]) this.q[4] = x;

    // increment positions
    for (let i = k + 1; i < 5; i++) this.ni[i] += 1;
    // desired positions shift by targets
    for (let i = 0; i < 5; i++) this.di[i] += this.np[i];

    // adjust interior markers 1..3
    for (let i = 1; i <= 3; i++) {
      const d = this.di[i] - this.ni[i];
      if (
        (d >= 1 && this.ni[i + 1] - this.ni[i] > 1) ||
        (d <= -1 && this.ni[i - 1] - this.ni[i] < -1)
      ) {
        const s = Math.sign(d);
        // parabolic prediction
        const qi =
          this.q[i] +
          (s / (this.ni[i + 1] - this.ni[i - 1])) *
            (((this.ni[i] - this.ni[i - 1] + s) * (this.q[i + 1] - this.q[i])) /
              (this.ni[i + 1] - this.ni[i]) +
              ((this.ni[i + 1] - this.ni[i] - s) *
                (this.q[i] - this.q[i - 1])) /
                (this.ni[i] - this.ni[0 < i - 1 ? i - 1 : i - 1]));
        // if prediction not monotone, use linear
        if (!(this.q[i - 1] < qi && qi < this.q[i + 1])) {
          const lin =
            this.q[i] +
            (s * (this.q[i + s] - this.q[i])) / (this.ni[i + s] - this.ni[i]);
          this.q[i] = lin;
        } else {
          this.q[i] = qi;
        }
        this.ni[i] += s;
      }
    }
    this.n++;
  }
  get() {
    if (this.n === 0) return 0;
    if (this.n < 5) {
      const a = [...this.q].sort((x, y) => x - y);
      const m = a.length;
      return m % 2 ? a[(m - 1) / 2] : (a[m / 2 - 1] + a[m / 2]) / 2;
    }
    return this.q[2]; // median marker
  }
}
