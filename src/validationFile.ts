import { autogenerationHeader } from "./autogeneration"

export function generateValidationFile(args: {
	date: Date
	sourceName: string
	importSourcePath: string
	pathToSchemasDir: string
	typeNames: string[]
}) {
	return `${autogenerationHeader({date: args.date, name: args.sourceName + ' Validation'})}
import * as types from ${JSON.stringify(args.importSourcePath)}


${typeIndex(args.typeNames)}


const pathToSchemasDir = ${JSON.stringify(args.pathToSchemasDir)}

export function validate<T extends keyof TypeIndex>(k: T, value: unknown, validateBySchemaFile: (schemaPath: string, value: unknown) => Promise<boolean>): Promise<boolean> {
	return validateBySchemaFile(pathToSchemasDir + '/' + k, value)
}

export function getSchemaPath(k: string) : string {
	return pathToSchemasDir + '/' + k + '.schema.json'
}
`

}


function typeIndex(typeNames: string[]) {
	const row = (n: string) => `	${n}: types.${n}`
	return `export type TypeIndex = {
${typeNames.map(row).join('\n')}
}
`
}
