#!/usr/bin/env node

var Snoocore = require('snoocore');
var cfg = require('./config.json');
var cmd = require('commander');
var request = require('request-promise');
var async = require('async');
var q = require('q');
var fs = require('fs');
var moment = require('moment');
var winston = require('winston');

var logger = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)(),
		new (winston.transports.File)({ filename: __dirname + '/tmp/run.log' })
	]
});

//arguments
cmd
	.option('-u, --user [string]', 'Username for reddit')
	.option('-p, --pass [string]', 'Password for reddit')
	.option('-k, --key [string]', 'Application key')
	.option('-s, --secret [string]', 'Secret key')
	.option('-t, --throttle [n]', 'Number of minutes between submissions', cfg.throttle)
	.option('-c, --concurrent [n]', 'Number of concurrent api requests', cfg.concurrent)
	.option('-v, --verbose', 'A value that can be increased', increaseVerbosity, 0)
	.parse(process.argv);

var reddit = new Snoocore({ userAgent: 'reddit-eraser/2.0', oauth: {
	type: 'script',
	key: cmd.key,
	secret: cmd.secret,
	username: cmd.user,
	password: cmd.pass,
	// make sure to set all the scopes you need.
	scope: [ 'history', 'edit', 'identity' ]
}});

start();


function increaseVerbosity(v, total) {
	return total + 1;
}

function getComments(before){
	var where = {
		sort: 'new',
		limit: 100
	};

	return reddit('/user/'+cmd.user+'/comments').listing(where)
		.then(function(data){
			//logger.log('info', data);
			return data.children;
		}).catch(function(err){
			logger.error(err);
		});
}

function eraseComment(comment){
	return request('http://api.icndb.com/jokes/random', { json: true })
		.then(function(data){
			return data.value.joke;
		})
		.then(function(text){
			return reddit('/api/editusertext').post({
					api_type: 'json',
					text: text,
					thing_id: comment.data.name
				});
		})
		.catch(function(err){
			logger.log('error', err);
		})
}

function deleteComment(comment){
	return reddit('/api/del').post({
		api_type: 'json',
		id: comment.data.id
	});
}

function eraseAndDeleteComment(comment, cb){
	eraseComment(comment)
	.then(function(data){
		data = data && data.json;

		if ( data ) {
			if ( data.errors && data.errors[0] ) {
				if (data.errors[0][0] === 'QUOTA_FILLED') {
					logger.log('warn', data.errors[0].join(' '));
				}
			} else if ( data.ratelimit ) {
				logger.log('warn', 'rate limit hit: try again in %s mins', data.ratelimit/60);
			}
		}

		if ( cmd.verbose ) logger.log('info', 'erased comment name: %s', comment.data.name);

		return data.data.things[0];
	})
	.then(function(comment){
		deleteComment(comment)
		.then(function(data){
			if ( cmd.verbose ) logger.log('info', 'deleted comment id: %s', comment.data.id);

			cb();
		});
	})
	.catch(function(err){
		cb(err);
	});
}

function start(){
	if ( cmd.verbose ) logger.log('info', 'Starting with %d concurrency', cmd.concurrent);

	reddit.auth().then(function(){
			return reddit('/api/v1/me').get()
		})
		.then(function(me){
			return getComments();
		})
		.then(function(comments){
			var def = q.defer();

			async.eachLimit(comments, cmd.concurrent, eraseAndDeleteComment, function(err){
				if ( err ) {
					logger.error(err);
					return def.reject(err);
				}

				if ( cmd.verbose ) logger.log('info', 'Done erasing and deleting comments');

				def.resolve();
			});

			return def.promise;
		})
		.then(function(data){
			if ( cmd.verbose ) logger.log('info', 'Done with all tasks.');
		})
		.catch(function(err){
			logger.error(err);
		});
}
