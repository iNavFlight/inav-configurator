# INAV JavaScript Programming Tab

## Installation Instructions

This folder contains the JavaScript Programming tab for INAV Configurator.

### Files Needed:

All files are available as artifacts in the Claude conversation.
Copy each artifact to its corresponding location:

**Main Tab Files:**
1. javascript_programming.html (from artifact: javascript_tab_html)
2. javascript_programming.js (from artifact: javascript_tab_js)

**Transpiler Core:**
3. transpiler/index.js (from artifact: inav_module_index)
4. transpiler/transpiler/index.js (from artifact: inav_transpiler_index)
5. transpiler/transpiler/parser.js (from artifact: inav_transpiler_parser)
6. transpiler/transpiler/codegen.js (from artifact: inav_transpiler_codegen)
7. transpiler/transpiler/optimizer.js (from artifact: inav_transpiler_optimizer)

**API Definitions:**
8. transpiler/api/types.js (from artifact: inav_api_types)
9. transpiler/api/definitions/index.js (from artifact: inav_api_index)
10. transpiler/api/definitions/flight.js (from artifact: inav_api_flight)
11. transpiler/api/definitions/override.js (from artifact: inav_api_override_v2)
12. transpiler/api/definitions/waypoint.js (from artifact: inav_api_waypoint)
13. transpiler/api/definitions/rc.js (from artifact: inav_api_rc)

**Editor:**
14. transpiler/editor/diagnostics.js (from artifact: inav_diagnostics)

**Examples:**
15. transpiler/examples/index.js (from artifact: inav_examples)

### Integration:

Add to main.html:
```html
<li class="tab_javascript_programming">
  <a href="#" i18n="tabJavaScriptProgramming"></a>
</li>
```

Add to main.js:
```javascript
javascript_programming: {
    setup: TABS.javascript_programming.initialize,
    cleanup: TABS.javascript_programming.cleanup
},
```

Add to locales/en/messages.json:
```json
{
  "tabJavaScriptProgramming": {
    "message": "JavaScript Programming"
  },
  "javascriptTranspile": { "message": "Transpile to INAV" },
  "javascriptLoad": { "message": "Load from FC" },
  "javascriptSave": { "message": "Save to FC" },
  "javascriptClear": { "message": "Clear Editor" }
}
```

### Load Transpiler:

Add to javascript_programming.html before </body>:
```html
<script type="module">
  import { Transpiler } from './transpiler/index.js';
  window.Transpiler = Transpiler;
</script>
```
