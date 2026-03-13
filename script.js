// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    });
});

// Update line numbers
function updateLineNumbers(textareaId, lineNumbersId) {
    const textarea = document.getElementById(textareaId);
    const lineNumbers = document.getElementById(lineNumbersId);
    
    if (!textarea || !lineNumbers) return;
    
    const lines = textarea.value ? textarea.value.split('\n').length : 1;
    const lineNumbersArray = Array.from({length: lines}, (_, i) => `<div>${i + 1}</div>`);
    lineNumbers.innerHTML = lineNumbersArray.join('');
    
    // Remove old listener if exists
    textarea.onscroll = null;
    
    // Sync vertical scroll only
    textarea.onscroll = function() {
        lineNumbers.scrollTop = textarea.scrollTop;
    };
}

function updateOutputLineNumbers(outputId, lineNumbersId) {
    const output = document.getElementById(outputId);
    const lineNumbers = document.getElementById(lineNumbersId);
    
    if (!output || !lineNumbers) return;
    
    const text = output.textContent || output.innerText;
    const lines = text ? text.split('\n').length : 1;
    const lineNumbersArray = Array.from({length: lines}, (_, i) => `<div>${i + 1}</div>`);
    lineNumbers.innerHTML = lineNumbersArray.join('');
    
    // Remove old listener if exists
    output.onscroll = null;
    
    // Sync vertical scroll only
    output.onscroll = function() {
        lineNumbers.scrollTop = output.scrollTop;
    };
}

// Initialize line numbers on input
['json-input', 'xml-input', 'compress-input'].forEach(id => {
    const textarea = document.getElementById(id);
    if (textarea) {
        textarea.addEventListener('input', () => {
            updateLineNumbers(id, id + '-lines');
        });
        updateLineNumbers(id, id + '-lines');
    }
});

// JSON Functions
function formatJSON() {
    const input = document.getElementById('json-input').value.trim();
    const output = document.getElementById('json-output');
    
    if (!input) {
        output.textContent = '';
        updateOutputLineNumbers('json-output', 'json-output-lines');
        return;
    }
    
    try {
        const parsed = JSON.parse(input);
        const formatted = JSON.stringify(parsed, null, 2);
        output.innerHTML = syntaxHighlightJSON(formatted);
        updateOutputLineNumbers('json-output', 'json-output-lines');
    } catch (e) {
        output.innerHTML = `<span class="error">Invalid JSON: ${e.message}</span>`;
        updateOutputLineNumbers('json-output', 'json-output-lines');
    }
}

function minifyJSON() {
    const input = document.getElementById('json-input').value.trim();
    const output = document.getElementById('json-output');
    
    if (!input) {
        output.textContent = '';
        updateOutputLineNumbers('json-output', 'json-output-lines');
        return;
    }
    
    try {
        const parsed = JSON.parse(input);
        const minified = JSON.stringify(parsed);
        output.textContent = minified;
        updateOutputLineNumbers('json-output', 'json-output-lines');
    } catch (e) {
        output.innerHTML = `<span class="error">Invalid JSON: ${e.message}</span>`;
        updateOutputLineNumbers('json-output', 'json-output-lines');
    }
}

function clearJSON() {
    document.getElementById('json-input').value = '';
    document.getElementById('json-output').textContent = '';
    updateLineNumbers('json-input', 'json-input-lines');
    updateOutputLineNumbers('json-output', 'json-output-lines');
}

// XML Functions
function formatXML() {
    const input = document.getElementById('xml-input').value.trim();
    const output = document.getElementById('xml-output');
    
    if (!input) {
        output.textContent = '';
        updateOutputLineNumbers('xml-output', 'xml-output-lines');
        return;
    }
    
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(input, 'text/xml');
        
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            const errorText = parserError.textContent || 'Invalid XML structure';
            throw new Error(errorText);
        }
        
        const formatted = formatXMLString(input);
        output.textContent = formatted;
        updateOutputLineNumbers('xml-output', 'xml-output-lines');
    } catch (e) {
        output.innerHTML = `<span class="error">Invalid XML: ${e.message}</span>`;
        updateOutputLineNumbers('xml-output', 'xml-output-lines');
    }
}

function formatXMLString(xml) {
    let formatted = '';
    let indent = 0;
    const tab = '  ';
    
    xml.split(/>\s*</).forEach(node => {
        if (node.match(/^\/\w/)) indent--;
        formatted += tab.repeat(indent) + '<' + node + '>\n';
        if (node.match(/^<?\w[^>]*[^\/]$/)) indent++;
    });
    
    return formatted.substring(1, formatted.length - 2);
}

function minifyXML() {
    const input = document.getElementById('xml-input').value.trim();
    const output = document.getElementById('xml-output');
    
    if (!input) {
        output.textContent = '';
        return;
    }
    
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(input, 'text/xml');
        
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            throw new Error('Invalid XML structure');
        }
        
        const minified = input.replace(/>\s+</g, '><').trim();
        output.textContent = minified;
        updateOutputLineNumbers('xml-output', 'xml-output-lines');
    } catch (e) {
        output.innerHTML = `<span class="error">Invalid XML: ${e.message}</span>`;
    }
}

