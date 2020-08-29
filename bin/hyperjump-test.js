#!/usr/bin/env node

const JsonSchema = require("@hyperjump/json-schema");

const schemaJson = {
  "$schema": "https://json-schema.org/draft/2019-09/schema",
  "$id": "http://example.com/schemas/string",
  "type": "string"
}
JsonSchema.add(schemaJson);

const fs = require("fs")

/**
 * A specific interaction between client and server has been extracted from a pact
 * file and a matching json-schema file has been found. Examine the interaction against
 * the schema definition
 **/
async function checkInteraction(schemaFilename, interaction) {
  const schema = await JsonSchema.get("file:////Users/psbanka/dev/pact-schema-check/schema/tls-domains-schema.json");
  JsonSchema.setMetaOutputFormat(JsonSchema.FLAG);
  const output = await JsonSchema.validate(schema, "foo", JsonSchema.VERBOSE);
  if (output.valid) {
    console.log("Instance is valid :-)");
  } else {
    console.log("Instance is invalid :-(");
  }

  console.log('>>>', output)
  return output.valid
}

/**
 * Go through all interactions in a given pact filename and
 * see if there are matching schema files. If so, test the interaction
 * against the schema and report back errors
 **/
async function testPact(pactFilename) {
  const pactFh = await fs.promises.open(pactFilename, "r+")
  const pactText = await pactFh.readFile({ encoding: "utf8" })
  const pact = JSON.parse(pactText)

  const files = await fs.promises.readdir("schema")
  const output = []

  for (let index = 0; index < pact.interactions.length; index++) {
    const interaction = pact.interactions[index]
    const base = interaction.description.split("/").join("-")
    const filename = `${base}-schema.json`
    if (files.includes(filename)) {
      const results = await checkInteraction(filename, interaction)
      output.push(results)
    }
  }
  return output
}

async function main(filename) {
  try {
    const output = await testPact(filename)
    console.log("results:", output)
    if (output.length === 0) {
      console.error("No tests found")
      process.exit(3)
    }
    if (output.includes(false)) process.exit(5)
    process.exit(0)
  } catch (e) {
    console.error("error", e)
    process.exit(10)
  }
}

if (process.argv.length !== 3) {
  console.error(
    "must provide a filename as the one and only argument to this script."
  )
  process.exit(2)
}

main(process.argv[2])
