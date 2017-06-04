define([], function() {

	function Array2d(rows, cols, value) {
		var rows = rows;
		var cols = cols;

		var cells = [];
		for (var x = 0; x < rows; ++x) {
			cells.push([]);
			for (var y = 0; y < cols; ++y) {
				cells[x].push(typeof(value) === "undefined" ? 0.0 : value);
			};
		};

		this.get = function(x, y) {
			if (x < 0 || x >= rows || y < 0 || y >= cols) throw "Array2d: index out of bounds";
			return cells[x][y];
		};

		this.set = function(x, y, value) {
			if (x < 0 || x >= rows || y < 0 || y >= cols) throw "Array2d: index out of bounds";
			cells[x][y] = value;
		};

		this.getRows = function() { return rows; };
		this.getCols = function() { return cols; };

		this.getCells = function() { return cells; };

		this.print = function() {
			for (var y = 0; y < cols; ++y) {
				console.log(cells[y].join(" "));
			}
		};

		this.clone = function() {
			var clone = new Array2d(rows, cols, value);

			for (var x = 0; x < rows; ++x) {
				for (var y = 0; y < cols; ++y) {
					clone.set(x, y, cells[x][y]);
				};
			};

			return clone;
		};

		/**
		 * Applies a function callback on each of the array elements.
		 * fun is called with three arguments: (value, x, y)
		 */
		this.forEach = function(fun) {
			for (var x = 0; x < rows; ++x) {
				for (var y = 0; y < cols; ++y) {
					fun(cells[x][y], x, y);
				};
			};
		};


		this.deleteRow = function(row) {
			cells.splice(row, 1);
			--rows;
		};


		this.addRow = function(row, value) {
			cells.splice(row, 0, []);
			for (var y = 0; y < cols; ++y) {
				cells[row].push(typeof(value) === "undefined" ? 0.0 : value);
			};
			++rows;
		};


		/*this.deleteColumn = function(col) {
			for (var x = 0; x < rows; ++x) {
				cells[x].splice(col, 1);
			};
			--height;
		};*/

	};

	return {
		Array2d: Array2d
	};
});
