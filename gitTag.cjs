const cp = require('child_process');
var fs = require('fs');

const revision = cp
.execSync('git rev-parse HEAD')
.toString().trim()

const shortRevision = cp
.execSync('git rev-parse --short HEAD')
.toString().trim()

// ISO 8601 with timezone offset, same shape moment().format() produced.
const timestmp = new Date().toISOString();


fs.writeFile('public/gitVersion.json', `{ "short": "${shortRevision}", "full":"${revision}", "created":"${timestmp}"  }`, function (err) {
  if (err) throw err;
  console.log("Writing current Git commit to file")
});

