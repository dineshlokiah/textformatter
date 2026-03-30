d(buildTreeNode(data[k], isArr ? undefined : k)));

  const close = document.createElement('div');
  close.textContent = isArr ? ']' : '}';
  close.style.color = 'var(--text2)';
  wrap.appendChild(childWrap);
  wrap.appendChild(close);
  return wrap;
}

  toggle.className = 'tree-toggle';
  const childWrap = document.createElement('div');

  const label = key !== undefined ? `"${key}": ` : '';
  toggle.textContent = `▾ ${label}${isArr ? '[' : '{'}`;
  toggle.addEventListener('click', () => {
    const collapsed = childWrap.style.display === 'none';
    childWrap.style.display = collapsed ? '' : 'none';
    toggle.textContent = `${collapsed ? '▾' : '▸'} ${label}${isArr ? '[' : '{'}`;
  });
  wrap.appendChild(toggle);

  keys.forEach(k => childWrap.appendChilclassName = 'tree-key'; k.textContent = `"${key}": `;
      wrap.appendChild(k);
    }
    span.className = data === null ? 'tree-val-null' : typeof data === 'string' ? 'tree-val-str' : typeof data === 'boolean' ? 'tree-val-bool' : 'tree-val-num';
    span.textContent = data === null ? 'null' : typeof data === 'string' ? `"${data}"` : String(data);
    wrap.appendChild(span);
    return wrap;
  }

  const isArr = Array.isArray(data);
  const keys = Object.keys(data);
  const toggle = document.createElement('span');ile);
  });
});

/* ── Tree View ── */
function renderTree(containerId, data) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  container.appendChild(buildTreeNode(data));
}

function buildTreeNode(data, key) {
  const wrap = document.createElement('div');
  wrap.className = 'tree-node';

  if (data === null || typeof data !== 'object') {
    const span = document.createElement('span');
    if (key !== undefined) {
      const k = document.createElement('span');
      k.one.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const ta = document.getElementById(inputId);
      ta.value = ev.target.result;
      const numsId = inputId === 'json-input' ? 'json-in-nums' : 'xml-in-nums';
      syncLineNums(ta, document.getElementById(numsId));
    };
    reader.readAsText(f (!text) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  a.download = filename;
  a.click();
}

/* ── File Drop ── */
['json-drop', 'xml-drop'].forEach(id => {
  const zone = document.getElementById(id);
  if (!zone) return;
  const inputId = id === 'json-drop' ? 'json-input' : 'xml-input';
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zcument.getElementById('comp-out-nums').innerHTML = '';
  document.getElementById('comp-in-nums').innerHTML = '<div>1</div>';
  document.getElementById('compress-stats').classList.add('hidden');
}

/* ── Copy / Download ── */
function copyOutput(id) {
  const text = document.getElementById(id).textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard'));
}

function downloadOutput(id, filename) {
  const text = document.getElementById(id).textContent;
  if
      document.getElementById('compress-stats').classList.remove('hidden');
      return;
    }
  } catch { /* fall through */ }
  setOutput('compress-output', 'comp-out-nums', extracted, 'text');
  document.getElementById('compress-stats').textContent = 'Unescaped (no JSON/XML detected)';
  document.getElementById('compress-stats').classList.remove('hidden');
}

function clearCompress() {
  document.getElementById('compress-input').value = '';
  document.getElementById('compress-output').innerHTML = '';
  do).textContent = '✓ Extracted and formatted JSON';
    document.getElementById('compress-stats').classList.remove('hidden');
    return;
  } catch { /* try XML */ }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(extracted, 'text/xml');
    if (!doc.getElementsByTagName('parsererror').length) {
      setOutput('compress-output', 'comp-out-nums', formatXMLString(extracted), 'xml');
      document.getElementById('compress-stats').textContent = '✓ Extracted and formatted XML';lementById('compress-stats');
  stats.textContent = `Original: ${origSize} bytes  ·  Compressed: ${compSize} bytes  ·  Saved: ${saved}%`;
  stats.classList.remove('hidden');
}

