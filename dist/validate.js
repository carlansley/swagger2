// validate.js
"use strict";
function isEmpty(value) {
    return value === undefined || value === '' || Object.keys(value).length === 0;
}
function validate(value, schema) {
    // if no schema, treat as an error
    if (schema === undefined) {
        return {
            actual: value,
            expected: {
                schema: undefined
            },
        };
    }
    var valid = schema.validator(value);
    if (valid) {
        return;
    }
    var error = {
        actual: value,
        expected: {
            schema: schema.schema,
            type: schema.type,
            format: schema.format
        }
    };
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
function request(compiledPath, method, query, body, headers) {
    if (compiledPath === undefined) {
        return;
    }
    // get operation object for path and method
    var operation = compiledPath.path[method.toLowerCase()];
    if (operation === undefined) {
        // operation not defined, return 405 (method not allowed)
        return;
    }
    var parameters = operation.resolvedParameters;
    var validationErrors = [];
    var bodyDefined = false;
    // check all the parameters match swagger schema
    if (parameters.length === 0) {
        var error = validate(body, { validator: isEmpty });
        if (error !== undefined) {
            error.where = 'body';
            validationErrors.push(error);
        }
        if (query !== undefined && Object.keys(query).length > 0) {
            Object.keys(query).forEach(function (key) {
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
    parameters.forEach(function (parameter) {
        var value;
        switch (parameter.in) {
            case 'query':
                value = (query || {})[parameter.name];
                break;
            case 'path':
                var actual = compiledPath.name.match(/[^\/]+/g);
                var valueIndex = compiledPath.expected.indexOf('{' + parameter.name + '}');
                value = actual ? actual[valueIndex] : undefined;
                break;
            case 'body':
                value = body;
                bodyDefined = true;
                break;
            case 'header':
                value = (headers || {})[parameter.name];
                break;
            default:
        }
        var error = validate(value, parameter);
        if (error !== undefined) {
            error.where = parameter.in;
            validationErrors.push(error);
        }
    });
    // ensure body is undefined if no body schema is defined
    if (!bodyDefined && body !== undefined) {
        var error = validate(body, { validator: isEmpty });
        if (error !== undefined) {
            error.where = 'body';
            validationErrors.push(error);
        }
    }
    return validationErrors;
}
exports.request = request;
function response(compiledPath, method, status, body) {
    if (compiledPath === undefined) {
        return {
            actual: 'UNDEFINED_PATH',
            expected: 'PATH'
        };
    }
    var operation = compiledPath.path[method.toLowerCase()];
    // check the response matches the swagger schema
    var response = operation.responses[status];
    if (response === undefined) {
        response = operation.responses['default'];
    }
    return validate(body, response);
}
exports.response = response;
//# sourceMappingURL=validate.js.map