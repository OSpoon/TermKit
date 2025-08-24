import * as Meta from '@src/generated/meta'
import { defineConfigObject } from 'reactive-vscode'

export const config = defineConfigObject<Meta.ScopedConfigKeyTypeMap>(
  Meta.scopedConfigs.scope,
  Meta.scopedConfigs.defaults,
)
