var path = require("path");
var events = require("events");
module.exports = function(NodeGit) {
var Diff = NodeGit.Diff;
var LookupWrapper = NodeGit.Utils.lookupWrapper;
var Tree = NodeGit.Tree;
var Treebuilder = NodeGit.Treebuilder;

/**
* Retrieves the tree pointed to by the oid
* @async
* @param {Repository} repo The repo that the tree lives in
* @param {String|Oid|Tree} id The tree to lookup
* @param {Function} callback
* @return {Tree}
*/
Tree.lookup = LookupWrapper(Tree);

/**
 * Make builder. This is helpful for modifying trees.
 * @return {Treebuilder}
 */
Tree.prototype.builder = function() {
  var builder = Treebuilder.create(this);

  builder.root = builder;
  builder.repo = this.repo;

  return builder;
};

/**
 * Diff two trees
 * @async
 * @param {Tree} tree to diff against
 * @param {Function} callback
 * @return {DiffList}
 */
Tree.prototype.diff = function(tree, callback) {
  return this.diffWithOptions(tree, null, callback);
};

/**
 * Diff two trees with options
 * @async
 * @param {Tree} tree to diff against
 * @param {Object} options
 * @param {Function} callback
 * @return {DiffList}
 */
Tree.prototype.diffWithOptions = function(tree, options, callback) {
  return Diff.treeToTree(this.repo, tree, this, options).then(function(diff) {
    if (typeof callback === "function") {
      callback(null, diff);
    }

    return diff;
  }, callback);
};

/**
 * Return an array of the entries in this tree (excluding its children).
 * @return {Array<TreeEntry>} an array of TreeEntrys
 */
Tree.prototype.entries = function() {
  var size = this.entryCount();
  var result = [];

  for (var i = 0; i < size; i++) {
    result.push(this.entryByIndex(i));
  }

  return result;
};

/**
 * Get an entry at the ith position.
 *
 * @param {Number} i
 * @return {TreeEntry}
 */
Tree.prototype.entryByIndex = function(i) {
  var entry = this._entryByIndex(i);
  entry.parent = this;
  return entry;
};

/**
 * Get an entry by name; if the tree is a directory, the name is the filename.
 *
 * @param {String} name
 * @return {TreeEntry}
 */
Tree.prototype.entryByName = function(name) {
  var entry = this._entryByName(name);
  entry.parent = this;
  return entry;
};

/**
 * Get an entry at a path. Unlike by name, this takes a fully
 * qualified path, like `/foo/bar/baz.javascript`
 * @async
 * @param {String} filePath
 * @return {TreeEntry}
 */
Tree.prototype.getEntry = function(filePath, callback) {
  var tree = this;

  return this.entryByPath(filePath).then(function(entry) {
    entry.parent = tree;
    entry.dirtoparent = path.dirname(filePath);

    if (typeof callback === "function") {
      callback(null, entry);
    }

    return entry;
  });
};

/**
 * Return the path of this tree, like `/lib/foo/bar`
 * @return {String}
 */
Tree.prototype.path = function(blobsOnly) {
  return this.entry ? this.entry.path() : "";
};

/**
 * Recursively walk the tree in breadth-first order. Fires an event for each
 * entry.
 *
 * @fires EventEmitter#entry Tree
 * @fires EventEmitter#end Array<Tree>
 * @fires EventEmitter#error Error
 *
 * @param {Boolean} [blobsOnly = true] True to emit only blob & blob executable
 * entries.
 *
 * @return {EventEmitter}
 */
Tree.prototype.walk = function(blobsOnly) {
  blobsOnly = typeof blobsOnly === "boolean" ? blobsOnly : true;

  var self = this;
  var event = new events.EventEmitter();

  var total = 1;
  var entries = new Set();
  var finalEntires = [];

  // This looks like a DFS, but it is a BFS because of implicit queueing in
  // the recursive call to `entry.getTree(bfs)`
  function bfs(error, tree) {
    total--;

    if (error) {
      return event.emit("error", error);
    }

    tree.entries().forEach(function (entry, entryIndex) {
      if (!blobsOnly || entry.isFile() && !entries.has(entry)) {
        event.emit("entry", entry);
        entries.add(entry);

        // Node 0.12 doesn't support either [v for (v of entries)] nor
        // Array.from so we'll just maintain our own list.
        finalEntires.push(entry);
      }

      if (entry.isTree()) {
        total++;
        entry.getTree(bfs);
      }
    });

    if (total === 0) {
      event.emit("end", finalEntires);
    }
  }

  event.start = function() {
    bfs(null, self);
  };

  return event;
};
}
