#!/usr/bin/env node

const Ajv = require("ajv")
const ajvInstance = new Ajv({ allErrors: true })
ajvInstance.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"))
const fs = require("fs")

interface Response {
  body: object
}

interface Interaction {
  description: string
  response: Response
}

/**
 * A specific interaction between client and server has been extracted from a pact
 * file and a matching json-schema file has been found. Examine the interaction against
 * the schema definition
 **/
async function checkInteraction(
  schemaFilename: string,
  interaction: Interaction
) {
  const schemaFh = await fs.promises.open(`schema/${schemaFilename}`, "r+")
  const schemaJson = await schemaFh.readFile({ encoding: "utf8" })
  const validate = ajvInstance.compile(JSON.parse(schemaJson))

  const valid = validate(interaction.response.body)
  if (valid) {
    console.log(`${interaction.description} : valid`)
  } else {
    console.error(`${interaction.description} --------------------`)
    console.error(JSON.parse(schemaJson))
    console.error("--------------------")
    console.log(`${interaction.description} : invalid`)
    console.error(ajvInstance.errorsText(validate.errors))
  }
  return valid
}

/**
 * Go through all interactions in a given pact filename and
 * see if there are matching schema files. If so, test the interaction
 * against the schema and report back errors
 **/
async function testPact(pactFilename: string) {
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

async function main(filename: string) {
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
