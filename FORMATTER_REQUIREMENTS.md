# Text Formatter — Requirements & Design Document

## 1. Overview

The Text Formatter is a client-side browser tool UI application. It provides JSON formatting, XML formatting, and text compression capabilities — all executed entirely within the user's browser. No data is transmitted to any server, ensuring complete data privacy and security.

### 1.1 Problem Statement

Teams frequently use third-party websites (e.g., jsonformatter.org, codebeautify.org) to format, minify, or extract JSON/XML from logs. These external tools pose a significant data security risk:

- Sensitive customer data (PII, PNRs, booking details) is sent to external servers
- No control over how third-party services store or process submitted data
- Potential violation of data handling policies

### 1.2 Solution

A built-in formatter tool that runs 100% in the browser. Zero network calls, zero data storage, zero risk of data leakage.

---

## 2. Functional Requirements

### 2.1 JSON Formatter

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-JSON-01 | Format/pretty-print JSON with 2-space indentation | High |
| FR-JSON-02 | Minify JSON (remove all whitespace) | High |
| FR-JSON-03 | Validate JSON and display meaningful error messages | High |
| FR-JSON-04 | Syntax highlighting with color-coded output | High |
| FR-JSON-05 | Line numbers on both input and output panels | Medium |
| FR-JSON-06 | Copy formatted output to clipboard | High |
| FR-JSON-07 | Clear input and output with a single action | Medium |


### 2.2 XML Formatter

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-XML-01 | Format/pretty-print XML with proper indentation | High |
| FR-XML-02 | Minify XML (remove all whitespace between tags) | High |
| FR-XML-03 | Validate XML structure and display error messages | High |
| FR-XML-04 | Syntax highlighting with color-coded output | High |
| FR-XML-05 | Line numbers on both input and output panels | Medium |
| FR-XML-06 | Copy formatted output to clipboard | High |
| FR-XML-07 | Clear input and output with a single action | Medium |

