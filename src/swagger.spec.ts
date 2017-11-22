// swagger.spec.ts

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

import * as assert from 'assert';

import * as swagger from './swagger';

function compile(fileName: string) {
  const raw = swagger.loadDocumentSync(fileName);
  const document: swagger.Document | undefined = swagger.validateDocument(raw);

  /* istanbul ignore if */
  if (document === undefined) {
    throw Error(`${fileName} failed to compile`);
  }

  return swagger.compileDocument(document);
}

describe('swagger2', () => {
  it('has a loadDocumentSync function', () => assert.equal(typeof swagger.loadDocumentSync, 'function'));
  it('has a validateDocument function', () => assert.equal(typeof swagger.validateDocument, 'function'));
  it('has a validateRequest function', () => assert.equal(typeof swagger.validateRequest, 'function'));
  it('has a validateResponse function', () => assert.equal(typeof swagger.validateResponse, 'function'));
  it('has a compileDocument function', () => assert.equal(typeof swagger.compileDocument, 'function'));

  describe('petstore', () => {
    const compiled = compile('test/yaml/petstore.yaml');

    it('invalid paths are undefined', () => {
      assert.equal(undefined, compiled('/v1/bad'));
      assert.equal(undefined, compiled('/v2/pets'));
    });

    it('compiles valid paths', () => {
      const compiledPath = compiled('/v1/pets');
      assert.notEqual(compiledPath, undefined);
      if (compiledPath !== undefined) {
        assert.equal(compiledPath.name, '/pets');
        assert.notEqual(compiledPath.path.get, undefined);
        if (compiledPath.path.get !== undefined) {
          assert.equal(compiledPath.path.get.summary, 'List all pets');
        }
      }
    });

    describe('/v1/pets', () => {
      const compiledPath = compiled('/v1/pets');

      it('do not allow DELETE', () => {
        assert.equal(undefined, swagger.validateRequest(compiledPath, 'delete', {}, {}));
      });

      it('do not allow undefined paths on requests or responses', () => {
        assert.equal(undefined, swagger.validateRequest(undefined, 'delete', {}, {}));
        assert.deepStrictEqual(swagger.validateResponse(undefined, 'delete', 201), {
          actual: 'UNDEFINED_PATH', expected: 'PATH'
        });
      });

      describe('put', () => {
        it('empty array works', () => {
          assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'put', undefined, []), []);
        });

        it('pet works', () => {
          assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'put', undefined, [{
            id: 123,
            name: 'name'
          }]), []);
        });

        it('pet with empty name does not work', () => {
          assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'put', undefined, [{
            id: 123,
            name: ''
          }]), [{
            actual: [{ id: 123, name: '' }],
            expected: {
              schema: {
                type: 'array',
                items: {
                  required: ['id', 'name'],
                  properties: {
                    id: { type: 'integer', format: 'int64' },
                    name: { type: 'string', minLength: 1 },
                    tag: { type: 'string' }
                  }
                }
              }
            },
            error: 'data.0.name has less length than allowed',
            where: 'body'
          }]);
        });

        describe('post', () => {

          it('body must be empty', () => {
            assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'post', undefined, { x: 'hello' }), [{
              actual: { x: 'hello' },
              expected: undefined,
              where: 'body'
            }]);
          });

          it('parameters must be empty', () => {
            assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'post', { x: 'y' }), [{
              where: 'query',
              name: 'x',
              actual: 'y',
              expected: {}
            }]);
          });

          it('succeed if request valid', () => {
            assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'post'), []);
          });

          it('fail if response invalid', () => {
            assert.deepStrictEqual(swagger.validateResponse(compiledPath, 'post', 201, {}), {
              actual: {},
              expected: undefined
            });
          });

          it('succeed if response valid', () => {
            assert.equal(swagger.validateResponse(compiledPath, 'post', 201), undefined);
            // tslint:disable-next-line:no-null-keyword
            assert.equal(swagger.validateResponse(compiledPath, 'post', 201, null), undefined);
            assert.equal(swagger.validateResponse(compiledPath, 'post', 201, ''), undefined);
          });
        });

        describe('get', () => {

          it('limit must be a number', () => {
            assert.deepStrictEqual([{
              actual: 'hello',
              expected: { type: 'integer', format: 'int32' },
              where: 'query'
            }], swagger.validateRequest(compiledPath, 'get', { limit: 'hello' }));

            assert.deepStrictEqual([{
              actual: 23.3,
              expected: { type: 'integer', format: 'int32' },
              where: 'query'
            }], swagger.validateRequest(compiledPath, 'get', { limit: 23.3 }));

            assert.deepStrictEqual([{
              actual: 'hello',
              expected: { type: 'number' },
              where: 'query'
            }], swagger.validateRequest(compiledPath, 'get', { numberLimit: 'hello' }));

            assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'get', { limit: 5 }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'get', { numberLimit: 5 }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'get', { numberLimit: 5.5 }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'get', { limit: '5' }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'get', { numberLimit: '5' }), []);
          });

          it('booleanLimit must be a boolean', () => {
            assert.deepStrictEqual([{
              actual: 'hello',
              expected: { type: 'boolean' },
              where: 'query'
            }], swagger.validateRequest(compiledPath, 'get', { booleanLimit: 'hello' }));

            assert.deepStrictEqual([{
              actual: '0',
              expected: { type: 'boolean' },
              where: 'query'
            }], swagger.validateRequest(compiledPath, 'get', { booleanLimit: '0' }));

            assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'get', { booleanLimit: true }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'get', { booleanLimit: false }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'get', { booleanLimit: 'true' }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'get', { booleanLimit: 'false' }), []);
          });

          it('body must be empty', () => {
            assert.deepStrictEqual([{
              actual: { x: 'hello' },
              expected: undefined,
              where: 'body'
            }], swagger.validateRequest(compiledPath, 'get', undefined, { x: 'hello' }));
          });

          it('ok with no limit', () => assert.deepStrictEqual([], swagger.validateRequest(compiledPath, 'get')));
          it('ok with valid limit', () => assert.deepStrictEqual([], swagger.validateRequest(compiledPath, 'get',
            { limit: 50 })));
          it('invalid method response', () => assert.deepStrictEqual(swagger.validateResponse(compiledPath, 'get', 201,
            { code: 'hello' }), {
              actual: { code: 'hello' },
              expected: {
                schema: {
                  required: ['code', 'message'],
                  properties: {
                    code: {
                      type: 'integer',
                      format: 'int32'
                    },
                    message: { type: 'string' }
                  }
                }
              },
              error: 'data.message is required'
            }));

          it('invalid object response',
            () => assert.deepStrictEqual(swagger.validateResponse(compiledPath, 'get', 200, { bad: 'object' }), {
              actual: { bad: 'object' },
              expected: {
                schema: {
                  type: 'array',
                  items: {
                    required: ['id', 'name'],
                    properties: {
                      id: { type: 'integer', format: 'int64' },
                      name: { type: 'string', minLength: 1 },
                      tag: { type: 'string' }
                    }
                  }
                }
              },
              error: 'data is the wrong type'
            }));

          it('invalid array response', () => assert
            .deepStrictEqual(swagger.validateResponse(compiledPath, 'get', 200,
              [{ bad: 'value' }]), {
              actual: [{ bad: 'value' }],
              expected: {
                schema: {
                  type: 'array',
                  items: {
                    required: ['id', 'name'],
                    properties: {
                      id: { type: 'integer', format: 'int64' },
                      name: { type: 'string', minLength: 1 },
                      tag: { type: 'string' }
                    }
                  }
                }
              },
              error: 'data.0.id is required\ndata.0.name is required'
            }));

          it('invalid pet object response', () => assert.deepStrictEqual(swagger.validateResponse(compiledPath, 'get',
            200, [{
              id: 'abc', name: 'hello'
            }]), {
              actual: [{ id: 'abc', name: 'hello' }],
              expected: {
                schema: {
                  type: 'array',
                  items: {
                    required: ['id', 'name'],
                    properties: {
                      id: {
                        type: 'integer',
                        format: 'int64'
                      },
                      name: { type: 'string', minLength: 1 },
                      tag: { type: 'string' }
                    }
                  }
                }
              },
              error: 'data.0.id is the wrong type'
            }));

          it('valid error response', () => assert.deepStrictEqual(swagger.validateResponse(compiledPath, 'get', 400, {
            code: 32,
            message: 'message'
          }), undefined));

          it('valid empty array response', () => assert.deepStrictEqual(swagger.validateResponse(compiledPath, 'get',
            200, []), undefined));
          it('valid array response', () => assert.deepStrictEqual(swagger.validateResponse(compiledPath, 'get', 200, [{
            id: 3, name: 'hello'
          }]), undefined));

        });
      });

      describe('/v1/pets/{petId}', () => {

        it('do not allow POSTs, PUTs or DELETE', () => {
          assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/3'), 'post', {}, {}), undefined);
          assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/3'), 'put', {}, {}), undefined);
          assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/3'), 'delete', {}, {}), undefined);
        });

        describe('get', () => {
          it('petId must return 400 if optional header has wrong format', () => {
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello' }, undefined,
              { 'If-Match': 'XYZ', 'If-None-Match': 'NOT NUMBER' }),
              [{
                actual: 'NOT NUMBER',
                expected: { type: 'number' },
                where: 'header'
              }]);
          });
          it('petId must return 400 if required header missing', () => {
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'), 'get', { String: 'hello' }), [{
              actual: undefined,
              expected: { type: 'string' },
              where: 'header'
            }]);
          });
          it('petId must return an array of pet objects', () => {
            assert.deepStrictEqual([], swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello' }, undefined,
              { 'If-Match': 'XYZ' }));
            assert.deepStrictEqual(swagger.validateResponse(compiled('/v1/pets/abc'), 'get', 200, [{
              id: 3, name: 'hello'
            }]), undefined);
          });
          it('petId must accept a required array of strings in query', () => {
            assert.deepStrictEqual([], swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello' }, undefined,
              { 'If-Match': 'XYZ' }));
            assert.deepStrictEqual([], swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: ['hello'] }, undefined,
              { 'If-Match': 'XYZ' }));
            assert.deepStrictEqual([], swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: ['hello', 'hello2'] }, undefined,
              { 'If-Match': 'XYZ' }));
            assert.deepStrictEqual([{
              actual: undefined,
              expected: { type: 'array' },
              where: 'query'
            }], swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', undefined, undefined, { 'If-Match': 'XYZ' }));
          });

          it('petId must accept an optional array of numbers in query', () => {
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', Number: 213 }, undefined,
              { 'If-Match': 'XYZ' }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', Number: '213' }, undefined,
              { 'If-Match': 'XYZ' }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', Number: '213,456' }, undefined,
              { 'If-Match': 'XYZ' }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', Number: 'hello' }, undefined,
              { 'If-Match': 'XYZ' }), [{
                actual: 'hello',
                expected: { type: 'array' },
                where: 'query'
              }]);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', Number: '123,hello' }, undefined,
              { 'If-Match': 'XYZ' }), [{
                actual: '123,hello',
                expected: { type: 'array' },
                where: 'query'
              }]);
          });

          it('petId must accept an optional array of booleans in query', () => {
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', Boolean: true }, undefined,
              { 'If-Match': 'XYZ' }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', Boolean: 'true' }, undefined,
              { 'If-Match': 'XYZ' }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', Boolean: 'false|true' }, undefined,
              { 'If-Match': 'XYZ' }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', Boolean: 'hello' }, undefined,
              { 'If-Match': 'XYZ' }), [{
                actual: 'hello',
                expected: { type: 'array' },
                where: 'query'
              }]);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', Boolean: 'true|hello' }, undefined,
              { 'If-Match': 'XYZ' }), [{
                actual: 'true|hello',
                expected: { type: 'array' },
                where: 'query'
              }]);
          });

          it('petId must accept an optional spaced array of booleans in query', () => {
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', SpacedBoolean: 'true' }, undefined,
              { 'If-Match': 'XYZ' }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', SpacedBoolean: 'false true' },
              undefined, { 'If-Match': 'XYZ' }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', SpacedBoolean: 'false abc' },
              undefined, { 'If-Match': 'XYZ' }), [{
                actual: 'false abc',
                expected: { type: 'array' },
                where: 'query'
              }]);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', SpacedBoolean: 'false,true' },
              undefined, { 'If-Match': 'XYZ' }), [{
                actual: 'false,true',
                expected: { type: 'array' },
                where: 'query'
              }]);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', SpacedBoolean: 'false\ttrue' },
              undefined, { 'If-Match': 'XYZ' }), [{
                actual: 'false\ttrue',
                expected: { type: 'array' },
                where: 'query'
              }]);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', SpacedBoolean: 'false|true' },
              undefined, { 'If-Match': 'XYZ' }), [{
                actual: 'false|true',
                expected: { type: 'array' },
                where: 'query'
              }]);
          });

          it('petId must accept an optional tabbed array of booleans in query', () => {
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', TabbedBoolean: 'true' }, undefined,
              { 'If-Match': 'XYZ' }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', TabbedBoolean: 'false\ttrue' },
              undefined, { 'If-Match': 'XYZ' }), []);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', TabbedBoolean: 'false\tabc' },
              undefined, { 'If-Match': 'XYZ' }), [{
                actual: 'false\tabc',
                expected: { type: 'array' },
                where: 'query'
              }]);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', TabbedBoolean: 'false,true' },
              undefined, { 'If-Match': 'XYZ' }), [{
                actual: 'false,true',
                expected: { type: 'array' },
                where: 'query'
              }]);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', TabbedBoolean: 'false true' },
              undefined, { 'If-Match': 'XYZ' }), [{
                actual: 'false true',
                expected: { type: 'array' },
                where: 'query'
              }]);
            assert.deepStrictEqual(swagger.validateRequest(compiled('/v1/pets/abc'),
              'get', { String: 'hello', TabbedBoolean: 'false|true' },
              undefined, { 'If-Match': 'XYZ' }), [{
                actual: 'false|true',
                expected: { type: 'array' },
                where: 'query'
              }]);
          });

        });
      });
    });


    // TODO: load relative references so we can validate petstore-separate
    // describe('petstore-separate', () => {
    //   const raw = swagger.loadDocumentSync(__dirname + '/../test/yaml/petstore-separate/spec/swagger.yaml');
    //   const document: swagger.Document = swagger.validateDocument(raw);
    //   let compiled = swagger.compileDocument(document);
    //   describe('/api/pets', () => {
    //     let compiledPath = compiled('/api/pets');
    //     describe('post', () => {
    //       assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'post', {}, { x: 'y' }), []);
    //     });
    //   });
    // });

    describe('parameters.yaml', () => {

      it('/api/pets', () => {
        const compiledPath = compile('test/yaml/parameters.yaml')('/api/pets/abc');

        // not ok
        assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'get', {
          Number: 1
        }), [{
          actual: undefined,
          expected: { type: 'string' },
          where: 'query'
        }]);

        // ok
        assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'get', {
          String: 'hello',
          Number: 1
        }), []);

        // not ok
        assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'put', {
          String: 'abc'
        }), [{ actual: 'abc', expected: { type: 'number' }, where: 'query' }]);

        // ok
        assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'put', { String: 123 }), []);

      });
    });

    describe('no-base-path.yaml', () => {
      it('/pets is resolved correctly with no basePath defined', () => {
        const compiledPath = compile('test/yaml/no-base-path.yaml')('/pets/abc');
        assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'get'), []);
      });

      it('/pets verify an error is returned when no response or default response is defined', () => {
        const compiledPath = compile('test/yaml/no-base-path.yaml')('/pets/abc');
        assert.deepStrictEqual(swagger.validateResponse(compiledPath, 'get', 404), {
          actual: undefined,
          expected: { schema: undefined }
        });
      });

    });

    describe('tricky-slash-path.yaml', () => {
      it('/pets is resolved correctly with basePath defined as "/"', () => {
        const compiledPath = compile('test/yaml/tricky-slash-path.yaml')('/pets/abc');
        assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'get'), []);
      });

      it('/pets is resolved correctly with the request path ends with a "/"', () => {
        const compiledPath = compile('test/yaml/tricky-slash-path.yaml')('/pets/abc/');
        assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'get'), []);
      });

      it('/pets verifies and returns error while the request path ends with multiple "/"', () => {
        const compiledPath = compile('test/yaml/tricky-slash-path.yaml')('/pets/abc//');
        assert.deepStrictEqual(swagger.validateResponse(compiledPath, 'get', 404), {
          actual: 'UNDEFINED_PATH',
          expected: 'PATH'
        });
      });
    });

    describe('parsed path parameter validation', () => {
      it('/api/pets/dog/short should match { breed: "dog", fur: "short" }', () => {
        const compiledPath = compile('test/yaml/parameters.yaml')('/api/pets/dog/short');
        assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'get', undefined, undefined, undefined, {
          breed: 'dog',
          fur: 'short'
        }), []);
      });

      it('/api/pets/dog/short should not match { breed: "dog" }', () => {
        const compiledPath = compile('test/yaml/parameters.yaml')('/api/pets/dog/short');
        assert.deepStrictEqual(swagger.validateRequest(compiledPath, 'get', undefined, undefined, undefined, {
          breed: 'dog'
        }), [{
          actual: undefined,
          error: 'data is the wrong type',
          expected: { type: 'string' },
          where: 'path'
        }]);
      });
    });
  });
});
