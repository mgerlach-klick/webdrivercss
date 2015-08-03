'use strict';

/* global document,window */

var async = require('async'),
    fs = require('fs'),
    gm = require('gm'),
    rimraf = require('rimraf'),
    generateUUID = require('./generateUUID.js'),
    path = require('path');

module.exports = function mobileScreenshot(fileName) {

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
                    screenWidth: Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * scale,
                    screenHeight: window.innerHeight * scale,
                    documentWidth: document.documentElement.scrollWidth * scale,
                    documentHeight: document.documentElement.scrollHeight * scale
                };
            }, cb);
        },

        /*!
         * take viewport shots and cache them into tmp dir
         */
        function(res, cb) {
            response.execute.push(res);

            /*!
             * run scan
             */
            async.whilst(

                /*!
                 * while expression
                 */
                function() {
		    console.log("currentXPos: " + currentXPos + " response.execute[0].value.documentHeight: " + response.execute[0].value.documentHeight);
                    console.log(currentXPos < response.execute[0].value.documentHeight);
                    return (currentXPos < response.execute[0].value.documentHeight);
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
			    console.log("Writing "+file);

			    /*gm(new Buffer(res.value, 'base64')).crop(response.execute[0].value.screenWidth, response.execute[0].value.screenHeight, 0, 0).write(file, cb);
                            response.screenshot.push(res);

                            if (!cropImages[currentXPos]) {
                                cropImages[currentXPos] = [];
                            }

                            cropImages[currentXPos][currentYPos] = file;

                                currentYPos = 0;
                            // currentXPos++;
*/
			    gm(new Buffer(res.value, 'base64')).write(file, cb);
			    // gm(new Buffer(res.value, 'base64')).crop(response.execute[0].value.screenWidth, response.execute[0].value.screenHeight, 0, 0).write(file, cb);
                            response.screenshot.push(res);
			    
			    console.log("response.execute[0].value.screenHeight: " + response.execute[0].value.screenHeight);
			    currentXPos += (response.execute[0].value.screenHeight / 3 * 2)
			    console.log("currentXPos: " + currentXPos);
                        },

                        /*!
                         * scroll to next area
                         */
                        function() {
			    console.log("Scroll, scroll, scroll your boat");
			    
                            self.execute(scrollFn,
					 0,
					 currentXPos,
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
         * concats all shots
         */
        function(cb) {
            var subImg = 0;

	    cb();
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
        },

        /*!
         * crop screenshot regarding page size
         */
        function(cb) {
            // gm(fileName).crop(response.execute[0].value.documentWidth, response.execute[0].value.documentHeight, 0, 0).write(fileName, arguments[arguments.length - 1]);
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
