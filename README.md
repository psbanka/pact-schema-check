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
