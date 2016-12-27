[![Build Status](https://travis-ci.org/carlansley/swagger2.svg?branch=master)](https://travis-ci.org/carlansley/swagger2)
[![Coverage Status](https://coveralls.io/repos/github/carlansley/swagger2/badge.svg?branch=master)](https://coveralls.io/github/carlansley/swagger2?branch=master)
[![Dependencies](https://david-dm.org/carlansley/swagger2.svg)](https://raw.githubusercontent.com/carlansley/swagger2/master/package.json)

# swagger2
Loading, parsing and validating requests to HTTP services based on Swagger v2.0 documents.

## Benefits

* Fast.  Pre-compiled regular expressions and code generation used to validate the inputs and outputs
of Swagger 2.0 operations at run-time.
* Typed.  swagger2 is implemented in TypeScript 2, including a fully annotated TypeScript definition of
the Swagger 2.0 document object.  Makes working with Swagger objects more pleasant in the IDE of your
choosing (WebStorm, Atom, etc).

## Installation

```shell
$ npm install swagger2 --save
```

## Usage

Basic loading and validation of swagger 2.0 document:

```
import * as swagger from 'swagger2';

// load YAML swagger file
const document = swagger.loadDocumentSync('./swagger.yml');

// validate document
if (!swagger.validateDocument(document)) {
  throw Error(`./swagger.yml does not conform to the Swagger 2.0 schema`);
}
```

You can compile the document for fast validation of operation requests and responses within
the framework of your choosing.  Koa 2 example:

```
let app = new Koa();

...
app.use(body());
app.use(createKoaMiddleware(document));
...


function createKoaMiddleware(document: swagger.Document) {

  // construct a validation object, pre-compiling all schema and regex required
  let compiled = swagger.compileDocument(document);

  return async(context, next) => {

    if (!context.path.startsWith(document.basePath)) {
      // not a path that we care about
      await next();
      return;
    }

    let compiledPath = compiled(context.path);
    if (compiledPath === undefined) {
      // if there is no single matching path, return 404 (not found)
      context.status = 404;
      return;
    }

    // check the request matches the swagger schema
    let validationErrors = swagger.validateRequest(compiledPath,
      context.method, context.request.query, context.request.body);
    if (validationErrors === undefined) {
      // operation not defined, return 405 (method not allowed)
      context.status = 405;
      return;
    }

    if (validationErrors.length > 0) {
      context.status = 400;
      context.body = {
        code: 'SWAGGER_REQUEST_VALIDATION_FAILED',
        errors: validationErrors
      };
      return;
    }

    // wait for the operation to execute
    await next();

    // check the response matches the swagger schema
    let error = swagger.validateResponse(compiledPath, context.method, context.status, context.body);
    if (error) {
      error.where = 'response';
      context.status = 500;
      context.body = {
        code: 'SWAGGER_RESPONSE_VALIDATION_FAILED',
        errors: [error]
      };
    }
  };
}


```

There is a complete implementation of this example/use-case in the <a href="https://github.com/carlansley/swagger2-koa">swagger2-koa</a> module,
so if you're using Koa 2 it may make sense to use that instead of swagger2 directly.

## Limitations

* currently only supports synchronous loading of full documents (via swagger.loadDocumentSync)
* does not support validation of file attachments
* does not support validation of mime-types
* requires node v6.0 or above

## Development

First, grab the source from <a href="https://github.com/carlansley/swagger2">GitHub</a>.

From within the swagger2 directory, to run tests:

```shell
$ npm install
$ npm test
```

To see code coverage in a web-browser:

```shell
$ npm run cover:browser
```

To clean up:

```shell
$ npm run clean
```

## License

MIT
