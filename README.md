reddit-eraser
=============

reddit-eraser is a node.js script that will get the last 100 comments, and replace them with chuck norris quotes...then delete the comment.

## node.js (required)

	#mac
	brew install node

Other OS (windows, linux) should install from source found at http://nodejs.org

## install

    git clone git@github.com:chovy/reddit-eraser.git
    cd reddit-eraser
    npm install
    
    # copy config
    cp config.sample.json config.json
    
    # run from command line
    ./index.js -u username -p password

    # add a cronjob to periodically check
    crontab -e

    # add this line (runs every hour on hh:05)
    5 * * * * /usr/local/bin/node ~/path/to/reddit-eraser/index.js -u user -p pass
    
    # use flock to skip runs where script is already running (recommended - allows to run every hour)
    5 * * * * flock -n /tmp/reddit-eraser.lock -c "/usr/local/bin/node /path/to/reddit-eraser/index.js -u user -p pass"

## configure

concurrency is the number of simultaneous api requests sent to reddit.

## options

- user: reddit uername
- pass: reddit password
- v: verbosity (`-vvv` to increase)
- c: concurrent requests

LICENSE: MIT
