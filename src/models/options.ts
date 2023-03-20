import Search from "./search.js";

interface Options {
	searches: Search[];
	headers: {
		[key: string]: string;
	};
	output?: string;
	filter?: RegExp;
	check?: (arg0: string) => Promise<boolean>;
}

export default Options;
