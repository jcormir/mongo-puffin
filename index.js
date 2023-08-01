// Create the namespace object
const mp = {};
const atlas_hosted = "Collection command aggregate stage $search is available only on MongoDB Atlas";

function _countFunctions(obj) {
    let count = 0;
    
    for (let prop in obj) {
        if (typeof obj[prop] === 'function') {
            count++;
        }
    }

    return count;
}

function _loadFunctions(obj, ns) {
    for (let prop in obj) {
        if (typeof obj[prop] === 'function') {
            ns[prop] = obj[prop];
        }
    }
}

function _version() {
    const versionString = db.version();
    const versionParts = versionString.split('.');
  
    const majorVersion = parseInt(versionParts[0]);
    const minorVersion = parseInt(versionParts[1]);
    const patchVersion = parseInt(versionParts[2]);
    
    return {
      major: majorVersion,
      minor: minorVersion,
      patch: patchVersion
    };
}

function _is_atlas() {
    return db.runCommand({ connectionStatus: 1 }).authInfo.isAtlas;
}

function _dict_str(dict) {
    const length = Object.keys(dict).length;
    let dict_str = "";
    let i = 0;

    for (let key in dict) {
        // Add key and value
        if (dict.hasOwnProperty(key)) {
            dict_str += key + ": " + dict[key];
        }

        // Add newline if not the last line
        if (i < length - 1) { dict_str += "\n"; }
        
        // Increment counter
        i++;
    }

    return dict_str;
}

/**
 * Converts number of bytes to number of megabytes
 * @param {number} num Number of bytes to convert 
 * @returns {number} Conversion to megabytes
 */
function to_mb(num) {
    return Math.round(num / 1048576);
}

