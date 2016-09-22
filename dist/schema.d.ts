export declare type ParameterType = 'query' | 'path' | 'body';
export declare type DataType = 'array' | 'string' | 'number' | 'integer' | 'boolean';
export declare type DataFormat = 'uuid' | 'int32' | 'int64' | 'float' | 'double' | 'byte' | 'binary' | 'date' | 'date-time' | 'password';
export declare type Schemes = 'http' | 'https' | 'ws' | 'wss';
export interface Document {
    swagger: '2.0';
    info: Info;
    host?: string;
    basePath?: string;
    schemes?: Schemes[];
    consumes?: string[];
    produces?: string[];
    paths: Paths;
    definitions?: Definitions;
    parameters?: ParametersDefinitions;
    responses?: ResponsesDefinitions;
    securityDefinitions?: SecurityDefinitions;
    security?: SecurityRequirement;
    tags?: Tag;
    externalDocs?: ExternalDocumentation;
}
export interface Info {
    title: string;
    description?: string;
    termsOfService?: string;
    contact?: Contact;
    license?: License;
    version: string;
}
export interface Contact {
    name?: string;
    url?: string;
    email?: string;
}
export interface License {
    name: string;
    url?: string;
}
export interface Paths {
    [path: string]: PathItem;
}
export interface PathItem {
    '$ref'?: Operation;
    get?: Operation;
    put?: Operation;
    post?: Operation;
    delete?: Operation;
    options?: Operation;
    head?: Operation;
    patch?: Operation;
    parameters?: Operation;
}
export interface Definitions {
}
export interface ParametersDefinitions {
}
export interface ResponsesDefinitions {
}
export interface SecurityDefinitions {
}
export interface SecurityRequirement {
}
export interface Tag {
}
export interface ExternalDocumentation {
}
export interface Definition {
    '$ref'?: string;
    type?: DataType;
    format?: DataFormat;
    schema?: any;
    required?: boolean;
    items?: any;
    collectionFormat?: string;
}
export interface Parameter extends Definition {
    name?: string;
    in?: ParameterType;
    description?: string;
}
export interface Response extends Definition {
    description: string;
    headers?: any;
    examples?: any;
}
export interface Operation {
    summary?: string;
    operationId?: string;
    description?: string;
    tags?: string[];
    produces?: string[];
    parameters?: Parameter[];
    responses: {
        [statusCode: string]: Response;
    };
    security?: any;
}
