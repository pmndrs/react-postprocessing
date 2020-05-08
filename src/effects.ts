import { BloomEffect, GlitchEffect, PixelationEffect, NoiseEffect, DotScreenEffect } from 'postprocessing'
import { wrapEffect } from './utils'

export const Glitch = wrapEffect(GlitchEffect)

export const Bloom = wrapEffect(BloomEffect)

export const Pixelation = wrapEffect(PixelationEffect)

export const Noise = wrapEffect(NoiseEffect)

export const DotScreen = wrapEffect(DotScreenEffect)
