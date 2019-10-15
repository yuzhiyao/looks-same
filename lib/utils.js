'use strict';

const _ = require('lodash');
const png = require('./png');
const DiffArea = require('./diff-area');
const DiffClusters = require('./diff-clusters');
const validators = require('./validators');

exports.readPair = (first, second, callback) => {
    const src = {first, second};
    const result = {first: null, second: null};

    let read = 0;
    let failed = false;

    ['first', 'second'].forEach((key) => {
        const {source, ...opts} = src[key];
        const readFunc = Buffer.isBuffer(source) ? png.fromBuffer : png.fromFile;

        readFunc(source, opts, (error, png) => {
            if (failed) {
                return;
            }

            if (error) {
                failed = true;
                return callback(error, null);
            }

            result[key] = png;
            read++;

            if (read === 2) {
                callback(null, result);
            }
        });
    });
};

const getDiffClusters = (diffClusters, diffArea, {shouldCluster}) => {
    return shouldCluster ? diffClusters.clusters : [diffArea.area];
};

exports.getDiffPixelsCoords = (png1, png2, predicate, opts, callback) => {
    if (!callback) {
        callback = opts;
        opts = {};
    }

    const stopOnFirstFail = opts.hasOwnProperty('stopOnFirstFail') ? opts.stopOnFirstFail : false;

    const width = Math.min(png1.width, png2.width);
    const height = Math.min(png1.height, png2.height);

    const diffArea = new DiffArea();
    const diffClusters = new DiffClusters(opts.clustersSize);

    // let equal = 0;
    let diff = 0;

    const processRow = (y) => {
        setImmediate(() => {
            for (let x = 0; x < width; x++) {
                const color1 = png1.getPixel(x, y);
                const color2 = png2.getPixel(x, y);
                //console.log(JSON.stringify(color2));

                const result = predicate({
                    color1, color2,
                    png1, png2,
                    x, y,
                    width, height
                });

                
                // if(result) equal ++;
               // else error ++;

                if (!result) {
                    diff ++;

                    const {x: actX, y: actY} = png1.getActualCoord(x, y);
                    diffArea.update(actX, actY);
                    if (opts.shouldCluster) {
                        diffClusters.update(actX, actY);
                    }

                    if (stopOnFirstFail) {
                        return callback({diffArea, diffClusters: getDiffClusters(diffClusters, diffArea, opts)});
                    }
                }
            }

            y++;

            if (y < height) {
                processRow(y);
            } else {

                //相似度计算
                let compareValue = (1 - diff/(height*width))*100;
                let compareInfo = {
                    similarity: compareValue,
                    compareValue: `${compareValue}%`,
                    equalPix: height*width - diff,
                    diffPix: diff
                }
                callback({diffArea, diffClusters: getDiffClusters(diffClusters, diffArea, opts), compareInfo});
            }
        });
    };

    processRow(0);
};

exports.formatImages = (img1, img2) => {
    validators.validateImages(img1, img2);

    return [img1, img2].map((i) => {
        return _.isObject(i) && !Buffer.isBuffer(i) ? i : {source: i, boundingBox: null};
    });
};
