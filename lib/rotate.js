'use strict';

/* global document,window */

var fs = require('fs'),
    gm = require('gm'),
    Q = require('q'),
    _ = require('lodash'),
    generateUUID = require('./generateUUID.js'),
    R = require('ramda');

var rotate_ = function (tmpdir, img){
    return Q.Promise(function(resolve, reject, notify) {
	var i = img.rotate("white", -90);

	var tmpfile = tmpdir + "/" + generateUUID()+".png";

	i.write(tmpfile, function (){
	    resolve(gm(tmpfile));
	});
    });
}

var rotate = function (tmpdir,imgs){
	var rotateC = R.curry(rotate_)(tmpdir);
    return R.map(rotateC, _.isArray(imgs) ? imgs : [imgs]);
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
