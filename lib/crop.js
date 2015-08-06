'use strict';

/* global document,window */

var fs = require('fs'),
    gm = require('gm'),
    Q = require('q'),
    _ = require('lodash'),
    generateUUID = require('./generateUUID.js'),
    R = require('ramda');

var crop_ = function (header, footer, img){
    return Q.Promise(function(resolve, reject, notify) {
	return img.size(function (err, size){
	    console.log("size:: " + JSON.stringify(size, null, ' '));
	    console.log("Now cropping");
	    img.crop(size.width, size.height - header - footer , 0, header)
	    var tmpfile = "/tmp/"+generateUUID()+".png";
	    img.write(tmpfile, function (){
		resolve(gm(tmpfile));
	    });
	});
    })
}

var crop = function (header, footer, imgs){
    var cropC = R.curry(crop_)(header)(footer)
    return R.map(cropC, _.isArray(imgs) ? imgs : [imgs]);
}

var cropIphonePortait = R.curry(crop)(129)(89);
var cropIphoneLandscape = R.curry(crop)(129)(0);

/*gg
var file ="/tmp/fullsize/0.png";
var file2 ="/tmp/fullsize/1.png";


var is= [gm(file), gm(file2)];

var header=129;
var footer=90;

var c = crop(header, footer, is);


c[0].then(function (c){
	c.write("/tmp/out0.png", function (err, val){
    console.log(err, val);
})});

c[1].then(function (c){
	c.write("/tmp/out1.png", function (err, val){
    console.log(err, val);
})});

 */


module.exports = {
    crop:crop,
    cropIphonePortait: cropIphonePortait,
    cropIphoneLandscape: cropIphoneLandscape
}
