import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import type { ComponentProps } from "react"

type OnChangePluginProps = ComponentProps<typeof OnChangePlugin>
type EditorState = Parameters<NonNullable<OnChangePluginProps["onChange"]>>[0]
type SerializedEditorState = ReturnType<EditorState["toJSON"]>

import { editorTheme } from "components/editor/themes/editor-theme"
import { TooltipProvider } from "~/components/ui/tooltip"

import { nodes } from "./nodes"
import { Plugins } from "./plugins"

type InitialConfigType = ComponentProps<typeof LexicalComposer>["initialConfig"]

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error)
  },
}

export function Editor({
  editorState,
  editorSerializedState,
  onChange,
  onSerializedChange,
}: {
  editorState?: EditorState
  editorSerializedState?: SerializedEditorState
  onChange?: (editorState: EditorState) => void
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void
}) {
  return (
    <div className="bg-background overflow-hidden rounded-lg border shadow">
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          ...(editorState ? { editorState } : {}),
          ...(editorSerializedState
            ? { editorState: JSON.stringify(editorSerializedState) }
            : {}),
        }}
      >
        <TooltipProvider>
          <Plugins />

          <OnChangePlugin
            ignoreSelectionChange={true}
            onChange={(editorState) => {
              onChange?.(editorState)
              onSerializedChange?.(editorState.toJSON())
            }}
          />
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
}
