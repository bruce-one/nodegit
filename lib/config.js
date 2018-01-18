module.exports = function(NodeGit) {

var Config = NodeGit.Config;

// Backwards compatibility.
Config.prototype.getString = function() {
  return this.getStringBuf.apply(this, arguments);
};
}
