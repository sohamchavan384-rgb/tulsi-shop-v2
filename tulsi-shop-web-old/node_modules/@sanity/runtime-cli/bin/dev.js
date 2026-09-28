#!/usr/bin/env -S node --import jiti/register --disable-warning=ExperimentalWarning

import {execute} from '@oclif/core'

await execute({development: true, dir: import.meta.url})
