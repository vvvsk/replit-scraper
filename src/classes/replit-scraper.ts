import fs from "fs/promises";
import axios from "axios";
import Options from "../models/options.js";
import Wait from "../utils/wait.js";
import Search from "../models/search.js";

class ReplitScraper {
	private options: Options;

	constructor(options?: Options) {
		this.options = {
			searches: options?.searches || [],
			headers: options?.headers || {},
			output: options?.output || "output.json",
			filter: options?.filter,
			check: options?.check,
		};
		let userAgent = this.options.headers["user-agent"] ?? this.options.headers["User-Agent"];
		if (!userAgent) this.options.headers["User-Agent"] = "ReplitScraper/1.0.0";
		this.options.headers["origin"] = "https://replit.com";
		this.options.headers["X-Requested-With"] = "XMLHttpRequest";
		let cookie = this.options.headers["cookie"] ?? this.options.headers["Cookie"];
		if (!cookie) throw new Error("No cookie provided in headers");
	}

	*ChunkArray<T>(lst: T[], n: number) {
		for (let i = 0; i < lst.length; i += n) {
			yield lst.slice(i, i + n);
		}
	}

	async Search(query: string, num: number) {
		let data = [
			{
				operationName: "SearchPageSearchResults",
				variables: {
					options: {
						onlyCalculateHits: false,
						categories: ["Files"],
						query: query,
						categorySettings: {
							repls: {
								sort: "Relevant",
								tags: [],
								exactMatch: false,
							},
							posts: {
								sort: "Relevant",
								exactMatch: false,
							},
							templates: {
								exactMatch: false,
							},
							docs: {},
							files: {
								page: {
									first: num,
									after: "1",
								},
								sort: "Relevant",
								exactMatch: false,
								myCode: false,
							},
							users: {},
						},
					},
				},
				query:
					"query SearchPageSearchResults($options: SearchQueryOptions!) {\n  search(options: $options) {\n	...SearchPageResults\n	... on UserError {\n	  message\n	  __typename\n	}\n	... on UnauthorizedError {\n	  message\n	  __typename\n	}\n	__typename\n  }\n}\n\nfragment SearchPageResults on SearchQueryResults {\n  userResults {\n	hitInfo {\n	  ...HitInfo\n	  __typename\n	}\n	results {\n	  pageInfo {\n		...PageInfo\n		__typename\n	  }\n	  items {\n		id\n		...SearchPageResultsUser\n		__typename\n	  }\n	  __typename\n	}\n	__typename\n  }\n  replResults {\n	hitInfo {\n	  ...HitInfo\n	  __typename\n	}\n	results {\n	  pageInfo {\n		...PageInfo\n		__typename\n	  }\n	  items {\n		id\n		...SearchPageResultsRepl\n		__typename\n	  }\n	  __typename\n	}\n	__typename\n  }\n  templateResults {\n	hitInfo {\n	  ...HitInfo\n	  __typename\n	}\n	results {\n	  pageInfo {\n		...PageInfo\n		__typename\n	  }\n	  items {\n		id\n		...SearchPageResultsTemplate\n		__typename\n	  }\n	  __typename\n	}\n	__typename\n  }\n  postResults {\n	hitInfo {\n	  ...HitInfo\n	  __typename\n	}\n	results {\n	  pageInfo {\n		...PageInfo\n		__typename\n	  }\n	  items {\n		id\n		...SearchPageResultsPost\n		__typename\n	  }\n	  __typename\n	}\n	__typename\n  }\n  docResults {\n	hitInfo {\n	  ...HitInfo\n	  __typename\n	}\n	results {\n	  pageInfo {\n		...PageInfo\n		__typename\n	  }\n	  items {\n		...SearchPageResultsDoc\n		__typename\n	  }\n	  __typename\n	}\n	__typename\n  }\n  fileResults {\n	hitInfo {\n	  ...HitInfo\n	  __typename\n	}\n	results {\n	  pageInfo {\n		...PageInfo\n		__typename\n	  }\n	  items {\n		...SearchPageResultsFile\n		__typename\n	  }\n	  __typename\n	}\n	__typename\n  }\n  __typename\n}\n\nfragment HitInfo on SearchQueryHitInfo {\n  totalHits\n  totalPages\n  __typename\n}\n\nfragment PageInfo on PageInfo {\n  hasPreviousPage\n  hasNextPage\n  nextCursor\n  previousCursor\n  __typename\n}\n\nfragment SearchPageResultsUser on User {\n  id\n  username\n  fullName\n  bio\n  image\n  url\n  ...UserRoles\n  __typename\n}\n\nfragment UserRoles on User {\n  roles(\n	only: [ADMIN, MODERATOR, PATRON, PYTHONISTA, DETECTIVE, LANGUAGE_JAMMER, FEATURED, REPLIT_REP, REPLIT_REP_EDU]\n  ) {\n	id\n	name\n	key\n	tagline\n	__typename\n  }\n  __typename\n}\n\nfragment SearchPageResultsRepl on Repl {\n  id\n  ...ReplPostReplCardRepl\n  __typename\n}\n\nfragment ReplPostReplCardRepl on Repl {\n  id\n  iconUrl\n  description(plainText: true)\n  ...ReplPostReplInfoRepl\n  ...ReplStatsRepl\n  ...ReplLinkRepl\n  tags {\n	id\n	...PostsFeedNavTag\n	__typename\n  }\n  owner {\n	... on Team {\n	  id\n	  username\n	  url\n	  image\n	  __typename\n	}\n	... on User {\n	  id\n	  username\n	  url\n	  image\n	  __typename\n	}\n	__typename\n  }\n  __typename\n}\n\nfragment ReplPostReplInfoRepl on Repl {\n  id\n  title\n  description(plainText: true)\n  imageUrl\n  iconUrl\n  templateInfo {\n	label\n	iconUrl\n	__typename\n  }\n  __typename\n}\n\nfragment ReplStatsRepl on Repl {\n  id\n  likeCount\n  runCount\n  commentCount\n  __typename\n}\n\nfragment ReplLinkRepl on Repl {\n  id\n  url\n  nextPagePathname\n  __typename\n}\n\nfragment PostsFeedNavTag on Tag {\n  id\n  isOfficial\n  __typename\n}\n\nfragment SearchPageResultsTemplate on Repl {\n  id\n  ...TemplateReplCardRepl\n  __typename\n}\n\nfragment TemplateReplCardRepl on Repl {\n  id\n  iconUrl\n  templateCategory\n  title\n  description(plainText: true)\n  releasesForkCount\n  templateLabel\n  likeCount\n  url\n  owner {\n	... on User {\n	  id\n	  ...TemplateReplCardFooterUser\n	  __typename\n	}\n	... on Team {\n	  id\n	  ...TemplateReplCardFooterTeam\n	  __typename\n	}\n	__typename\n  }\n  deployment {\n	id\n	activeRelease {\n	  id\n	  __typename\n	}\n	__typename\n  }\n  publishedAs\n  __typename\n}\n\nfragment TemplateReplCardFooterUser on User {\n  id\n  username\n  image\n  url\n  __typename\n}\n\nfragment TemplateReplCardFooterTeam on Team {\n  id\n  username\n  image\n  url\n  __typename\n}\n\nfragment SearchPageResultsPost on Post {\n  id\n  ...ReplPostPost\n  ...ReplCardPostPost\n  ...OldPostPost\n  __typename\n}\n\nfragment ReplPostPost on Post {\n  id\n  title\n  timeCreated\n  isPinned\n  isAnnouncement\n  ...ReplViewPostActionPermissions\n  replComment {\n	id\n	body(removeMarkdown: true)\n	__typename\n  }\n  repl {\n	id\n	...ReplViewReplActionsPermissions\n	...ReplPostRepl\n	__typename\n  }\n  user {\n	id\n	...ReplPostUserPostUser\n	__typename\n  }\n  recentReplComments {\n	id\n	...ReplPostReplComment\n	__typename\n  }\n  __typename\n}\n\nfragment ReplViewPostActionPermissions on Post {\n  id\n  isHidden\n  __typename\n}\n\nfragment ReplViewReplActionsPermissions on Repl {\n  id\n  slug\n  lastPublishedAt\n  publishedAs\n  owner {\n	... on User {\n	  id\n	  username\n	  __typename\n	}\n	... on Team {\n	  id\n	  username\n	  __typename\n	}\n	__typename\n  }\n  templateReview {\n	id\n	promoted\n	__typename\n  }\n  currentUserPermissions {\n	publish\n	containerWrite\n	__typename\n  }\n  ...UnpublishReplRepl\n  ...ReplLinkRepl\n  __typename\n}\n\nfragment UnpublishReplRepl on Repl {\n  id\n  commentCount\n  likeCount\n  runCount\n  publishedAs\n  __typename\n}\n\nfragment ReplPostRepl on Repl {\n  id\n  ...ReplPostReplInfoRepl\n  ...LikeButtonRepl\n  ...ReplStatsRepl\n  tags {\n	id\n	...PostsFeedNavTag\n	__typename\n  }\n  __typename\n}\n\nfragment LikeButtonRepl on Repl {\n  id\n  currentUserDidLike\n  likeCount\n  url\n  wasPosted\n  wasPublished\n  __typename\n}\n\nfragment ReplPostUserPostUser on User {\n  id\n  username\n  image\n  ...UserLinkUser\n  __typename\n}\n\nfragment UserLinkUser on User {\n  id\n  url\n  username\n  __typename\n}\n\nfragment ReplPostReplComment on ReplComment {\n  id\n  body\n  timeCreated\n  user {\n	id\n	...ReplPostRecentCommentUser\n	__typename\n  }\n  __typename\n}\n\nfragment ReplPostRecentCommentUser on User {\n  id\n  username\n  image\n  ...UserLinkUser\n  __typename\n}\n\nfragment ReplCardPostPost on Post {\n  id\n  title\n  timeCreated\n  isPinned\n  isAnnouncement\n  ...ReplViewPostActionPermissions\n  repl {\n	id\n	...ReplViewReplActionsPermissions\n	...ReplCardPostRepl\n	__typename\n  }\n  recentReplComments {\n	id\n	...ReplPostReplComment\n	__typename\n  }\n  user {\n	id\n	...ReplPostUserPostUser\n	__typename\n  }\n  __typename\n}\n\nfragment ReplCardPostRepl on Repl {\n  id\n  ...LikeButtonRepl\n  ...ReplPostReplCardRepl\n  recentComments {\n	id\n	...ReplPostReplComment\n	__typename\n  }\n  __typename\n}\n\nfragment OldPostPost on Post {\n  id\n  title\n  preview(removeMarkdown: true, length: 150)\n  url\n  commentCount\n  isPinned\n  isAnnouncement\n  timeCreated\n  ...PostLinkPost\n  user {\n	id\n	...ReplPostUserPostUser\n	__typename\n  }\n  repl {\n	id\n	...ReplPostRepl\n	__typename\n  }\n  board {\n	id\n	name\n	color\n	__typename\n  }\n  recentComments(count: 3) {\n	id\n	preview(removeMarkdown: true, length: 500)\n	timeCreated\n	user {\n	  id\n	  ...ReplPostRecentCommentUser\n	  __typename\n	}\n	__typename\n  }\n  __typename\n}\n\nfragment PostLinkPost on Post {\n  id\n  url\n  __typename\n}\n\nfragment SearchPageResultsDoc on SearchResultIndexedDoc {\n  path\n  section\n  contents\n  contentMatches {\n	start\n	length\n	__typename\n  }\n  __typename\n}\n\nfragment SearchPageResultsFile on SearchResultIndexedFile {\n  repl {\n	id\n	title\n	iconUrl\n	url\n	owner {\n	  ... on User {\n		id\n		image\n		username\n		__typename\n	  }\n	  ... on Team {\n		id\n		image\n		username\n		__typename\n	  }\n	  __typename\n	}\n	__typename\n  }\n  filePath\n  fileContents\n  fileContentMatches {\n	start\n	length\n	__typename\n  }\n  __typename\n}\n",
			},
		];
		try {
			const response = await axios.post("https://replit.com/graphql", data, { headers: this.options.headers });
			const searchResults = response.data[0].data.search.fileResults.results.items;
			return searchResults;
		} catch (e: any) {
			if (e.message) console.error("Error searching", query, e.message);
			else console.error("Error searching", query, e);
			return [];
		}
	}

