"use strict";
// document.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDocumentSync = exports.validateDocument = void 0;
/*
 * Loading, parsing and validating Swagger v2 documents
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
const fs_1 = __importDefault(require("fs"));
const is_my_json_valid_1 = __importDefault(require("is-my-json-valid"));
const yaml = __importStar(require("js-yaml"));
const schema = __importStar(require("./schema.json"));
// build a swagger validator from the official v2.0 schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const schemaValidator = (0, is_my_json_valid_1.default)(schema);
/*
 * Validate a swagger document against the 2.0 schema, returning a typed Document object.
 */
function validateDocument(document) {
    if (!schemaValidator(document)) {
        return;
    }
    return document;
}
exports.validateDocument = validateDocument;
/*
 * Load a swagger document.  We only support YAML for now.
 */
function loadDocumentSync(file) {
    // eslint-disable-next-line no-sync
    return yaml.load(fs_1.default.readFileSync(file, 'utf8'));
}
exports.loadDocumentSync = loadDocumentSync;
//# sourceMappingURL=document.js.map