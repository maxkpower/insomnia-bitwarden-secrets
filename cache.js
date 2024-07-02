const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 60 * 60 });

function writeEntry(key, value) {
  return cache.set(key, value);
}

function getEntry(key) {
  return cache.get(key);
}

function bwsCliInstalled() {
  return cache.get('bwsCliInstalled');
}

function writeBwsCliInstalled(installed) {
  return cache.set('bwsCliInstalled', installed);
}

module.exports = {
  writeEntry,
  getEntry,
  bwsCliInstalled,
  writeBwsCliInstalled
};
