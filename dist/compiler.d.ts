import type { Definition, Document, Parameter, PathItem } from './schema';
export interface CompiledDefinition extends Definition {
    validator: (value: any) => boolean;
}
export interface CompiledParameter extends Parameter {
    validator: (value: any) => boolean;
}
export interface CompiledPath {
    regex: RegExp;
    path: PathItem;
    name: string;
    expected: string[];
    requestPath?: string;
}
export declare type Compiled = (path: string) => CompiledPath | undefined;
export declare function compile(document: Document): Compiled;
