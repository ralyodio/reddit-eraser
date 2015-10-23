#!/usr/bin/env node

/**
 * Get all your reddit comments
 * ./async.js -u <reddit-username>
 * -> Found 513 comments
 */

var Snoocore = require('snoocore');
var reddit = new Snoocore({ userAgent: 'reddit-rss-submit/1.0' });
var q = require('q');
var async = require('async');
var cmd = require('commander');

//arguments
cmd
.option('-u, --user [string]', 'Username for reddit')
.parse(process.argv);


function getComments(allComments, cb){
	var after = allComments.length && allComments[allComments.length-1].data.name;
	var where = {
		limit: 100
	};

	if ( after ) {
		where.after = after;
	}

	reddit('/user/'+cmd.user+'/comments').listing(where)
		.then(function(comments){
			var done = comments.allChildren.length < 100;

			allComments = allComments.concat(comments.allChildren);

			if ( done ) {
				return cb(null, allComments);
			}

			return getComments(allComments, cb);
		});
}

async.waterfall([
	function(cb){
		getComments([], cb)
	}], function(err, allComments){
	if ( err ) return console.error(err);

	console.log('Found %d comments', allComments.length);
});
