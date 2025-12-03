import Editor from '@monaco-editor/react';
import './CodeEditor.css';

function CodeEditor({ code, language, onChange }) {
  const handleEditorChange = (value) => {
    onChange(value || '');
  };

  // Map language names to Monaco editor language IDs
  const getMonacoLanguage = (lang) => {
    const languageMap = {
      javascript: 'javascript',
      python: 'python',
      java: 'java',
      cpp: 'cpp',
      csharp: 'csharp',
      go: 'go',
      rust: 'rust',
      typescript: 'typescript'
    };
    return languageMap[lang] || 'javascript';
  };

  return (
    <div className="code-editor">
      <Editor
        height="100%"
        language={getMonacoLanguage(language)}
        value={code}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  );
}

export default CodeEditor;
