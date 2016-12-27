// compiler.js
"use strict";
/*
 * Convert a swagger document into a compiled form so that it can be used by validator
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
var jsonValidator = require("is-my-json-valid");
var deref = require("json-schema-deref-sync");
/*
 * We need special handling for query validation, since they're all strings.
 * e.g. we must treat "5" as a valid number
 */
function stringValidator(schema) {
    var validator = jsonValidator(schema);
    return function (value) {
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
                }
                else if (value === 'false') {
                    value = false;
                }
                break;
            case 'array':
                if (!Array.isArray(value)) {
                    var format = schema.collectionFormat || 'csv';
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
                        value = value.map(function (num) {
                            if (!isNaN(num)) {
                                // if the value is a number, make sure it's a number
                                return +num;
                            }
                            else {
                                return num;
                            }
                        });
                        break;
                    case 'boolean':
                        value = value.map(function (bool) {
                            if (bool === 'true') {
                                return true;
                            }
                            else if (bool === 'false') {
                                return false;
                            }
                            else {
                                return bool;
                            }
                        });
                        break;
                    default:
                }
                break;
            default:
        }
        return validator(value);
    };
}
function compile(document) {
    // get the de-referenced version of the swagger document
    var swagger = deref(document);
    // add a validator for every parameter in swagger document
    Object.keys(swagger.paths).forEach(function (pathName) {
        var path = swagger.paths[pathName];
        Object.keys(path).filter(function (name) { return name !== 'parameters'; }).forEach(function (operationName) {
            var operation = path[operationName];
            var parameters = {};
            var resolveParameter = function (parameter) {
                parameters[parameter.name + ":" + parameter.location] = parameter;
            };
            // start with parameters at path level
            (path.parameters || []).forEach(resolveParameter);
            // merge in or replace parameters from operation level
            (operation.parameters || []).forEach(resolveParameter);
            // create array of fully resolved parameters for operation
            operation.resolvedParameters = Object.keys(parameters).map(function (key) { return parameters[key]; });
            // create parameter validators
            operation.resolvedParameters.forEach(function (parameter) {
                var schema = parameter.schema || parameter;
                if (parameter.in === 'query' || parameter.in === 'header') {
                    parameter.validator = stringValidator(schema);
                }
                else {
                    parameter.validator = jsonValidator(schema);
                }
            });
            Object.keys(operation.responses).forEach(function (statusCode) {
                var response = operation.responses[statusCode];
                if (response.schema) {
                    response.validator = jsonValidator(response.schema);
                }
                else {
                    // no schema, so ensure there is no response
                    // tslint:disable-next-line:no-null-keyword
                    response.validator = function (body) { return body === undefined || body === null || body === ''; };
                }
            });
        });
    });
    var basePath = swagger.basePath || '';
    var matcher = Object.keys(swagger.paths)
        .map(function (name) {
        return {
            name: name,
            path: swagger.paths[name],
            regex: new RegExp(basePath + name.replace(/\{[^}]*}/g, '[^/]+') + '$'),
            expected: (name.match(/[^\/]+/g) || []).map(function (s) { return s.toString(); })
        };
    });
    return function (path) {
        // get a list of matching paths, there should be only one
        var matches = matcher.filter(function (match) { return !!path.match(match.regex); });
        if (matches.length !== 1) {
            return;
        }
        return matches[0];
    };
}
exports.compile = compile;
//# sourceMappingURL=compiler.js.map