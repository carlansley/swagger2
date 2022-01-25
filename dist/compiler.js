"use strict";
// compiler.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = void 0;
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
const is_my_json_valid_1 = __importDefault(require("is-my-json-valid"));
const json_schema_deref_sync_1 = __importDefault(require("json-schema-deref-sync"));
/*
 * We need special handling for query validation, since they're all strings.
 * e.g. we must treat "5" as a valid number
 */
function stringValidator(schema) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validator = (0, is_my_json_valid_1.default)(schema); // is-my-json-valid doesn't export its types...
    return (inputValue) => {
        // if an optional field is not provided, we're all good other not so much
        if (inputValue === undefined) {
            return !schema['required'];
        }
        let value = inputValue;
        switch (schema['type']) {
            case 'number':
            case 'integer':
                if (!isNaN(value)) {
                    // if the value is a number, make sure it's a number
                    value = Number(value);
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
                    const format = schema['collectionFormat'] || 'csv';
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
                switch (schema['items'].type) {
                    case 'number':
                    case 'integer':
                        value = value.map((num) => {
                            if (!isNaN(num)) {
                                // if the value is a number, make sure it's a number
                                return Number(num);
                            }
                            return num;
                        });
                        break;
                    case 'boolean':
                        value = value.map((bool) => {
                            if (bool === 'true') {
                                return true;
                            }
                            else if (bool === 'false') {
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
function compile(document) {
    // get the de-referenced version of the swagger document
    const swagger = (0, json_schema_deref_sync_1.default)(document);
    // add a validator for every parameter in swagger document
    Object.keys(swagger.paths).forEach((pathName) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const path = swagger.paths[pathName];
        Object.keys(path)
            .filter((name) => name !== 'parameters')
            .forEach((operationName) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const operation = path[operationName];
            const parameters = {};
            const resolveParameter = (parameter) => {
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
            operation.resolvedParameters.forEach((parameter) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const schema = parameter.schema ?? parameter;
                if (parameter.in === 'query' || parameter.in === 'header' || parameter.in === 'path') {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    parameter.validator = stringValidator(schema);
                }
                else {
                    parameter.validator = (0, is_my_json_valid_1.default)(schema);
                }
            });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
            Object.keys(operation.responses).forEach((statusCode) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
                const response = operation.responses[statusCode];
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (response.schema) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    response.validator = (0, is_my_json_valid_1.default)(response.schema);
                }
                else {
                    // no schema, so ensure there is no response
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    response.validator = (body) => typeof body === 'undefined' || body === null || body === '';
                }
            });
        });
    });
    const basePath = swagger.basePath || '';
    const matcher = Object.keys(swagger.paths).map((name) => ({
        name,
        path: swagger.paths[name],
        // eslint-disable-next-line require-unicode-regexp
        regex: new RegExp(`^${basePath.replace(/\/*$/, '')}${name.replace(/{[^}]*}/g, '[^/]+')}/?$`),
        // eslint-disable-next-line no-useless-escape,require-unicode-regexp,id-length
        expected: (name.match(/[^\/]+/g) || []).map((s) => s.toString()),
    }));
    return ((path) => {
        // get a list of matching paths, there should be only one
        const matches = matcher.filter((match) => Boolean(path.match(match.regex)));
        if (matches.length === 0) {
            return;
        }
        return {
            requestPath: path.substring((basePath || '').length),
            ...matches[0],
        };
    });
}
exports.compile = compile;
//# sourceMappingURL=compiler.js.map