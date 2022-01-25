// schema.ts

/*
 * schema.ts
 *
 * Type definition for Swagger 2.0 schema, decorated with comments from the
 * version 2.0 spec at: http://swagger.io/specification/
 *
 * Names of objects, fields and types are designed to match the specification
 * as consistently as possible.  e.g. the Path Item Object in the spec is defined by
 * PathItem interface.
 *
 * Limitations of type definition:
 * 1) Does not support extensions to the Swagger Schema, e.g. x-internal-id.
 *    Therefore presence in an object literal will result in a compiler error.
 * 2) Format field values are limited to those enumerated in DataFormat type.
 *    The spec allows for any string.
 * 3) ONLY SUPPORTS 2.0 SCHEMA.
 */

/*
 The MIT License

 Copyright (c) 2014-2021 Carl Ansley

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

/*
 Allows extensions to the Swagger Schema. The field name MUST begin with x-, for example, x-internal-id.
 The value can be null, a primitive, an array or an object.
 */
export type Extension = null | number | boolean | string | object | Array<Extension>;

export type ParameterType = 'query' | 'path' | 'body' | 'header' | 'formData';

export type DataType = 'array' | 'string' | 'number' | 'integer' | 'boolean';

export type DataFormat =
  | 'uuid'
  | 'int32'
  | 'int64'
  | 'float'
  | 'double'
  | 'byte'
  | 'binary'
  | 'date'
  | 'date-time'
  | 'password';

export type Schemes = 'http' | 'https' | 'ws' | 'wss';

/*
 Determines the format of the array if type array is used. Possible values are:
 csv - comma separated values foo,bar.
 ssv - space separated values foo bar.
 tsv - tab separated values foo\tbar.
 pipes - pipe separated values foo|bar.
 multi - corresponds to multiple parameter instances instead of multiple values for a single instance
         foo=bar&foo=baz.   This is valid only for parameters in "query" or "formData".
 Default value is csv.
 */
export type CollectionFormat = 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';

// Contact information for the exposed API.
export interface Contact {
  name?: string; // The identifying name of the contact person/organization.
  url?: string; // The URL pointing to the contact information. MUST be in the format of a URL.
  email?: string; // The email address of the contact person/organization. MUST be in the format of an email address.
  [extension: string]: Extension; // Allows extensions to the Swagger Schema. The field name MUST begin with x-.
}

// License information for the exposed API.
export interface License {
  name: string; // The license name used for the API.
  url?: string; // A URL to the license used for the API. MUST be in the format of a URL.
  [extension: string]: Extension; // Allows extensions to the Swagger Schema. The field name MUST begin with x-.
}

/* 
 The object provides metadata about the API. The metadata can be used by the clients if needed, and can be presented in
 the Swagger-UI for convenience.
 */
export interface Info {
  title: string; // The title of the application.
  description?: string; // A short description of the application.
  termsOfService?: string; // The Terms of Service for the API.
  contact?: Contact; // The contact information for the exposed API.
  license?: License; // The license information for the exposed API.
  version: string; // Provides the version of the application API.
  [extension: string]: Extension; // Allows extensions to the Swagger Schema. The field name MUST begin with x-.
}

/*
 An object to hold data types that can be consumed and produced by operations.
 These data types can be primitives, arrays or models.
 */
export interface Definitions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: any; // A single definition, mapping a "name" to the schema it defines.
}

/*
 An object to hold parameters to be reused across operations.
 Parameter definitions can be referenced to the ones defined here.
 This does not define global operation parameters.
 */
export interface ParametersDefinitions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: any; // A single parameter definition, mapping a "name" to the parameter it defines.
}

/*
 An object to hold responses to be reused across operations.
 Response definitions can be referenced to the ones defined here.
 This does not define global operation responses.
 */
export interface ResponsesDefinitions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: any; // A single response definition, mapping a "name" to the response it defines.
}

/*
 A declaration of the security schemes available to be used in the specification.
 This does not enforce the security schemes on the operations and only serves to provide
 the relevant details for each scheme.
 */
export interface SecurityDefinitions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: any; // A single security scheme definition, mapping a "name" to the scheme it defines.
}

/*
 Lists the required security schemes to execute this operation.
 The object can have multiple security schemes declared in it which are all required (that is, there is a logical
 AND between the schemes).

 The name used for each property MUST correspond to a security scheme declared in the Security Definitions.
 */
export interface SecurityRequirement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: any; // Each name must correspond to a security scheme which is declared in the Security Definitions.
}

/*
 Allows referencing an external resource for extended documentation.
 */
