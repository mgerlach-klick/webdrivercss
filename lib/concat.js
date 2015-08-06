'use strict';

/* global document,window */

var fs = require('fs'),
    gm = require('gm'),
    Q = require('q'),
    _ = require('lodash'),
    R = require('ramda');


/* Don't be a dick and actually append multiple gm instance images */
var concat = function (imgs,cb){
    if(_.isEmpty(imgs)) return null;
    if(imgs.length == 1) return _.first(imgs);

    
    var tmppath="/tmp/fuckyousomuchnodejs.png";
    if(imgs.length == 2) {
	imgs[1].write(tmppath, function (err, val){
	    cb(imgs[0].append(tmppath))
	});
    } else {
	concat(_.rest(imgs), function (img){
	    img.write(tmppath, function (err, val){
		cb(imgs[0].append(tmppath));
	    })
	});
    }
};

/*
var file ="/tmp/fullsize/0.png";
var file2 ="/tmp/fullsize/1.png";
var file3 ="/tmp/fullsize/2.png";


var is = [gm(file), gm(file2), gm(file3)];

concat(is, function (img){img.write("/tmp/concat.png", function (){console.log("done");})});

 */

module.exports = concat;
