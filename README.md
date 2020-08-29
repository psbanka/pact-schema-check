# pact-schema-check

The purpose of this project is to work with the [Pact](https://pact.io/)
project, and will compare a pact
[contract](https://docs.pact.io/consumer/contract_tests_not_functional_tests)
against a [json-schema](https://json-schema.org/) document.  Examples of both a
pact contract and the json-schema that it validates against are provided as
examples.

If you are working on a project where your backend team provides json-schema
documents to provide validation of the API implementation, this project can be
used to test your pact contracts. This is not quite as useful as doing full
Pact contract validation, as the schema doesn't provide for specifications
about how the API behaves under different circumstances (e.g. different
query-parameters, different headers, different data seeding, etc), but it is
better than nothing!

# How to do this

1. Download sample complex output from your server for each endpoint

Typically, if you visit your application in Chrome or Firefox and inspect the network traffic, you can perform a "copy as curl" operation, which should provide you with something like the following:

```
curl 'https://api.fastly.com/tls/certificates?filter%5Bcustomer.id%5D=1S5uCkNAEhEMS2ZoJZoiCn&include=tls_activations&page%5Bnumber%5D=1&page%5Bsize%5D=20&sort=not_after'
```

If you run this curl command from your terminal and then pipe it through a JSON-beautifier such as `jq`, then you should have a pretty clean dump of some sample data that the server spits out.

2. Write your JSON-schema to comply with the shape of the data that you found from the server. There are some samples of this for JSON-API in the `/schema` directory in this project if you'd like to get some inspiration.

3. Validate that your json-schema file works with your downloaded sample data from your server.

```
$ node_modules/.bin/ts-node bin/index.ts <schema-file> <captured-json-file>
```

4. Generate a pact document.

There is a number of ways to accomplish this. If you're using ember, you might use the `ember-cli-pact` addon, which analyzes mirage interactions and generates pact files.

5. Compare the pact document with the schema files

```
$ node_modules/.bin/ts-node bin/index.ts <pact-file>
```