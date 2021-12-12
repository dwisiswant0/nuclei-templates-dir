var blob = "https://github.com/projectdiscovery/nuclei-templates/blob/master";
	contributors = document.getElementById("contributors"),
	count = document.getElementById("count"),
	dialog = document.getElementById("dialog"),
	dialogMsg = document.getElementById("dialog-message"),
	header = document.getElementById("header"),
	keyword = document.getElementById("keyword"),
	list = document.getElementById("list"),
	octocat = document.getElementsByClassName("github-link")[0],
	result = document.getElementById("result"),
	search = document.getElementById("search"),
	suggest = document.getElementById("suggest"),
	top10 = document.getElementById("top-10"),
	version = document.getElementById("version"),
	versionBadge = document.getElementById("version-badge"),
	shrug = document.getElementById("shrug"),
	cmd = document.getElementById("command"),
	cmdDialog = document.getElementById("command-dialog"),
	cmdTitle = document.getElementById("command-title"),
	cmdURL = document.getElementById("command-url");

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
	let req = new XMLHttpRequest();
	req.open("GET", "db.json", true);
	req.send();
	req.addEventListener("readystatechange", function() {
		if (this.readyState === this.DONE) {
			try {
				window.db = JSON.parse(this.response);
				version.innerText = window.db["version"];
				versionBadge.removeAttribute("style")
				suggest.style.display = "block";
				search.removeAttribute("disabled");
				getQueryHash()
			} catch(e) {
				dialogMsg.innerText = "Database can't be loaded: " + e.message;
				dialog.showModal()
			}
		}
	});

	loadTop10()
}

function loadTop10() {
	let req = new XMLHttpRequest();
	req.open("GET", "https://raw.githubusercontent.com/projectdiscovery/nuclei-templates/master/TOP-10.md", true);
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

search.addEventListener("keyup", doSearch);