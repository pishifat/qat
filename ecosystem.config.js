module.exports = {
    apps: [{
        name: 'bn',
        script: 'npm',
        args: 'run prod',
        instances: 1,
        exec_mode: 'fork',
        watch: false,
        max_memory_restart: '500M',
        merge_logs: true,
        time: true,
    }],
};
