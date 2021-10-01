
import { autogenerationHeader } from "./autogeneration"
import { ApiFnNames } from "./types"


//TODO1 la getInputTypeName usa la convenzione? va sistemata la cosa!!!
export function generateServerBindingFile(args: {
	date: Date
	sourceName: string
	importSourcePath: string
	apiFnNames: ApiFnNames[]
}) {

	return `${autogenerationHeader({ date: args.date, name: args.sourceName + ' Validation' })}
import * as types from ${JSON.stringify(args.importSourcePath)}

type ApiFn<Ctx, I, O> = {
	(ctx: Ctx, i: I): Promise<O>
}

${apiIndex(args.apiFnNames)}

export function getInputTypeName(apiName: string) : string {
	return 'Api_' + apiName + '_i'
}
`
}


function apiIndex(apiFns: ApiFnNames[]) {
	const row = (a: ApiFnNames) => `	${a.name}: ApiFn<Ctx, types.${a.inputTypeName}, types.${a.outputTypeName}>`

	return `export type ApiIndex<Ctx> = {
${apiFns.map(row).join('\n')}
}
`
}




//TODO1 migliorare la gestione errori
export function findApiNames(args: {
	typePrefix: string
	inputTypeSuffix: string
	outputTypeSuffix: string
	typeNames: string[]
}): ApiFnNames[] {

	function detectInput(name: string) {
		return name.startsWith(args.typePrefix) && name.endsWith(args.inputTypeSuffix) && name.slice(args.typePrefix.length, -(args.outputTypeSuffix.length)) || undefined
	}

	function checkOutput(apiName: string | undefined) {
		return args.typeNames.includes(args.typePrefix + apiName + args.outputTypeSuffix)
	}

	return (args.typeNames
		.map(detectInput)
		.filter(x => x) as string[])
		.filter(checkOutput)
		.map(name => ({
			inputTypeName: args.typePrefix + name + args.inputTypeSuffix,
			outputTypeName: args.typePrefix + name + args.outputTypeSuffix,
			name
		}))
}
