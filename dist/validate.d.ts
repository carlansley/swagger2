import { CompiledPath } from './compiler';
export interface ValidationError {
    where?: string;
    name?: string;
    actual: any;
    expected: any;
    error?: any;
}
export declare function request(compiledPath: CompiledPath | undefined, method: string, query?: any, body?: any, headers?: any): ValidationError[] | undefined;
export declare function response(compiledPath: CompiledPath | undefined, method: string, status: number, body?: any): ValidationError | undefined;
