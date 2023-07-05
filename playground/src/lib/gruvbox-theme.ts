/**
 * @see https://themes.codehike.org/editor
 * @see https://marketplace.visualstudio.com/items?itemName=jdinhlife.gruvbox
 */

import { editor } from 'monaco-editor'

export const pandaTheme: editor.IStandaloneThemeData = {
  inherit: true,
  base: 'vs-dark',
  colors: {
    focusBorder: '#3c3836',
    foreground: '#ebdbb2',
    'widget.shadow': '#28282830',
    'selection.background': '#689d6a80',
    errorForeground: '#fb4934',
    'button.background': '#45858880',
    'button.foreground': '#ebdbb2',
    'button.hoverBackground': '#45858860',
    'dropdown.background': '#282828',
    'dropdown.border': '#3c3836',
    'dropdown.foreground': '#ebdbb2',
    'input.background': '#ebdbb205',
    'input.border': '#3c3836',
    'input.foreground': '#ebdbb2',
    'input.placeholderForeground': '#ebdbb260',
    'inputValidation.errorBorder': '#fb4934',
    'inputValidation.errorBackground': '#cc241d80',
    'inputValidation.infoBorder': '#83a598',
    'inputValidation.infoBackground': '#45858880',
    'inputValidation.warningBorder': '#fabd2f',
    'inputValidation.warningBackground': '#d7992180',
    'inputOption.activeBorder': '#ebdbb260',
    'scrollbar.shadow': '#282828',
    'scrollbarSlider.activeBackground': '#689d6a',
    'scrollbarSlider.hoverBackground': '#665c54',
    'scrollbarSlider.background': '#50494599',
    'badge.background': '#d3869b',
    'badge.foreground': '#282828',
    'progressBar.background': '#689d6a',
    'list.activeSelectionBackground': '#3c383680',
    'list.activeSelectionForeground': '#8ec07c',
    'list.hoverBackground': '#3c383680',
    'list.hoverForeground': '#d5c4a1',
    'list.focusBackground': '#3c3836',
    'list.focusForeground': '#ebdbb2',
    'list.inactiveSelectionForeground': '#689d6a',
    'list.inactiveSelectionBackground': '#3c383680',
    'list.dropBackground': '#3c3836',
    'list.highlightForeground': '#689d6a',
    'sideBar.background': '#282828',
    'sideBar.foreground': '#d5c4a1',
    'sideBar.border': '#3c3836',
    'sideBarTitle.foreground': '#ebdbb2',
    'sideBarSectionHeader.background': '#28282800',
    'sideBarSectionHeader.foreground': '#ebdbb2',
    'activityBar.background': '#282828',
    'activityBar.dropBackground': '#282828',
    'activityBar.foreground': '#ebdbb2',
    'activityBar.border': '#3c3836',
    'activityBarBadge.background': '#458588',
    'activityBarBadge.foreground': '#ebdbb2',
    'editorGroup.background': '#3c3836',
    'editorGroup.border': '#3c3836',
    'editorGroup.dropBackground': '#3c383660',
    'editorGroupHeader.noTabsBackground': '#3c3836',
    'editorGroupHeader.tabsBackground': '#282828',
    'editorGroupHeader.tabsBorder': '#3c3836',
    'tab.border': '#28282800',
    'tab.activeBorder': '#689d6a',
    'tab.activeBackground': '#3c3836',
    'tab.activeForeground': '#ebdbb2',
    'tab.inactiveForeground': '#a89984',
    'tab.inactiveBackground': '#282828',
    'tab.unfocusedActiveForeground': '#a89984',
    'tab.unfocusedActiveBorder': '#28282800',
    'tab.unfocusedInactiveForeground': '#928374',
    'editor.background': '#282828',
    'editor.foreground': '#ebdbb2',
    'editorLineNumber.foreground': '#665c54',
    'editorCursor.foreground': '#ebdbb2',
    'editor.selectionBackground': '#689d6a40',
    'editor.selectionHighlightBackground': '#fabd2f40',
    'editor.hoverHighlightBackground': '#689d6a50',
    'editorLink.activeForeground': '#ebdbb2',
    'editor.findMatchBackground': '#83a59870',
    'editor.findMatchHighlightBackground': '#fe801930',
    'editor.findRangeHighlightBackground': '#83a59870',
    'editor.lineHighlightBackground': '#3c383660',
    'editor.lineHighlightBorder': '#3c383600',
    'editorWhitespace.foreground': '#a8998420',
    'editorIndentGuide.background': '#a8998420',
    'editorIndentGuide.activeBackground': '#a8998450',
    'editorRuler.foreground': '#a8998440',
    'editorCodeLens.foreground': '#a8998490',
    'editorBracketMatch.border': '#28282800',
    'editorBracketMatch.background': '#92837480',
    'editorHoverWidget.background': '#282828',
    'editorHoverWidget.border': '#3c3836',
    'editorOverviewRuler.border': '#28282800',
    'editorOverviewRuler.findMatchForeground': '#bdae93',
    'editorOverviewRuler.rangeHighlightForeground': '#bdae93',
    'editorOverviewRuler.selectionHighlightForeground': '#665c54',
    'editorOverviewRuler.wordHighlightForeground': '#665c54',
    'editorOverviewRuler.wordHighlightStrongForeground': '#665c54',
    'editorOverviewRuler.modifiedForeground': '#83a598',
    'editorOverviewRuler.addedForeground': '#83a598',
    'editorOverviewRuler.deletedForeground': '#83a598',
    'editorOverviewRuler.errorForeground': '#fb4934',
    'editorOverviewRuler.warningForeground': '#d79921',
    'editorOverviewRuler.infoForeground': '#d3869b',
    'editorGutter.background': '#28282800',
    'editorGutter.modifiedBackground': '#83a598',
    'editorGutter.addedBackground': '#b8bb26',
    'editorGutter.deletedBackground': '#fb4934',
    'editorError.foreground': '#cc241d',
    'editorWarning.foreground': '#d79921',
    'editorInfo.foreground': '#458588',
    'editorBracketHighlight.foreground1': '#b16286',
    'editorBracketHighlight.foreground2': '#458588',
    'editorBracketHighlight.foreground3': '#689d6a',
    'editorBracketHighlight.foreground4': '#98971a',
    'editorBracketHighlight.foreground5': '#d79921',
    'editorBracketHighlight.foreground6': '#d65d0e',
    'editorBracketHighlight.unexpectedBracket.foreground': '#cc241d',
    'diffEditor.insertedTextBackground': '#b8bb2630',
    'diffEditor.removedTextBackground': '#fb493430',
    'editorWidget.background': '#282828',
    'editorWidget.border': '#3c3836',
    'editorSuggestWidget.background': '#282828',
    'editorSuggestWidget.foreground': '#ebdbb2',
    'editorSuggestWidget.highlightForeground': '#689d6a',
    'editorSuggestWidget.selectedBackground': '#3c383660',
    'editorSuggestWidget.border': '#3c3836',
    'peekView.border': '#3c3836',
    'peekViewEditor.background': '#3c383650',
    'peekViewEditorGutter.background': '#3c383650',
    'peekViewEditor.matchHighlightBackground': '',
    'peekViewResult.background': '#3c383650',
    'peekViewResult.fileForeground': '#ebdbb2',
    'peekViewResult.matchHighlightBackground': '#8ec07c30',
    'peekViewResult.selectionBackground': '#8ec07c30',
    'peekViewResult.selectionForeground': '#8ec07c30',
    'peekViewTitle.background': '#3c383650',
    'peekViewTitleDescription.foreground': '#bdae93',
    'peekViewTitleLabel.foreground': '#ebdbb2',
    'merge.currentHeaderBackground': '#45858840',
    'merge.currentContentBackground': '#45858820',
    'merge.incomingHeaderBackground': '#689d6a40',
    'merge.incomingContentBackground': '#689d6a20',
    'merge.border': '#28282800',
    'editorOverviewRuler.currentContentForeground': '#458588',
    'editorOverviewRuler.incomingContentForeground': '#689d6a',
    'editorOverviewRuler.commonContentForeground': '#928374',
    'panel.border': '#3c3836',
    'panelTitle.activeForeground': '#ebdbb2',
    'statusBar.background': '#282828',
    'statusBar.border': '#3c3836',
    'statusBar.foreground': '#ebdbb2',
    'statusBar.debuggingBackground': '#fe8019',
    'statusBar.debuggingForeground': '#282828',
    'statusBar.debuggingBorder': '#28282800',
    'statusBar.noFolderBackground': '#282828',
    'statusBar.noFolderBorder': '#28282800',
    'statusBar.prominentBackground': '#689d6a',
    'statusBar.prominentHoverBackground': '#689d6a70',
    'terminal.ansiBlack': '#3c3836',
    'terminal.ansiBrightBlack': '#928374',
    'terminal.ansiRed': '#cc241d',
    'terminal.ansiBrightRed': '#fb4934',
    'terminal.ansiGreen': '#98971a',
    'terminal.ansiBrightGreen': '#b8bb26',
    'terminal.ansiYellow': '#d79921',
    'terminal.ansiBrightYellow': '#fabd2f',
    'terminal.ansiBlue': '#458588',
    'terminal.ansiBrightBlue': '#83a598',
    'terminal.ansiMagenta': '#b16286',
    'terminal.ansiBrightMagenta': '#d3869b',
    'terminal.ansiCyan': '#689d6a',
    'terminal.ansiBrightCyan': '#8ec07c',
    'terminal.ansiWhite': '#a89984',
    'terminal.ansiBrightWhite': '#ebdbb2',
    'terminal.foreground': '#ebdbb2',
    'terminal.background': '#282828',
    'titleBar.activeBackground': '#282828',
    'titleBar.activeForeground': '#ebdbb2',
    'titleBar.inactiveBackground': '#282828',
    'gitDecoration.modifiedResourceForeground': '#d79921',
    'gitDecoration.deletedResourceForeground': '#cc241d',
    'gitDecoration.untrackedResourceForeground': '#98971a',
    'gitDecoration.ignoredResourceForeground': '#7c6f64',
    'gitDecoration.conflictingResourceForeground': '#b16286',
    'menu.border': '#3c3836',
    'notebook.cellEditorBackground': '#32302f',
    'notebook.focusedCellBorder': '#a89984',
    'notebook.cellBorderColor': '#504945',
    'notebook.focusedEditorBorder': '#504945',
    'notification.background': '#282828',
    'notification.foreground': '#ebdbb2',
    'notification.buttonBackground': '#665c54',
    'notification.buttonHoverBackground': '#665c5450',
    'notification.buttonForeground': '#ebdbb2',
    'notification.infoBackground': '#83a598',
    'notification.infoForeground': '#282828',
    'notification.warningBackground': '#fabd2f',
    'notification.warningForeground': '#282828',
    'notification.errorBackground': '#fb4934',
    'notification.errorForeground': '#282828',
    'extensionButton.prominentBackground': '#b8bb2680',
    'extensionButton.prominentHoverBackground': '#b8bb2630',
    'textLink.foreground': '#83a598',
    'textLink.activeForeground': '#458588',
    'debugToolBar.background': '#282828',
  },
  rules: [
    {
      fontStyle: 'italic',
      token: 'emphasis',
    },
    {
      fontStyle: 'bold',
      token: 'strong',
    },
    {
      foreground: '#458588',
      token: 'header',
    },
    {
      foreground: '#928374',
      fontStyle: 'italic',
      token: 'comment',
    },
    {
      foreground: '#928374',
      fontStyle: 'italic',
      token: 'punctuation.definition.comment',
    },
    {
      foreground: '#d3869b',
      token: 'constant',
    },
    {
      foreground: '#d3869b',
      token: 'support.constant',
    },
    {
      foreground: '#d3869b',
      token: 'variable.arguments',
    },
    {
      foreground: '#ebdbb2',
      token: 'constant.rgb-value',
    },
    {
      foreground: '#8ec07c',
      token: 'entity.name.selector',
    },
    {
      foreground: '#fabd2f',
      token: 'entity.other.attribute-name',
    },
    {
      foreground: '#8ec07c',
      token: 'entity.name.tag',
    },
    {
      foreground: '#8ec07c',
      token: 'punctuation.tag',
    },
    {
      foreground: '#cc241d',
      token: 'invalid',
    },
    {
      foreground: '#cc241d',
      token: 'invalid.illegal',
    },
    {
      foreground: '#b16286',
      token: 'invalid.deprecated',
    },
    {
      foreground: '#8ec07c',
      token: 'meta.selector',
    },
    {
      foreground: '#fe8019',
      token: 'meta.preprocessor',
    },
    {
      foreground: '#b8bb26',
      token: 'meta.preprocessor.string',
    },
    {
      foreground: '#b8bb26',
      token: 'meta.preprocessor.numeric',
    },
    {
      foreground: '#fe8019',
      token: 'meta.header.diff',
    },
    {
      foreground: '#fb4934',
      token: 'storage',
    },
    {
      foreground: '#fe8019',
      token: 'storage.modifier',
    },
    {
      foreground: '#b8bb26',
      token: 'string',
    },
    {
      foreground: '#b8bb26',
      token: 'string.tag',
    },
    {
      foreground: '#b8bb26',
      token: 'string.value',
    },
    {
      foreground: '#fe8019',
      token: 'string.regexp',
    },
    {
      foreground: '#fb4934',
      token: 'string.escape',
    },
    {
      foreground: '#8ec07c',
      token: 'string.quasi',
    },
    {
      foreground: '#b8bb26',
      token: 'string.entity',
    },
    {
      foreground: '#ebdbb2',
      token: 'object',
    },
    {
      foreground: '#83a598',
      token: 'module.node',
    },
    {
      foreground: '#689d6a',
      token: 'support.type.property-name',
    },
    {
      foreground: '#fb4934',
      token: 'keyword',
    },
    {
      foreground: '#fb4934',
      token: 'keyword.control',
    },
    {
      foreground: '#8ec07c',
      token: 'keyword.control.module',
    },
    {
      foreground: '#d79921',
      token: 'keyword.control.less',
    },
    {
      foreground: '#8ec07c',
      token: 'keyword.operator',
    },
    {
      foreground: '#fe8019',
      token: 'keyword.operator.new',
    },
    {
      foreground: '#b8bb26',
      token: 'keyword.other.unit',
    },
    {
      foreground: '#fe8019',
      token: 'metatag.php',
    },
    {
      foreground: '#689d6a',
      token: 'support.function.git-rebase',
    },
    {
      foreground: '#b8bb26',
      token: 'constant.sha.git-rebase',
    },
    {
      foreground: '#fabd2f',
      token: 'meta.type.name',
    },
    {
      foreground: '#fabd2f',
      token: 'meta.return.type',
    },
    {
      foreground: '#fabd2f',
      token: 'meta.return-type',
    },
    {
      foreground: '#fabd2f',
      token: 'meta.cast',
    },
    {
      foreground: '#fabd2f',
      token: 'meta.type.annotation',
    },
    {
      foreground: '#fabd2f',
      token: 'support.type',
    },
    {
      foreground: '#fabd2f',
      token: 'storage.type.cs',
    },
    {
      foreground: '#fabd2f',
      token: 'variable.class',
    },
    {
      foreground: '#d3869b',
      token: 'variable.this',
    },
    {
      foreground: '#d3869b',
      token: 'support.variable',
    },
    {
      foreground: '#fabd2f',
      token: 'entity.name',
    },
    {
      foreground: '#fabd2f',
      token: 'entity.static',
    },
    {
      foreground: '#fabd2f',
      token: 'entity.name.class.static.function',
    },
    {
      foreground: '#fabd2f',
      token: 'entity.name.function',
    },
    {
      foreground: '#fabd2f',
      token: 'entity.name.class',
    },
    {
      foreground: '#fabd2f',
      token: 'entity.name.type',
    },
    {
      foreground: '#8ec07c',
      token: 'storage.type.function',
    },
    {
      foreground: '#8ec07c',
      token: 'entity.function',
    },
    {
      foreground: '#8ec07c',
      token: 'entity.name.function.static',
    },
    {
      foreground: '#8ec07c',
      token: 'entity.name.function.function-call',
    },
    {
      foreground: '#fe8019',
      token: 'support.function.builtin',
    },
    {
      foreground: '#689d6a',
      token: 'entity.name.method',
    },
    {
      foreground: '#689d6a',
      token: 'entity.name.method.function-call',
    },
    {
      foreground: '#689d6a',
      token: 'entity.name.static.function-call',
    },
    {
      foreground: '#d5c4a1',
      token: 'brace',
    },
    {
      foreground: '#83a598',
      token: 'meta.parameter.type.variable',
    },
    {
      foreground: '#83a598',
      token: 'variable.parameter',
    },
    {
      foreground: '#83a598',
      token: 'variable.name',
    },
    {
      foreground: '#83a598',
      token: 'variable.other',
    },
    {
      foreground: '#83a598',
      token: 'variable',
    },
    {
      foreground: '#83a598',
      token: 'string.constant.other.placeholder',
    },
    {
      foreground: '#d3869b',
      token: 'prototype',
    },
    {
      foreground: '#fb4934',
      token: 'storage.type.class',
    },
    {
      foreground: '#a89984',
      token: 'punctuation',
    },
    {
      foreground: '#ebdbb2',
      token: 'punctuation.quoted',
    },
    {
      foreground: '#fb4934',
      token: 'punctuation.quasi',
    },
    {
      fontStyle: 'underline',
      token: '*url*',
    },
    {
      fontStyle: 'underline',
      token: '*link*',
    },
    {
      fontStyle: 'underline',
      token: '*uri*',
    },
    {
      foreground: '#8ec07c',
      token: 'meta.function.python',
    },
    {
      foreground: '#8ec07c',
      token: 'entity.name.function.python',
    },
    {
      foreground: '#fb4934',
      token: 'storage.type.function.python',
    },
    {
      foreground: '#fb4934',
      token: 'storage.modifier.declaration',
    },
    {
      foreground: '#fb4934',
      token: 'storage.type.class.python',
    },
    {
      foreground: '#83a598',
      token: 'meta.function-call.generic',
    },
    {
      foreground: '#d5c4a1',
      token: 'meta.function-call.arguments',
    },
    {
      foreground: '#fabd2f',
      fontStyle: 'bold',
      token: 'entity.name.function.decorator',
    },
    {
      fontStyle: 'bold',
      token: 'constant.other.caps',
    },
    {
      foreground: '#fb4934',
      token: 'keyword.operator.logical',
    },
    {
      foreground: '#fe8019',
      token: 'punctuation.definition.logical-expression',
    },
    {
      foreground: '#fe8019',
      token: 'string.inperpolated.dollar.shell',
    },
    {
      foreground: '#8ec07c',
      token: 'string.interpolated.dollar.shell',
    },
    {
      foreground: '#8ec07c',
      token: 'string.interpolated.backtick.shell',
    },
    {
      foreground: '#8ec07c',
      token: 'keyword.control.directive',
    },
    {
      foreground: '#fabd2f',
      token: 'support.function.C99',
    },
    {
      foreground: '#b8bb26',
      token: 'meta.function.cs',
    },
    {
      foreground: '#b8bb26',
      token: 'entity.name.function.cs',
    },
    {
      foreground: '#b8bb26',
      token: 'entity.name.type.namespace.cs',
    },
    {
      foreground: '#8ec07c',
      token: 'keyword.other.using.cs',
    },
    {
      foreground: '#8ec07c',
      token: 'entity.name.variable.field.cs',
    },
    {
      foreground: '#8ec07c',
      token: 'entity.name.variable.local.cs',
    },
    {
      foreground: '#8ec07c',
      token: 'variable.other.readwrite.cs',
    },
    {
      foreground: '#d3869b',
      token: 'keyword.other.this.cs',
    },
    {
      foreground: '#d3869b',
      token: 'keyword.other.base.cs',
    },
    {
      foreground: '#fabd2f',
      token: 'meta.scope.prerequisites',
    },
    {
      foreground: '#b8bb26',
      fontStyle: 'bold',
      token: 'entity.name.function.target',
    },
    {
      foreground: '#bdae93',
      token: 'storage.modifier.import.java',
    },
    {
      foreground: '#bdae93',
      token: 'storage.modifier.package.java',
    },
    {
      foreground: '#8ec07c',
      token: 'keyword.other.import.java',
    },
    {
      foreground: '#8ec07c',
      token: 'keyword.other.package.java',
    },
    {
      foreground: '#fabd2f',
      token: 'storage.type.java',
    },
    {
      foreground: '#83a598',
      fontStyle: 'bold',
      token: 'storage.type.annotation',
    },
    {
      foreground: '#8ec07c',
      token: 'keyword.other.documentation.javadoc',
    },
    {
      foreground: '#b8bb26',
      fontStyle: 'bold',
      token: 'comment.block.javadoc variable.parameter.java',
    },
    {
      foreground: '#ebdbb2',
      token: 'source.java variable.other.object',
    },
    {
      foreground: '#ebdbb2',
      token: 'source.java variable.other.definition.java',
    },
    {
      foreground: '#fabd2f',
      token: 'meta.function-parameters.lisp',
    },
    {
      fontStyle: 'underline',
      token: 'markup.underline',
    },
    {
      foreground: '#928374',
      fontStyle: 'underline',
      token: 'string.other.link.title.markdown',
    },
    {
      foreground: '#d3869b',
      token: 'markup.underline.link',
    },
    {
      fontStyle: 'bold',
      foreground: '#fe8019',
      token: 'markup.bold',
    },
    {
      fontStyle: 'bold',
      foreground: '#fe8019',
      token: 'markup.heading',
    },
    {
      fontStyle: 'italic',
      token: 'markup.italic',
    },
    {
      foreground: '#b8bb26',
      token: 'markup.inserted',
    },
    {
      foreground: '#d65d0e',
      token: 'markup.deleted',
    },
    {
      foreground: '#fe8019',
      token: 'markup.changed',
    },
    {
      foreground: '#98971a',
      token: 'markup.punctuation.quote.beginning',
    },
    {
      foreground: '#83a598',
      token: 'markup.punctuation.list.beginning',
    },
    {
      foreground: '#8ec07c',
      token: 'markup.inline.raw',
    },
    {
      foreground: '#8ec07c',
      token: 'markup.fenced_code.block',
    },
    {
      foreground: '#83a598',
      token: 'string.quoted.double.json',
    },
    {
      foreground: '#b8bb26',
      token: 'source.json meta.structure.dictionary.json support.type.property-name.json',
    },
    {
      foreground: '#8ec07c',
      token:
        'source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json',
    },
    {
      foreground: '#d3869b',
      token:
        'source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json',
    },
    {
      foreground: '#b8bb26',
      token:
        'source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json',
    },
    {
      foreground: '#fe8019',
      token: 'entity.other.attribute-name.css',
    },
    {
      foreground: '#ebdbb2',
      token: 'source.css meta.selector',
    },
    {
      foreground: '#fe8019',
      token: 'support.type.property-name.css',
    },
    {
      foreground: '#b8bb26',
      token: 'entity.other.attribute-name.class',
    },
    {
      foreground: '#fb4934',
      token: 'source.css support.function.transform',
    },
    {
      foreground: '#fb4934',
      token: 'source.css support.function.timing-function',
    },
    {
      foreground: '#fb4934',
      token: 'source.css support.function.misc',
    },
    {
      foreground: '#d65d0e',
      token: 'support.property-value',
    },
    {
      foreground: '#d65d0e',
      token: 'constant.rgb-value',
    },
    {
      foreground: '#d65d0e',
      token: 'support.property-value.scss',
    },
    {
      foreground: '#d65d0e',
      token: 'constant.rgb-value.scss',
    },
    {
      fontStyle: 'normal',
      token: 'entity.name.tag.css',
    },
    {
      foreground: '#83a598',
      token: 'punctuation.definition.tag',
    },
    {
      foreground: '#8ec07c',
      fontStyle: 'bold',
      token: 'text.html entity.name.tag',
    },
    {
      foreground: '#8ec07c',
      fontStyle: 'bold',
      token: 'text.html punctuation.tag',
    },
    {
      foreground: '#fe8019',
      token: 'source.js variable.language',
    },
    {
      foreground: '#fe8019',
      token: 'source.ts variable.language',
    },
    {
      foreground: '#fabd2f',
      token: 'source.go storage.type',
    },
    {
      foreground: '#b8bb26',
      token: 'source.go entity.name.import',
    },
    {
      foreground: '#8ec07c',
      token: 'source.go keyword.package',
    },
    {
      foreground: '#8ec07c',
      token: 'source.go keyword.import',
    },
    {
      foreground: '#83a598',
      token: 'source.go keyword.interface',
    },
    {
      foreground: '#83a598',
      token: 'source.go keyword.struct',
    },
    {
      foreground: '#ebdbb2',
      token: 'source.go entity.name.type',
    },
    {
      foreground: '#d3869b',
      token: 'source.go entity.name.function',
    },
    {
      foreground: '#83a598',
      token: 'keyword.control.cucumber.table',
    },
    {
      foreground: '#b8bb26',
      token: 'source.reason string.double',
    },
    {
      foreground: '#b8bb26',
      token: 'source.reason string.regexp',
    },
    {
      foreground: '#8ec07c',
      token: 'source.reason keyword.control.less',
    },
    {
      foreground: '#83a598',
      token: 'source.reason entity.name.function',
    },
    {
      foreground: '#fe8019',
      token: 'source.reason support.property-value',
    },
    {
      foreground: '#fe8019',
      token: 'source.reason entity.name.filename',
    },
    {
      foreground: '#fe8019',
      token: 'source.powershell variable.other.member.powershell',
    },
    {
      foreground: '#fabd2f',
      token: 'source.powershell support.function.powershell',
    },
    {
      foreground: '#bdae93',
      token: 'source.powershell support.function.attribute.powershell',
    },
    {
      foreground: '#fe8019',
      token: 'source.powershell meta.hashtable.assignment.powershell variable.other.readwrite.powershell',
    },
  ],
  encodedTokensColors: [],
}
