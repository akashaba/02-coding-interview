import { useState, useRef, useEffect } from 'react';
import './OutputPanel.css';

function OutputPanel({ code, language, output, setOutput, socket, roomId, isConnected }) {
  const [isRunning, setIsRunning] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const pyodideRef = useRef(null);

  // Load Pyodide from CDN when component mounts
  useEffect(() => {
    const loadPyodideFromCDN = async () => {
      try {
        if (!pyodideRef.current && !window.loadPyodide) {
          // Dynamically load Pyodide script from CDN
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
          script.async = true;
          
          script.onload = async () => {
            try {
              pyodideRef.current = await window.loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
              });
              setPyodideReady(true);
              console.log('Pyodide loaded successfully from CDN');
            } catch (error) {
              console.error('Failed to initialize Pyodide:', error);
            }
          };
          
          script.onerror = () => {
            console.error('Failed to load Pyodide script from CDN');
          };
          
          document.head.appendChild(script);
        } else if (window.loadPyodide && !pyodideRef.current) {
          // If script already loaded but Pyodide not initialized
          pyodideRef.current = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
          });
          setPyodideReady(true);
          console.log('Pyodide loaded successfully from CDN');
        }
      } catch (error) {
        console.error('Failed to load Pyodide:', error);
      }
    };

    loadPyodideFromCDN();
  }, []);

  const executeCode = async () => {
    setIsRunning(true);
    setOutput('Running code...');

    try {
      let result;
      
      if (language === 'javascript') {
        // Execute JavaScript code safely
        const logs = [];
        const customConsole = {
          log: (...args) => logs.push(args.join(' ')),
          error: (...args) => logs.push('Error: ' + args.join(' ')),
          warn: (...args) => logs.push('Warning: ' + args.join(' '))
        };

        try {
          // Create a function from the code and execute it
          const func = new Function('console', code);
          func(customConsole);
          result = logs.join('\n') || 'Code executed successfully (no output)';
        } catch (error) {
          result = `Error: ${error.message}`;
        }
      } else if (language === 'python') {
        // Execute Python using Pyodide (WASM)
        if (!pyodideReady || !pyodideRef.current) {
          result = '⏳ Loading Python runtime (Pyodide)...\nPlease wait a moment and try again.';
        } else {
          try {
            // Redirect stdout to capture print statements
            await pyodideRef.current.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
            `);

            // Execute the user's code
            await pyodideRef.current.runPythonAsync(code);

            // Get the captured output
            const stdout = await pyodideRef.current.runPythonAsync('sys.stdout.getvalue()');
            result = stdout || 'Code executed successfully (no output)';
          } catch (error) {
            result = `Python Error: ${error.message}`;
          }
        }
      } else if (language === 'java') {
        result = 'Java execution requires a backend compiler service.\nConsider using services like Judge0 or JDoodle API.';
      } else if (language === 'cpp') {
        result = 'C++ execution requires a backend compiler service.\nConsider using services like Judge0 or Wandbox API.';
      } else if (language === 'csharp') {
        result = 'C# execution requires a backend compiler service.\nConsider using .NET Compiler Platform (Roslyn) on the backend.';
      } else if (language === 'go') {
        result = 'Go execution requires a backend compiler service.\nConsider using Go Playground API.';
      } else if (language === 'rust') {
        result = 'Rust execution requires a backend compiler service.\nConsider using Rust Playground API.';
      } else if (language === 'typescript') {
        // For TypeScript, transpile to JavaScript and execute
        result = 'TypeScript execution requires transpilation.\nInstall @babel/standalone or typescript package for browser execution.';
      } else {
        result = `Execution not supported for ${language} yet.`;
      }

      setOutput(result);
      
      // Emit the result to all users in the room
      if (socket && isConnected && roomId) {
        socket.emit('code-executed', { roomId, output: result });
      }
    } catch (error) {
      const errorMsg = `Execution Error: ${error.message}`;
      setOutput(errorMsg);
      
      // Emit error to all users
      if (socket && isConnected && roomId) {
        socket.emit('code-executed', { roomId, output: errorMsg });
      }
    } finally {
      setIsRunning(false);
    }
  };

  const clearOutput = () => {
    setOutput('');
    
    // Emit clear event to all users in the room
    if (socket && isConnected && roomId) {
      socket.emit('output-cleared', { roomId });
    }
  };

  return (
    <div className="output-panel">
      <div className="output-header">
        <h3>Output</h3>
        <div className="output-actions">
          <button 
            className="run-btn" 
            onClick={executeCode}
            disabled={isRunning}
          >
            {isRunning ? '⏳ Running...' : '▶️ Run Code'}
          </button>
          <button className="clear-btn" onClick={clearOutput}>
            Clear
          </button>
        </div>
      </div>
      <div className="output-content">
        <pre>{output || 'Click "Run Code" to execute your code.'}</pre>
      </div>
      <div className="output-info">
        <p>💡 <strong>Note:</strong> JavaScript and Python run directly in the browser using WASM (Pyodide for Python). 
        {!pyodideReady && language === 'python' && <span> Python runtime is loading...</span>}
        {pyodideReady && language === 'python' && <span className="ready-badge"> ✅ Python ready</span>}
        <br />Other languages require backend compiler services for security and proper execution.</p>
      </div>
    </div>
  );
}

export default OutputPanel;