	async *ReplBatchSearch(queries: Search[]) {
		for await (const query of queries) {
			const result = await this.Search(query.value, query.first);
			yield result;
		}
	}

	private GetFileVariantPath(path: string, variant: string): string {
		if (path.indexOf(".") === -1) {
			return `${path}.${variant}`;
		}

		const pathParts = path.split(".");
		const extension = pathParts.pop();
		const newPath = `${pathParts.join(".")}.${variant}.${extension}`;
		return newPath;
	}

	async CheckValues(values: string[]) {
		let checkedValues = [];
		for await (const chunckedValues of this.ChunkArray(values, 10)) {
			console.log("Checking...", chunckedValues.length, "values");
			let promises = [];
			chunckedValues.forEach(async (v) => {
				let p = this.options.check(v);
				promises.push(this.options.check(v));
				let isValid = await p;
				if (isValid) {
					console.log("Checked", v, "is valid");
					checkedValues.push(v);
				} else console.log("Checked", v, "is invalid");
			});
			await Promise.all(promises);
			await Wait(500);
		}
		return checkedValues;
	}

	async Start() {
		const start = Date.now();
		console.log("Starting...");
		let items = [];

		for await (const search of this.ChunkArray(this.options.searches, 3)) {
			console.log("Searching...", search.length, "queries");
			for await (const t of this.ReplBatchSearch(search)) {
				console.log("Found", t.length, "search results");
				items = [...items, ...t];
			}
			await Wait(5000);
		}

		console.log("Found Total", items.length, "search results");

		const data = JSON.stringify(items, null, 4);

		await fs.writeFile(this.options.output, data);

		if (this.options.filter) {
			console.log("Filtering search results...");
			let fiteredFilePath = this.GetFileVariantPath(this.options.output, "filtered");
			const filtered = data.match(this.options.filter);
			let distnicted = Array.from(new Set(filtered));
			let distnictedData = JSON.stringify(distnicted, null, 4);
			console.log("Filtered number of search results:", distnicted.length);
			await fs.writeFile(fiteredFilePath, distnictedData);

			if (this.options.check) {
				console.log("Checking search results...");
				let checkedFilePath = this.GetFileVariantPath(this.options.output, "checked");
				const checked = await this.CheckValues(distnicted);
				let checkedData = JSON.stringify(checked, null, 4);
				await fs.writeFile(checkedFilePath, checkedData);
				console.log("Checked number of search results:", checked.length);
			}
		}

		const end = Date.now();
		console.log("Finished in", (end - start) / 1000, "seconds");
	}
}

export default ReplitScraper;
