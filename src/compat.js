import * as THREE from 'three'

const version = /* @__PURE__ */ (() => parseInt(THREE.REVISION.replace(/\D+/g, '')))()

// NOTE: WebGLMultipleRenderTargets is removed since r172, so we implement it ourselves.
// https://github.com/mrdoob/three.js/pull/26427
export const WebGLMultipleRenderTargets =
  version >= 162
    ? class extends THREE.WebGLRenderTarget {
        constructor(width = 1, height = 1, count = 1, options = {}) {
          super(width, height, { ...options, count })

          this.isWebGLMultipleRenderTargets = true
        }

        get texture() {
          return this.textures
        }
      }
    : class extends THREE.WebGLRenderTarget {
        constructor(width = 1, height = 1, count = 1, options = {}) {
          super(width, height, options)

          this.isWebGLMultipleRenderTargets = true

          const texture = this.texture

          this.texture = []

          for (let i = 0; i < count; i++) {
            this.texture[i] = texture.clone()
            this.texture[i].isRenderTargetTexture = true
          }
        }

        setSize(width, height, depth = 1) {
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

        copy(source) {
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
