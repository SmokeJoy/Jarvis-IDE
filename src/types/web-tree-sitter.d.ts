declare module 'web-tree-sitter' {
  export interface Point {
    row: number
    column: number
  }

  export interface Range {
    startPosition: Point
    endPosition: Point
    startIndex: number
    endIndex: number
  }

  export interface Node {
    type: string
    text: string
    startPosition: Point
    endPosition: Point
    startIndex: number
    endIndex: number
    childCount: number
    children: Node[]
    parent: Node | null
    nextSibling: Node | null
    previousSibling: Node | null
    firstChild: Node | null
    lastChild: Node | null
    firstNamedChild: Node | null
    lastNamedChild: Node | null
    nextNamedSibling: Node | null
    previousNamedSibling: Node | null
    hasChanges: boolean
    hasError: boolean
    isMissing: boolean
    isNamed: boolean
    isExtra: boolean
    toString(): string
    child(index: number): Node | null
    namedChild(index: number): Node | null
    childForFieldName(fieldName: string): Node | null
    descendantForIndex(index: number): Node
    descendantForPosition(position: Point): Node
    walk(): TreeCursor
  }

  export interface TreeCursor {
    nodeType: string
    nodeText: string
    startPosition: Point
    endPosition: Point
    startIndex: number
    endIndex: number
    currentNode(): Node
    gotoParent(): boolean
    gotoFirstChild(): boolean
    gotoFirstChildForIndex(index: number): boolean
    gotoNextSibling(): boolean
    reset(node: Node): void
  }

  export interface Parser {
    parse(input: string | Uint8Array, previousTree?: Tree): Tree
    setLanguage(language: Language): void
    getLanguage(): Language | null
    reset(): void
  }

  export interface Tree {
    rootNode: Node
    edit(edit: Edit): void
    getChangedRanges(oldTree: Tree): Range[]
    walk(): TreeCursor
  }

  export interface Language {
    query(source: string): Query
  }

  export interface Query {
    matches(node: Node, startPosition?: Point, endPosition?: Point): QueryMatch[]
    captures(node: Node, startPosition?: Point, endPosition?: Point): QueryCapture[]
  }

  export interface QueryMatch {
    pattern: number
    captures: QueryCapture[]
  }

  export interface QueryCapture {
    name: string
    node: Node
  }

  export interface Edit {
    startIndex: number
    oldEndIndex: number
    newEndIndex: number
    startPosition: Point
    oldEndPosition: Point
    newEndPosition: Point
  }

  export function init(): Promise<void>
  export function Parser(): Parser
} 