// compiler.js

/*
 * Convert a swagger document into a compiled form so that it can be used by validator
 */

/*
 The MIT License

 Copyright (c) 2014-2018 Carl Ansley

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

import * as jsonValidator from 'is-my-json-valid';
import * as deref from 'json-schema-deref-sync';

import {CollectionFormat, Definition, Document, Parameter, PathItem} from './schema';

export type Compiled = (path: string) => CompiledPath | undefined;

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


/*
 * We need special handling for query validation, since they're all strings.
 * e.g. we must treat "5" as a valid number
 */
function stringValidator(schema: any) {
  const validator = jsonValidator(schema);
  return (value: any) => {

    // if an optional field is not provided, we're all good other not so much
    if (value === undefined) {
      return !schema.required;
    }

    switch (schema.type) {
      case 'number':
      case 'integer':
        if (!isNaN(value)) {
          // if the value is a number, make sure it's a number
          value = +value;
        }
        break;

      case 'boolean':
        if (value === 'true') {
          value = true;
        } else if (value === 'false') {
          value = false;
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          const format: CollectionFormat = schema.collectionFormat || 'csv';
          switch (format) {
            case 'csv':
              value = String(value).split(',');
              break;
            case 'ssv':
              value = String(value).split(' ');
              break;
            case 'tsv':
              value = String(value).split('\t');
              break;
            case 'pipes':
              value = String(value).split('|');
              break;
            case 'multi':
            default:
              value = [value];
              break;
          }
        }
        switch (schema.items.type) {
          case 'number':
          case 'integer':
            value = value.map((num: any) => {
              if (!isNaN(num)) {
                // if the value is a number, make sure it's a number
                return +num;
              } else {
                return num;
              }
            });
            break;
          case 'boolean':
            value = value.map((bool: any) => {
              if (bool === 'true') {
                return true;
              } else if (bool === 'false') {
                return false;
              } else {
                return bool;
              }
            });
            break;
          default:
          // leave as-is
        }
        break;

      default:
        // leave as-is
    }
    return validator(value);
  };
}


export function compile(document: Document): Compiled {
  // get the de-referenced version of the swagger document
  const swagger = deref(document);

  // add a validator for every parameter in swagger document
  Object.keys(swagger.paths).forEach((pathName) => {
    const path = swagger.paths[pathName];
    Object.keys(path).filter((name) => name !== 'parameters').forEach((operationName) => {
      const operation = path[operationName];

      const parameters: any = {};
      const resolveParameter = (parameter: any) => {
        parameters[`${parameter.name}:${parameter.location}`] = parameter;
      };

      // start with parameters at path level
      (path.parameters || []).forEach(resolveParameter);

      // merge in or replace parameters from operation level
      (operation.parameters || []).forEach(resolveParameter);

      // create array of fully resolved parameters for operation
      operation.resolvedParameters = Object.keys(parameters).map((key) => parameters[key]);

      // create parameter validators
      operation.resolvedParameters.forEach((parameter: CompiledParameter) => {
        const schema = parameter.schema || parameter;
        if (parameter.in === 'query' || parameter.in === 'header' || parameter.in === 'path') {
          parameter.validator = stringValidator(schema);
        } else {
          parameter.validator = jsonValidator(schema);
        }
      });

      Object.keys(operation.responses).forEach((statusCode) => {
        const response = operation.responses[statusCode];
        if (response.schema) {
          response.validator = jsonValidator(response.schema);
        } else {
          // no schema, so ensure there is no response
          // tslint:disable-next-line:no-null-keyword
          response.validator = (body: any) => body === undefined || body === null || body === '';
        }
      });
    });
  });

  const basePath = swagger.basePath || '';
  const matcher: CompiledPath[] = Object.keys(swagger.paths)
    .map((name) => {
      return {
        name,
        path: swagger.paths[name],
        regex: new RegExp('^' + basePath.replace(/\/*$/, '') + name.replace(/\{[^}]*}/g, '[^/]+') + '/?$'),
        expected: (name.match(/[^\/]+/g) || []).map((s) => s.toString())
      };
    });

  return (path: string) => {
    // get a list of matching paths, there should be only one
    const matches = matcher.filter((match) => !!path.match(match.regex));
    if (matches.length === 0) {
      return;
    }
    return {requestPath: path.substring((basePath || '').length), ...matches[0]};
  };
}
