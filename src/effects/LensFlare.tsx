import * as THREE from 'three'
import React, {
  useRef,
  useContext,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  RefObject,
  useMemo,
} from 'react'
import { useThree, useFrame, createPortal } from '@react-three/fiber'
import { CopyPass, DepthPickingPass, DepthOfFieldEffect } from 'postprocessing'
import { easing } from 'maath'

import { DepthOfField } from './DepthOfField'
import { EffectComposerContext } from '../EffectComposer'

export type LensFlareProps = {}

export const LensFlare = forwardRef(({ ...props }, fref) => {
  return <></>
})
