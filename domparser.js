
let fs = require('fs');
let path = require('path');
let xmldom = require('xmldom');
let DOMParser = new xmldom.DOMParser();
let XMLSerializer = new xmldom.XMLSerializer();

module.exports.updateTestFile = (monitorIds, testFilePath) => {
    const fileContent = fs.readFileSync(testFilePath, 'utf8');
    const doc = DOMParser.parseFromString(fileContent, 'application/xml');
    let tests = doc.getElementsByTagName("Test");

    monitorIds.forEach(monitorIdObj => {
        const name = monitorIdObj.TestName;
        const monitorId = monitorIdObj.MonitorId;
        
        let didFindTest = false;
        for (testNumber in tests) {
            const test = tests[testNumber];
            if (test.firstChild && test.firstChild.nextSibling && test.firstChild.nextSibling.firstChild) {

                const testName = test.firstChild.nextSibling.firstChild.data;
                if (testName === name) {
                    
                    const monitorEl = test.getElementsByTagName("Monitoring")[0];
                    if (monitorEl) {
                        monitorEl.setAttribute("MonitorId", monitorId);
                        didFindTest = true;
                    }
                }
            }
        }

        if (!didFindTest) {
            console.warn(`Test name ${name} was not found in ${path.basename(testFilePath)}`);
        }
    })

    const newFileContent = XMLSerializer.serializeToString(doc);
    fs.writeFileSync(testFilePath, newFileContent);
}