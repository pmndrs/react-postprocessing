import React, { Ref, forwardRef, useMemo } from 'react'
import { SMAAEffect, SMAAPreset, EdgeDetectionMode, PredicationMode } from 'postprocessing'

type SMAAProps = {
  preset?: SMAAPreset
  edgeDetectionMode?: EdgeDetectionMode
  predicationMode?: PredicationMode
}

export const SMAA = forwardRef(function SMAA(props: SMAAProps, ref: Ref<SMAAEffect>) {
  const effect = useMemo(() => new SMAAEffect(props), [props])
  return <primitive ref={ref} object={effect} dispose={null} />
})
