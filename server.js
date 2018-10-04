'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var rn = require('random-number');
var url = require('url');
var dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

var urlSchema = new mongoose.Schema({
  url: String,
  short: Number
}, { timestamps: true });
var UrlModel = mongoose.model('url', urlSchema);

function addhttp(url) {
  var newUrl = url;
  if (!/^(?:f||ht)tps?\:\/\//.test(url)) {
    newUrl = 'http://'.concat(url);
  }
  return newUrl;
}

app.get('/api/shorturl/:id', function(req, res) {
  if (isNaN(req.params.id)) {
    res.redirect('/');
  } else {
    var shortUrl = Number(req.params.id);
  
    UrlModel.findOne({ short: shortUrl }, function(err, data) {
      data ? res.redirect(addhttp(data.url)) : res.redirect('/');
    });
  }
});

app.post('/api/shorturl/new', function(req, res) {
  var originalUrl = req.body.url;
  var parsedUrl = url.parse(addhttp(originalUrl));
  
  dns.lookup(parsedUrl.host, function(err, address) {
    if (address === undefined) {
      res.json({ error: 'invalid URL' });
    } else {
      var gen = rn.generator({
        min: 1,
        max: 99999,
        integer: true
      });
      
      var shortUrl = gen();
      
      var newUrl = new UrlModel({
        url: originalUrl,
        short: shortUrl
      });
      
      newUrl.save(function(errSave) {
        res.json({ original_url: originalUrl, short_url: shortUrl });
      });
    }
  });
});
  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});