(function() {
    'use strict';

    const STORAGE_KEY = 'markflow_content';
    const THEME_KEY = 'markflow_theme';
    const COLOR_THEME_KEY = 'markflow_color_theme';

    const $ = id => document.getElementById(id);

    const editor = $('editor');
    const preview = $('preview');
    const saveIndicator = $('save-indicator');
    const wordCountEl = $('word-count');
    const charCountEl = $('char-count');
    const readTimeEl = $('read-time');
    const themeLabel = $('current-theme');
    const loadingOverlay = $('loading-overlay');
    const editorPanel = $('editor-panel');
    const previewPanel = $('preview-panel');
    const resizeHandle = $('resize-handle');
    const fileStatus = $('file-status');

    let history = [];
    let historyIndex = -1;
    let saveTimeout = null;
    let confirmCallback = null;

    const marked = window.marked;
    const hljs = window.hljs;

    const FONT_SIZES = { small: 13, medium: 15, large: 17 };
    let currentFontSize = FONT_SIZES.medium;

    marked.setOptions({
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (e) {}
            }
            try {
                return hljs.highlightAuto(code).value;
            } catch (e) {}
            return code;
        },
        breaks: true,
        gfm: true
    });

    function init() {
        loadFromStorage();
        loadTheme();
        loadColorTheme();
        setupEventListeners();
        updateStats();
        updateFileStatus();
        parseMarkdown();
        
        setTimeout(() => {
            loadingOverlay.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => loadingOverlay.remove(), 300);
        }, 800);
    }

    function updateFileStatus() {
        const statusEl = $('file-status');
        const content = editor.value;
        
        if (!content.trim()) {
            statusEl.textContent = 'Empty';
            statusEl.className = 'text-slate-400 normal-case';
        } else if (content.length > 1000) {
            statusEl.textContent = 'Editing...';
            statusEl.className = 'text-primary-500 normal-case';
        } else {
            statusEl.textContent = 'Ready';
            statusEl.className = 'text-emerald-500 normal-case';
        }
    }

    function loadFromStorage() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            editor.value = saved;
            history = [saved];
            historyIndex = 0;
        }
    }

    function loadTheme() {
        const saved = localStorage.getItem(THEME_KEY) || 'light';
        applyTheme(saved);
    }

    function loadColorTheme() {
        const saved = localStorage.getItem(COLOR_THEME_KEY) || 'blue';
        applyColorTheme(saved);
    }

    function setupEventListeners() {
        editor.addEventListener('input', handleInput);
        editor.addEventListener('scroll', syncScroll);
        editor.addEventListener('keydown', handleKeydown);
        editor.addEventListener('dragover', handleDragOver);
        editor.addEventListener('drop', handleDrop);
        editor.addEventListener('dragleave', handleDragLeave);

        document.addEventListener('click', handleClickOutside);

        $('resize-handle')?.addEventListener('mousedown', initResize);

        setupDropdown();
    }

    function handleInput() {
        addToHistory();
        parseMarkdown();
        updateStats();
        updateFileStatus();
        markUnsaved();
        
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveToStorage, 1000);
    }

    function addToHistory() {
        const content = editor.value;
        
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        
        if (history[history.length - 1] !== content) {
            history.push(content);
            if (history.length > 50) history.shift();
            historyIndex = history.length - 1;
        }
    }

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            editor.value = history[historyIndex];
            parseMarkdown();
            updateStats();
            markUnsaved();
            showToast('Undo', 'info');
        }
    }

    function redo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            editor.value = history[historyIndex];
            parseMarkdown();
            updateStats();
            markUnsaved();
            showToast('Redo', 'info');
        }
    }

    window.formatText = function(type) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const text = editor.value;
        const selected = text.substring(start, end);
        let insertion = '';
        let cursorOffset = 0;

        const formats = {
            bold: { before: '**', after: '**', placeholder: 'bold text' },
            italic: { before: '_', after: '_', placeholder: 'italic text' },
            strike: { before: '~~', after: '~~', placeholder: 'strike text' },
            h1: { before: '# ', after: '', placeholder: 'Heading 1', newline: true },
            h2: { before: '## ', after: '', placeholder: 'Heading 2', newline: true },
            quote: { before: '> ', after: '', placeholder: 'Quote', newline: true },
            code: { before: '`', after: '`', placeholder: 'code' },
            codeblock: { before: '```\n', after: '\n```', placeholder: 'code', newline: true },
            ul: { before: '- ', after: '', placeholder: 'List item', newline: true },
            ol: { before: '1. ', after: '', placeholder: 'List item', newline: true },
            task: { before: '- [ ] ', after: '', placeholder: 'Task', newline: true },
            link: { before: '[', after: '](url)', placeholder: 'link text', cursor: -5 },
            image: { before: '![', after: '](url)', placeholder: 'alt text', cursor: -5 }
        };

        const fmt = formats[type];
        if (!fmt) return;

        if (selected) {
            insertion = fmt.before + selected + fmt.after;
        } else {
            insertion = fmt.before + fmt.placeholder + fmt.after;
            cursorOffset = fmt.cursor !== undefined ? fmt.cursor : 0;
        }

        editor.value = text.substring(0, start) + insertion + text.substring(end);

        const newPos = start + fmt.before.length + (selected ? selected.length : fmt.placeholder.length) + cursorOffset;
        editor.focus();
        editor.setSelectionRange(newPos, newPos);

        handleInput();
    };

    function handleKeydown(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    formatText('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    formatText('italic');
                    break;
                case 'k':
                    e.preventDefault();
                    formatText('link');
                    break;
                case 's':
                    e.preventDefault();
                    saveToStorage();
                    showToast('Saved!', 'success');
                    break;
                case 'z':
                    e.preventDefault();
                    e.shiftKey ? redo() : undo();
                    break;
                case 'y':
                    e.preventDefault();
                    redo();
                    break;
            }
        }
    }

    function parseMarkdown() {
        const content = editor.value;

        if (!content.trim()) {
            preview.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-slate-400">
                    <i class="bi bi-file-earmark-text text-5xl mb-4 opacity-30"></i>
                    <p class="text-sm">Start typing to see preview</p>
                </div>`;
            return;
        }

        try {
            const html = marked.parse(content);
            preview.innerHTML = html;
            
            preview.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        } catch (e) {
            console.error('Parse error:', e);
        }
    }

    function updateStats() {
        const content = editor.value;
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        const readTime = Math.max(1, Math.ceil(words / 200));

        wordCountEl.textContent = words;
        charCountEl.textContent = chars;
        readTimeEl.textContent = readTime;
    }

    function saveToStorage() {
        localStorage.setItem(STORAGE_KEY, editor.value);
        markSaved();
    }

    function markUnsaved() {
        saveIndicator.classList.add('text-amber-500');
        saveIndicator.classList.remove('text-emerald-500');
        saveIndicator.innerHTML = '<i class="bi bi-exclamation-circle-fill"></i><span>Unsaved</span>';
    }

    function markSaved() {
        saveIndicator.classList.remove('text-amber-500');
        saveIndicator.classList.add('text-emerald-500');
        saveIndicator.innerHTML = '<i class="bi bi-check-circle-fill"></i><span>Saved</span>';
    }

    function initResize(e) {
        e.preventDefault();
        
        const startX = e.clientX;
        const startEditorWidth = editorPanel.offsetWidth;
        
        function onMove(e) {
            const diff = e.clientX - startX;
            const newWidth = Math.max(200, Math.min(window.innerWidth - 400, startEditorWidth + diff));
            const percent = (newWidth / window.innerWidth) * 100;
            
            editorPanel.style.flex = `0 ${percent}%`;
            previewPanel.style.flex = `0 ${100 - percent}%`;
        }
        
        function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            resizeHandle.classList.remove('bg-primary-500');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
        
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        resizeHandle.classList.add('bg-primary-500');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    function syncScroll() {
        const scrollPercent = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
        preview.scrollTop = scrollPercent * (preview.scrollHeight - preview.clientHeight);
    }

    function handleDragOver(e) {
        e.preventDefault();
        editor.classList.add('ring-2', 'ring-primary-500', 'ring-opacity-50');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        editor.classList.remove('ring-2', 'ring-primary-500', 'ring-opacity-50');
    }

    function handleDrop(e) {
        e.preventDefault();
        editor.classList.remove('ring-2', 'ring-primary-500', 'ring-opacity-50');
        
        const files = e.dataTransfer?.files;
        if (files?.length > 0) {
            handleImageUpload(files[0]);
        }
    }

    function handleImageUpload(file) {
        if (!file.type.startsWith('image/')) {
            showToast('Please drop an image', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const base64 = event.target.result;
            const markdown = `![${file.name}](${base64})`;
            insertTextAtCursor(markdown);
            showToast('Image added!', 'success');
        };
        reader.onerror = () => showToast('Failed to read image', 'error');
        reader.readAsDataURL(file);
    }

    function insertTextAtCursor(text) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const content = editor.value;

        editor.value = content.substring(0, start) + text + content.substring(end);
        const newPos = start + text.length;
        editor.focus();
        editor.setSelectionRange(newPos, newPos);

        handleInput();
    }

    function setupDropdown() {
        const dropdownBtn = document.querySelector('[data-dropdown]');
        const dropdown = dropdownBtn?.parentElement;

        dropdownBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown?.classList.toggle('open');
        });

        document.addEventListener('click', () => {
            dropdown?.classList.remove('open');
        });
    }

    function handleClickOutside(e) {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
        }
    }

    window.applyTheme = function(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            $('hljs-light').disabled = true;
            $('hljs-dark').disabled = false;
        } else {
            document.documentElement.classList.remove('dark');
            $('hljs-light').disabled = false;
            $('hljs-dark').disabled = true;
        }
        
        localStorage.setItem(THEME_KEY, theme);
    };

    window.toggleTheme = function() {
        const current = document.documentElement.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
    };

    window.setTheme = function(theme) {
        applyTheme(theme);
        showToast(`${theme.charAt(0).toUpperCase() + theme.slice(1)} mode`, 'info');
    };

    window.applyColorTheme = function(theme) {
        document.documentElement.setAttribute('data-color-theme', theme);
        
        const labels = { blue: 'Ocean Blue', green: 'Forest Green', purple: 'Lavender' };
        themeLabel.textContent = labels[theme] || 'Ocean Blue';
        
        localStorage.setItem(COLOR_THEME_KEY, theme);
    };

    window.setColorTheme = function(theme) {
        applyColorTheme(theme);
        showToast(theme.charAt(0).toUpperCase() + theme.slice(1) + ' theme', 'info');
    };

    window.exportData = function(type) {
        const content = editor.value;
        const timestamp = new Date().toISOString().slice(0, 10);
        
        if (type === 'md') {
            if (!content.trim()) {
                showToast('Nothing to export!', 'error');
                return;
            }
            const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `markflow-${timestamp}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Exported as .md', 'success');
        } else if (type === 'html') {
            if (!content.trim()) {
                showToast('Nothing to export!', 'error');
                return;
            }
            const parsedHtml = marked.parse(content);
            const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MarkFlow Export</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.8; color: #1e293b; }
        h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; }
        h2 { border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }
        h1 { font-size: 2rem; }
        pre { background: #f8fafc; padding: 1rem; overflow-x: auto; border-radius: 0.5rem; }
        blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; margin: 1rem 0; font-style: italic; color: #64748b; }
        code { background: #f1f5f9; padding: 0.2em 0.4em; border-radius: 0.25rem; font-family: 'JetBrains Mono', monospace; }
        pre code { background: transparent; padding: 0; }
        a { color: #3b82f6; text-decoration: none; }
        a:hover { text-decoration: underline; }
        ul, ol { padding-left: 1.5rem; }
        li { margin-bottom: 0.5em; }
        table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        th, td { border: 1px solid #e2e8f0; padding: 0.75rem; text-align: left; }
        th { background: #f8fafc; }
        img { max-width: 100%; border-radius: 0.5rem; margin: 1rem 0; }
        hr { border: none; border-top: 2px solid #e2e8f0; margin: 2rem 0; }
    </style>
</head>
<body>
${parsedHtml}
</body>
</html>`;
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `markflow-${timestamp}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Exported as .html', 'success');
        } else if (type === 'txt') {
            if (!content.trim()) {
                showToast('Nothing to export!', 'error');
                return;
            }
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `markflow-${timestamp}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Exported as .txt', 'success');
        }
    };

    window.copyToClipboard = function() {
        const html = marked.parse(editor.value);
        navigator.clipboard.writeText(html).then(() => {
            showToast('Copied to clipboard', 'success');
        }).catch(() => {
            showToast('Failed to copy', 'error');
        });
    };

    window.toggleFullscreen = function() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            showToast('Fullscreen', 'info');
        } else {
            document.exitFullscreen();
            showToast('Exit fullscreen', 'info');
        }
    };

    window.confirmClear = function() {
        confirmCallback = () => {
            editor.value = '';
            history = [''];
            historyIndex = 0;
            localStorage.removeItem(STORAGE_KEY);
            parseMarkdown();
            updateStats();
            markSaved();
            showToast('Editor cleared', 'info');
        };
        
        const dialog = $('confirm-dialog');
        $('confirm-message').textContent = 'Are you sure you want to clear the editor? This cannot be undone.';
        dialog.showModal();
    };

    window.closeConfirm = function() {
        $('confirm-dialog').close();
        confirmCallback = null;
    };

    window.confirmAction = function() {
        if (confirmCallback) {
            confirmCallback();
            confirmCallback = null;
        }
        $('confirm-dialog').close();
    };

    window.showPanel = function(panel) {
        const editorTab = $('tab-editor');
        const previewTab = $('tab-preview');
        
        if (panel === 'editor') {
            editorPanel.classList.remove('hide');
            previewPanel.classList.remove('show');
            previewPanel.style.display = 'none';
            editorPanel.style.display = 'flex';
            
            editorTab.classList.add('bg-primary-100', 'dark:bg-primary-900/30', 'text-primary-600');
            previewTab.classList.remove('bg-primary-100', 'dark:bg-primary-900/30', 'text-primary-600');
        } else {
            editorPanel.classList.add('hide');
            previewPanel.classList.add('show');
            editorPanel.style.display = 'none';
            previewPanel.style.display = 'flex';
            
            previewTab.classList.add('bg-primary-100', 'dark:bg-primary-900/30', 'text-primary-600');
            editorTab.classList.remove('bg-primary-100', 'dark:bg-primary-900/30', 'text-primary-600');
        }
    };

    function downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function showToast(message, type = 'info') {
        const container = $('toast-container');
        const toast = document.createElement('div');
        
        const icons = {
            success: 'bi bi-check-circle-fill',
            error: 'bi bi-x-circle-fill',
            info: 'bi bi-info-circle-fill'
        };
        
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="${icons[type]}"></i><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    document.addEventListener('DOMContentLoaded', init);

})();