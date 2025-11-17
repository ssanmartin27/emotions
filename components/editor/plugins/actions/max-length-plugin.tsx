import { useEffect } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $trimTextContentFromAnchor } from "@lexical/selection"
import { $restoreEditorState } from "@lexical/utils"
import {
  $getSelection,
  $isRangeSelection,
  RootNode,
} from "lexical"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import type { ComponentProps } from "react"

type OnChangePluginProps = ComponentProps<typeof OnChangePlugin>
type EditorState = Parameters<NonNullable<OnChangePluginProps["onChange"]>>[0]

export function MaxLengthPlugin({ maxLength }: { maxLength: number }): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    let lastRestoredEditorState: EditorState | null = null

    return editor.registerNodeTransform(RootNode, (rootNode: RootNode) => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return
      }
      const prevEditorState = editor.getEditorState()
      const prevTextContentSize = prevEditorState.read(() =>
        rootNode.getTextContentSize()
      )
      const textContentSize = rootNode.getTextContentSize()
      if (prevTextContentSize !== textContentSize) {
        const delCount = textContentSize - maxLength
        const anchor = selection.anchor

        if (delCount > 0) {
          // Restore the old editor state instead if the last
          // text content was already at the limit.
          if (
            prevTextContentSize === maxLength &&
            lastRestoredEditorState !== prevEditorState
          ) {
            lastRestoredEditorState = prevEditorState
            $restoreEditorState(editor, prevEditorState)
          } else {
            $trimTextContentFromAnchor(editor, anchor, delCount)
          }
        }
      }
    })
  }, [editor, maxLength])

  return null
}
