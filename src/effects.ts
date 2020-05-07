// @ts-ignore
import { BloomEffect, GlitchEffect, PixelationEffect } from 'postprocessing'
import { wrapEffect } from 'utils'

export const Glitch = wrapEffect(GlitchEffect)

export const Bloom = wrapEffect(BloomEffect)

export const Pixelation = wrapEffect(PixelationEffect)
