const { EventEmitter } = require('events');
const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');

class PythonBridge extends EventEmitter {
  constructor(options = {}) {
    super();
    this.process = null;
    this.port = options.port || 8765;
    this.appRoot = options.appRoot || process.cwd();
  }

  _getPythonExecutable() {
    const candidates = ['python', 'python3', 'py'];
    for (const bin of candidates) {
      try {
        execSync(`${bin} --version`, { stdio: 'ignore' });
        return bin;
      } catch (err) {
        // Continue to next candidate
      }
    }
    throw new Error('No python executable found. Please install Python.');
  }

  async start() {
    if (this.isRunning()) {
      return true;
    }

    const pythonBin = this._getPythonExecutable();
    const scriptPath = path.join(this.appRoot, 'api', 'server.py');

    try {
      if (process.platform === 'win32') {
        execSync(`FOR /F "tokens=5" %a in ('netstat -aon ^| findstr :${this.port}') do taskkill /F /PID %a`, { stdio: 'ignore' });
      } else {
        execSync(`lsof -t -i:${this.port} | xargs -r kill -9`, { stdio: 'ignore' });
      }
    } catch (e) {
      // Ignore if no process is using the port
    }

    this.process = spawn(pythonBin, [scriptPath], {
      cwd: this.appRoot,
      env: { ...process.env, PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8' }
    });

    this.process.stdout.on('data', (data) => {
      this.emit('log', data.toString());
    });

    this.process.stderr.on('data', (data) => {
      this.emit('error', data.toString());
    });

    this.process.on('close', (code) => {
      this.process = null;
      this.emit('exit', code);
    });

    return await this._waitForHealthCheck();
  }

  stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  isRunning() {
    return this.process !== null && !this.process.killed;
  }

  getPort() {
    return this.port;
  }

  _waitForHealthCheck() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 30;
      const intervalMs = 1000;

      const check = () => {
        attempts++;
        const req = http.get(`http://localhost:${this.port}/api/health`, (res) => {
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            retry();
          }
        });

        req.on('error', () => {
          retry();
        });
      };

      const retry = () => {
        if (attempts >= maxAttempts) {
          reject(new Error('Failed to connect to Python backend after 30 seconds'));
        } else if (!this.isRunning()) {
            reject(new Error('Python backend stopped during startup'));
        } else {
          setTimeout(check, intervalMs);
        }
      };

      // Initial wait to give python time to start
      setTimeout(check, 1000);
    });
  }
}

module.exports = { PythonBridge };
