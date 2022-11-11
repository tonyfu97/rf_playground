// Need to serve the onnx files because the CORS policy no longer allow us
// to fetch local files.

// const http = require('http');
// const url = require('url');
// const fs = require('fs');

// const server = http.createServer((req, res) => {
//     let parsedURL = url.parse(req.url, true);
//     let path = parsedURL.path.replace(/^\/+|\/+$/g, "");
//     let file = __dirname + "/onnx_files/alexnet_conv1.onnx"

// })

var fs = require('fs'),
    http = require('http');

http.createServer(function (req, res) {
  fs.readFile(__dirname + req.url, function (err,data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
}).listen(8080);