function init() {
	let req = new XMLHttpRequest();
	req.open("GET", "db.json", true);
	req.send();
	req.addEventListener("readystatechange", function() {
		if (this.readyState === this.DONE && this.status === 200) {
			try {
				window.db = JSON.parse(this.response)
			} catch(e) {
				alert("Error! Database can't be loaded: " + e.message)
			}
		}
	});

	loadTop10()
}

String.prototype.toHtmlEntities = function() {
	return this.replace(/./gm, function(s) {
		return (s.match(/[a-z0-9\s-_]+/i)) ? s : "&#" + s.charCodeAt(0) + ";";
	});
};

String.prototype.escapeRegExp = function() {
	return this.replace(/./gm, function(s) {
		return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	});
}

var search = document.getElementById("search"),
	result = document.getElementById("result"),
	keyword = document.getElementById("keyword"),
	count = document.getElementById("count"),
	list = document.getElementById("list"),
	top10 = document.getElementById("top-10");

function loadTop10() {
	let req = new XMLHttpRequest();
	req.open("GET", "https://raw.githubusercontent.com/projectdiscovery/nuclei-templates/master/TOP-10.md", true);
	req.send();
	req.addEventListener("readystatechange", function() {
		if (this.readyState === this.DONE && this.status === 200) {
			var list = Array.from(this.response.matchAll(/^\|\s\w+.+?\|\s+\d+\s\|\s(\w+)/gm)).map(match => match[1]),
				output = "";
			console.log(list);
			list.forEach(function(user) {
				output += `<a class="contributor" href="https://github.com/${user}" target="_blank">` +
					`<img class="nes-avatar is-large is-rounded lazy" src="//github.com/${user}.png?size=64" onerror="this.onerror=null, this.src='//github.com/github.png?size=64'">` +
					`<p>${user}</p></a>\n`
			});
			top10.innerHTML = output
		}
	})
}

function doSuggest(keyword) {
	search.value = keyword;
	doSearch()
}

function doSearch() {
	var input = search.value,
		regex = new RegExp(input.escapeRegExp(), "i"),
		i = 0,
		output = "";

	if (input === "") {
		result.style.display = "none";
		return
	}

	window.db.forEach(function(e) {
		if ((e.author.toString().search(regex) != -1) || (e.id.search(regex) != -1) || (e.name.search(regex) != -1)) {
			output += `<li><a href="${e.url}" target="_blank">${e.name}</a></li>`;
			i++
		}
	});

	count.innerText = i;
	keyword.innerText = input.toHtmlEntities();
	list.innerHTML = output;
	result.style.display = "block"
};

search.addEventListener("keyup", doSearch);