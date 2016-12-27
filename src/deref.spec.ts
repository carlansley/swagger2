// dref.spec.ts

/*
 The MIT License

 Copyright (c) 2016 Christian Holzberger

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the 'Software'), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

import * as swagger from './swagger';
import * as assert from 'assert';

const EXT_YML = {
  name: 'base',
  ref: {
    name: 'ext'
  }
};
/* see nested dereference bug
const ext_nested_yml = {
  name: 'base',
  ref: {
    name: 'nested',
  }
};
*/

const INT_YML = {
  name: 'base',
  intname: 'int',
  ref: {
    name: 'int'
  }
};

const SUB_YML = {
  name: 'base-sub',
  sub: {
    name: 'sub-level1',
    sub: {
      name: 'sub-level2'
    }
  }
};

const baseFolder = __dirname + '/../test/yaml/deref/';

describe('Reference resolution', () => {

  describe('in async mode', () => {

    it('does dereference external references in yaml files', () => {
      const raw = swagger.loadDocumentSync(baseFolder + 'base.yaml');
      return swagger.deref(raw, {baseFolder}).then ((document) => {
        assert.deepStrictEqual(document, EXT_YML);
      });
    });
    /*
     * this doesn't work and i can't figure out why... 
     * perhaps a bug in json-schema-deref?
     
    it('does dereference nested external references in yaml files', () => {
      const raw = swagger.loadDocumentSync(baseFolder + 'base.nested.yaml');
      return swagger.deref(raw, {baseFolder: baseFolder}).then ((document) => {
        assert.deepStrictEqual(document, ext_nested_yml);
      });
    });
    */
    it('does dereference internal references in yaml files', () => {
      const raw = swagger.loadDocumentSync(baseFolder + 'internal.yaml');
      return swagger.deref(raw, {baseFolder}).then ((document) => {
        assert.deepStrictEqual(document, INT_YML);
      });
    });

    it('does dereference external references to yaml files in sub folders', () => {
      const raw = swagger.loadDocumentSync(baseFolder + 'base.sub.yaml');
      return swagger.deref(raw, {baseFolder}).then ((document) => {
        assert.deepStrictEqual(document, SUB_YML);
      });
    });
  });
});
