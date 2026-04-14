import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { defaultKeymap, indentWithTab, history, historyKeymap } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { oneDark } from "@codemirror/theme-one-dark";

const container = document.getElementById("cm-editor");
const filePath = container.dataset.filePath;
const initialContent = container.dataset.fileContent;
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
        // Retry after 3 seconds
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
