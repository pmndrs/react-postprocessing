import * as THREE from 'three'

// NOTE: WebGLMultipleRenderTargets is removed since r172, so we implement it ourselves.
class LegacyWebGLMultipleRenderTargets extends THREE.WebGLRenderTarget {
  isWebGLMultipleRenderTargets = true
  // @ts-expect-error
  override texture: THREE.Texture[] = []

  constructor(width = 1, height = 1, count = 1, options = {}) {
    super(width, height, options)

    const texture = this.texture as unknown as THREE.Texture

    this.texture = []

    for (let i = 0; i < count; i++) {
      this.texture[i] = texture.clone()
      this.texture[i].isRenderTargetTexture = true
    }
  }

  setSize(width: number, height: number, depth = 1) {
    if (this.width !== width || this.height !== height || this.depth !== depth) {
      this.width = width
      this.height = height
      this.depth = depth

      for (let i = 0, il = this.texture.length; i < il; i++) {
        this.texture[i].image.width = width
        this.texture[i].image.height = height
        this.texture[i].image.depth = depth
      }

      this.dispose()
    }

    this.viewport.set(0, 0, width, height)
    this.scissor.set(0, 0, width, height)
  }

  // @ts-expect-error
  override copy(source: WebGLMultipleRenderTargets) {
    this.dispose()

    this.width = source.width
    this.height = source.height
    this.depth = source.depth

    this.scissor.copy(source.scissor)
    this.scissorTest = source.scissorTest

    this.viewport.copy(source.viewport)

    this.depthBuffer = source.depthBuffer
    this.stencilBuffer = source.stencilBuffer

    if (source.depthTexture !== null) this.depthTexture = source.depthTexture.clone()

    this.texture.length = 0

    for (let i = 0, il = source.texture.length; i < il; i++) {
      this.texture[i] = source.texture[i].clone()
      this.texture[i].isRenderTargetTexture = true
    }

    return this
  }
}

const version = /* @__PURE__ */ (() => parseInt(THREE.REVISION.replace(/\D+/g, '')))()

// https://github.com/mrdoob/three.js/pull/26427
export const WebGLMultipleRenderTargets =
  version >= 162
    ? class WebGLMultipleRenderTargets extends THREE.WebGLRenderTarget {
        isWebGLMultipleRenderTargets = true
        textures!: THREE.Texture[]

        constructor(width = 1, height = 1, count = 1, options = {}) {
          // @ts-expect-error
          super(width, height, { ...options, count })
        }

        // @ts-expect-error
        get texture() {
          return this.textures as THREE.Texture[]
        }
      }
    : LegacyWebGLMultipleRenderTargets
