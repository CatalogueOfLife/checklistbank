export const parse = function(lines, marker) {
	var populatefn = populatefn || function(obj) { return obj;};
	var marker = ' ';

	function addHiddenProperties(scope, props) {
		for (let p in props) {
            try {
                Object.defineProperty(scope, p, {enumerable: false, value: props[p]});
            } catch(err) {
                console.log(err)
            }
			
		}
	}	
	var TreeNode = function(data, depth, lineNo) {
		this.parent = null;
		addHiddenProperties(this, {
            'title': data,
			'data':data,
            'key': lineNo,
			'depth':depth,
			'parent':null,
			'children':[]
		});
		this[data||'root']=this.children;
	}
	
	TreeNode.prototype.toString = function() { 
		return JSON.stringify(this.children);
	}

	var tree = new TreeNode(null, -1);

	var levels = [tree];

	function countTabs(line) {
		var count = 0; 
		for (var i = 0; i < line.length; i += 2) {
			var ch = line[i];
            var ch2 = line[i+1]
			if ((ch === marker && ch2)) {
				count += 1;
			} else if (/[^\s]/.test(ch)){
				return count;
			}
		}
		return -1; // no content
	}

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];

		var tabcount = countTabs(line);

		if (tabcount >= 0) { //then add node to tree

			function topnode() {
		       		return levels[levels.length - 1];
			}
			while(tabcount - topnode().depth <= 0) {
				levels.pop();
			}
			var depth = levels.length - 1;
			var node = new TreeNode(line.substring(tabcount), depth, i);
			node.parent = topnode();
			node.parent.children.push(node);
			levels.push(node);
		}
	}
	return tree;
}

export const traverse = function (tree, cb){
	function _traverse(node) {
		cb(node);
		for (var i = 0; i < node.children.length; i++) {
			_traverse(node.children[i]);
		}
	}

	for (var i = 0; i < tree.children.length; i++) {
		_traverse(tree.children[i]);
	}
}

export const print = function(tree) {
	exports.traverse(tree, function(node) {
		var string = "";
		for (var i = 0; i < node.depth; i++) {
			string += "\t";
		}
		string += node.data;
		console.log(string);
	});
}

export const toJSON = function(tree) {
	return JSON.stringify(tree.children);
}