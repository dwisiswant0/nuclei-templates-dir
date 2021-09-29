#!/env/bin python

import glob
import json
import re
import yaml

blob = "https://github.com/projectdiscovery/nuclei-templates/blob/master"
data = []
files = glob.glob("/home/dw1/Documents/nuclei-templates/**/*.yaml", recursive=True)

for template in files:
	path = re.sub(r".*nuclei-templates", "", template)
	with open(template, "r") as stream:
		obj = yaml.safe_load(stream)
		try:
			data.append({"author": obj['info']['author'], "id": obj['id'], "name": obj['info']['name'], "url": blob + path})
		except:
			pass

print(json.dumps(data, indent=4))