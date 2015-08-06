'use strict';

/* global document,window */

var async = require('async'),
    fs = require('fs'),
    gm = require('gm'),
    rimraf = require('rimraf'),
    generateUUID = require('./generateUUID.js'),
    path = require('path'),
    Q = require('q'),
    _ = require('lodash'),
    crop = require("./crop"),
    rotate = require("./rotate"),
    concat = require("./concat");

module.exports = function mobileScreenshot(orientation, fileName) {

    var ErrorHandler = this.instance.ErrorHandler;

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if (typeof fileName !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with saveScreenshot command'));
    }

    var self = this.instance,
	response = {
	    execute: [],
            screenshot: []
        },
        tmpDir = null,
        cropImages = [],
        currentXPos = 0,
        currentYPos = 0,
	scrollAmount = 0,
	scale=0,
        screenshot = null,
        scrollFn = function(w, h) {
            document.body.style.webkitTransform = 'translate(-' + w + 'px, -' + h + 'px)';
            document.body.style.mozTransform = 'translate(-' + w + 'px, -' + h + 'px)';
            document.body.style.msTransform = 'translate(-' + w + 'px, -' + h + 'px)';
            document.body.style.oTransform = 'translate(-' + w + 'px, -' + h + 'px)';
            document.body.style.transform = 'translate(-' + w + 'px, -' + h + 'px)';
        };

    async.waterfall([

        /*!
         * create tmp directory to cache viewport shots
         */
        function(cb) {
            var uuid = generateUUID();
            tmpDir = path.join(__dirname, '..', '.tmp-' + uuid);

            fs.exists(tmpDir, function(exists) {
                return exists ? cb() : fs.mkdir(tmpDir, '0755', cb);
            });
        },

        /*!
         * prepare page scan
         */
        function() {
            var cb = arguments[arguments.length - 1];
            self.execute(function() {
                /**
                 * remove scrollbars
                 */
                document.body.style.overflow = 'hidden';

                /**
                 * scroll back to start scanning
                 */
                window.scrollTo(0, 0);

                /**
                 * get viewport width/height and total width/height
                 */
		var scale = window.devicePixelRatio;
		return {
		    scale: window.devicePixelRatio,
		    scrollAmount: orientation == 'landscape' ? window.innerWidth: window.innerHeight,
                    screenWidth: window.innerWidth * scale,
                    screenHeight: window.innerHeight * scale,
                    documentWidth: document.documentElement.scrollWidth,
                    documentHeight: document.documentElement.scrollHeight
                };
            }, cb);
        },

        /*!
         * take viewport shots and cache them into tmp dir
         */
        function(res, cb) {
            response.execute.push(res);

	    scale = response.execute[0].value.scale;
	    scrollAmount = response.execute[0].value.scrollAmount
	    console.log("scale: " + scale);
	    console.log("scrollAmount: " + scrollAmount);
	    console.log("screen Height: "+ response.execute[0].value.screenHeight+" screen width: "+ response.execute[0].value.screenWidth);
	    console.log("document Height: "+ response.execute[0].value.documentHeight +" doc width: "+ response.execute[0].value.documentWidth);
			    

            /*!
             * run scan
             */
            async.whilst(

                /*!
                 * while expression
                 */
                function() {
		    console.log("currentXPos: " + currentXPos * scrollAmount + " documentHeight: " + response.execute[0].value.documentHeight);
                    console.log(currentXPos * scrollAmount );
                    return (currentXPos * response.execute[0].value.scrollAmount < response.execute[0].value.documentHeight);
                },

                /*!
                 * loop function
                 */
                function(finishedScreenshot) {
                    response.screenshot = [];

                    async.waterfall([

                        /*!
                         * take screenshot of viewport
                         */
                        self.screenshot.bind(self),

                        /*!
                         * cache image into tmp dir
                         */
                        function(res, cb) {
                            var file = tmpDir + '/' + currentXPos + '.png';
			    /*gm(new Buffer(res.value, 'base64')).crop(response.execute[0].value.screenWidth, response.execute[0].value.screenHeight, 0, 0).write(file, cb);
                            response.screenshot.push(res);

                            if (!cropImages[currentXPos]) {
                                cropImages[currentXPos] = [];
                            }

                            cropImages[currentXPos][currentYPos] = file;

                                currentYPos = 0;
                            // currentXPos++;
*/
			    // gm(new Buffer(res.value, 'base64')).write(file, cb);
			    // gm(new Buffer(res.value, 'base64')).crop(response.execute[0].value.screenWidth, response.execute[0].value.screenHeight, 0, 0).write(file, cb);
			    var resImg = gm(new Buffer(res.value, 'base64'));
			    cropImages.push(resImg)
                            response.screenshot.push(res);
			    console.log("screenshot! >"+file);
			    currentXPos = currentXPos+1;
			    gm(new Buffer(res.value, 'base64')).write(file, function (err, val){
				console.log("Writing file");
				console.log("err: " + err);
				console.log("val: " + val);
			    });

			    cb(); 
                        },

                        /*!
                         * scroll to next area
                         */
                        function() {
			    console.log("Scroll by " + scrollAmount +" from "+ (currentXPos-1) * scrollAmount  +" to " + currentXPos * scrollAmount);
			    
                            self.execute(scrollFn,
					 0,
					 currentXPos  * scrollAmount,

					 function(val, res) {
					     response.execute.push(res);
					 }
					).pause(100).call(arguments[arguments.length - 1]);
			}

		    ], finishedScreenshot);
		},
                cb
            );
        },
	
        /*!
         * crop screenshot regarding page size
         */
        function(cb) {
            // gm(fileName).crop(response.execute[0].value.documentWidth, response.execute[0].value.documentHeight, 0, 0).write(fileName, arguments[arguments.length - 1]);
	    // crop.cropIphonePortrait
	    console.log("cropImages.length: " + cropImages.length);
	    // var c = _.map(cropImages, function (img){return crop.crop(129, 89, img)});
	    var c = crop.cropIphonePortait(cropImages);
	    // console.log("c: " + JSON.stringify(c, null, ' '));

	    
	    /*
	    var p = c[0];
	    p.then(function (cc){
		console.log("1");
		console.log("write to /tmp/boutoutout.png");
		cc.write("/tmp/boutoutout.png", function (err, val){
		    console.log("err: " + err);
		    console.log("val: " + val);
		    // cb();
		});
	    }, function (err){
		console.error("it's all shit")
		console.error(err)
	    });
		*/
	    
	    Q.all(c).then(function thenFn(croppedImages){
		console.log("2");
		var cc = concat(croppedImages, function (img){
		    console.log("write to /tmp/outoutout.png");
		    img.write("/tmp/outoutout.png", function (err, val){
			console.log("concat all");
			console.log("err: " + err);
			console.log("val: " + val);
			cb();
		    });
		});
	    }, console.error);

	    // cb()
        },



        /*!
         * concats all shots
         */
        function(cb) {
            // var subImg = 0;

	    // cb();
            // async.eachSeries(cropImages, function(x, cb) {
            //     var col = gm(x.shift());
            //     col.append.apply(col, x);

            //     if (!screenshot) {
            //         screenshot = col;
            //         col.write(fileName, cb);
            //     } else {
            //         col.write(tmpDir + '/' + (++subImg) + '.png', function() {
            //             gm(fileName).append(tmpDir + '/' + subImg + '.png', true).write(fileName, cb);
            //         });
            //     }
            // }, cb);
	    cb()
        },
        /*!
         * remove tmp dir
         */
        function(cb) {
	    console.log("Saved everything to "+tmpDir);
            // rimraf(tmpDir, arguments[arguments.length - 1]);
	    cb();
        },

        /*!
         * scroll back to start position
         */
        function(cb) {
            self.execute(scrollFn, 0, 0, cb);
        },

        /**
         * enable scrollbars again
         */
        function(res, cb) {
            response.execute.push(res);
            self.execute(function() {
                document.body.style.overflow = 'visible';
            }, cb);
        }
    ], function(err) {
        callback(err, null, response);
    });

};