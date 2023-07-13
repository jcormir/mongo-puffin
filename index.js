 // Create the namespace object
const mp = {};

function _countFunctions(obj) {
    var count = 0;
    
    for (var prop in obj) {
        if (typeof obj[prop] === 'function') {
            count++;
        }
    }

    return count;
}

function _loadFunctions(obj, ns) {
    for (var prop in obj) {
        if (typeof obj[prop] === 'function') {
            ns[prop] = obj[prop];
        }
    }
}

// Module
let mpModule = (function() {
    let version = "0.1";

    let hostInfo = db.hostInfo();
    let serverBuildInfo = db.serverBuildInfo();
    let serverStatus = db.serverStatus();
    
    function arch() {
        return db.serverBits();
    }

    function uname() {
        let systemHostname = hostInfo['system']['hostname'];
        let osType = hostInfo['os']['type'];
        let extraVersion = hostInfo['extra']['versionString'];
    
        let values = [
            osType,
            systemHostname,
            extraVersion];
    
        return values.join(" ");
    }

    function os() {
        let osName = hostInfo['os']['name'];
        let osType = hostInfo['os']['type'];
        let osVersion = hostInfo['os']['version'];
    
        let values = [
            osName,
            osType,
            osVersion
        ];
    
        return values.join(" ");
    }
    
    function time() {
        let isoDate = hostInfo['system']['currentTime']
        let humanReadableDate = isoDate.toString();
        
        return humanReadableDate;
    }

    function mname() {
        let mongoVersion = serverBuildInfo['version'];
        let mongoGitVersion = serverBuildInfo['gitVersion'];

        let values = [
            "MongoDB",
            mongoVersion,
            mongoGitVersion
        ];

        return values
        .join(" ");
    }

    function uptime() {
        // Uptime
        var uptimeSeconds = serverStatus.uptime;
        var uptimeDays = Math.floor(uptimeSeconds / (24 * 60 * 60));
        var uptimeHours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
        var uptimeMinutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
    
        // Current time
        var currentDateTime = new Date();
        var formattedTime = currentDateTime.getHours().toString().padStart(2, '0') + ':' + currentDateTime.getMinutes().toString().padStart(2, '0');
        
        // Current queue & active clients
        var activeClients = serverStatus.globalLock.activeClients;
        var currentQueue = serverStatus.globalLock.currentQueue;
      
        let activeClientsValues = [
            activeClients['total'],
            activeClients['readers'],
            activeClients['writers']
        ];
        
        let currentQueueValues = [
            currentQueue['total'],
            currentQueue['readers'],
            currentQueue['writers']
        ];
    
        let values = [
            formattedTime,
            '  up ',
            uptimeDays,
            ' days, ',
            uptimeHours,
            ':',
            uptimeMinutes.toString().padStart(2, '0'),
            ', clients: ',
            activeClientsValues.join("/"),
            ', queue: ',
            currentQueueValues.join("/")
        ];
    
        return values.join("");
    }

    // MongoDB Performance Tuning, page 212
    function txn_counts() {
	var ssTxns = db.serverStatus().transactions;

	print(ssTxns.totalStarted + 0, 'transactions started');
	print(ssTxns.totalAborted + 0, 'transactions aborted');
	print(ssTxns.totalCommitted + 0, 'transactions committed');

	var percentageAborted = Math.round(ssTxns.totalAborted * 100 / ssTxns.totalStarted);
	if (ssTxns.totalStarted == 0) percentageAborted = 0;

	return percentageAborted + "% txns aborted";
    }

    function ping() {
	let startTime = new Date();
        let pong = db.runCommand("ping");
	let endTime = new Date();
	let timeDiff = endTime - startTime;
	let ok = pong.ok;
	
	return "P0NG! " + timeDiff + "ms, ok: " + ok;
    }

    // Expose the public functions
    return {
        version: version,
        arch: arch,
        uname: uname,
        os: os,
        time: time,
        mname: mname,
        uptime: uptime,
	txn_counts: txn_counts,
        ping: ping
    };
})();

// Load module functions
_loadFunctions(mpModule, mp);

// Output module details
print(`Loaded mongo-puffin v${mpModule.version}\n`);
print("You will find commands under 'mp' namespace. Example: mp.uptime()");
print("Number of commands available:", _countFunctions(mpModule));
