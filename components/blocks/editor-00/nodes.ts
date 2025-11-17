import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import {
  ParagraphNode,
  TextNode,
} from "lexical"
import type { LexicalNode } from "lexical"

type Klass<T> = new (...args: any[]) => T

export const nodes: ReadonlyArray<Klass<LexicalNode>> =
  [HeadingNode, ParagraphNode, TextNode, QuoteNode]
