type LogLevels = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const logLevels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const DEFAULT_LOG_LEVEL: string = 'INFO';

function appendError(params: any, error?: Error): any {
  if (error == null) {
    return params;
  }

  const stackAsArray = error.stack == null ? [] : error.stack.split(/\r?\n/);

  return {
    ...params,
    error: {
      name: error.name,
      message: error.message,
      stackTrace: stackAsArray
    }
  };
}

function doLog(levelName: LogLevels, message: string, params: any, printFunc: Function = console.log): void {
  const isEnabled: boolean =
    logLevels[levelName] >= logLevels[(process.env.LOG_LEVEL as LogLevels) || DEFAULT_LOG_LEVEL];

  if (isEnabled) {
    const logJson = {
      level: levelName,
      message,
      params
    };

    printFunc(JSON.stringify(logJson));
  }
}

const log = {
  error: (message: string, params?: any, error?: Error) =>
    doLog('ERROR', message, appendError(params, error), console.error),
  warn: (message: string, params?: any, error?: Error) =>
    doLog('WARN', message, appendError(params, error), console.warn),
  info: (message: string, params?: any) => doLog('INFO', message, params, console.info),
  debug: (message: string, params?: any) => doLog('DEBUG', message, params, console.debug)
};

export default log;
