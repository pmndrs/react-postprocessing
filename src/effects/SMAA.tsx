import { SMAAEffect } from 'postprocessing'
import { wrapEffect } from '../util.tsx'

export const SMAA = /* @__PURE__ */ wrapEffect(SMAAEffect)
