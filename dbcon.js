var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'classmysql.engr.oregonstate.edu',
  user            : 'cs340_wilsonc6',
  password        : '6720',
  database        : 'cs340_wilsonc6'
});

module.exports.pool = pool;
