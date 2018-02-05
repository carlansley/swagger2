// document.ts

/*
 * Loading, parsing and validating Swagger v2 documents
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

import * as jsonValidator from 'is-my-json-valid';
import * as YAML from 'yamljs';

import {Document} from './schema';
import * as schema from './schema.json';

// build a swagger validator from the official v2.0 schema
const schemaValidator = jsonValidator(schema);

/*
 * Validate a swagger document against the 2.0 schema, returning a typed Document object.
 */
export function validateDocument(document: any): Document | undefined {
  if (!schemaValidator(document)) {
    return;
  }
  return document;
}

/*
 * Load a swagger document.  We only support YAML for now.
 */
export function loadDocumentSync(file: string): any {
  return YAML.load(file);
}
