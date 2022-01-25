"use strict";
// validate.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.response = exports.request = void 0;
function isEmpty(value) {
    return value === undefined || value === '' || (value instanceof Object && Object.keys(value).length === 0);
}
function validate(value, schema) {
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
    const error = {
        actual: value,
        expected: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            schema: schema.schema,
            type: schema.type,
            format: schema.format,
        },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const errorDetail = schema.validator.error;
    if (errorDetail) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        error.error = errorDetail;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
    if (typeof error.expected.schema === 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
        delete error.expected.schema;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
    if (typeof error.expected.type === 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
        delete error.expected.type;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
    if (typeof error.expected.format === 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
        delete error.expected.format;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-argument
    if (Object.keys(error.expected).length === 0) {
        // nothing is expected, so set to undefined
        error.expected = undefined;
    }
    return error;
}
// eslint-disable-next-line sonarjs/cognitive-complexity
function request(compiledPath, method, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
query, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
body, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
headers, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
pathParameters) {
    if (typeof compiledPath === 'undefined') {
        return;
    }
    // get operation object for path and method
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
    const operation = compiledPath.path[method.toLowerCase()];
    if (typeof operation === 'undefined') {
        // operation not defined, return 405 (method not allowed)
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const parameters = operation.resolvedParameters;
    const validationErrors = [];
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
    parameters.forEach((parameter) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let value;
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
                }
                else {
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
exports.request = request;
function response(compiledPath, method, status, body) {
    if (typeof compiledPath === 'undefined') {
        return {
            actual: 'UNDEFINED_PATH',
            expected: 'PATH',
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const operation = compiledPath.path[method.toLowerCase()];
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
exports.response = response;
//# sourceMappingURL=validate.js.map