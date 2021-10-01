import { autogenerationHeader } from "./autogeneration"
import { ApiFnNames } from "./types"


export function generateClientApiFile(args: {
	date: Date
	sourceName: string
	importSourcePath: string
	apiFnNames: ApiFnNames[]
}) {

	return `${autogenerationHeader({date: args.date, name: args.sourceName + ' client'})}
import * as types from ${JSON.stringify(args.importSourcePath)}

${apiNames(args.apiFnNames.map(x => x.name))}

${api(args.apiFnNames)}

export type Fetcher = {
	(apiName: string, input: Object | undefined): Promise<any>
}

export function buildClient(fetcher: Fetcher): Api {
	const api: Api = {} as any
	for (const name of names)
		(api as any)[name] = (input: any) => fetcher(name, input)
	return api
}
`
}

function apiNames(names: string[]) {
	return `export const names: (keyof Api)[] = ${JSON.stringify(names)}
	`
}

function api(nomi: ApiFnNames[]) {
	//generati in base ai tipi
	return `export type Api = {
${nomi.map(apiFn).join('')}}
`
}

function apiFn(n: ApiFnNames) {
	return `	${n.name}(i: types.${n.inputTypeName}): Promise<types.${n.outputTypeName}>
`
}