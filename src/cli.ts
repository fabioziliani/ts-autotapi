#!/usr/bin/env node

import { typor8 } from "./builder";

typor8(process.argv[2]).catch(err => console.error(err))
