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
  body: object,
  description: string
) {
  const schemaFh = await fs.promises.open(schemaFilename, "r+")
  const schemaJson = await schemaFh.readFile({ encoding: "utf8" })
  try {
    const validate = ajvInstance.compile(JSON.parse(schemaJson))
    const valid = validate(body)
    if (valid) {
      console.log(`${description} : valid`)
    } else {
      console.error(`${description} INVALID ------------`)
      console.error("SCHEMA -------------")
      console.error(schemaJson)
      console.error("BODY ---------------")
      console.error(JSON.stringify(body, undefined, 2))
      console.error("ERRORS -------------")
      console.error(
        ajvInstance.errorsText(validate.errors).split(", ").join("\n")
      )
      console.error("--------------------")
    }
    return valid
  } catch (e) {
    console.error(`ERROR parsing ${schemaFilename}`)
    console.error(e)
    return [false]
  }
}

/**
 * Go through all interactions in a given pact filename and
 * see if there are matching schema files. If so, test the interaction
 * against the schema and report back errors
 **/
async function testPact(pactFilename: string) {
  const pactFh = await fs.promises.open(pactFilename, "r+")
  const pactText = await pactFh.readFile({ encoding: "utf8" })
  try {
    const pact = JSON.parse(pactText)
    const files = await fs.promises.readdir("schema")
    const output = []

    for (let index = 0; index < pact.interactions.length; index++) {
      const interaction = pact.interactions[index] as Interaction
      const base = interaction.description.split("/").join("-")
      const schemaFilename = `${base}-schema.json`
      if (files.includes(schemaFilename)) {
        const results = await checkInteraction(
          `schema/${schemaFilename}`,
          interaction.response.body,
          interaction.description
        )
        output.push(results)
      } else {
        console.error(`ERROR finding schema file: ${schemaFilename}`)
        output.push(false)
      }
    }
    return output
  } catch (e) {
    console.error(`ERROR parsing ${pactFilename}`)
    console.error(e)
    return [false]
  }
}

async function checkPact(pactFilename: string) {
  try {
    const output = await testPact(pactFilename)
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

async function checkSchemaAgainstReal(
  realInteractionFilename: string,
  schemaFilename: string
) {
  let interactionText
  try {
    const interactionFh = await fs.promises.open(realInteractionFilename, "r+")
    interactionText = await interactionFh.readFile({ encoding: "utf8" })
  } catch (e) {
    console.error("error", e)
    process.exit(10)
  }
  try {
    const interaction = JSON.parse(interactionText)
    const results = await checkInteraction(
      schemaFilename,
      interaction,
      "schema-check"
    )
    process.exit(0)
  } catch (e) {
    console.error(`ERROR parsing ${realInteractionFilename}`)
    console.error(e)
    process.exit(10)
  }
}

if (process.argv.length === 4) {
  const schemaFilename = process.argv[2]
  const outputFilename = process.argv[3]
  const schemaStat = fs.statSync(schemaFilename)
  const outputStat = fs.statSync(outputFilename)
  if (schemaStat.isFile() && outputStat.isFile()) {
    checkSchemaAgainstReal(outputFilename, schemaFilename)
  } else {
    process.exit(2)
  }
} else if (process.argv.length === 3) {
  checkPact(process.argv[2])
} else {
  console.error(
    "must provide a filename as the one and only argument to this script."
  )
  process.exit(2)
}
