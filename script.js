const repo = "projectdiscovery/nuclei-templates"

var blob = `https://github.com/${repo}/blob/main`,
	cmd = document.getElementById("command"),
	cmdDialog = document.getElementById("command-dialog"),
	cmdTitle = document.getElementById("command-title"),
	cmdURL = document.getElementById("command-url");
	contributors = document.getElementById("contributors"),
	count = document.getElementById("count"),
	countIssue = document.getElementById("count-issue"),
	dialog = document.getElementById("dialog"),
	dialogMsg = document.getElementById("dialog-message"),
	header = document.getElementById("header"),
	historySearchIssue = "",
	keyword = document.getElementById("keyword"),
	keywordIssue = document.getElementById("keyword-issue"),
	list = document.getElementById("list"),
	listIssue = document.getElementById("list-issue"),
	octocat = document.getElementsByClassName("github-link")[0],
	rateLimited = document.getElementById("rate-limited-issue"),
	result = document.getElementById("result"),
	resultIssue = document.getElementById("result-issue"),
	search = document.getElementById("search"),
	searchIssue = document.getElementById("search-issue"),
	shrug = document.getElementById("shrug"),
	shrugIssue = document.getElementById("shrug-issue"),
	suggest = document.getElementById("suggest"),
	top10 = document.getElementById("top-10"),
	version = document.getElementById("version"),
	versionBadge = document.getElementById("version-badge");

String.prototype.toHtmlEntities = function() {	
	return this.replace(/./gm, function(s) {
		return (s.match(/[a-z0-9\s-_]+/i)) ? s : "&#" + s.charCodeAt(0) + ";";
	});
};

String.prototype.escapeRegExp = function() {
	return this.replace(/./gm, function(s) {
		return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	});
};

document.body.onscroll = function() {
	if (window.pageYOffset > 50) {
		header.setAttribute("class", "sticky");
		octocat.classList.remove("active")
	} else {
		header.removeAttribute("class");
		octocat.classList.add("active")
	}
};

function init() {
	let db = window.localStorage.getItem("db");
	if (db == null) {
		getDb()
	} else {
		window.db = JSON.parse(db)
		let req = new XMLHttpRequest();
		req.open("GET", "https://raw.githubusercontent.com/dwisiswant0/nuclei-templates-dir/master/VERSION", true);
		req.send();
		req.addEventListener("readystatechange", function() {
			if (this.readyState === this.DONE && this.status === 200) {
				if (this.response.trim() !== window.db["version"]) {
					getDb()
				} else {
					toggle()
				}
			}
		})
	}
	loadTop10()
}

function toggle(e) {
	if (e) {
		dialogMsg.innerText = "Database can't be loaded: " + e.toString();
		dialog.showModal()
	} else {
		version.innerText = window.db["version"];
		versionBadge.removeAttribute("style")
		suggest.style.display = "block";
		search.removeAttribute("disabled");
		getQueryHash()
	}
}

function getDb() {
	let req = new XMLHttpRequest();
	req.open("GET", "db.json.gz", true);
	req.responseType = "arraybuffer";
	req.send();
	req.addEventListener("readystatechange", function() {
		if (this.readyState === this.DONE) {
			try {
				const data = pako.inflate(this.response, {to:"string"});
				window.db = JSON.parse(data);
				window.localStorage.setItem("db", data);
				toggle()
			} catch(e) {
				toggle(e)
			}
		}
	});
}

function loadTop10() {
	let req = new XMLHttpRequest();
	req.open("GET", `https://raw.githubusercontent.com/${repo}/main/TOP-10.md`, true);
	req.send();
	req.addEventListener("readystatechange", function() {
		if (this.readyState === this.DONE && this.status === 200) {
			var list = Array.from(this.response.matchAll(/^\|\s\w+.+?\|\s+\d+\s\|\s(\w+)/gm)).map(match => match[1]),
				output = "";

			list.forEach(function(user) {
				output += `<a class="contributor" href="https://github.com/${user}" target="_blank">` +
					`<img class="nes-avatar is-large is-rounded lazy" src="//github.com/${user}.png?size=64" onerror="this.onerror=null, this.src='//github.com/github.png?size=64'">` +
					`<p>${user}</p></a>\n`
			});
			top10.innerHTML = output;
			contributors.style.display = "block"
		}
	})
}

function genCommand(obj) {
	var cmdTxt = "$ nuclei -u ",
		path = obj.getAttribute("href").replace(`${blob}/`, "");

	if (path.startsWith(`file/`)) {
		cmdTxt += `"DIRECTORY" -t "${path}"`
	} else if (path.startsWith(`workflows/`)) {
		cmdTxt += `"URL" -w "${path}"`
	} else if (path.startsWith(`headless/`)) {
		cmdTxt += `"URL" -t "${path}" -headless`
	} else if (path.startsWith(`dns/`) || path.startsWith(`network/`)) {
		cmdTxt += `"HOST" -t "${path}"`
	} else {
		cmdTxt += `"URL" -t "${path}"`
	}

	cmd.innerText = cmdTxt;
	hljs.highlightAll();
	cmdTitle.innerText = obj.innerText;
	cmdURL.setAttribute("href", `${blob}/${path}`);
	cmdDialog.showModal();

	return false
}

