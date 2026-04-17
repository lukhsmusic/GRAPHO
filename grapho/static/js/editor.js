import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "https://esm.sh/@codemirror/view@6";
import { EditorState } from "https://esm.sh/@codemirror/state@6";
import { markdown } from "https://esm.sh/@codemirror/lang-markdown@6";
import { defaultKeymap, indentWithTab, history, historyKeymap } from "https://esm.sh/@codemirror/commands@6";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from "https://esm.sh/@codemirror/language@6";
import { searchKeymap, highlightSelectionMatches } from "https://esm.sh/@codemirror/search@6";
import { oneDark } from "https://esm.sh/@codemirror/theme-one-dark@6";

const container = document.getElementById("cm-editor");
const filePath = container.dataset.filePath;
const initialContent = JSON.parse(document.getElementById("file-content-data").textContent);
const statusEl = document.getElementById("save-status");

let saveTimeout = null;
let isDirty = false;

function setStatus(text, cls) {
    statusEl.textContent = text;
    statusEl.className = cls;
    if (cls === "saved") {
        setTimeout(() => {
            if (statusEl.className === "saved") {
                statusEl.textContent = "";
                statusEl.className = "";
            }
        }, 2000);
    }
}

async function save(content) {
    setStatus("Speichere...", "saving");
    try {
        const res = await fetch(`/api/file/${filePath}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error(res.statusText);
        setStatus("Gespeichert", "saved");
        isDirty = false;
    } catch (e) {
        setStatus("Fehler beim Speichern", "error");
        setTimeout(() => save(editor.state.doc.toString()), 3000);
    }
}

function scheduleSave(content) {
    clearTimeout(saveTimeout);
    isDirty = true;
    setStatus("Ungespeichert", "");
    saveTimeout = setTimeout(() => save(content), 1500);
}

const editor = new EditorView({
    state: EditorState.create({
        doc: initialContent,
        extensions: [
            lineNumbers(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            history(),
            bracketMatching(),
            highlightSelectionMatches(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            markdown(),
            oneDark,
            keymap.of([
                ...defaultKeymap,
                ...historyKeymap,
                ...searchKeymap,
                indentWithTab,
                {
                    key: "Mod-s",
                    run: () => {
                        clearTimeout(saveTimeout);
                        save(editor.state.doc.toString());
                        return true;
                    },
                },
            ]),
            EditorView.lineWrapping,
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    scheduleSave(update.state.doc.toString());
                }
            }),
        ],
    }),
    parent: container,
});

window.addEventListener("beforeunload", (e) => {
    if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
    }
});

editor.focus();
