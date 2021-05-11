export type NodeType =
  | 'Program'
  | 'PipeStatement'
  | 'PipeInvocation'
  | 'String'
  | 'Number'
  | 'Variable'
  | 'Method'
  | 'Function'
  | 'CurryStatement'
  | 'UnionStatement'
  | 'SwitchStatement'
  | 'SwitchCase'
  | 'DefaultSwitchCase'
  | 'SideEffect'
  | 'DisableAutoCurrying'
  | 'FlipArguments';
export interface Node {
  type: NodeType;
  value?: string;
  childs?: Node[];
  args?: (NumberLiteral | StringLiteral | Variable)[];
  negated?: boolean;
  if?: FunctionStatement;
  else?: FunctionStatement;
  cases?: SwitchCase[];
  default?: SwitchCase;
  predicate?: string;
  disableAutoCurrying?: boolean;
  flipArguments?: boolean;
}

export interface AST extends Node {
  type: 'Program';
  childs: Node[];
}

export interface PipeStatement extends Node {
  type: 'PipeStatement';
  value: string;
  childs: Node[];
}
export interface PipeInvocation extends Node {
  type: 'PipeInvocation';
  childs: Node[];
}

export interface FunctionStatement extends Node {
  type: 'Function';
  value: string;
  args?: (NumberLiteral | StringLiteral | Variable)[];
  negated?: boolean;
  if?: FunctionStatement;
  else?: FunctionStatement;
  disableAutoCurrying?: boolean;
  flipArguments?: boolean;
}

export interface UnionStatement extends Node {
  type: 'UnionStatement';
  childs: FunctionStatement[];
}

export interface Method extends Node {
  type: 'Method';
  value: string;
  args?: (NumberLiteral | StringLiteral | Variable)[];
}

export interface SideEffect extends Node {
  type: 'SideEffect';
  value: string;
}
export interface NumberLiteral extends Node {
  type: 'Number';
  value: string;
}

export interface Variable extends Node {
  type: 'Variable';
  value: string;
}

export interface StringLiteral extends Node {
  type: 'String';
  value: string;
}

export interface SwitchStatement extends Node {
  type: 'SwitchStatement';
  cases: SwitchCase[];
  default?: SwitchCase;
}

export interface SwitchCase extends Node {
  type: 'SwitchCase' | 'DefaultSwitchCase';
  predicate: string;
  value: string;
}

export interface DisableAutoCurrying extends Node {
  type: 'DisableAutoCurrying';
}

export interface FlipArguments extends Node {
  type: 'FlipArguments';
}
