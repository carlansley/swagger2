// deref.ts

/*
 The MIT License

 Copyright (c) 2014-2016 Carl Ansley, Christian Holzberger

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
import js_deref = require('json-schema-deref');
import js_deref_sync = require('json-schema-deref-sync');
import * as YAML from 'yamljs';
import path = require('path');

/**
 * deref is not exporting their options interface
 */
export interface DerefOptions {
  baseFolder?: string;
  cache?: boolean;
  cacheTTL?: number;
  failOnMissing?: boolean;
  loader?: any;
}

/**
 * custom loader for yml references
 */
async function ymlLoader( ref: string, derefOptions: DerefOptions, fn: any ) {
  const isYamlRegex = /(.*\.y(a|)ml)($|#)/i;
  const match = ref.match(isYamlRegex);

  if ( match !== null ) {
    const refFileName = match[1];
    let yamlRef = YAML.load(path.join(derefOptions.baseFolder, refFileName));

    const optionsOverride = {
      loader: ymlLoader,
      baseFolder: path.dirname(path.join(derefOptions.baseFolder, refFileName))
    };

    const options = Object.assign({}, derefOptions, optionsOverride);
    let resolved = await derefp(yamlRef, options);
    fn(null, resolved);
  } else {
    fn();
  }
}

/*
 * A wrapper for async deref to provide a promise instead
 */
async function derefp(document: any, options?: any): Promise<any> {
  let p = new Promise<any> ((resolve, reject) => {
    js_deref(document, options, (err: any, derefedDocument: any) => {
      if ( err ) {
        reject(err);
      } else {
        resolve(derefedDocument);
      }
    });
  });
  return p;
}

/**
 * just an alias for sync dereffing of input document
 */
export function derefSync(document: any) {
  return js_deref_sync(document);
}

/**
 * async dereffing of input document
 */
export async function deref(document: any, derefOptions?: DerefOptions ) {
  let optionsOverride: DerefOptions = {
    loader: ymlLoader
  };
  const options = Object.assign({}, derefOptions , optionsOverride);
  return await derefp(document, options);
}