export interface ExternalDocumentation {
  description?: string; // A short description of the target documentation.
  url: string; // The URL for the target documentation. Value MUST be in the format of a URL.
  [extension: string]: Extension; // Allows extensions to the Swagger Schema. The field name MUST begin with x-.
}

/*
 Allows adding metadata to a single tag that is used by the Operation Object. It is not mandatory to have a
 Tag Object per tag used there.
 */
export interface Tag {
  name: string; // The name of the tag.
  description?: string; // A short description for the tag.
  externalDocs?: ExternalDocumentation; // Additional external documentation for this tag.
  [extension: string]: Extension; // Allows extensions to the Swagger Schema. The field name MUST begin with x-.
}

export interface Definition {
  $ref?: string;
  type?: DataType;
  format?: DataFormat;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema?: any;
  required?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headers?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  examples?: any;
}

export interface Operation {
  summary?: string;
  operationId?: string;
  description?: string;
  tags?: string[];
  produces?: string[];
  parameters?: Parameter[];
  responses: { [statusCode: string]: Response };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  security?: any;
}

/*
 Describes the operations available on a single path. A Path Item may be empty, due to ACL constraints. The path itself
 is still exposed to the documentation viewer but they will not know which operations and parameters are available.
 */
export interface PathItem {
  $ref?: Operation;
  get?: Operation;
  put?: Operation;
  post?: Operation;
  // noinspection ReservedWordAsName
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  patch?: Operation;
  parameters?: Operation;
}

/*
 Holds the relative paths to the individual endpoints. The path is appended to the basePath in order to construct the
 full URL. The Paths may be empty, due to ACL constraints.
 */
export interface Paths {
  /*
   A relative path to an individual endpoint. The field name MUST begin with a slash. The path is appended to the
   basePath in order to construct the full URL. PathItem templating is allowed.
   */
  [path: string]: PathItem; // Allows extensions to the Swagger Schema. The field name MUST begin with x-.
}

/*
 This is the root document object for the API specification. It combines what previously was the Resource Listing
 and API Declaration (version 1.2 and earlier) together into one document.
 */
export interface Document {
  /*
   Specifies the Swagger Specification version being used. It can be used by the Swagger UI and other clients to
   interpret the API listing. The value MUST be "2.0".
   */
  swagger: '2.0';

  /*
   Provides metadata about the API. The metadata can be used by the clients if needed.
   */
  info: Info;

  /*
   The host (name or ip) serving the API. This MUST be the host only and does not include the scheme nor sub-paths. It
   MAY include a port. If the host is not included, the host serving the documentation is to be used (including the
   port). The host does not support path templating.
   */
  host?: string;

  /*
   The base path on which the API is served, which is relative to the host. If it is not included, the API is served
   directly under the host. The value MUST start with a leading slash (/). The basePath does not support path
   templating.
   */
  basePath?: string;

  /*
   The transfer protocol of the API. Values MUST be from the list: "http", "https", "ws", "wss". If the schemes is not
   included, the default scheme to be used is the one used to access the Swagger definition itself.
   */
  schemes?: Schemes[];

  /*
   A list of MIME types the APIs can consume. This is global to all APIs but can be overridden on specific API calls.
   Value MUST be as described under Mime Types.
   */
  consumes?: string[];

  /*
   A list of MIME types the APIs can produce. This is global to all APIs but can be overridden on specific API calls.
   Value MUST be as described under Mime Types.
   */
  produces?: string[];

  /*
   The available paths and operations for the API.
   */
  paths: Paths;

  /*
   An object to hold data types produced and consumed by operations.
   */
  definitions?: Definitions;

  /*
   An object to hold parameters that can be used across operations. This property does not define global parameters for
   all operations.
   */
  parameters?: ParametersDefinitions;

  /*
   An object to hold responses that can be used across operations. This property does not define global responses for
   all operations.
   */
  responses?: ResponsesDefinitions;

  /*
   Security scheme definitions that can be used across the
   specification.
   */
  securityDefinitions?: SecurityDefinitions;

  /*
   A declaration of which security schemes are applied for the API as a whole. The list of values describes alternative
   security schemes that can be used (that is, there is a logical OR between the security requirements). Individual
   operations can override this definition.
   */
  security?: SecurityRequirement;

  /*
   A list of tags used by the specification with additional metadata. The order of the tags can be used to reflect on
   their order by the parsing tools. Not all tags that are used by the Operation Object must be declared. The tags that
   are not declared may be organized randomly or based on the tools' logic. Each tag name in the list MUST be unique.
   */
  tags?: Tag;

  /*
   Additional external documentation.
   */
  externalDocs?: ExternalDocumentation;

  [extension: string]: Extension;
}
