module.exports = function(NodeGit) {

var OdbObject = NodeGit.OdbObject;

OdbObject.prototype.toString = function(size) {
  size = size || this.size();

  return this.data().toBuffer(size).toString();
};
}
