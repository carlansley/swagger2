"use strict";
// validate.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.response = exports.request = void 0;
// eslint-disable-next-line @typescript-eslint/no-empty-function
const Undefined = (() => { })();
function isEmpty(value) {
    return typeof value === 'undefined' || value === '' || Object.keys(value).length === 0;
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
            schema: schema.schema,
            type: schema.type,
            format: schema.format,
        },
    };
    const errorDetail = schema.validator.error;
    if (errorDetail) {
        error.error = errorDetail;
    }
    if (typeof error.expected.schema === 'undefined') {
        delete error.expected.schema;
    }
    if (typeof error.expected.type === 'undefined') {
        delete error.expected.type;
    }
    if (typeof error.expected.format === 'undefined') {
        delete error.expected.format;
    }
    if (Object.keys(error.expected).length === 0) {
        // nothing is expected, so set to undefined
        error.expected = Undefined;
    }
    return error;
}
// eslint-disable-next-line sonarjs/cognitive-complexity
function request(compiledPath, method, query, body, headers, pathParameters) {
    if (typeof compiledPath === 'undefined') {
        return;
    }
    // get operation object for path and method
    const operation = compiledPath.path[method.toLowerCase()];
    if (typeof operation === 'undefined') {
        // operation not defined, return 405 (method not allowed)
        return;
    }
    const parameters = operation.resolvedParameters;
    const validationErrors = [];
    let bodyDefined = false;
    // check all the parameters match swagger schema
    if (parameters.length === 0) {
        const error = validate(body, { validator: isEmpty });
        if (typeof error !== 'undefined') {
            error.where = 'body';
            validationErrors.push(error);
        }
        if (typeof query !== 'undefined' && Object.keys(query).length > 0) {
            Object.keys(query).forEach((key) => {
                validationErrors.push({
                    where: 'query',
                    name: key,
                    actual: query[key],
                    expected: {},
                });
            });
        }
        return validationErrors;
    }
    parameters.forEach((parameter) => {
        let value;
        switch (parameter.in) {
            case 'query':
                value = (query || {})[parameter.name];
                break;
            case 'path':
                if (pathParameters) {
                    value = pathParameters[parameter.name];
                }
                else {
                    // eslint-disable-next-line require-unicode-regexp,no-useless-escape
                    const actual = (compiledPath.requestPath || '').match(/[^\/]+/g);
                    const valueIndex = compiledPath.expected.indexOf(`{${parameter.name}}`);
                    value = actual ? actual[valueIndex] : Undefined;
                }
                break;
            case 'body':
                value = body;
                bodyDefined = true;
                break;
            case 'header':
                value = (headers || {})[parameter.name];
                break;
            case 'formData':
                value = (body || {})[parameter.name];
                bodyDefined = true;
                break;
            default:
            // do nothing
        }
        const error = validate(value, parameter);
        if (typeof error !== 'undefined') {
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
    const operation = compiledPath.path[method.toLowerCase()];
    // check the response matches the swagger schema
    let schema = operation.responses[status];
    if (typeof schema === 'undefined') {
        schema = operation.responses.default;
    }
    return validate(body, schema);
}
exports.response = response;
//# sourceMappingURL=validate.js.map