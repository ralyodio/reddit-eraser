#!/usr/bin/env node

var Snoocore = require('snoocore');
var reddit = new Snoocore({ userAgent: 'reddit-rss-submit/1.0' });
var q = require('q');
var cmd = require('commander');

//arguments
cmd
.option('-u, --user [string]', 'Username for reddit')
.parse(process.argv);


function getNextComments(allComments, def){
  allComments = allComments || [];
  def = def || q.defer();

  var after = allComments.length && allComments[allComments.length-1].data.name;
  var where = {
    limit: 100
  };

  if ( after ) {
    where.after = after;
  }

  reddit('/user/'+cmd.user+'/comments').listing(where)
    .then(function(comments) {
      var done = comments.allChildren.length < 100;

      allComments = allComments.concat(comments.allChildren);

      if ( done ) {
        return def.resolve(allComments);
      }

      return getNextComments(allComments, def);
    })
    .catch(function(err){
      console.error(err);
    });

  return def.promise;
}

function getComments(){
  var promises = [];

  q.all(promises, function(allComments){

  });
}

function start(){

  getComments()
    .then(function(allComments){
      console.log('found %d comments', allComments.length);
    })
    .catch(function(err){
      console.error(err);
    })
}

start();
