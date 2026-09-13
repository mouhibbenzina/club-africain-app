module.exports = {
  apps: [
    {
      name: 'club-africain-api',
      script: 'index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-err.log',
      merge_logs: true,
      time: true,
      exp_backoff_restart_delay: 500,
      max_restarts: 10,
    },
  ],
};