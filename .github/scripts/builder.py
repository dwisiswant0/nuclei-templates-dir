#!/env/bin python

import glob
import io
import json
import os
import re
import shutil
import sys
import tempfile
import yaml

from contextlib import closing
from urllib.request import urlopen
from zipfile import ZipFile

temp = tempfile.mkdtemp()
name = "nuclei-templates"
repo = "projectdiscovery/" + name
data = {}

def get_latest():
	latest = json.loads(urlopen("https://api.github.com/repos/%s/releases/latest" % (repo)).read())
	return latest["tag_name"]

try:
	if sys.argv[1] == "get-latest":
		print(get_latest())
except:
	pass
else:
	sys.exit(0)

print("Get latest releases...", file=sys.stderr)
data["version"] = get_latest()
data["data"] = []

print("Downloading %s tag..." % (data["version"]), file=sys.stderr)
with closing(urlopen("https://github.com/%s/archive/refs/tags/%s.zip" % (repo, data["version"]))) as stream:
	with ZipFile(io.BytesIO(stream.read())) as zfile:
		zfile.extractall(path=temp)

tpl = glob.glob("%s/%s-%s/**/*.yaml" % (temp, name, data["version"][1:]), recursive=True)

print("Building data...", file=sys.stderr)
for template in tpl:
	path = re.sub(r"^(/[\w\.\-]+){3}/", "", template)
	with open(template, "r") as stream:
		obj = yaml.safe_load(stream)

		author = obj['info']['author'] if obj.get("info", {}).get("author") else ""
		ID = obj['id'] if obj.get("id") else ""
		name = obj['info']['name'] if obj.get("info", {}).get("name") else ""
		severity = obj['info']['severity'] if obj.get("info", {}).get("severity") else ""
		tags = obj['info']['tags'] if obj.get("info", {}).get("tags") else ""

		try:
			data["data"].append(
				{
					"author": author,
					"id": ID,
					"name": name,
					"severity": severity,
					"tags": tags,
					"path": path
				}
			)
		except:
			pass

print(json.dumps(data, indent=4))
shutil.rmtree(temp)