function extractAndFormat() {
  let input = document.getElementById('compress-input').value;
  if (!input) return;
  let extracted = unescape(input);
  try {
    const parsed = JSON.parse(extracted);
    setOutput('compress-output', 'comp-out-nums', JSON.stringify(parsed, null, 2), 'json');
    document.getElementById('compress-stats' } catch { /* not JSON, skip */ }
  }

  if (allWs) result = result.replace(/\s+/g, '');
  else {
    if (extraWs) result = result.replace(/[ \t]+/g, ' ');
    if (newlines) result = result.replace(/\n+/g, ' ');
    if (tabs) result = result.replace(/\t/g, '');
  }
  result = result.trim();

  const compSize = new Blob([result]).size;
  const saved = origSize > 0 ? ((1 - compSize / origSize) * 100).toFixed(1) : 0;

  setOutput('compress-output', 'comp-out-nums', result, 'text');
  const stats = document.getEWs = document.getElementById('opt-extra-ws').checked;
  const newlines = document.getElementById('opt-newlines').checked;
  const tabs = document.getElementById('opt-tabs').checked;
  const nulls = document.getElementById('opt-nulls').checked;
  const empty = document.getElementById('opt-empty').checked;

  if (nulls || empty) {
    try {
      let parsed = JSON.parse(result);
      if (nulls) parsed = removeNulls(parsed);
      if (empty) parsed = removeEmpty(parsed);
      result = JSON.stringify(parsed);
     return Object.fromEntries(Object.entries(obj)
      .filter(([,v]) => v !== '' && !(Array.isArray(v) && !v.length) && !(v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length))
      .map(([k,v]) => [k, removeEmpty(v)]));
  return obj;
}

function compressText() {
  let input = document.getElementById('compress-input').value;
  if (!input) return;
  const origSize = new Blob([input]).size;
  let result = input;

  const allWs = document.getElementById('opt-all-ws').checked;
  const extra.isArray(obj)) return obj.map(removeNulls).filter(v => v !== null);
  if (obj !== null && typeof obj === 'object')
    return Object.fromEntries(Object.entries(obj).filter(([,v]) => v !== null).map(([k,v]) => [k, removeNulls(v)]));
  return obj;
}

function removeEmpty(obj) {
  if (Array.isArray(obj)) return obj.map(removeEmpty).filter(v => v !== '' && !(Array.isArray(v) && !v.length) && !(v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length));
  if (obj !== null && typeof obj === 'object')
  ) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const c = xmlToObj(child);
      if (obj[child.nodeName] !== undefined) {
        if (!Array.isArray(obj[child.nodeName])) obj[child.nodeName] = [obj[child.nodeName]];
        obj[child.nodeName].push(c);
      } else obj[child.nodeName] = c;
    } else if (child.nodeType === Node.TEXT_NODE) {
      const t = (child.textContent || '').trim();
      if (t) return t;
    }
  }
  return obj;
}

