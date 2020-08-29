'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const dns = require('dns');
var cors = require('cors');

var app = express();

var port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

app.use(cors());

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}))

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

const Schema = mongoose.Schema

const shortenerSchema = new Schema({
  original_url: String,
  short_url: String
})

const Shortener = mongoose.model("Shortener", shortenerSchema)

const getCount = async () => {
  const count = await Shortener.find({})
  return count
}

const checkUrl = async (url) => {
  let isValid = true;
    dns.lookup(`${url.slice(url.indexOf('.')+1)}`, (err, addresses,family) => {
      if (err) isValid = false
    })
  return isValid
}

app.post("/api/shorturl/new", (req, res) => {
  getCount().then(result => {
    const url = req.body.url
    const isUrl = url.match(/^http[s]?[:][/]{2}www[.][a-zA-Z0-9]+[.][a-zA-Z]{2,4}$/g)
    if(isUrl) {
      checkUrl(url).then(exists => {
        res.json({original_url: url, short_url: result.length+1})
        const objToSave = new Shortener({
          original_url: url,
          short_url: result.length+1
        })
        objToSave.save((err,data) => {
          if (err) return console.log(err)
          console.log(data)
        })  
      }).catch(doesnt => {
        console.log("Url does not exist: "+doesnt.data)
      })
    } else {
      res.json({error: "invalid URL"})
    }}).catch(err => {
      console.log(err)
    })      
})
app.get(`/api/shorturl/:short`, (req, res) => {
  Shortener.findOne({short_url: req.params.short}, (err, foundUrl) => {
    if(err) return console.log(err)
    console.log(foundUrl)
    res.redirect(foundUrl.original_url)
  })
})


app.listen(port, function () {
  console.log('Node.js listening ...');
});