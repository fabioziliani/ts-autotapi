import { JSONSchema7Definition } from 'json-schema'

export function remove(schema: JSONSchema7Definition) {
	if (typeof schema !== 'object')
		return

	if (!schema.definitions)
		return

	const daTenere = refBrowser(schema)

	for (const k of Object.keys(schema.definitions)) {
		if (!daTenere.has(k))
			delete schema.definitions[k]
	}
}

function refBrowser(root: JSONSchema7Definition) {
	const navigated = new Set<string>()

	function browseToRef(url: string) {
		if (navigated.has(url))
			return

		if (!url.startsWith('#/definitions/'))
			throw new Error('Usupported $ref value: ' + url)

		const defKey = url.slice(14)
		navigated.add(defKey)

		const def = (root as any).definitions[defKey] as JSONSchema7Definition | undefined
		if (def == null)
			throw new Error('Cannot find definition: ' + url)

		browseToNode(def)
		// if (typeof def === 'object' && def.$ref)
		// 	browseToRef(decodeURIComponent(def.$ref))
	}


	function browseToNode(node: JSONSchema7Definition) {
		if (typeof node === 'object' && node.$ref)
			browseToRef(decodeURIComponent(node.$ref))
		else if (typeof node === 'object') {
			//naviga tutto alla brutto dinci senza considerare se sono oggetti o meno
			for (const k in node)
				if (k !== 'definitions')
					browseToNode((node as any)[k])
		}
	}

	browseToNode(root)
	// if (typeof root === 'object' && root.$ref)
	// 	browseToRef(decodeURIComponent(root.$ref))

	return navigated
}