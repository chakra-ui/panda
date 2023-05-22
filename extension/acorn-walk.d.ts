declare module "acorn-walk" {
  type NodeType = import("estree").Node["type"];
  type DiscriminateUnion<
    T,
    K extends keyof T,
    V extends T[K] = T[K]
  > = T extends Record<K, V> ? T : never;
  type NarrowNode<K extends NodeType> = DiscriminateUnion<
    import("estree").Node,
    "type",
    K
  >;

  type FullWalkerCallback<TState> = (
    node: import("estree").Node,
    state: TState,
    type: NodeType
  ) => void;

  type FullAncestorWalkerCallback<TState> = (
    node: import("estree").Node,
    state: TState | import("estree").Node[],
    ancestors: import("estree").Node[],
    type: NodeType
  ) => void;
  type WalkerCallback<TState> = (
    node: import("estree").Node,
    state: TState
  ) => void;

  type SimpleWalkerFn<K extends NodeType, TState> = (
    node: NarrowNode<K>,
    state: TState
  ) => void;

  type AncestorWalkerFn<K extends NodeType, TState> = (
    node: NarrowNode<K>,
    state: TState | import("estree").Node[],
    ancestors: import("estree").Node[]
  ) => void;

  type RecursiveWalkerFn<K extends NodeType, TState> = (
    node: NarrowNode<K>,
    state: TState,
    callback: WalkerCallback<TState>
  ) => void;

  type SimpleVisitors<Types extends NodeType, TState> = {
    [Type in Types]: SimpleWalkerFn<Type, TState>;
  };

  type AncestorVisitors<Types extends NodeType, TState> = {
    [Type in Types]: AncestorWalkerFn<Type, TState>;
  };

  type RecursiveVisitors<Types extends NodeType, TState> = {
    [Type in Types]: RecursiveWalkerFn<Type, TState>;
  };

  type FindPredicate = (type: NodeType, node: import("estree").Node) => boolean;

  interface Found<Type extends NodeType, TState> {
    node: NarrowNode<Type>;
    state: TState;
  }

  /**
   * Does a 'simple' walk over a tree.
   * @param node An AST node to walk
   * @param visitors An object with properties whose names correspond to node types in the ESTree spec
   * @param base A default walker algorithm for nodes not specified in the visitors object
   * @param state Start state
   */
  export function simple<TState, K extends NodeType>(
    node: import("estree").Node,
    visitors: SimpleVisitors<K, TState>,
    base?: RecursiveVisitors<NodeType, TState>,
    state?: TState
  ): void;

  /**
   * Does a 'simple' walk over a tree, building up an array of ancestor nodes (including the current node) and passing the array to the callbacks as a third parameter.
   * @param node An AST node to walk
   * @param visitors An object with properties whose names correspond to node types in the ESTree spec
   * @param base A default walker algorithm for nodes not specified in the visitors object
   * @param state Start state
   */
  export function ancestor<TState, K extends NodeType>(
    node: import("estree").Node,
    visitors: AncestorVisitors<K, TState>,
    base?: RecursiveVisitors<NodeType, TState>,
    state?: TState
  ): void;

  /**
   * Does a 'recursive' walk, where the walker functions are responsible for continuing the walk on the child nodes of their target node
   * @param node An AST node to walk
   * @param state Start state
   * @param functions An object that maps node types to walker functions
   * @param base A default walker algorithm for nodes not specified in the `functions` object
   */
  export function recursive<TState, K extends NodeType>(
    node: import("estree").Node,
    state: TState,
    functions: RecursiveVisitors<K, TState>,
    base?: RecursiveVisitors<NodeType, TState>
  ): void;

  /**
   * Does a 'full' walk over a tree, calling the callback with the arguments for each node
   * @param node An AST node to walk
   * @param callback A callback that is called once for each node.
   * @param base A default walker algorithm.
   * @param state Start state
   */
  export function full<TState>(
    node: import("estree").Node,
    callback: FullWalkerCallback<TState>,
    base?: RecursiveVisitors<NodeType, TState>,
    state?: TState
  ): void;

  /**
   * Does a 'full' walk over a tree, building up an array of ancestor nodes (including the current node) and passing the array to the callbacks.
   * @param node An AST node to walk
   * @param callback A callback that is called once for each node.
   * @param base A default walker algorithm for nodes not specified in the `functions` object
   * @param state Start state
   */
  export function fullAncestor<TState>(
    node: import("estree").Node,
    callback: FullAncestorWalkerCallback<TState>,
    base?: RecursiveVisitors<NodeType, TState>,
    state?: TState
  ): void;

  /**
   * Builds a new walker object by using the walker functions in functions and filling in the missing ones by taking defaults from base.
   * @param functions An object that maps node types to walker functions
   * @param base A default walker algorithm for nodes not specified in the `functions` object
   * @return An object with a walker callback for each node type.
   */
  export function make<TState, K extends NodeType>(
    functions: RecursiveVisitors<K, TState>,
    base?: RecursiveVisitors<NodeType, TState>
  ): RecursiveVisitors<NodeType, TState>;

  /**
   * Tries to locate a node in a tree at the given start and/or end offsets, which satisfies the predicate test.
   * `start` and `end` can be either null (as wildcard) or a number. `test` may be a string (indicating a node type) or
   * a function that takes (nodeType, node) arguments and returns a boolean indicating whether this node is interesting.
   * `base` and `state` are optional, and can be used to specify a custom walker. Nodes are tested from inner to outer,
   * so if two nodes match the boundaries, the inner one will be preferred.
   * @param node A node where to start searching.
   * @param start Start position to look for.
   * @param end End position to look for.
   * @param type Type of node to find.
   * @param base A default walker algorithm for nodes
   * @param state Start state
   * @return Details about the found node, or `undefined` otherwise.
   */
  export function findNodeAt<TState, K extends NodeType>(
    node: import("estree").Node,
    start: number | undefined,
    end: number | undefined,
    type: K,
    base?: RecursiveVisitors<NodeType, TState>,
    state?: TState
  ): Found<K, TState> | undefined;

  /**
   * Tries to locate a node in a tree at the given start and/or end offsets, which satisfies the predicate test.
   * `start` and `end` can be either null (as wildcard) or a number. `test` may be a string (indicating a node type) or
   * a function that takes (nodeType, node) arguments and returns a boolean indicating whether this node is interesting.
   * `base` and `state` are optional, and can be used to specify a custom walker. Nodes are tested from inner to outer,
   * so if two nodes match the boundaries, the inner one will be preferred.
   * @param node A node where to start searching.
   * @param start Start position to look for.
   * @param end End position to look for.
   * @param type A predicate that tests whether a node is interesting and should be returned.
   * @param base A default walker algorithm for nodes
   * @param state Start state
   * @return Details about the found node, or `undefined` otherwise.
   */
  export function findNodeAt<TState>(
    node: import("estree").Node,
    start: number | undefined,
    end: number | undefined,
    type?: FindPredicate,
    base?: RecursiveVisitors<NodeType, TState>,
    state?: TState
  ): Found<NodeType, TState> | undefined;

  /**
   * Is a lot like `findNodeAt`, but will match any node that exists 'around' (spanning) the given position.
   */
  export const findNodeAround: typeof findNodeAt;

  /**
   * Is similar to `findNodeAround`, but will match all nodes after the given position (testing outer nodes before inner nodes).
   */
  export const findNodeAfter: typeof findNodeAt;
}