### 2.3 Compress Text

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-COMP-01 | Remove ALL whitespace (spaces, tabs, newlines) | High |
| FR-COMP-02 | Remove extra whitespace (collapse multiple spaces to one) | High |
| FR-COMP-03 | Remove tabs only | Medium |
| FR-COMP-04 | Remove newlines only | Medium |
| FR-COMP-05 | Remove null values from JSON objects | Medium |
| FR-COMP-06 | Remove empty values (empty strings, arrays, objects) from JSON | Medium |
| FR-COMP-07 | Display compression statistics (original size, compressed size, % saved) | Medium |
| FR-COMP-08 | Extract and format JSON/XML from escaped strings (e.g., log output) | High |
| FR-COMP-09 | Unescape common escape sequences (\", \n, \t, \\) | High |
| FR-COMP-10 | Copy compressed output to clipboard | High |


---

## 3. Non-Functional Requirements

### 3.1 Security

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-SEC-01 | All processing must occur client-side (in browser) | Critical |
| NFR-SEC-02 | No data transmission to any server or external service | Critical |
| NFR-SEC-03 | No local storage or caching of user input | Critical |
| NFR-SEC-04 | Safe for PII, PNRs, and all customer-sensitive data | Critical |

### 3.2 Performance

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-PERF-01 | Handle JSON/XML files up to 12,000+ lines without performance degradation | High |
| NFR-PERF-02 | Format/minify operations complete in < 2 seconds for typical payloads | Medium |
| NFR-PERF-03 | Scrollable text areas with fixed height (no page expansion) | High |
| NFR-PERF-04 | Synchronized scrolling between line numbers and content | Medium |

### 3.3 Usability

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-UI-01 | Consistent Material-UI design matching some existing famous userfriendly application online | High |
| NFR-UI-02 | Responsive layout for desktop and tablet devices | Medium |
| NFR-UI-03 | Dark mode and light mode support | Medium |
| NFR-UI-04 | Clear visual feedback for errors and successful operations | High |
| NFR-UI-05 | Intuitive tab-based navigation between formatters | High |


---

## 4. User Interface Design

### 4.1 Navigation

- **Menu Button**: "Formatter" button in the main navigation bar (left of search box)
- **Hover Behavior**: Submenu appears on hover showing JSON, XML, and Compress Text options
- **Click Behavior**: Clicking "Formatter" navigates to the formatter page (JSON tab by default)

### 4.2 Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Formatter                                               │
│ Format, minify, and compress text directly in your      │
│ browser. Unlike third-party websites, your data never   │
│ leaves your machine...                                  │
├─────────────────────────────────────────────────────────┤
│ [JSON Formatter] [XML Formatter] [Compress Text]       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Input                        Output                    │
│  ┌──────────────────┐        ┌──────────────────┐     │
│  │ 1 | {            │        │ 1 | {            │     │
│  │ 2 |   "key":     │        │ 2 |   "key":     │     │
│  │ 3 |   "value"    │        │ 3 |   "value"    │     │
│  │ 4 | }            │        │ 4 | }            │     │
│  │   |              │        │   |              │     │
│  └──────────────────┘        └──────────────────┘     │
│  [Format] [Minify] [Clear]   [Copy Output]            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```


### 4.3 Code Editor Features

- **Line Numbers**: Displayed on the left side of both input and output
- **Syntax Highlighting**: Color-coded keywords, strings, numbers, booleans
- **Monospace Font**: For proper code alignment
- **Scrollable**: Fixed height with vertical scrollbar for large content
- **Synchronized Scrolling**: Line numbers scroll with content

### 4.4 Theme Support

- **Light Mode**: GitHub color scheme (light background, dark text)
- **Dark Mode**: VS2015 color scheme (dark background, bright syntax colors)
- Automatically switches based on application theme toggle

---

## 5. Technical Design

### 5.1 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                     │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │           React Component Layer                   │ │
│  │  - FormatterPage.tsx                              │ │
│  │  - CodeEditor component                           │ │
│  │  - Tab navigation                                 │ │
│  └───────────────────────────────────────────────────┘ │
│                         ↓                               │
│  ┌───────────────────────────────────────────────────┐ │
│  │         Processing Layer (Pure JS)                │ │
│  │  - JSON.parse() / JSON.stringify()                │ │
│  │  - DOMParser for XML                              │ │
│  │  - String manipulation for compression            │ │
│  └───────────────────────────────────────────────────┘ │
│                         ↓                               │
│  ┌───────────────────────────────────────────────────┐ │
│  │         Rendering Layer                           │ │
│  │  - react-syntax-highlighter                       │ │
│  │  - Material-UI components                         │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  NO NETWORK CALLS • NO SERVER INTERACTION              │
└─────────────────────────────────────────────────────────┘
```


### 5.2 Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 18 + TypeScript | Component-based UI |
| UI Library | Material-UI (MUI) v5 | Consistent design system |
| Syntax Highlighting | react-syntax-highlighter | Color-coded output |
| Routing | React Router v6 | Navigation |
| State Management | React Hooks (useState) | Local component state |
| Build Tool | Vite | Fast development and bundling |

### 5.3 Key Libraries

```json
{
  "react": "^18.2.0",
  "react-syntax-highlighter": "^15.5.0",
  "@mui/material": "^5.15.20",
  "@mui/icons-material": "^5.15.20",
  "react-router-dom": "^6.26.0"
}
```

### 5.4 Client-Side Processing

All operations use native browser APIs:

1. **JSON Processing**
   - `JSON.parse()` - Parse and validate JSON
   - `JSON.stringify(obj, null, 2)` - Format with indentation
   - `JSON.stringify(obj)` - Minify

2. **XML Processing**
   - `DOMParser` - Parse and validate XML
   - Custom `formatXMLString()` - Add indentation
   - Regex-based minification

3. **Text Compression**
   - `String.replace()` with regex patterns
   - Recursive object traversal for null/empty removal
   - `Blob` API for size calculation


---

## 6. Implementation Details

### 6.1 File Structure

```
code/src/
├── pages/
│   └── FormatterPage.tsx          # Main formatter component
├── components/
│   └── SearchAppBar.tsx            # Navigation with Formatter menu
├── routes/
│   └── root.tsx                    # Route configuration
└── main.tsx                        # Route registration
```

### 6.2 Component Hierarchy

```
FormatterPage
├── Header (Title + Description)
├── Tabs (JSON | XML | Compress)
└── TabPanel (for each tab)
    ├── Grid Container
    │   ├── Input Column
    │   │   ├── CodeEditor (editable)
    │   │   └── Action Buttons
    │   └── Output Column
    │       ├── CodeEditor (read-only)
    │       └── Copy Button
    └── Options (Compress tab only)
```

### 6.3 CodeEditor Component

Custom component that provides:
- Line numbers with synchronized scrolling
- Syntax highlighting (read-only mode)
- Native textarea (editable mode)
- Theme-aware styling
- Fixed height with scrolling

**Props:**
```typescript
interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: 'json' | 'xml';
  readOnly?: boolean;
  placeholder?: string;
  minHeight?: number;
}
```


---

## 7. Security Considerations

### 7.1 Data Privacy

✅ **No Network Calls**: All processing happens in the browser's JavaScript engine  
✅ **No Storage**: No localStorage, sessionStorage, or cookies used  
✅ **No Logging**: No analytics or telemetry on user input  
✅ **No Third-Party Services**: No external APIs or CDNs for processing  

### 7.2 Safe for Sensitive Data

The formatter can safely process:
- Personally Identifiable Information (PII)
- Passenger Name Records (PNRs)
- Booking details and itineraries
- API responses with customer data
- Internal system logs
- Configuration files with credentials (though not recommended)

### 7.3 Browser Security

- Runs in the browser's sandboxed JavaScript environment
- No file system access
- No ability to make network requests
- Subject to same-origin policy

---

## 8. Use Cases

### 8.1 Format JSON from API Response

**Scenario**: Developer receives minified JSON from an API call in logs

**Steps**:
1. Copy minified JSON from logs
2. Navigate to Formatter → JSON Formatter
3. Paste into input
4. Click "Format"
5. View formatted, color-coded output with line numbers

### 8.2 Extract JSON from Log String

**Scenario**: JSON is escaped in application logs (e.g., `{\"key\":\"value\"}`)

**Steps**:
1. Navigate to Formatter → Compress Text
2. Paste escaped JSON string
3. Click "Extract & Format JSON/XML"
4. View properly formatted JSON


### 8.3 Remove Null Values from JSON

**Scenario**: API response contains many null fields that clutter the view

**Steps**:
1. Navigate to Formatter → Compress Text
2. Paste JSON
3. Check "Remove null values (JSON)"
4. Click "Compress"
5. Copy cleaned JSON

### 8.4 Minify JSON for Transmission

**Scenario**: Need to reduce JSON payload size for API request

**Steps**:
1. Navigate to Formatter → JSON Formatter
2. Paste formatted JSON
3. Click "Minify"
4. Copy minified output

---

## 9. Testing Requirements

### 9.1 Functional Testing

| Test Case | Expected Result |
|-----------|----------------|
| Format valid JSON | Properly indented output with syntax highlighting |
| Format invalid JSON | Error message displayed |
| Minify JSON | Single-line output, no whitespace |
| Format valid XML | Properly indented XML with syntax highlighting |
| Format invalid XML | Error message displayed |
| Extract escaped JSON | Unescaped and formatted JSON |
| Remove null values | JSON without null properties |
| Remove empty values | JSON without empty strings/arrays/objects |
| Compress text | Whitespace removed, statistics shown |
| Copy to clipboard | Output copied successfully |
| Scroll large file (12k+ lines) | Smooth scrolling, line numbers sync |
| Switch themes | Syntax colors update appropriately |


### 9.2 Security Testing

| Test Case | Expected Result |
|-----------|----------------|
| Monitor network tab during formatting | Zero network requests |
| Check localStorage after use | No data stored |
| Check sessionStorage after use | No data stored |
| Inspect cookies after use | No cookies created |
| Disconnect network and use formatter | All features work offline |

### 9.3 Performance Testing

| Test Case | Expected Result |
|-----------|----------------|
| Format 12,000+ line JSON | Completes in < 2 seconds |
| Scroll through large formatted output | Smooth, no lag |
| Rapid format/minify toggling | No UI freezing |

---

## 10. Future Enhancements

| Feature | Description | Priority |
|---------|-------------|----------|
| YAML Formatter | Format and validate YAML | Low |
| Base64 Encode/Decode | Encode and decode Base64 strings | Low |
| URL Encode/Decode | Encode and decode URL parameters | Low |
| JWT Decoder | Decode and display JWT token contents | Medium |
| Diff Viewer | Compare two JSON/XML documents side by side | Low |
| Keyboard Shortcuts | Ctrl+Enter to format, Ctrl+Shift+M to minify | Low |
| Download Output | Save formatted output as a file | Low |

---

## 11. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-13 | DevOps Winglet | Initial release with JSON, XML, Compress |


---

## 12. Deployment & Access


### 12.2 Browser Compatibility

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome | 90+ | ✅ Supported |
| Edge | 90+ | ✅ Supported |
| Firefox | 88+ | ✅ Supported |
| Safari | 14+ | ✅ Supported |

### 12.3 No Installation Required

- Runs directly in the browser
- No plugins or extensions needed
- No desktop application to install
- Works on any device with a modern browser

---

## 13. Support & Documentation

### 13.1 User Documentation

- In-app description explains security benefits
- Tooltips on compression options
- Clear error messages for invalid input

### 13.2 Developer Documentation

- Code comments in FormatterPage.tsx
- Component prop interfaces documented
- README.md with setup instructions

### 13.3 Contact



---

**END OF DOCUMENT**
