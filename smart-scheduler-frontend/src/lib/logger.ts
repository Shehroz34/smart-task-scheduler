type LogLevel = "debug" | "info" | "warn" | "error";

const shouldLog =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGS === "true";

function write(level: LogLevel, message: string, meta?: unknown) {
  if (!shouldLog) {
    return;
  }

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [frontend:${level}] ${message}`;

  if (meta === undefined) {
    console[level](prefix);
    return;
  }

  console[level](prefix, meta);
}

export const logger = {
  debug(message: string, meta?: unknown) {
    write("debug", message, meta);
  },
  info(message: string, meta?: unknown) {
    write("info", message, meta);
  },
  warn(message: string, meta?: unknown) {
    write("warn", message, meta);
  },
  error(message: string, meta?: unknown) {
    write("error", message, meta);
  },
};
