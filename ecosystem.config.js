module.exports = {
  apps: [
    {
      name: 'veck-platform',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: 1
      },
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      error_file: 'logs/error.log',
      out_file: 'logs/output.log',
      log_file: 'logs/combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      // Автоперезагрузка при сбоях
      min_uptime: '10s',
      max_restarts: 20,
      // Мониторинг и метрики
      pmx: true,
      // Настройки для высокой нагрузки
      node_args: '--max-old-space-size=2048',
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 5000,
      // Логирование
      merge_logs: true,
      // Мониторинг
      monitor: true
    }
  ]
};
