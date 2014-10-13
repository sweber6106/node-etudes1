#!/usr/local/bin/node

function handle_incoming_request(req, res) {
  if (req.method.toLowerCase() == 'get' && req.url.substring(0, 9) == '/content/') {
    serve_static_file(req.url.substring(9), res);
  }
  else {
    res.writeHead(404, { "Content-Type" : "application/json" });

    var out = { error: "not_found", message: "'" + req.url + "' not found" };

    res.end(JSON.stringify(out) + "\n");
  }
}

function serve_static_file(file, res) {
  var rs = fs.createReadStream(file);
  var ct = content_type_for_path(file);
  res.writeHead(200, { "Content-Type" : ct });

  rs.on (
    'readable',
    function() {
      var d = rs.read();
      if (d) {
        if (typeof d == 'string') {
          res.write(d);
        }
        else if (typeof d == 'object' && d instanceof Buffer) {
          res.write(d.toString('utf8'));
        }
      }
    }
  );

  rs.on (
    'error',
    function(e) {
      res.writeHead(404, { "Content-Type" : "application/json" });
      var out = { error: "not_found", message: "'" + file + "' not found" };
      res.end(JSON.stringify(out) + "\n");
      return;
    }
  );

  rs.on (
    'end',
    function() {
      res.end();
    }
  );
}

function content_type_for_path(file) {
  return "text/html";
}

var http = require('http');
var fs = require('fs');

var s = http.createServer(handle_incoming_request);
s.listen(8080);
