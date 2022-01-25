export declare type Extension = null | number | boolean | string | object | Array<Extension>;
export declare type ParameterType = 'query' | 'path' | 'body' | 'header' | 'formData';
export declare type DataType = 'array' | 'string' | 'number' | 'integer' | 'boolean';
export declare type DataFormat = 'uuid' | 'int32' | 'int64' | 'float' | 'double' | 'byte' | 'binary' | 'date' | 'date-time' | 'password';
export declare type Schemes = 'http' | 'https' | 'ws' | 'wss';
export declare type CollectionFormat = 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';
export interface Contact {
    name?: string;
    url?: string;
    email?: string;
    [extension: string]: Extension;
}
export interface License {
    name: string;
    url?: string;
    [extension: string]: Extension;
}
export interface Info {
    title: string;
    description?: string;
    termsOfService?: string;
    contact?: Contact;
    license?: License;
    version: string;
    [extension: string]: Extension;
}
export interface Definitions {
    [name: string]: any;
}
export interface ParametersDefinitions {
    [name: string]: any;
}
export interface ResponsesDefinitions {
    [name: string]: any;
}
export interface SecurityDefinitions {
    [name: string]: any;
}
export interface SecurityRequirement {
    [name: string]: any;
}
export interface ExternalDocumentation {
    description?: string;
    url: string;
    [extension: string]: Extension;
}
export interface Tag {
    name: string;
    description?: string;
    externalDocs?: ExternalDocumentation;
    [extension: string]: Extension;
}
export interface Definition {
    $ref?: string;
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
export interface PathItem {
    $ref?: Operation;
    get?: Operation;
    put?: Operation;
    post?: Operation;
    delete?: Operation;
    options?: Operation;
    head?: Operation;
    patch?: Operation;
    parameters?: Operation;
}
export interface Paths {
    [path: string]: PathItem;
}
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
    [extension: string]: Extension;
}
