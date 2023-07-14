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

    let host_info = db.hostInfo();
    let server_build_info = db.serverBuildInfo();
    let server_status = db.serverStatus();
    
    function arch() {
        return db.serverBits();
    }

    function uname() {
        let system_hostname = host_info['system']['hostname'];
        let os_type = host_info['os']['type'];
        let extra_version = host_info['extra']['versionString'];
    
        let values = [
            os_type,
            system_hostname,
            extra_version];
    
        return values.join(" ");
    }

    function os() {
        let os_name = host_info['os']['name'];
        let os_type = host_info['os']['type'];
        let os_version = host_info['os']['version'];
    
        let values = [
            os_name,
            os_type,
            os_version
        ];
    
        return values.join(" ");
    }
    
    function time() {
        let iso_date = host_info['system']['currentTime']
        let human_readable_date = iso_date.toString();
        
        return human_readable_date;
    }

    function mname() {
        let mongo_version = server_build_info['version'];
        let mongo_git_version = server_build_info['gitVersion'];

        let values = [
            "MongoDB",
            mongo_version,
            mongo_git_version
        ];

        return values
        .join(" ");
    }

    function uptime() {
        // Uptime
        let uptime_seconds = server_status.uptime;
        let uptime_days = Math.floor(uptime_seconds / (24 * 60 * 60));
        let uptime_hours = Math.floor((uptime_seconds % (24 * 60 * 60)) / (60 * 60));
        let uptime_minutes = Math.floor((uptime_seconds % (60 * 60)) / 60);
    
        // Current time
        let current_date_time = new Date();
        let formatted_time = current_date_time.getHours().toString().padStart(2, '0') + ':' + current_date_time.getMinutes().toString().padStart(2, '0');
        
        // Current queue & active clients
        let active_clients = server_status.globalLock.activeClients;
        let current_queue = server_status.globalLock.currentQueue;
      
        let active_clients_values = [
            active_clients['total'],
            active_clients['readers'],
            active_clients['writers']
        ];
        
        let currentQueueValues = [
            current_queue['total'],
            current_queue['readers'],
            current_queue['writers']
        ];
    
        let values = [
            formatted_time,
            '  up ',
            uptime_days,
            ' days, ',
            uptime_hours,
            ':',
            uptime_minutes.toString().padStart(2, '0'),
            ', clients: ',
            active_clients_values.join("/"),
            ', queue: ',
            currentQueueValues.join("/")
        ];
    
        return values.join("");
    }

    // MongoDB Performance Tuning, page 212
    function txn_counts() {
        let ss_txns = db.serverStatus().transactions;
    
        print(ss_txns.totalStarted + 0, 'transactions started');
        print(ss_txns.totalAborted + 0, 'transactions aborted');
        print(ss_txns.totalCommitted + 0, 'transactions committed');

        var percentage_aborted = Math.round(ss_txns.totalAborted * 100 / ss_txns.totalStarted);
        if (ss_txns.totalStarted == 0) percentage_aborted = 0;

        return percentage_aborted + "% txns aborted";
    }

    function ping() {
	    let start_time = new Date();
        let pong = db.runCommand("ping");
	    let end_time = new Date();
        let time_diff = end_time - start_time;
        let ok = pong.ok;
        let ping_msg = "P0NG! " + time_diff + "ms, ok: " + ok;

        if (timeDiff >= 100) ping_msg += ", high latency";

        return ping_msg;
    }

    function mem() {
    	let server_stats = db.serverStatus();
        let wired_tiger_cache_size = Math.round(server_stats.wiredTiger.cache['bytes currently in the cache'] / 1048576);

        mem_msg = `Mongod virtual memory:  ${serverStats.mem.virtual}MB\n`;
        mem_msg += `Mongod resident memory: ${serverStats.mem.resident}MB\n`;
        mem_msg += `WiredTiger cache size:  ${wired_tiger_cache_size}MB`;

        return mem_msg;
    }

    function wiredtiger() {
        let wt = db.serverStatus().wiredTiger;
	    let wt_cache_size = Math.round(wt.cache['bytes currently in the cache'] / 1048576);

        // Cache reads
	    let wt_cache_disk_reads = wt.cache['application threads page read from disk to cache count'];
        let wt_cache_disk_read_time = wt.cache['application threads page read from disk to cache time (usecs)'];
        let wt_cache_avg_reads = wt_cache_disk_read_time/1000/wt_cache_disk_reads;
	    
        // Cache writes
        let wt_cache_disk_writes = wt.cache['application threads page write from cache to disk count'];
        let wt_cache_disk_write_time = wt.cache['application threads page write from cache to disk time (usecs)'];
        let wt_cache_avg_writes = wt_cache_disk_write_time/1000/wt_cache_disk_writes;

        // Build WiredTiger command output
        wt_msg = `WiredTiger cache size: ${wt_cache_size}MB\n`;
        wt_msg += `WiredTiger cache disk read count:  ${wt_cache_disk_reads}\n`
        wt_msg += `WiredTiger cache disk write count: ${wt_cache_disk_writes}\n`
        wt_msg += `WiredTiger cache disk read time:  ${wt_cache_disk_read_time}ms\n`
        wt_msg += `WiredTiger cache disk write time: ${wt_cache_disk_write_time}ms\n`

        wt_msg += `Avg. disk read time:  ${wt_cache_avg_reads}ms`;
        wt_msg += `Avg. disk write time: ${wt_cache_avg_writes}ms\n`;

	    return wt_msg;
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
        ping: ping,
	    mem: mem,
	    wiredtiger, wiredtiger
    };
})();

// Load module functions
_loadFunctions(mpModule, mp);

// Output module details
print(`Loaded mongo-puffin v${mpModule.version}\n`);
print("You will find commands under 'mp' namespace. Example: mp.uptime()");
print("Number of commands available:", _countFunctions(mpModule));
