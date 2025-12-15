/**
 * Type declarations for EditorJS modules that don't have published TypeScript definitions.
 *
 * This file was created to resolve TypeScript errors for EditorJS plugins that either:
 * 1. Don't ship with TypeScript definitions (@editorjs/checklist, @editorjs/marker, etc.)
 * 2. Have definitions that aren't properly exported in their package.json (@editorjs/embed)
 *
 * Without these declarations, TypeScript throws TS7016 errors:
 * "Could not find a declaration file for module '@editorjs/[plugin]'"
 *
 * These minimal type definitions provide enough type information for TypeScript to compile
 * while allowing the actual runtime behavior to be handled by the JavaScript implementations.
 * Using 'any' for config parameters is intentional as each plugin has different config schemas.
 */

declare module "@editorjs/checklist" {
  import { BlockTool } from "@editorjs/editorjs";
  export default class Checklist implements BlockTool {
    constructor(config: any);
    static get toolbox(): any;
    render(): HTMLElement;
    save(blockContent: HTMLElement): any;
  }
}

declare module "@editorjs/marker" {
  import { InlineTool } from "@editorjs/editorjs";
  export default class Marker implements InlineTool {
    constructor(config: any);
    static get isInline(): boolean;
    render(): HTMLElement;
    surround(range: Range): void;
    checkState(selection: Selection): boolean;
  }
}

declare module "@editorjs/link" {
  import { BlockTool } from "@editorjs/editorjs";
  export default class LinkTool implements BlockTool {
    constructor(config: any);
    static get toolbox(): any;
    render(): HTMLElement;
    save(blockContent: HTMLElement): any;
  }
}

declare module "@editorjs/raw" {
  import { BlockTool } from "@editorjs/editorjs";
  export default class RawTool implements BlockTool {
    constructor(config: any);
    static get toolbox(): any;
    render(): HTMLElement;
    save(blockContent: HTMLElement): any;
  }
}

declare module "@editorjs/embed" {
  import { BlockTool } from "@editorjs/editorjs";
  export default class Embed implements BlockTool {
    constructor(config: any);
    static get toolbox(): any;
    render(): HTMLElement;
    save(blockContent: HTMLElement): any;
  }
}
