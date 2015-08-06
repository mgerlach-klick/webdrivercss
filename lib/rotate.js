'use strict';

/* global document,window */

var fs = require('fs'),
    gm = require('gm'),
    Q = require('q'),
    _ = require('lodash'),
    R = require('ramda');

var rotate_ = function (img){
    return Q.Promise(function(resolve, reject, notify) {
	resolve(img.rotate("white", -90));
    })
}

var rotate = function (imgs){
    return R.map(rotate_, _.isArray(imgs) ? imgs : [imgs]);
}

/*
var file ="/tmp/fullsizerot/0.png";
var i = gm(file)
var r = rotate(i)
console.log("r: " + r);
console.log("r[0]: " + r[0]);
r[0].then(function (c){
    c.write("/tmp/out0.png", function (err, val){
	console.log(err, val);
	console.log("Done");
})});
 */

module.exports = rotate;
