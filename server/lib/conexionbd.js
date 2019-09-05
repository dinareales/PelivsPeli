var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  port     : '3306',
  user     : 'dina',
  password : 'cositadina',
  database : 'competencias'
});

module.exports = connection;