/* ── Compress ── */
function removeNulls(obj) {
  if (Array}

function clearXML() {
  document.getElementById('xml-input').value = '';
  document.getElementById('xml-output').innerHTML = '';
  document.getElementById('xml-out-nums').innerHTML = '';
  document.getElementById('xml-in-nums').innerHTML = '<div>1</div>';
  showXmlError('');
}

function xmlToObj(node) {
  const obj = {};
  if (node.attributes && node.attributes.length) {
    obj['@attr'] = {};
    for (let a of node.attributes) obj['@attr'][a.nodeName] = a.nodeValue;
  }
  for (let child of node.childNodes')[0]); }
}

function minifyXML() {
  const input = unescape(document.getElementById('xml-input').value.trim());
  if (!input) return;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/xml');
    if (doc.getElementsByTagName('parsererror').length > 0)
      throw new Error('Invalid XML structure');
    setOutput('xml-output', 'xml-out-nums', input.replace(/>\s+</g, '><').trim(), 'xml');
    showXmlError('');
  } catch (e) { showXmlError('Invalid XML: ' + e.message); }
parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/xml');
    if (doc.getElementsByTagName('parsererror').length > 0)
      throw new Error(doc.getElementsByTagName('parsererror')[0].textContent);
    const formatted = formatXMLString(input);
    setOutput('xml-output', 'xml-out-nums', formatted, 'xml');
    showXmlError('');
    if (xmlViewMode === 'tree') renderTree('xml-tree-view', xmlToObj(doc.documentElement));
  } catch (e) { showXmlError('Invalid XML: ' + e.message.split('\nxml = xml.replace(/(>)(<)(\/*)/g, '$1\n$2$3');
  xml.split('\n').forEach(line => {
    let indent = 0;
    if (line.match(/.+<\/\w[^>]*>$/)) indent = 0;
    else if (line.match(/^<\/\w/) && pad > 0) pad--;
    else if (line.match(/^<\w[^>]*[^\/]>.*$/)) indent = 1;
    formatted += PADDING.repeat(pad) + line + '\n';
    pad += indent;
  });
  return formatted.trim();
}

function formatXML() {
  const input = unescape(document.getElementById('xml-input').value.trim());
  if (!input) return;
  try {
    const ode');
  document.getElementById('xml-tree-btn').classList.toggle('active', mode === 'tree');
  document.getElementById('xml-code-view').classList.toggle('hidden', mode === 'tree');
  document.getElementById('xml-tree-view').classList.toggle('hidden', mode === 'code');
}

function showXmlError(msg) {
  const el = document.getElementById('xml-error');
  el.textContent = msg;
  el.classList.toggle('hidden', !msg);
}

function formatXMLString(xml) {
  const PADDING = '  ';
  let formatted = '';
  let pad = 0;
  ction clearJSON() {
  document.getElementById('json-input').value = '';
  document.getElementById('json-output').innerHTML = '';
  document.getElementById('json-out-nums').innerHTML = '';
  document.getElementById('json-in-nums').innerHTML = '<div>1</div>';
  showJsonError('');
  document.getElementById('json-tree-view').innerHTML = '';
}

/* ── XML ── */
let xmlViewMode = 'code';

function setXmlView(mode) {
  xmlViewMode = mode;
  document.getElementById('xml-code-btn').classList.toggle('active', mode === 'csyaml.dump(parsed);
    setOutput('json-output', 'json-out-nums', yaml, 'text');
    showJsonError('');
  } catch (e) { showJsonError('Error: ' + e.message); }
}

function yamlToJson() {
  const input = document.getElementById('json-input').value.trim();
  if (!input) return;
  try {
    const parsed = jsyaml.load(unescape(input));
    setOutput('json-output', 'json-out-nums', JSON.stringify(parsed, null, 2), 'json');
    showJsonError('');
  } catch (e) { showJsonError('Invalid YAML: ' + e.message); }
}

funJsonError('');
  } catch (e) { showJsonError('Invalid JSON: ' + e.message); }
}

function deepSort(obj) {
  if (Array.isArray(obj)) return obj.map(deepSort);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc, k) => { acc[k] = deepSort(obj[k]); return acc; }, {});
  }
  return obj;
}

function jsonToYaml() {
  const input = document.getElementById('json-input').value.trim();
  if (!input) return;
  try {
    const parsed = smartParseJSON(input);
    const yaml = j
  try {
    const parsed = smartParseJSON(input);
    setOutput('json-output', 'json-out-nums', JSON.stringify(parsed), 'json');
    showJsonError('');
  } catch (e) { showJsonError('Invalid JSON: ' + e.message); }
}

function sortJSON() {
  const input = document.getElementById('json-input').value.trim();
  if (!input) return;
  try {
    const parsed = smartParseJSON(input);
    const sorted = deepSort(parsed);
    setOutput('json-output', 'json-out-nums', JSON.stringify(sorted, null, 2), 'json');
    showcument.getElementById('json-input').value.trim();
  if (!input) return;
  try {
    const parsed = smartParseJSON(input);
    const formatted = JSON.stringify(parsed, null, 2);
    setOutput('json-output', 'json-out-nums', formatted, 'json');
    showJsonError('');
    if (jsonViewMode === 'tree') renderTree('json-tree-view', parsed);
  } catch (e) { showJsonError('Invalid JSON: ' + e.message); }
}

function minifyJSON() {
  const input = document.getElementById('json-input').value.trim();
  if (!input) return;-code-btn').classList.toggle('active', mode === 'code');
  document.getElementById('json-tree-btn').classList.toggle('active', mode === 'tree');
  document.getElementById('json-code-view').classList.toggle('hidden', mode === 'tree');
  document.getElementById('json-tree-view').classList.toggle('hidden', mode === 'code');
}

function showJsonError(msg) {
  const el = document.getElementById('json-error');
  el.textContent = msg;
  el.classList.toggle('hidden', !msg);
}

function formatJSON() {
  const input = do) s = s.slice(1, -1);
  if (s.includes('\\"') || s.includes('\\n') || s.includes('\\t')) {
    s = s.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, '\n')
         .replace(/\\t/g, '\t').replace(/\\r/g, '\r').replace(/\\\\/g, '\\');
  }
  return s;
}

