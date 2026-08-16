import fs from 'fs';
import path from 'path';

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical' | 'debug';
  service: string;
  action?: string;
  nodeId?: string;
  message: string;
  ip?: string;
  details?: any;
}

class FileLogger {
  private logDir: string;
  private logFilePath: string;
  private errorLogFilePath: string;
  private memoryBuffer: SystemLogEntry[] = [];
  private maxMemoryEntries: number = 1000;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFilePath = path.join(this.logDir, 'system.log');
    this.errorLogFilePath = path.join(this.logDir, 'errors.log');
    this.initLogFiles();
  }

  private initLogFiles() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
      if (!fs.existsSync(this.logFilePath)) {
        fs.writeFileSync(this.logFilePath, `[${new Date().toISOString()}] [INFO] [SystemLogger] [INIT] Alex HD System Log initialized\n`, 'utf8');
      }
      this.loadRecentLogsFromDisk();
    } catch (err) {
      console.error('[FileLogger] Failed to initialize log directory/files:', err);
    }
  }

  private loadRecentLogsFromDisk() {
    try {
      if (fs.existsSync(this.logFilePath)) {
        const content = fs.readFileSync(this.logFilePath, 'utf8');
        const lines = content.trim().split('\n').filter(Boolean);
        const recentLines = lines.slice(-300);

        for (const line of recentLines) {
          const parsed = this.parseLogLine(line);
          if (parsed) {
            this.memoryBuffer.push(parsed);
          }
        }
      }
    } catch (e) {
      console.warn('[FileLogger] Could not pre-load logs from disk:', e);
    }
  }

  private parseLogLine(line: string): SystemLogEntry | null {
    // Expected format: [2026-08-16T15:43:12.000Z] [LEVEL] [Service] [ACTION] Message | Details | IP: ...
    const regex = /^\[(.*?)\]\s+\[(.*?)\]\s+\[(.*?)\](?:\s+\[(.*?)\])?\s+(.*)$/;
    const match = line.match(regex);
    if (!match) {
      return {
        id: `log-raw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'System',
        message: line
      };
    }

    const [, timestamp, level, service, action, rest] = match;
    let message = rest;
    let ip = '';
    let nodeId = '';
    let details: any = undefined;

    if (rest.includes(' | IP: ')) {
      const parts = rest.split(' | IP: ');
      message = parts[0];
      ip = parts[1]?.trim();
    }

    if (message.includes(' | Node: ')) {
      const parts = message.split(' | Node: ');
      message = parts[0];
      nodeId = parts[1]?.trim();
    }

    return {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: timestamp || new Date().toISOString(),
      level: (level.toLowerCase() as any) || 'info',
      service: service || 'Core',
      action: action || '',
      nodeId: nodeId || undefined,
      ip: ip || undefined,
      message,
      details
    };
  }

  private writeToDisk(entry: SystemLogEntry) {
    try {
      const actionPart = entry.action ? ` [${entry.action}]` : '';
      const nodePart = entry.nodeId ? ` | Node: ${entry.nodeId}` : '';
      const ipPart = entry.ip ? ` | IP: ${entry.ip}` : '';
      const detailsPart = entry.details ? ` | Details: ${typeof entry.details === 'object' ? JSON.stringify(entry.details) : entry.details}` : '';
      
      const formattedLine = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.service}]${actionPart} ${entry.message}${nodePart}${ipPart}${detailsPart}\n`;

      fs.appendFileSync(this.logFilePath, formattedLine, 'utf8');

      // Also write errors and critical events to errors.log
      if (entry.level === 'error' || entry.level === 'critical') {
        fs.appendFileSync(this.errorLogFilePath, formattedLine, 'utf8');
      }
    } catch (err) {
      console.error('[FileLogger] Failed to write log to disk:', err);
    }
  }

  public log(entry: Omit<SystemLogEntry, 'id' | 'timestamp'> & { timestamp?: string }) {
    const timestamp = entry.timestamp || new Date().toISOString();
    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const fullEntry: SystemLogEntry = {
      id,
      timestamp,
      level: entry.level,
      service: entry.service,
      action: entry.action,
      nodeId: entry.nodeId,
      message: entry.message,
      ip: entry.ip,
      details: entry.details
    };

    // Keep in ring buffer
    this.memoryBuffer.unshift(fullEntry);
    if (this.memoryBuffer.length > this.maxMemoryEntries) {
      this.memoryBuffer.pop();
    }

    // Write to real file on disk
    this.writeToDisk(fullEntry);

    // Also output to Node stdout for development console visibility
    const consolePrefix = `[${fullEntry.level.toUpperCase()}] [${fullEntry.service}]`;
    if (fullEntry.level === 'error' || fullEntry.level === 'critical') {
      console.error(consolePrefix, fullEntry.message, fullEntry.details || '');
    } else if (fullEntry.level === 'warn') {
      console.warn(consolePrefix, fullEntry.message);
    } else {
      console.log(consolePrefix, fullEntry.message);
    }

    return fullEntry;
  }

  public info(service: string, action: string, message: string, details?: any, ip?: string, nodeId?: string) {
    return this.log({ level: 'info', service, action, message, details, ip, nodeId });
  }

  public warn(service: string, action: string, message: string, details?: any, ip?: string, nodeId?: string) {
    return this.log({ level: 'warn', service, action, message, details, ip, nodeId });
  }

  public error(service: string, action: string, message: string, errorOrDetails?: any, ip?: string, nodeId?: string) {
    let details = errorOrDetails;
    if (errorOrDetails instanceof Error) {
      details = {
        name: errorOrDetails.name,
        message: errorOrDetails.message,
        stack: errorOrDetails.stack
      };
    }
    return this.log({ level: 'error', service, action, message, details, ip, nodeId });
  }

  public critical(service: string, action: string, message: string, errorOrDetails?: any, ip?: string, nodeId?: string) {
    let details = errorOrDetails;
    if (errorOrDetails instanceof Error) {
      details = {
        name: errorOrDetails.name,
        message: errorOrDetails.message,
        stack: errorOrDetails.stack
      };
    }
    return this.log({ level: 'critical', service, action, message, details, ip, nodeId });
  }

  public getLogs(filter?: { level?: string; service?: string; search?: string; limit?: number }): SystemLogEntry[] {
    let result = [...this.memoryBuffer];

    if (filter) {
      if (filter.level && filter.level !== 'all') {
        result = result.filter(l => l.level.toLowerCase() === filter.level?.toLowerCase());
      }
      if (filter.service && filter.service !== 'all') {
        result = result.filter(l => l.service.toLowerCase().includes(filter.service!.toLowerCase()));
      }
      if (filter.search && filter.search.trim() !== '') {
        const q = filter.search.toLowerCase();
        result = result.filter(l => 
          l.message.toLowerCase().includes(q) ||
          l.service.toLowerCase().includes(q) ||
          (l.action && l.action.toLowerCase().includes(q)) ||
          (l.nodeId && l.nodeId.toLowerCase().includes(q)) ||
          (l.ip && l.ip.includes(q))
        );
      }
      if (filter.limit && filter.limit > 0) {
        result = result.slice(0, filter.limit);
      }
    }

    return result;
  }

  public getRawLogText(maxBytes: number = 500000): string {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return 'Log file does not exist yet.';
      }
      const stats = fs.statSync(this.logFilePath);
      if (stats.size <= maxBytes) {
        return fs.readFileSync(this.logFilePath, 'utf8');
      }
      const buffer = Buffer.alloc(maxBytes);
      const fd = fs.openSync(this.logFilePath, 'r');
      fs.readSync(fd, buffer, 0, maxBytes, stats.size - maxBytes);
      fs.closeSync(fd);
      return buffer.toString('utf8');
    } catch (err: any) {
      return `Error reading log file: ${err.message}`;
    }
  }

  public clearLogs() {
    try {
      this.memoryBuffer = [];
      const timestamp = new Date().toISOString();
      fs.writeFileSync(this.logFilePath, `[${timestamp}] [INFO] [SystemLogger] [CLEAR] Log file was cleared by administrator\n`, 'utf8');
      if (fs.existsSync(this.errorLogFilePath)) {
        fs.writeFileSync(this.errorLogFilePath, `[${timestamp}] [INFO] [SystemLogger] [CLEAR] Error log was cleared\n`, 'utf8');
      }
      this.info('SystemLogger', 'CLEAR', 'Журнал логов на диске был очищен администратором');
      return true;
    } catch (err) {
      console.error('[FileLogger] Failed to clear logs:', err);
      return false;
    }
  }

  public getLogStats() {
    try {
      const stats = fs.existsSync(this.logFilePath) ? fs.statSync(this.logFilePath) : null;
      return {
        filePath: this.logFilePath,
        errorFilePath: this.errorLogFilePath,
        sizeBytes: stats ? stats.size : 0,
        sizeKb: stats ? Math.round(stats.size / 1024) : 0,
        lastModified: stats ? stats.mtime.toISOString() : null,
        inMemoryCount: this.memoryBuffer.length,
        errorCount: this.memoryBuffer.filter(l => l.level === 'error' || l.level === 'critical').length,
        warnCount: this.memoryBuffer.filter(l => l.level === 'warn').length,
        infoCount: this.memoryBuffer.filter(l => l.level === 'info').length
      };
    } catch (e) {
      return { error: 'Could not read log stats' };
    }
  }
}

export const fileLogger = new FileLogger();
