import { useState } from "react"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import type { ComponentProps } from "react"

import { Editor } from "~/components/blocks/editor-x/editor"

type OnChangePluginProps = ComponentProps<typeof OnChangePlugin>
type EditorState = Parameters<NonNullable<OnChangePluginProps["onChange"]>>[0]
type SerializedEditorState = ReturnType<EditorState["toJSON"]>

export const initialValue = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Hello World 🚀",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
} as unknown as SerializedEditorState

export default function EditorPage() {
  const [editorState, setEditorState] =
    useState<SerializedEditorState>(initialValue)
  return (
    <Editor
      editorSerializedState={editorState}
      onSerializedChange={(value) => setEditorState(value)}
    />
  )
}
