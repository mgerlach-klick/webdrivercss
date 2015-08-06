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

module.exports = function mobileScreenshot(fileName, orientation) {

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
        partialScreenshots = [],
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

			    var resImg = gm(new Buffer(res.value, 'base64'));
			    partialScreenshots.push(resImg)
                            response.screenshot.push(res);
			    console.log("screenshot! >"+file);
			    currentXPos = currentXPos+1;
			    gm(new Buffer(res.value, 'base64')).write(file, function (err, val){
				console.log("Writing file");
				if( err ){
				    console.error("err: " + err);
				}
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
	 * crop and concatenate screenshot
	 */
	function(cb) {
	    var rotatingFn = orientation == "portrait" ? function (_, imgs){return imgs}: rotate;
	    console.log("rotatingFn: " + rotatingFn);
	    var r = rotatingFn(tmpDir, partialScreenshots);
	    
	    Q.all(r).then(function (rotatedImages){
		console.log("Rotated all images");

		var croppingFn = orientation == "portrait" ? crop.cropIphonePortait : crop.cropIphoneLandscape;
		var c = croppingFn(tmpDir, rotatedImages);
		
		Q.all(c).then(function (croppedImages){
		    console.log("Cropped all images");
		    
		    concat(tmpDir, croppedImages, function (img){
			console.log("Concatenated all images");
			
			img.write(fileName, function (err, val){
			    if(err) {
				console.error("err: " + err);
			    } else {
				console.log("Saved the result to: " + fileName);
				cb();
			    }
			});
		    });
		});
	    }, console.error);
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
