import * as tsj from 'ts-json-schema-generator'
import { copyFile, promises } from 'fs'
import { JSONSchema7 } from 'json-schema'
import { basename, dirname, join, relative } from 'path'
import { emptyDir } from 'fs-extra'
import { helmet, Defaults } from './jsonschema-helmet'
import * as rfdc from 'rfdc'
import { remove } from './jsonschema-remove-unused-definitions'
import { generateValidationFile } from './validationFile'
import { Path, Typor8Conf } from './types'
import { loadTyporConf, resolvePaths } from './paths'
import { findApiNames, generateServerBindingFile } from './apiFile'
import { generateClientApiFile } from './clientApiFile'
import path = require('path')
const clone = rfdc.default()





function wf(path: Path, data: string) {
	return promises.writeFile(path, data, 'utf8')
}


export async function typor8(confPath: string) {
	const conf = await loadTyporConf(confPath)
	const paths = resolvePaths(confPath, conf)

	const now = new Date()

	const { schema, typeNames } = compileSource(paths.mainTypes, false)

	const apiFnNames = findApiNames({
		typePrefix: 'Api_',
		inputTypeSuffix: '_i',
		outputTypeSuffix: '_o',
		typeNames
	})

	async function writeValidationFile() {
		const validationFile = generateValidationFile({
			date: now,
			sourceName: paths.sourceName,
			importSourcePath: paths.validationFile.importSourcePath,
			pathToSchemasDir: paths.schemasDirBe,
			typeNames
		})

		await wf(paths.validationFile.output, validationFile)
		console.log(`Written validation file in ${paths.validationFile.output}`)
	}

	async function writeSchemas() {
		//TODO gestione errori
		var schemas = generateSingleTypeSchemas(conf.jsonSchemaHelmetDefaults as any, schema, typeNames)
		await emptyDir(paths.schemasDir)
		await Promise.all(schemas.map(x => wf(paths.schemaPath(x.typeName), JSON.stringify(x.schema))))

		console.log(`Written ${schemas.length} schemas in ${conf.schemasDir}`)
	}

	async function writeServerBinding() {
		const bindingFile = generateServerBindingFile({
			date: now,
			importSourcePath: paths.serverBindingFile.importSourcePath,
			sourceName: paths.sourceName,
			apiFnNames
		})

		await wf(paths.serverBindingFile.output, bindingFile)
		console.log(`Written server binding in ${paths.serverBindingFile.output}`)
	}

	async function writeClientApi() {
		if (!paths.clientApiFile)
			return

		await emptyDir(paths.clientApiFile.clientDir)

		const clientApiFile = generateClientApiFile({
			apiFnNames,
			date: now,
			importSourcePath: paths.clientApiFile.importSourcePath,
			sourceName: paths.sourceName
		})
		await Promise.all([
			wf(paths.clientApiFile.output!, clientApiFile),
			...paths.clientApiFile.clientTypeFiles.map(x => promises.copyFile(x.from, x.to))
		])

		//TODO messaggio di output decente
		console.log(`Written something in the client`)
		// console.log(`Written client binding in ${paths.clientApiFile.output}`)
	}

	await Promise.all([
		writeValidationFile(),
		writeSchemas(),
		writeServerBinding(),
		writeClientApi()
	])
}




function generateSingleTypeSchemas(jsonSchemaHelmetDefaults: Defaults | undefined, fullTypesSchema: JSONSchema7, typeNames: string[]) {
	if (jsonSchemaHelmetDefaults)
		helmet(jsonSchemaHelmetDefaults, fullTypesSchema)
	return typeNames.map(typeName => ({
		schema: generateSingleTypeSchema(fullTypesSchema, typeName),
		typeName
	}))
}

function generateSingleTypeSchema(fullTypesSchema: JSONSchema7, typeName: string) {
	//tsj genera uno schemone con solo definizioni
	//lo clono e inserisco la ref alla definizione del tipo che mi interessa
	const s = clone(fullTypesSchema)
	s.$ref = '#/definitions/' + typeName
	remove(s)
	return s
}


function compileSource(path: string, skipTypeCheck: boolean | undefined) {
	const schema = tsj.createGenerator({
		path,
		encodeRefs: true,
		skipTypeCheck,
		// topRef: false,
		// tsconfig: "path/to/tsconfig.json",
		type: '*', // Or <type-name> if you want to generate schema for that one type only
	}).createSchema('*')

	const typeNames = schema.definitions && Object.keys(schema.definitions) || []

	return {
		schema,
		typeNames
	}
}
