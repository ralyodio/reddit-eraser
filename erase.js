const snoowrap = require('snoowrap');
const request = require('request-promise');

class SnoowrapWithProxy extends snoowrap {
	rawRequest(options) {
		return request(Object.assign(options, {
			proxy: process.env.HTTP_PROXY
		}));
	}
}

class Reddit {
	constructor(opts) {
		this.opts = opts;
		this.proxy = process.env.HTTP_PROXY;
		this.timeout = 1000 * 30;

		// reddit
		this.authRedditId = process.env.REDDIT_ID;
		this.authRedditSecret = process.env.REDDIT_SECRET;
		this.authRedditUser = process.env.REDDIT_USER;
		this.authRedditPass = process.env.REDDIT_PASS;

		// reddit
		this.snoowrap = new SnoowrapWithProxy({
			user_agent: 'reddit-erase v1',
			client_id: this.authRedditId,
			client_secret: this.authRedditSecret,
			username: this.authRedditUser,
			password: this.authRedditPass
		});
	}

	async postItem(item) {
		const url = item.link.replace(amazonId, amazonCustomId);

		return this.snoowrap.getSubreddit(this.opts.subreddit).submitLink({
			title: item.title,
			url: url,
			resubmit: false
		})
			.then(resp => {
				const text = `=============
${item.title}
${url}
-----------
/r/${this.opts.subreddit}
http://redd.it/${resp.name.split('_')[1]}
`;
				console.log(text);
				return item;
			})
			.catch(err => {
				console.error(err.message);
				return item;
			});
	}

	async submitLinks(items) {
		return Promise.all(
			items.map(this.postItem.bind(this))
				.map(p => p.catch(item => {
					Promise.resolve(item);
				}))
		);
	}
}

module.exports = Reddit;