function clearXML() {
    document.getElementById('xml-input').value = '';
    document.getElementById('xml-output').textContent = '';
    updateLineNumbers('xml-input', 'xml-input-lines');
    updateOutputLineNumbers('xml-output', 'xml-output-lines');
}

// Compress Functions
function compressText() {
    let input = document.getElementById('compress-input').value;
    const output = document.getElementById('compress-output');
    const stats = document.getElementById('compress-stats');
    
    if (!input) {
        output.textContent = '';
        stats.textContent = '';
        return;
    }
    
    const originalSize = new Blob([input]).size;
    let result = input;
    
    try {
        // Check if input is JSON for null/empty removal
        let isJSON = false;
        let jsonObj = null;
        try {
            jsonObj = JSON.parse(input);
            isJSON = true;
        } catch (e) {
            // Not JSON, continue with text operations
        }
        
        if (isJSON && jsonObj) {
            if (document.getElementById('opt-null-values').checked) {
                jsonObj = removeNullValues(jsonObj);
            }
            if (document.getElementById('opt-empty-values').checked) {
                jsonObj = removeEmptyValues(jsonObj);
            }
            result = JSON.stringify(jsonObj);
        }
        
        // Text compression options
        if (document.getElementById('opt-all-whitespace').checked) {
            result = result.replace(/\s+/g, '');
        } else {
            if (document.getElementById('opt-extra-space').checked) {
                result = result.replace(/  +/g, ' ');
            }
            if (document.getElementById('opt-newlines').checked) {
                result = result.replace(/\n/g, '');
            }
            if (document.getElementById('opt-tabs').checked) {
                result = result.replace(/\t/g, '');
            }
        }
        
        const compressedSize = new Blob([result]).size;
        const saved = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
        
        output.textContent = result;
        stats.textContent = `Original: ${originalSize} bytes | Compressed: ${compressedSize} bytes | Saved: ${saved}%`;
        updateOutputLineNumbers('compress-output', 'compress-output-lines');
    } catch (e) {
        output.innerHTML = `<span class="error">Error: ${e.message}</span>`;
    }
}

function removeNullValues(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => removeNullValues(item)).filter(item => item !== null);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.entries(obj)
            .filter(([_, v]) => v !== null)
            .reduce((acc, [k, v]) => {
                acc[k] = removeNullValues(v);
                return acc;
            }, {});
    }
    return obj;
}

function removeEmptyValues(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => removeEmptyValues(item))
            .filter(item => {
                if (item === '') return false;
                if (Array.isArray(item) && item.length === 0) return false;
                if (item !== null && typeof item === 'object' && Object.keys(item).length === 0) return false;
                return true;
            });
    } else if (obj !== null && typeof obj === 'object') {
        return Object.entries(obj)
            .filter(([_, v]) => {
                if (v === '') return false;
                if (Array.isArray(v) && v.length === 0) return false;
                if (v !== null && typeof v === 'object' && Object.keys(v).length === 0) return false;
                return true;
            })
            .reduce((acc, [k, v]) => {
                acc[k] = removeEmptyValues(v);
                return acc;
            }, {});
    }
    return obj;
}

function extractJSON() {
    let input = document.getElementById('compress-input').value;
    const output = document.getElementById('compress-output');
    
    if (!input) {
        output.textContent = '';
        return;
    }
    
    try {
        // Unescape common escape sequences
        let unescaped = input
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\');
        
        // Try to find JSON in the string
        const jsonMatch = unescaped.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const formatted = JSON.stringify(parsed, null, 2);
            output.textContent = formatted;
        } else {
            // Try XML
            const xmlMatch = unescaped.match(/<[\s\S]*>/);
            if (xmlMatch) {
                output.textContent = formatXMLString(xmlMatch[0]);
            } else {
                output.textContent = unescaped;
            }
        }
        updateOutputLineNumbers('compress-output', 'compress-output-lines');
    } catch (e) {
        output.innerHTML = `<span class="error">Could not extract JSON/XML: ${e.message}</span>`;
    }
}

function clearCompress() {
    document.getElementById('compress-input').value = '';
    document.getElementById('compress-output').textContent = '';
    document.getElementById('compress-stats').textContent = '';
    updateLineNumbers('compress-input', 'compress-input-lines');
    updateOutputLineNumbers('compress-output', 'compress-output-lines');
}

// Copy to clipboard
function copyOutput(outputId) {
    const output = document.getElementById(outputId);
    const text = output.textContent || output.innerText;
    
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
        const btn = window.event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = '#4caf50';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Simple syntax highlighting for JSON
function syntaxHighlightJSON(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'json-key';
            } else {
                cls = 'json-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
    });
}
