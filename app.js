let fs = require('fs');
let xmlGenerator = require('js2xmlparser');
let uuid = require('uuid/v4');
let domparser = require('./domparser');

const config = JSON.parse(fs.readFileSync('./hm.config.json', 'utf8'));
validateConfig(config);

const hmTree = createHealthModelTree(config);
const xml = xmlGenerator.parse("HealthModelConfiguration", hmTree)
	.replace(/'/g, '"')
	.replace('<?xml version="1.0"?>', '<?xml version="1.0" encoding="utf-8"?>');

console.log(xml);

config.nodes.forEach(function (node) {
	domparser.updateTestFile(node.monitorIds, node.testListPath);
});

process.exit(0);

function createHealthModelTree(config) {
	const nodes = config.nodes;
	const monitors = config.monitors;

	const nodesXml = nodes.map(node => {
		node.monitorIds = []; // a map between test name to MonitorID

		const monitorsXml = monitors.map(monitor => {
			const monitorId = uuid().toUpperCase();

			node.monitorIds.push({
				TestName: `${monitor.testNamePrefix}${node.testNameSuffix}`,
				MonitorId: monitorId
			});

			return {
				"@": {
					id: monitorId,
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