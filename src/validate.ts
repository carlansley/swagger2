// validate.js

/*
 * Validate requests and responses in a web framework-neutral way
 */

/*
 The MIT License

 Copyright (c) 2014-2016 Carl Ansley

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

import {CompiledDefinition, CompiledPath} from './compiler';

export interface ValidationError {
  where?: string;
  name?: string;
  actual: any;
  expected: any;
  error?: any;
}

function isEmpty(value: any) {
  return value === undefined || value === '' || Object.keys(value).length === 0;
}

function validate(value: any, schema: CompiledDefinition): ValidationError | undefined {

  // if no schema, treat as an error
  if (schema === undefined) {
    return {
      actual: value,
      expected: {
        schema: undefined
      },
    };
  }

  const valid = schema.validator(value);
  if (valid) {
    return;
  }
  const error: ValidationError = {
    actual: value,
    expected: {
      schema: schema.schema,
      type: schema.type,
      format: schema.format
    },
  };
  const errorDetail = (schema.validator as any).error;
  if (errorDetail) {
    error.error = errorDetail;
  }

  if (error.expected.schema === undefined) {
    delete error.expected.schema;
  }
  if (error.expected.type === undefined) {
    delete error.expected.type;
  }
  if (error.expected.format === undefined) {
    delete error.expected.format;
  }
  if (Object.keys(error.expected).length === 0) {
    // nothing is expected, so set to undefined
    error.expected = undefined;
  }
  return error;
}

export function request(compiledPath: CompiledPath | undefined,
                        method: string,
                        query?: any,
                        body?: any,
                        headers?: any,
                        pathParameters?: { [name: string]: any }): ValidationError[] | undefined {

  if (compiledPath === undefined) {
    return;
  }

  // get operation object for path and method
  const operation = (compiledPath.path as any)[method.toLowerCase()];

  if (operation === undefined) {
    // operation not defined, return 405 (method not allowed)
    return;
  }

  const parameters = operation.resolvedParameters;
  const validationErrors: ValidationError[] = [];
  let bodyDefined = false;

  // check all the parameters match swagger schema
  if (parameters.length === 0) {

    const error = validate(body, {validator: isEmpty});
    if (error !== undefined) {
      error.where = 'body';
      validationErrors.push(error);
    }

    if (query !== undefined && Object.keys(query).length > 0) {
      Object.keys(query).forEach((key) => {
        validationErrors.push({
          where: 'query',
          name: key,
          actual: query[key],
          expected: {}
        });
      });
    }

    return validationErrors;
  }

  parameters.forEach((parameter: any) => {

    let value: any;
    switch (parameter.in) {
      case 'query':
        value = (query || {})[parameter.name];
        break;
      case 'path':
        if (pathParameters) {
          value = pathParameters[parameter.name];
        } else {
          const actual = compiledPath.name.match(/[^\/]+/g);
          const valueIndex = compiledPath.expected.indexOf('{' + parameter.name + '}');
          value = actual ? actual[valueIndex] : undefined;
        }
        break;
      case 'body':
        value = body;
        bodyDefined = true;
        break;
      case 'header':
        value = (headers || {})[parameter.name];
        break;
      default:
      // do nothing
    }

    const error = validate(value, parameter);
    if (error !== undefined) {
      error.where = parameter.in;
      validationErrors.push(error);
    }
  });

  // ensure body is undefined if no body schema is defined
  if (!bodyDefined && body !== undefined) {
    const error = validate(body, {validator: isEmpty});
    if (error !== undefined) {
      error.where = 'body';
      validationErrors.push(error);
    }
  }

  return validationErrors;
}


export function response(compiledPath: CompiledPath | undefined,
                         method: string,
                         status: number,
                         body?: any): ValidationError | undefined {

  if (compiledPath === undefined) {
    return {
      actual: 'UNDEFINED_PATH',
      expected: 'PATH'
    };
  }

  const operation = (compiledPath.path as any)[method.toLowerCase()];

  // check the response matches the swagger schema
  let schema = operation.responses[status];
  if (schema === undefined) {
    schema = operation.responses.default;
  }

  return validate(body, schema);
}
