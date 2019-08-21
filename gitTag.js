const cp = require('child_process');
var fs = require('fs');
const moment  = require('moment');

const revision = cp
.execSync('git rev-parse HEAD')
.toString().trim()

const shortRevision = cp
.execSync('git rev-parse --short HEAD')
.toString().trim()

const timestmp = moment().format();   


fs.writeFile('public/gitVersion.json', `{ "short": "${shortRevision}", "full":"${revision}", "created":"${timestmp}"  }`, function (err) {
  if (err) throw err;
  console.log("Writing current Git commit to file")
});