function getQueryHash() {
	var params = location.hash.substr(1).split('&'),
		keyword = "";

	params.forEach(function(val) {
		var split = val.split("=");
		if (split[0] == "q") {
			keyword = split[1];
			return
		}
	});

	if (keyword !== "") {
		doSuggest(keyword)
	}
}

function doSuggest(keyword) {
	search.value = keyword;
	doSearch()
}

function replaceState(keyword) {
	var URL = window.location.pathname + (keyword != "" ? `#q=${keyword}` : "");
	window.history.replaceState(null, window.document.title, URL);
}

function getIcon(type, state, size) {
	if (typeof size != "number" || size < 1) size = 16;

	let path = "", color = "#";

	switch (state) {
		case "open":
			color += "42a0ff";
			path = type == "pull_request" ? `<path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"></path>` : type == "issue" && `<path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path><path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"></path>`;
			break;
		case "closed":
			color += "a371f7";
			path = type == "pull_request" ? `<path d="M5 3.254V3.25v.005a.75.75 0 110-.005v.004zm.45 1.9a2.25 2.25 0 10-1.95.218v5.256a2.25 2.25 0 101.5 0V7.123A5.735 5.735 0 009.25 9h1.378a2.251 2.251 0 100-1.5H9.25a4.25 4.25 0 01-3.8-2.346zM12.75 9a.75.75 0 100-1.5.75.75 0 000 1.5zm-8.5 4.5a.75.75 0 100-1.5.75.75 0 000 1.5z"></path>` : type == "issue" && `<path d="M11.28 6.78a.75.75 0 00-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l3.5-3.5z"></path><path d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-1.5 0a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"></path>`;
			break;
	}

	return `<svg style="fill: ${color}" viewBox="0 0 ${size} ${size}" version="1.1" width="${size}" height="${size}" aria-hidden="true">` +
		path + `</svg>`
}

function doSearch() {
	var input = search.value.trim(),
		regex = new RegExp(input.escapeRegExp(), "i"),
		i = 0,
		output = "";

	replaceState(input);

	if (input === "") {
		result.style.display = "none";
		return
	}

	window.db["data"].forEach(function(e) {
		if ((e.author.toString().search(regex) != -1) || (e.id.search(regex) != -1) || (e.name.search(regex) != -1) || (e.tags.search(regex) != -1)) {
			var title = `${e.path.startsWith("cves") ? `${e.id}: ` : ""}${e.name}`,
				severity = e.severity == "" ? "none" : e.severity.toLowerCase();

			output += `<li><div class="severity-indicator"><div class="severity-indicator_separator"></div><div class="severity-indicator_separator"></div>` +
				`<div class="severity-indicator_separator"></div><div class="severity-indicator_separator"></div>` +
				`<div class="severity-indicator_progress severity-indicator_progress-${severity}"></div></div> ` +
				`<a href="${blob}/${e.path}" onclick="return genCommand(this);">${title}</a></li>`;
			i++
		}
	});

	0 == i ? shrug.style.display = "block" : shrug.style.display = "none";

	count.innerText = i;
	keyword.innerText = input;
	list.innerHTML = output;
	result.style.display = "block"
};

function doSearchIssue() {
	var input = searchIssue.value.trim(),
		i = 0,
		output = res = "";

	if (input === "") {
		resultIssue.style.display = "none";
		return
	} else if (input == historySearchIssue) {
		return
	}

	let req = new XMLHttpRequest();
	req.open("GET", `https://api.github.com/search/issues?q=${encodeURIComponent(input)}+repo:${repo}+in:title&sort=created&order=desc&per_page=100`, true);
	req.setRequestHeader("Accept", "application/vnd.github.v3.text-match+json");
	req.send();

	req.onreadystatechange = function() {
		if (this.readyState === this.DONE) {
			res = JSON.parse(this.response);

			if (this.status == 200) {
				i = res.total_count;
				res.items.forEach(function(e) {
					type = typeof e.pull_request == "object" ? "pull_request" : "issue";
					output += `<li>${getIcon(type, e.state)} <a href="https://github.com/${repo}/${type == "pull_request" ? "pull" : type == "issue" && type + "s"}/${e.number}" target="_blank">${e.title}</a></li>`;
				});

				res.total_count > 100 ? output += `<br><p>The display limit is 100, for the rest navigate to the <a href="https://github.com/${repo}/issues?q=${encodeURIComponent(input)}" target="_blank">GitHub repository page</a>.</p>` : false;

				i == 0 ? shrugIssue.style.display = "block" : shrugIssue.style.display = "none"
			} else if (this.status == 403) {
				rateLimited.style.display = "block";
				shrugIssue.style.display = "none"
			} else {
				rateLimited.style.display = "none"
			}

			countIssue.innerText = i;
			keywordIssue.innerText = input;
			listIssue.innerHTML = output;
			resultIssue.style.display = "block"
		}
	}

	historySearchIssue = input
};

search.addEventListener("keyup", doSearch);
searchIssue.addEventListener("keyup", doSearchIssue);