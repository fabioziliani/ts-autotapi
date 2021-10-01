import { basename, dirname, join, parse, relative } from 'path'
import { Path, Typor8Conf } from './types'
import { promises } from 'fs'


//TODO messaggi d'errore umani
export async function loadTyporConf(path: Path): Promise<Typor8Conf> {
	const json = await promises.readFile(path, 'utf8')
	const conf = JSON.parse(json) as Typor8Conf
	return conf
}

export function resolvePaths(confPath: Path, conf: Typor8Conf) {
	const packageDir = dirname(confPath)

	const mainTypesBe = conf.mainTypes
	if (typeof mainTypesBe !== 'string')
		throw new Error("Invalid inputTypes in conf")

	const mainTypesBeNoExt = removeExtension(mainTypesBe)

	const mainTypes = join(packageDir, mainTypesBe)
	const mainTypesNoExt = removeExtension(mainTypes)

	const types = (conf.types && (conf.types as string[]).map(x => join(packageDir, x))) as string[] | undefined

	if (conf.schemasDir != null && typeof conf.schemasDir !== 'string')
		throw new Error("schemasDir in conf is not a string")

	const schemasDirBe = (conf.schemasDir ?? 'schemas') as string
	const schemasDir = join(packageDir, schemasDirBe)


	const clientDirBe = conf.clientDir as string | undefined
	let clientDir: string | undefined = undefined
	const clientTypeFiles: { from: string, to: string }[] = []
	if (clientDirBe) {
		clientDir = join(packageDir, clientDirBe)
		clientTypeFiles.push(mapToClient(clientDir, mainTypes))
		if (types)
			for (const t of types)
				clientTypeFiles.push(mapToClient(clientDir, t))
	}

	return {
		mainTypes,
		mainTypesBe,
		// types,
		packageDir,
		schemasDir,
		schemasDirBe,//: relative(packageDirBe, schemasDirBe),
		/** Nome umano di riferimento */
		sourceName: basename(mainTypes),
		validationFile: {
			importSourcePath: './' + basename(mainTypesBeNoExt),
			output: mainTypesNoExt + '.validation.ts',
		},
		schemaPath(schemaName: string): Path {
			return join(schemasDir, schemaName + '.schema.json')
		},
		serverBindingFile: {
			importSourcePath: './' + basename(mainTypesBeNoExt),
			output: mainTypesNoExt + '.serverBinding.ts'
		},
		clientApiFile: clientDir ? {
			importSourcePath: './' + basename(mainTypesBeNoExt),
			output: join(clientDir, basename(mainTypesBeNoExt) + '.client.ts'),
			clientDir,
			clientTypeFiles
		} : undefined
	}
}


function removeExtension(path: string) {
	return path.slice(0, -parse(path).ext.length)
}

function mapToClient(clientDir: Path, path: Path) {
	return {
		from: path,
		to: join(clientDir, basename(path))
	}
}