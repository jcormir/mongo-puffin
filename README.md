# mongo-puffin

![Mongo Puffin](puffin.svg)

MongoDB tools that you didn't know you needed until now

- [Commands](#commands)
- [Examples](#examples)
- [Repository Illustration](#repository-illustration)

## Commands

- ping
- ops
- ops_repl
- conns
- txn_counts
- search_score
- uptime
- time
- collections / colls
- mname
- uname
- tls
- wiredtiger
- os
- mem
- arch
- whoami
- whatsmyuri
- engines
- cmdline

## Examples

Simple loading of script and running ping command.

```text
admin> load("/path/to/your/mongo-puffin/index.js");
Loaded mongo-puffin v0.1

You will find commands under 'mp' namespace. Example: mp.uptime()
Number of commands available: 21
true
admin> mp.ping()
P0NG! 5ms, ok: 1
admin>
```

## Repository Illustration

The repository social media image can be found at this [link](https://freesvg.org/vector-clip-art-of-bird-silhouette-drawn-from-black-dots).
