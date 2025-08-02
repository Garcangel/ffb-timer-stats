export class Half {
  constructor() {
    this.drives = [];
  }

  toJSON() {
    return {
      drives: this.drives.map((drive) =>
        typeof drive.toJSON === 'function' ? drive.toJSON() : drive,
      ),
    };
  }
}
