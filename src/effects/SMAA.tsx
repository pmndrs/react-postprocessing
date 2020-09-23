import React, { Ref, forwardRef, useMemo } from 'react'
import { useLoader } from 'react-three-fiber'
import { SMAAImageLoader, SMAAEffect, SMAAPreset, EdgeDetectionMode } from 'postprocessing'

export const SMAA = forwardRef(function SMAA(
  {
    preset = SMAAPreset.HIGH,
    edgeDetectionMode = EdgeDetectionMode.COLOR,
  }: { preset?: number; edgeDetectionMode?: number },
  ref: Ref<SMAAEffect>
) {
  const smaaProps: [any, any] = useLoader(SMAAImageLoader, '' as any)
  const effect = useMemo(() => new SMAAEffect(...smaaProps, preset, edgeDetectionMode), [
    smaaProps,
    preset,
    edgeDetectionMode,
  ])
  return <primitive ref={ref} object={effect} dispose={null} />
})
