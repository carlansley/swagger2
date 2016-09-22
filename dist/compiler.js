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
var jsonValidator = require('is-my-json-valid');
var deref = require('json-schema-deref-sync');
/*
 * We need special handling for query validation, since they're all strings.
 * e.g. we must treat "5" as a valid number
 */
function queryValidator(schema) {
    var validator = jsonValidator(schema);
    return function (value) {
        if (value === undefined) {
            return validator();
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
        Object.keys(path).forEach(function (operationName) {
            var operation = path[operationName];
            (operation.parameters || []).forEach(function (parameter) {
                var schema = parameter.schema || parameter;
                if (parameter.in === 'query') {
                    parameter.validator = queryValidator(schema);
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
                    response.validator = function (body) { return body === undefined; };
                }
            });
        });
    });
    var matcher = Object.keys(swagger.paths)
        .map(function (name) {
        return {
            name: name,
            path: swagger.paths[name],
            regex: new RegExp(swagger.basePath + name.replace(/\{[^}]*}/g, '[^/]+') + '$'),
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