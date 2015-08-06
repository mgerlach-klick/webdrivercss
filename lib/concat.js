'use strict';

/* global document,window */

var fs = require('fs'),
    gm = require('gm'),
    Q = require('q'),
    _ = require('lodash'),
    generateUUID = require('./generateUUID.js'),
    R = require('ramda');


/* Don't be a dick and actually append multiple gm instance images */
/*
var concat = function (imgs,cb){
    if(_.isEmpty(imgs)) return null;
    if(imgs.length == 1) return _.first(imgs);

    
    var tmppath="/tmp/fuckyousomuchnodejs.png";
    if(imgs.length == 2) {
	imgs[1].write(tmppath, function (err, val){
	    console.log("appending the last two");
	    var i = imgs[0].append(tmppath);
	    // setTimeout(function (){cb(i)}, 200);
	    cb(i);
	});
    } else {
	concat(_.rest(imgs), function (img){
	    img.write(tmppath, function (err, val){
		var i = imgs[0].append(tmppath);
		console.log("appending");
		// setTimeout(function (){cb(i)}, 200);
		// cb();
		cb(i);
	    })
	});
    }
};
*/

var concat = function (imgs,cb){
    console.log("imgs: " + imgs);
    var pWrite = function (i, path){
	var deferred = Q.defer();
	i.write(path,function (err,val){
	    console.log("Writing "+path);
	    if( err ){
		deferred.reject(err);
	    } else {
		deferred.resolve(path);
	    }
	});
	return deferred.promise;
    }

    var f = imgs[0];
    var r = _.rest(imgs);
    var paths = r.map(function (i){ return pWrite(i, "/tmp/myconcat"+generateUUID()+".png")});
    Q.all(paths).then(function (writtenImages){
	for(var i = 0; i < writtenImages.length; i++) {
	    f.append(writtenImages[i]);
	}
	var finishedConcat= "/tmp/finished_concat"+generateUUID()+".png";
	f.write(finishedConcat, function (){
	    cb(gm(finishedConcat));
	});
    });
}

/*
var file ="/tmp/fullsize/0.png";
var file2 ="/tmp/fullsize/1.png";
var file3 ="/tmp/fullsize/2.png";

 */

// var is = [gm("/tmp/cropped0.png"), gm("/tmp/cropped1.png")];

// concat(is, function (img){img.write("/tmp/concat.png", function (){console.log("done");})});



module.exports = concat;
