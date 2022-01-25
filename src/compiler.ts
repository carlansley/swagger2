// compiler.ts

/*
 * Convert a swagger document into a compiled form so that it can be used by validator
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

import { default as jsonValidator } from 'is-my-json-valid';
import deref from 'json-schema-deref-sync';

import type { CollectionFormat, Definition, Document, Parameter, PathItem } from './schema';

export interface CompiledDefinition extends Definition {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validator: (value: any) => boolean;
}

export interface CompiledParameter extends Parameter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validator: (value: any) => boolean;
}

export interface CompiledPath {
  regex: RegExp;
  path: PathItem;
  name: string;
  expected: string[];
  requestPath?: string;
}

export type Compiled = (path: string) => CompiledPath | undefined;

/*
 * We need special handling for query validation, since they're all strings.
 * e.g. we must treat "5" as a valid number
 */
function stringValidator(schema: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validator = jsonValidator(schema as any); // is-my-json-valid doesn't export its types...
  return (inputValue: unknown) => {
    // if an optional field is not provided, we're all good other not so much
    if (inputValue === undefined) {
      return !schema['required'];
    }

    let value = inputValue;

    switch (schema['type']) {
      case 'number':
      case 'integer':
        if (!isNaN(value as number)) {
          // if the value is a number, make sure it's a number
          value = Number(value);
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
          const format = schema['collectionFormat'] || ('csv' as CollectionFormat);
          // eslint-disable-next-line sonarjs/no-nested-switch
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
        // eslint-disable-next-line sonarjs/no-nested-switch
        switch ((schema['items'] as { type: string }).type) {
          case 'number':
          case 'integer':
            value = (value as number[]).map((num) => {
              if (!isNaN(num)) {
                // if the value is a number, make sure it's a number
                return Number(num);
              }
              return num;
            });
            break;
          case 'boolean':
            value = (value as (boolean | 'true' | 'false')[]).map((bool) => {
              if (bool === 'true') {
                return true;
              } else if (bool === 'false') {
                return false;
              }
              return bool;
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
  const swagger = deref(document) as Document;

  // add a validator for every parameter in swagger document
  Object.keys(swagger.paths).forEach((pathName) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const path = swagger.paths[pathName] as Record<string, any>;
    Object.keys(path)
      .filter((name) => name !== 'parameters')
      .forEach((operationName) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const operation = path[operationName];

        const parameters: Record<string, unknown> = {};
        const resolveParameter = (parameter: { name: string; location: string }) => {
          parameters[`${parameter.name}:${parameter.location}`] = parameter;
        };

        // start with parameters at path level
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        (path['parameters'] ?? []).forEach(resolveParameter);

        // merge in or replace parameters from operation level
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
        (operation?.parameters ?? []).forEach(resolveParameter);

        // create array of fully resolved parameters for operation
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        operation.resolvedParameters = Object.keys(parameters).map((key) => parameters[key]);

        // create parameter validators
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        operation.resolvedParameters.forEach((parameter: CompiledParameter) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const schema = parameter.schema ?? parameter;
          if (parameter.in === 'query' || parameter.in === 'header' || parameter.in === 'path') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            parameter.validator = stringValidator(schema);
          } else {
            parameter.validator = jsonValidator(schema);
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
        Object.keys(operation.responses).forEach((statusCode) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          const response = operation.responses[statusCode];
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (response.schema) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            response.validator = jsonValidator(response.schema);
          } else {
            // no schema, so ensure there is no response
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            response.validator = (body: unknown) => typeof body === 'undefined' || body === null || body === '';
          }
        });
      });
  });

  const basePath = swagger.basePath || '';
  const matcher: CompiledPath[] = Object.keys(swagger.paths).map((name) => ({
    name,
    path: swagger.paths[name] as PathItem,
    // eslint-disable-next-line require-unicode-regexp
    regex: new RegExp(`^${basePath.replace(/\/*$/, '')}${name.replace(/{[^}]*}/g, '[^/]+')}/?$`),
    // eslint-disable-next-line no-useless-escape,require-unicode-regexp,id-length
    expected: (name.match(/[^\/]+/g) || []).map((s) => s.toString()),
  }));

  return ((path: string) => {
    // get a list of matching paths, there should be only one
    const matches = matcher.filter((match) => Boolean(path.match(match.regex)));
    if (matches.length === 0) {
      return;
    }
    return {
      requestPath: path.substring((basePath || '').length),
      ...matches[0],
    };
  }) as Compiled;
}
