module.exports = function(NodeGit) {

var Obj = NodeGit.Object;

/**
 * Is this object a blob?
 * @return {Boolean}
 */
Obj.prototype.isBlob = function() {
  return this.type() == Obj.TYPE.BLOB;
};

/**
 * Is this object a commit?
 * @return {Boolean}
 */
Obj.prototype.isCommit = function() {
  return this.type() == Obj.TYPE.COMMIT;
};

/**
 * Is this object a tag?
 * @return {Boolean}
 */
Obj.prototype.isTag = function() {
  return this.type() == Obj.TYPE.TAG;
};

/**
 * Is this object a tree?
 * @return {Boolean}
 */
Obj.prototype.isTree = function() {
  return this.type() == Obj.TYPE.TREE;
};
}
