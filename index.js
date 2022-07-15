const selectDirections = {
  none: -1,
  left: 1,
  right: 2,
};

exports.decorateTerm = (Term, { React }) => {
  return class extends React.Component {
    constructor(props, context) {
      super(props, context);
      this.cursor = {
        col: 0,
        row: 0,
      };
      this.selection = {
        direction: selectDirections.none,
        start: 0,
        end: 0,
      };
      this.onData = this.onData.bind(this);
      this.onCursorMove = this.onCursorMove.bind(this);
    }

    onData(raw) {
      let data = raw;
      switch (raw) {
        // Consume shift([1;2) not to print.
        // shift+left
        case '\u001b[1;2D':
        // shift+right
        case '\u001b[1;2C':
          data = data.replace('[1;2', '[');
          break;
      }

      if (this.props.onData) {
        this.props.onData(data);
      }

      const term = this.props.term;
      if (!term) {
        this.resetSelection();
        return;
      }

      let { start, end } = this.selection;
      switch (raw) {
        // shift+left
        case '\u001b[1;2D':
          if (!this.hasSelection()) {
            this.selection.direction = selectDirections.left;
            start = this.cursor.col - 1;
            end = this.cursor.col;

            break;
          }

          if (this.selection.direction == selectDirections.left) {
            start--;
          } else {
            end--;
          }

          break;
        // shift+right
        case '\u001b[1;2C':
          if (!this.hasSelection()) {
            this.selection.direction = selectDirections.right;
            start = this.cursor.col;
            end = this.cursor.col + 1;

            break;
          }

          if (this.selection.direction == selectDirections.left) {
            start++;
          } else {
            end++;
          }

          break;
        default:
          this.resetSelection();
          return;
      }


      this.selection.start = Math.min(start, end);
      this.selection.end = Math.max(start, end);
      term.select(this.selection.start, this.cursor.row, this.selection.end - this.selection.start);

      if (this.selection.start == this.selection.end) {
        this.resetSelection();
      }
    }

    hasSelection() {
      return this.selection.start != this.selection.end;
    }

    resetSelection() {
      this.selection.direction = -1;
      this.selection.start = 0;
      this.selection.end = 0;
    }

    onCursorMove(cursorFrame) {
      if (this.props.onCursorMove) {
        this.props.onCursorMove(cursorFrame);
      }

      this.cursor.col = cursorFrame.col;
      this.cursor.row = cursorFrame.row;
    }

    render() {
      return React.createElement(
        Term,
        Object.assign({}, this.props, {
          onData: this.onData,
          onCursorMove: this.onCursorMove,
        })
      );
    }
  }
}
