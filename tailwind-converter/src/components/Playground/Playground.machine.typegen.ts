// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true
  internalEvents: {
    'xstate.init': { type: 'xstate.init' }
  }
  invokeSrcNameMap: {}
  missingImplementations: {
    actions: never
    delays: never
    guards: never
    services: never
  }
  eventsCausingActions: {
    assignEditorRef: 'Editor Loaded'
    extractClassList: 'Editor Loaded' | 'Select input tab' | 'Update input'
    selectInputTab: 'Select input tab'
    selectOutputTab: 'Select output tab'
    updateInput: 'Editor Loaded' | 'Select input tab' | 'Update input'
    updateSelectedInput: 'Editor Loaded' | 'Select input tab' | 'Update input'
  }
  eventsCausingDelays: {}
  eventsCausingGuards: {
    isAppFile: 'Editor Loaded' | 'Select input tab' | 'Update input'
    willBeReady: 'Editor Loaded'
  }
  eventsCausingServices: {}
  matchesStates: 'loading' | 'ready' | 'ready.Playing' | { ready?: 'Playing' }
  tags: never
}
