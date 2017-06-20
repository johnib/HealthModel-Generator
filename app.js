let fs = require('fs');
let xmlGenerator = require('js2xmlparser');
let uuid = require('uuid/v4');

const configFile = fs.readFileSync('./hm.config.json');
const config = JSON.parse(configFile.toString('utf8'));

validateConfig(config);

const hmTree = createHealthModelTree(config);
const xml = xmlGenerator.parse("HealthModelConfiguration", hmTree)
	.replace(/'/g, '"')
	.replace('<?xml version="1.0"?>', '<?xml version="1.0" encoding="utf-8"?>');

console.log(xml);

function createHealthModelTree(config) {
	const nodes = config.nodes;
	const monitors = config.monitors;

	const nodesXml = nodes.map(node => {
		const monitorsXml = monitors.map(monitor => {
			return {
				"@": {
					id: uuid().toUpperCase(),
					name: monitor.name,
					severity: monitor.severity || "2",
					sourceType: "MetricTip",
					metricName: getMetricName(monitor.testNamePrefix, node.testNameSuffix),
					kbId: monitor.kbId || "",
					kbOwner: monitor.kbOwner || ""
				}
			}
		})

		return {
			"@": {
				name: node.name,
			},
			Monitors: {
				Monitor: monitorsXml
			}
		}
	});

	let tree = {
		"@": {
			applicationResourceId: config.applicationResourceId
		},
		Nodes: {
			Node: nodesXml
		}
	};

	return tree;
}

function getMetricName(testNamePrefix, testNameSuffix) {
	return `${testNamePrefix}${testNameSuffix} Test Failure Count`
}

function validateConfig(config) {

}