import { JSONSchema7Definition } from 'json-schema'



export type Defaults = {
	[type: string]: { [k: string]: any }
}


//TODO devo clonare i risultati? se uno schema viene riciclato diventa semplicemente riespanso
//diventa un problema solo se viene riciclato sotto diverse configurazioni
//introdurre un parametro che attiva la clonazione di tutto?

export function helmet(conf: Defaults, schema: JSONSchema7Definition) {
	if (typeof schema === 'boolean')
		return

	const defs = conf[schema.type as string]
	if (defs) {
		for (const k in defs) {
			//ignoring num range. see below
			if (!(schema.type === 'number' && (k === 'minimum' || k === 'exclusiveMinimum' || k === 'maximum' || k === 'exclusiveMaximum'))) {
				if ((schema as any)[k] == null)
					(schema as any)[k] = defs[k]
			}

			if (schema.type === 'number') {
				//apply min or exMin only if both are not applied
				if ((defs.minimum != null || defs.exclusiveMinimum != null) && schema.minimum == null && schema.exclusiveMinimum == null) {
					if (defs.minimum != null)
						schema.minimum = defs.minimum
					if (defs.exclusiveMinimum != null)
						schema.exclusiveMinimum = defs.exclusiveMinimum
				}

				//same for max
				if ((defs.maximum != null || defs.exclusiveMaximum != null) && schema.maximum == null && schema.exclusiveMaximum == null) {
					if (defs.maximum != null)
						schema.maximum = defs.maximum
					if (defs.exclusiveMaximum != null)
						schema.exclusiveMaximum = defs.exclusiveMaximum
				}
			}
		}
	}

	//recursions
	// if (schema.type == 'array') {
	if (schema.items != null) {
		if (Array.isArray(schema.items)) {
			for (const x of schema.items)
				helmet(conf, x)
		}
		else {
			helmet(conf, schema.items)
		}
	}
	// }
	// else if (schema.type == 'object') {
	//TODO max properties?
	if (schema.properties) {
		for (const k in schema.properties)
			helmet(conf, schema.properties[k])
	}

	if (schema.definitions) {
		for (const k in schema.definitions)
			helmet(conf, schema.definitions[k])
	}
	// }

	for (const k of ['anyOf', 'oneOf', 'allOf']) {
		const xOf = (schema as any)[k]
		if (Array.isArray(xOf))
			for (const l of xOf)
				helmet(conf, l)
	}
}