// Module
let mpModule = (function() {
    const version = "0.1";

    // Collect host, server build, atlas connection, and server version
    const host_info = db.hostInfo();
    const server_build_info = db.serverBuildInfo();
    const is_atlas = _is_atlas();
    const server_version = _version();

    // Version check that allow for dynamic calls.
    // Example: _require_version(5), _require_version(4, 4), etc.
    function _require_version(major) {
        if (server_version.major != major) { return true; }
    
        let arg_len = arguments.length;
    
        if (arg_len > 1) { 
            let minor = arguments[0];
            if (server_version.minor != minor) { return true; }
        }
        
        if (arg_len > 2) {
            let patch = arguments[1];
            if (server_version.patch != patch) { return true; }
        }
        
        return false;
    }

    function _admin_cmd(cmd) {
        const current_database = db.getName()
        const cmd_result = db.adminCommand(cmd);
        return (cmd_result.ok === 1) ? cmd_result : null;
    }

    function _db_cmd(cmd) {
        const cmd_result = db.runCommand(cmd);
        return (cmd_result.ok === 1) ? cmd_result : null;
    }

    function _is_master() {
        return db.isMaster()['ismaster']
    }

    // Command functions
    function _arch() {
        return db.serverBits();
    }

    function _uname() {
        const system_hostname = host_info['system']['hostname'];
        const os_type = host_info['os']['type'];
        const extra_version = host_info['extra']['versionString'];
    
        const values = [
            os_type,
            system_hostname,
            extra_version];
    
        return values.join(" ");
    }

    function _os() {
        const os_name = host_info['os']['name'];
        const os_type = host_info['os']['type'];
        const os_version = host_info['os']['version'];
    
        const values = [
            os_name,
            os_type,
            os_version
        ];
    
        return values.join(" ");
    }
    
    function _time() {
        const iso_date = host_info['system']['currentTime']
        const human_readable_date = iso_date.toString();
        
        return human_readable_date;
    }

    function _mname() {
        const mongo_version = server_build_info['version'];
        const mongo_git_version = server_build_info['gitVersion'];

        const values = [
            "MongoDB",
            mongo_version,
            mongo_git_version
        ];

        return values.join(" ");
    }

    function _uptime() {
    	const server_status = db.serverStatus();
        
	    // Uptime
        const uptime_seconds = server_status.uptime;
        const uptime_days = Math.floor(uptime_seconds / (24 * 60 * 60));
        const uptime_hours = Math.floor((uptime_seconds % (24 * 60 * 60)) / (60 * 60));
        const uptime_minutes = Math.floor((uptime_seconds % (60 * 60)) / 60);
    
        // Current time
        const current_date_time = new Date();
        const formatted_time = current_date_time.getHours().toString().padStart(2, '0') + ':' + current_date_time.getMinutes().toString().padStart(2, '0');
        
        // Current queue & active clients
        const active_clients = server_status.globalLock.activeClients;
        const current_queue = server_status.globalLock.currentQueue;
      
        const active_clients_values = [
            active_clients['total'],
            active_clients['readers'],
            active_clients['writers']
        ];
        
        const currentQueueValues = [
            current_queue['total'],
            current_queue['readers'],
            current_queue['writers']
        ];
    
        const values = [
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
    function _txn_counts() {
    	const server_status = db.serverStatus();
	    const ss_txns = server_status.transactions;
        let txn_msg = [];

        txn_msg.push(ss_txns.totalStarted + " txns started");
        txn_msg.push(ss_txns.totalAborted + " txns aborted");
        txn_msg.push(ss_txns.totalCommitted + " txns committed");

        // Calculate percentage aborted, show 0 if none started.
        var percentage_aborted = Math.round(ss_txns.totalAborted * 100 / ss_txns.totalStarted);
        if (ss_txns.totalStarted == 0) percentage_aborted = 0;

        txn_msg.push(percentage_aborted + "% txns aborted");

        return txn_msg.join("\n");
    }

    function _ping() {
	    const start_time = new Date();
        const pong = db.runCommand("ping");
	    const end_time = new Date();
        const time_diff = end_time - start_time;
        const ok = pong.ok;
        let ping_msg = "P0NG! " + time_diff + "ms, ok: " + ok;

        if (time_diff >= 100) ping_msg += ", high latency";

        return ping_msg;
    }

    function _mem() {
    	const server_stats = db.serverStatus();
        const wt_cache_current_bytes = wt.cache['bytes currently in the cache'];
        const wired_tiger_cache_size = to_mb(wt_cache_current_bytes);

        let mem_msg = `Mongod virtual memory:  ${server_stats.mem.virtual}MB\n`;
        mem_msg += `Mongod resident memory: ${server_stats.mem.resident}MB\n`;
        mem_msg += `WiredTiger cache size:  ${wired_tiger_cache_size}MB`;

        return mem_msg;
    }

    function _wiredtiger() {
    	const server_status = db.serverStatus();
        const wt = server_status.wiredTiger;
	    const wt_cache_current_bytes = wt.cache['bytes currently in the cache'];
        const wt_cache_size = to_mb(wt_cache_current_bytes);

        // Cache reads
	    const wt_cache_disk_reads = wt.cache['application threads page read from disk to cache count'];
        const wt_cache_disk_read_time = wt.cache['application threads page read from disk to cache time (usecs)'];
        const wt_cache_avg_reads = wt_cache_disk_read_time/1000/wt_cache_disk_reads;
	    
        // Cache writes
        const wt_cache_disk_writes = wt.cache['application threads page write from cache to disk count'];
        const wt_cache_disk_write_time = wt.cache['application threads page write from cache to disk time (usecs)'];
        const wt_cache_avg_writes = wt_cache_disk_write_time/1000/wt_cache_disk_writes;

        // Build WiredTiger command output
        let wt_msg = `WiredTiger cache size: ${wt_cache_size}MB\n`;
        wt_msg += `WiredTiger cache disk read count: ${wt_cache_disk_reads}\n`
        wt_msg += `WiredTiger cache disk write count: ${wt_cache_disk_writes}\n`
        wt_msg += `WiredTiger cache disk read time: ${wt_cache_disk_read_time}ms\n`
        wt_msg += `WiredTiger cache disk write time: ${wt_cache_disk_write_time}ms\n`

        wt_msg += `Avg. disk read time: ${wt_cache_avg_reads}ms\n`;
        wt_msg += `Avg. disk write time: ${wt_cache_avg_writes}ms`;

	    return wt_msg;
    }
    
    function _search_score(collection_name, query, path) {
        // Check for MongoDB Atlas, stage $search is only on MongoDB Atlas
        if (!is_atlas) {
            return atlas_hosted;
        }

        let collection = db.getCollection(collection_name);

        collection.aggregate([
            {
                $search: {
                    text: {
                        query: query,
                        path: path,
                    },
                },
            },
            {$limit: 3,},
            {$project: {
                name: 1,
                score: { $meta: "searchScore" },
            },
            },
        ]);
    }

    function _ops() {
        const counters  = db.serverStatus()['opcounters'];
        return _dict_str(counters);
    }

    function _ops_repl() {
        const counters  = db.serverStatus()['opcountersRepl'];
        return _dict_str(counters);
    }

    function _tls() {
        const trans_sec = db.serverStatus()['transportSecurity'];
        return _dict_str(trans_sec);
    }

    // Collections (alias: colls)
    function _colls() { return collections(); }
    function _collections() {
        return db.getCollectionNames();
    }

    function _conns() {
        if (_require_version(5, 0)) { return "Requires version 5.0"; }
    }

    function _whatsmyuri() {
        const wmi = db.runCommand({ whatsmyuri: 1 });
        return wmi.you;
    }

    function _whoami() {
        const conn_status = db.runCommand({ connectionStatus: 1 });
        let whoami_msg = [];

        if (conn_status.ok === 1) {
            const auth_info = conn_status['authInfo'];
            const auth_users = auth_info.authenticatedUsers;
            const auth_roles = auth_info.authenticatedUserRoles;
          
            auth_users.forEach(user => whoami_msg.push(`${user.user}/${user.db}`));
            auth_roles.forEach(role => whoami_msg.push(`${role.role}/${role.db}`));
        } else {
            print("Authentication information retrieval failed");
        }

        return whoami_msg.join("\n");
    }

    /**
     * Outputs command line options used to start mongo
     * @returns {string} String of command line options
     */
    function _cmdline() {
        const cmdline_results = _db_cmd({ getCmdLineOpts: 1 });
        return cmdline_results['argv'].join(" ");
    }

    /**
     * Outputs supported storage engines
     * @returns {string} String of supported storage engines
     */
    function _engines() {
        const engines_results = _db_cmd({ buildInfo: 1 });

        if (engines_results)
            return engines_results['storageEngines'].join("\n");
    }

    function _conn_pool_stats() {
        if (!_is_master())
            return db.runCommand({ connPoolStats: 1 });
        else
            return "Connect to secondary to check connection pool statistics"
    }

    // Expose the public functions
    return {
        version: version,
        arch: _arch,
        uname: _uname,
        os: _os,
        time: _time,
        mname: _mname,
        uptime: _uptime,
	    txn_counts: _txn_counts,
        ping: _ping,
	    mem: _mem,
	    wiredtiger: _wiredtiger,
        search_score: _search_score,
        colls: _colls,
        collections: _collections,
        ops: _ops,
        ops_repl: _ops_repl,
        tls: _tls,
        conns: _conns,
        whatsmyuri: _whatsmyuri,
        whoami: _whoami,
        cmdline: _cmdline,
        engines: _engines,
        conn_pool_stats: _conn_pool_stats
    };
})();

// Load module functions
_loadFunctions(mpModule, mp);

// Output module details
print(`Loaded mongo-puffin v${mpModule.version}\n`);
print("You will find commands under 'mp' namespace. Example: mp.uptime()");
print("Number of commands available:", _countFunctions(mpModule));
