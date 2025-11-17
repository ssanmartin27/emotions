import { TEXT_MATCH_TRANSFORMERS } from "@lexical/markdown"

type TextMatchTransformer = (typeof TEXT_MATCH_TRANSFORMERS)[number]
import { $createTextNode } from "lexical"

import emojiList from "components/editor/utils/emoji-list"

export const EMOJI: TextMatchTransformer = {
  dependencies: [],
  export: () => null,
  importRegExp: /:([a-z0-9_]+):/,
  regExp: /:([a-z0-9_]+):/,
  replace: (textNode, [, name]) => {
    const emoji = emojiList.find((e) => e.aliases.includes(name))?.emoji
    if (emoji) {
      textNode.replace($createTextNode(emoji))
    }
  },
  trigger: ":",
  type: "text-match",
}
