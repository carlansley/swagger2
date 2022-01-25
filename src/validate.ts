// validate.ts

/*
 * Validate requests and responses in a web framework-neutral way
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

import type { CompiledDefinition, CompiledPath } from './compiler';

export interface ValidationError {
  where?: string;
  name?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actual: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expected: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
}

function isEmpty(value: unknown) {
  return value === undefined || value === '' || (value instanceof Object && Object.keys(value).length === 0);
}

function validate(value: unknown, schema: CompiledDefinition): ValidationError | undefined {
  // if no schema, treat as an error
  if (typeof schema === 'undefined') {
    return {
      actual: value,
      expected: {
        schema,
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      schema: schema.schema,
      type: schema.type,
      format: schema.format,
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const errorDetail = (schema.validator as any).error;
  if (errorDetail) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    error.error = errorDetail;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
  if (typeof (error as any).expected.schema === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
    delete (error as any).expected.schema;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
  if (typeof (error as any).expected.type === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
    delete (error as any).expected.type;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
  if (typeof (error as any).expected.format === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
    delete (error as any).expected.format;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-argument
  if (Object.keys((error as any).expected).length === 0) {
    // nothing is expected, so set to undefined
    error.expected = undefined;
  }
  return error;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function request(
  compiledPath: CompiledPath | undefined,
  method: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query?: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headers?: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pathParameters?: { [name: string]: any }
): ValidationError[] | undefined {
  if (typeof compiledPath === 'undefined') {
    return;
  }

  // get operation object for path and method
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
  const operation = (compiledPath.path as any)[method.toLowerCase()];

  if (typeof operation === 'undefined') {
    // operation not defined, return 405 (method not allowed)
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const parameters = operation.resolvedParameters;
  const validationErrors: ValidationError[] = [];
  let bodyDefined = false;

  // check all the parameters match swagger schema
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (parameters.length === 0) {
    const error = validate(body, { validator: isEmpty });
    if (typeof error !== 'undefined') {
      error.where = 'body';
      validationErrors.push(error);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (typeof query !== 'undefined' && Object.keys(query).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Object.keys(query).forEach((key) => {
        validationErrors.push({
          where: 'query',
          name: key,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
          actual: query[key],
          expected: {},
        });
      });
    }

    return validationErrors;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
  parameters.forEach((parameter: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    switch (parameter.in) {
      case 'query':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        value = (query ?? {})[parameter.name];
        break;
      case 'path':
        if (pathParameters) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
          value = pathParameters[parameter.name];
        } else {
          // eslint-disable-next-line require-unicode-regexp,no-useless-escape
          const actual = (compiledPath.requestPath || '').match(/[^\/]+/g);
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions,@typescript-eslint/no-unsafe-member-access
          const valueIndex = compiledPath.expected.indexOf(`{${parameter.name}}`);
          value = actual ? actual[valueIndex] : undefined;
        }
        break;
      case 'body':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        value = body;
        bodyDefined = true;
        break;
      case 'header':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        value = (headers ?? {})[parameter.name];
        break;
      case 'formData':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        value = (body ?? {})[parameter.name];
        bodyDefined = true;
        break;
      default:
      // do nothing
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const error = validate(value, parameter);
    if (typeof error !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      error.where = parameter.in;
      validationErrors.push(error);
    }
  });

  // ensure body is undefined if no body schema is defined
  if (!bodyDefined && typeof body !== 'undefined') {
    const error = validate(body, { validator: isEmpty });
    if (typeof error !== 'undefined') {
      error.where = 'body';
      validationErrors.push(error);
    }
  }

  return validationErrors;
}

export function response(
  compiledPath: CompiledPath | undefined,
  method: string,
  status: number,
  body?: unknown
): ValidationError | undefined {
  if (typeof compiledPath === 'undefined') {
    return {
      actual: 'UNDEFINED_PATH',
      expected: 'PATH',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const operation = (compiledPath.path as any)[method.toLowerCase()];

  // check the response matches the swagger schema
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  let schema = operation.responses[status];
  if (typeof schema === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    schema = operation.responses.default;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return validate(body, schema);
}
