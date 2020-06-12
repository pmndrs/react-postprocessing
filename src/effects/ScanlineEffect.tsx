import { forwardRef, useImperativeHandle, useMemo, ForwardRefExoticComponent, useLayoutEffect } from 'react'
import { ScanlineEffect } from 'postprocessing'
import { wrapEffect } from '../util'

export const Scanline = wrapEffect(ScanlineEffect)
