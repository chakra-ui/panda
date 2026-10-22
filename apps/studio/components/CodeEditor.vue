<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { autocompletion, completionKeymap, type CompletionContext } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { HighlightStyle, bracketMatching, syntaxHighlighting } from '@codemirror/language'
import { forceLinting, linter, type Diagnostic } from '@codemirror/lint'
import { EditorState } from '@codemirror/state'
import { EditorView, highlightActiveLine, keymap, lineNumbers, placeholder } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import * as s from './CodeEditor.css'
import type { DesignSystemIndex } from '~/utils/design-system'
import type { Finding } from '~/utils/token-inspection'

const props = defineProps<{
  modelValue: string
  ds: DesignSystemIndex
  findings: Finding[]
  categoryAt?: (source: string, offset: number) => string | undefined
  readOnly?: boolean
  label?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const host = ref<HTMLElement | null>(null)
let view: EditorView | undefined

const highlight = HighlightStyle.define([
  { tag: [tags.keyword, tags.controlKeyword, tags.moduleKeyword], color: 'var(--colors-code-keyword)' },
  { tag: [tags.string, tags.special(tags.string)], color: 'var(--colors-code-string)' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--colors-code-number)' },
  { tag: [tags.tagName, tags.typeName, tags.className], color: 'var(--colors-code-tag)' },
  { tag: [tags.propertyName, tags.attributeName], color: 'var(--colors-code-property)' },
  { tag: tags.comment, color: 'var(--colors-faint)', fontStyle: 'italic' },
])

function tokenCompletions(context: CompletionContext) {
  const line = context.state.doc.lineAt(context.pos)
  const typed = line.text.slice(0, context.pos - line.from).match(/['"`]([^'"`]*)$/)
  if (!typed) return null
  const category = props.categoryAt?.(context.state.doc.toString(), context.pos)
  if (!category || !props.ds.categories().includes(category)) return null
  return {
    from: context.pos - typed[1].length,
    validFor: /^[\w.-]*$/,
    options: props.ds.view(category).map((t) => ({
      label: t.name,
      detail: t.value,
      type: 'constant',
      boost: t.semantic ? 1 : 0,
      ...(category === 'colors' || category === 'gradients' ? { swatch: t.value } : {}),
    })),
  }
}

const completions = autocompletion({
  override: [tokenCompletions],
  icons: false,
  addToOptions: [
    {
      position: 20,
      render: (completion) => {
        const color = (completion as { swatch?: string }).swatch
        if (!color) return null
        const swatch = document.createElement('span')
        swatch.className = 'cm-swatch'
        swatch.style.background = color
        return swatch
      },
    },
  ],
})

type Change = { from: number; to: number; insert: string }

/** Token names go in as strings: keep the quote the value had, or add one to a bare `4`. */
function quoted(state: EditorState, change: Change): Change {
  const current = state.sliceDoc(change.from, change.to)
  const quote = /^['"`]/.test(current) && current.endsWith(current[0]) ? current[0] : "'"
  return { ...change, insert: `${quote}${change.insert}${quote}` }
}

const tokenLinter = linter(
  (editor) => {
    const diagnostics: Diagnostic[] = []
    const length = editor.state.doc.length
    for (const finding of props.findings) {
      if (finding.from < 0 || finding.to > length) continue
      if (finding.kind === 'unknown') {
        const { suggestion } = finding
        diagnostics.push({
          from: finding.from,
          to: finding.to,
          severity: 'warning',
          message: `${finding.value} isn't in your ${finding.category}.${suggestion ? ` Did you mean ${suggestion}?` : ''}`,
          actions:
            suggestion && !props.readOnly
              ? [
                  {
                    name: `Use ${suggestion}`,
                    apply: (v, from, to) => v.dispatch({ changes: quoted(v.state, { from, to, insert: suggestion }) }),
                  },
                ]
              : [],
        })
      } else if (finding.kind === 'raw' && finding.match) {
        const name = finding.match
        diagnostics.push({
          from: finding.from,
          to: finding.to,
          severity: 'info',
          message: `Hard-coded value. ${finding.category}.${finding.match} has the same value.`,
          actions: props.readOnly
            ? []
            : [
                {
                  name: `Use ${name}`,
                  apply: (v, from, to) => v.dispatch({ changes: quoted(v.state, { from, to, insert: name }) }),
                },
              ],
        })
      }
    }
    return diagnostics
  },
  { delay: 250 },
)

const theme = EditorView.theme({
  '&': { height: '100%', fontSize: '13px', backgroundColor: 'transparent', color: 'var(--colors-ink)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--fonts-mono)', lineHeight: '1.75' },
  '.cm-content': { padding: '14px 0', caretColor: 'var(--colors-ink)' },
  '.cm-line': { padding: '0 20px 0 6px' },
  '.cm-gutters': { backgroundColor: 'var(--colors-paper)', border: 'none', paddingLeft: '12px' },
  '.cm-lineNumbers .cm-gutterElement': {
    minWidth: '3ch',
    padding: '0 8px 0 0',
    color: 'var(--colors-faint)',
    fontSize: '12px',
    fontVariantNumeric: 'tabular-nums',
    userSelect: 'none',
  },
  '.cm-activeLineGutter': { backgroundColor: 'transparent' },
  '&.cm-focused .cm-activeLineGutter': { color: 'var(--colors-ink)' },
  '.cm-activeLine': { backgroundColor: 'transparent' },
  '&.cm-focused .cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--colors-subtle) 70%, transparent)' },
  '.cm-cursor': { borderLeftWidth: '1.5px', borderLeftColor: 'var(--colors-ink)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--colors-accent-subtle) !important',
  },
  '.cm-tooltip': {
    border: 'none',
    borderRadius: '10px',
    backgroundColor: 'var(--colors-paper)',
    boxShadow: 'var(--shadows-overlay)',
    overflow: 'hidden',
  },
  '.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--fonts-mono)', fontSize: '12.5px', maxHeight: '260px' },
  '.cm-tooltip-autocomplete > ul > li': { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--colors-selected)',
    color: 'var(--colors-ink)',
  },
  '.cm-completionDetail': {
    marginLeft: 'auto',
    paddingLeft: '16px',
    color: 'var(--colors-faint)',
    fontStyle: 'normal',
  },
  '.cm-completionIcon': { display: 'none' },
  '.cm-swatch': {
    width: '12px',
    height: '12px',
    flexShrink: '0',
    borderRadius: '3px',
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)',
  },
  '.cm-diagnostic': { padding: '6px 10px', fontFamily: 'var(--fonts-body)', fontSize: '12.5px' },
  '.cm-diagnosticAction': {
    marginLeft: '8px',
    border: 'none',
    borderRadius: '6px',
    padding: '2px 8px',
    backgroundColor: 'var(--colors-accent)',
    color: 'var(--colors-on-accent)',
    font: 'inherit',
    cursor: 'pointer',
  },
  '.cm-lintRange-warning': {
    backgroundImage: 'none',
    textDecoration: 'underline wavy var(--colors-danger)',
    textUnderlineOffset: '3px',
  },
  '.cm-lintRange-info': {
    backgroundImage: 'none',
    textDecoration: 'underline dotted var(--colors-faint)',
    textUnderlineOffset: '3px',
  },
})

onMounted(() => {
  view = new EditorView({
    parent: host.value!,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        bracketMatching(),
        javascript({ jsx: true, typescript: true }),
        syntaxHighlighting(highlight),
        ...(props.readOnly ? [EditorState.readOnly.of(true)] : [completions, placeholder('css({ color: … })')]),
        EditorView.contentAttributes.of({ 'aria-label': props.label ?? 'Code' }),
        tokenLinter,
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
          ...(props.readOnly ? [] : [indentWithTab]),
        ]),
        theme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) emit('update:modelValue', update.state.doc.toString())
        }),
      ],
    }),
  })
})

watch(
  () => props.findings,
  () => view && forceLinting(view),
)

watch(
  () => props.modelValue,
  (value) => {
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
    }
  },
)

onBeforeUnmount(() => view?.destroy())

defineExpose({
  replace(changes: Change[]) {
    if (!view) return
    const state = view.state
    view.dispatch({ changes: changes.map((change) => quoted(state, change)) })
    view?.focus()
  },
  select(from: number, to: number) {
    view?.dispatch({ selection: { anchor: from, head: to }, scrollIntoView: true })
    view?.focus()
  },
})
</script>

<template>
  <div ref="host" :class="s.editor" />
</template>
