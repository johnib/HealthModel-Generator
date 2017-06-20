let program = require('commander');
let fs = require('fs');
let xmlGenerator = require('js2xmlparser');
let uuid = require('uuid/v4');
let domparser = require('./domparser');

program
	.version('1.0.0')
	.option('-c, --config [path]', 'config file path')
	.option('-o, --output [path]', 'output file path (health model definition)')
	.option('-u, --update-test-xmls', 'update the test-list xml files with the new GUIDs')
	.parse(process.argv);

const config = JSON.parse(fs.readFileSync(program.config, 'utf8'));
generateHealthModel(config);

process.exit(0);

// End of program here

function generateHealthModel(config) {
	const hmTree = createHealthModelTree(config);
	const xml = xmlGenerator.parse("HealthModelConfiguration", hmTree)
		.replace(/'/g, '"')
		.replace('<?xml version="1.0"?>', '<?xml version="1.0" encoding="utf-8"?>');

	fs.writeFileSync(program.output, xml);
	config.nodes.forEach(function (node) {
		domparser.updateTestFile(node.monitorIds, node.testListPath);
	});

}

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