function smartParseJSON(input) {
  try { return JSON.parse(input); } catch {
    return JSON.parse(unescape(input));
  }
}

/* ── JSON ── */
let jsonViewMode = 'code';

function setJsonView(mode) {
  jsonViewMode = mode;
  document.getElementById('jsonng) {
  const pre = document.getElementById(preId);
  const nums = document.getElementById(numsId);
  if (!text) { pre.innerHTML = ''; nums.innerHTML = ''; return; }
  if (lang === 'json') pre.innerHTML = highlightJSON(text);
  else if (lang === 'xml') pre.innerHTML = highlightXML(text);
  else pre.textContent = text;
  syncOutputLineNums(pre, nums);
}

/* ── Unescape ── */
function unescape(input) {
  let s = input.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))tch}</span>`;
      if (/null/.test(match)) return `<span class="tok-null">${match}</span>`;
      return `<span class="tok-num">${match}</span>`;
    }
  );
}

function highlightXML(xml) {
  return xml
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(&lt;\/?)([\w:-]+)/g, '$1<span class="tok-tag">$2</span>')
    .replace(/([\w:-]+)(=)(&quot;[^&]*&quot;)/g,
      '<span class="tok-attr">$1</span>$2<span class="tok-val">$3</span>');
}

function setOutput(preId, numsId, text, laJSON(json) {
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(
    /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    match => {
      if (/^"/.test(match)) {
        return /:$/.test(match)
          ? `<span class="tok-key">${match}</span>`
          : `<span class="tok-str">${match}</span>`;
      }
      if (/true|false/.test(match)) return `<span class="tok-bool">${ma-input' ? 'json-in-nums' : id === 'xml-input' ? 'xml-in-nums' : 'comp-in-nums';
  el.addEventListener('input', () => syncLineNums(el, document.getElementById(numsId)));
  syncLineNums(el, document.getElementById(numsId));
});

/* ── Toast ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 2200);
}

/* ── Syntax Highlight ── */
function highlighttextarea.scrollTop; });
}

function syncOutputLineNums(preEl, numsEl) {
  const text = preEl.textContent || '';
  const lines = text.split('\n').length;
  numsEl.innerHTML = Array.from({ length: Math.max(lines, 1) }, (_, i) =>
    `<div>${i + 1}</div>`).join('');
  preEl.addEventListener('scroll', () => { numsEl.scrollTop = preEl.scrollTop; });
}

// Wire up input line numbers
['json-input', 'xml-input', 'compress-input'].forEach(id => {
  const el = document.getElementById(id);
  const numsId = id === 'jsonrySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

/* ── Line Numbers ── */
const LINE_H = 22;

function syncLineNums(textarea, numsEl) {
  const lines = (textarea.value || '').split('\n').length;
  numsEl.innerHTML = Array.from({ length: Math.max(lines, 1) }, (_, i) =>
    `<div>${i + 1}</div>`).join('');
  textarea.addEventListener('scroll', () => { numsEl.scrollTop = /* ── Theme ── */
const html = document.documentElement;
const themeBtn = document.getElementById('themeToggle');
themeBtn.addEventListener('click', () => {
  const isDark = html.dataset.theme === 'dark';
  html.dataset.theme = isDark ? 'light' : 'dark';
  themeBtn.textContent = isDark ? '🌙' : '☀️';
});

/* ── Tabs ── */
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.que