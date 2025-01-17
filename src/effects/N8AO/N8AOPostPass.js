import * as THREE from 'three'
import { Pass } from 'postprocessing'
import { Buffer } from 'buffer'
import { FullScreenTriangle } from './FullScreenTriangle'
import { EffectShader } from './EffectShader'
import { EffectCompositer } from './EffectCompositer'
import { PoissionBlur } from './PoissionBlur'
import { DepthDownSample } from './DepthDownSample'
import BlueNoise from './BlueNoise'
import { WebGLMultipleRenderTargets } from '../../compat'

const bluenoiseBits = /* @__PURE__ */ Buffer.from(BlueNoise, 'base64')

/**
 *
 * @param {*} timerQuery
 * @param {THREE.WebGLRenderer} gl
 * @param {N8AOPass} pass
 */
function checkTimerQuery(timerQuery, gl, pass) {
  const available = gl.getQueryParameter(timerQuery, gl.QUERY_RESULT_AVAILABLE)
  if (available) {
    const elapsedTimeInNs = gl.getQueryParameter(timerQuery, gl.QUERY_RESULT)
    const elapsedTimeInMs = elapsedTimeInNs / 1000000
    pass.lastTime = elapsedTimeInMs
  } else {
    // If the result is not available yet, check again after a delay
    setTimeout(() => {
      checkTimerQuery(timerQuery, gl, pass)
    }, 1)
  }
}
class N8AOPostPass extends Pass {
  /**
   *
   * @param {THREE.Scene} scene
   * @param {THREE.Camera} camera
   * @param {number} width
   * @param {number} height
   *
   * @property {THREE.Scene} scene
   * @property {THREE.Camera} camera
   * @property {number} width
   * @property {number} height
   */
  constructor(scene, camera, width = 512, height = 512) {
    super()
    this.width = width
    this.height = height

    this.clear = true

    this.camera = camera
    this.scene = scene
    /**
     * @type {Proxy & {
     * aoSamples: number,
     * aoRadius: number,
     * denoiseSamples: number,
     * denoiseRadius: number,
     * distanceFalloff: number,
     * intensity: number,
     * denoiseIterations: number,
     * renderMode: 0 | 1 | 2 | 3 | 4,
     * color: THREE.Color,
     * gammaCorrection: boolean,
     * logarithmicDepthBuffer: boolean
     * screenSpaceRadius: boolean,
     * halfRes: boolean,
     * depthAwareUpsampling: boolean
     * colorMultiply: boolean
     * }
     */
    this.autosetGamma = true
    this.configuration = new Proxy(
      {
        aoSamples: 16,
        aoRadius: 5.0,
        denoiseSamples: 8,
        denoiseRadius: 12,
        distanceFalloff: 1.0,
        intensity: 5,
        denoiseIterations: 2.0,
        renderMode: 0,
        color: new THREE.Color(0, 0, 0),
        gammaCorrection: true,
        logarithmicDepthBuffer: false,
        screenSpaceRadius: false,
        halfRes: false,
        depthAwareUpsampling: true,
        colorMultiply: true,
      },
      {
        set: (target, propName, value) => {
          const oldProp = target[propName]
          target[propName] = value
          if (propName === 'aoSamples' && oldProp !== value) {
            this.configureAOPass(this.configuration.logarithmicDepthBuffer)
          }
          if (propName === 'denoiseSamples' && oldProp !== value) {
            this.configureDenoisePass(this.configuration.logarithmicDepthBuffer)
          }
          if (propName === 'halfRes' && oldProp !== value) {
            this.configureAOPass(this.configuration.logarithmicDepthBuffer)
            this.configureHalfResTargets()
            this.configureEffectCompositer(this.configuration.logarithmicDepthBuffer)
            this.setSize(this.width, this.height)
          }
          if (propName === 'depthAwareUpsampling' && oldProp !== value) {
            this.configureEffectCompositer(this.configuration.logarithmicDepthBuffer)
          }
          if (propName === 'gammaCorrection') {
            this.autosetGamma = false
          }
          return true
        },
      }
    )
    /** @type {THREE.Vector3[]} */
    this.samples = []
    /** @type {number[]} */
    this.samplesR = []
    /** @type {THREE.Vector2[]} */
    this.samplesDenoise = []
    this.configureEffectCompositer(this.configuration.logarithmicDepthBuffer)
    this.configureSampleDependentPasses()
    this.configureHalfResTargets()
    //   this.effectCompisterQuad = new FullScreenTriangle(new THREE.ShaderMaterial(EffectCompositer));
    this.copyQuad = new FullScreenTriangle(
      new THREE.ShaderMaterial({
        uniforms: {
          tDiffuse: {
            value: null,
          },
        },
        depthWrite: false,
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1);
            }
            `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            varying vec2 vUv;
            void main() {
                gl_FragColor = texture2D(tDiffuse, vUv);
            }
            `,
      })
    )
    this.writeTargetInternal = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
    })
    this.readTargetInternal = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
    })
    this.outputTargetInternal = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
    })

    /** @type {THREE.DataTexture} */
    this.bluenoise = //bluenoise;
      new THREE.DataTexture(bluenoiseBits, 128, 128)
    this.bluenoise.colorSpace = THREE.NoColorSpace
    this.bluenoise.wrapS = THREE.RepeatWrapping
    this.bluenoise.wrapT = THREE.RepeatWrapping
    this.bluenoise.minFilter = THREE.NearestFilter
    this.bluenoise.magFilter = THREE.NearestFilter
    this.bluenoise.needsUpdate = true
    this.lastTime = 0
    this.needsDepthTexture = true
    this.needsSwap = true
    this._r = new THREE.Vector2()
    this._c = new THREE.Color()
  }
  configureHalfResTargets() {
    if (this.configuration.halfRes) {
      this.depthDownsampleTarget =
        /*new THREE.WebGLRenderTarget(this.width / 2, this.height / 2, {
                               minFilter: THREE.NearestFilter,
                               magFilter: THREE.NearestFilter,
                               depthBuffer: false,
                               format: THREE.RedFormat,
                               type: THREE.FloatType
                           });*/
        new WebGLMultipleRenderTargets(this.width / 2, this.height / 2, 2)
      this.depthDownsampleTarget.texture[0].format = THREE.RedFormat
      this.depthDownsampleTarget.texture[0].type = THREE.FloatType
      this.depthDownsampleTarget.texture[0].minFilter = THREE.NearestFilter
      this.depthDownsampleTarget.texture[0].magFilter = THREE.NearestFilter
      this.depthDownsampleTarget.texture[0].depthBuffer = false
      this.depthDownsampleTarget.texture[1].format = THREE.RGBAFormat
      this.depthDownsampleTarget.texture[1].type = THREE.HalfFloatType
      this.depthDownsampleTarget.texture[1].minFilter = THREE.NearestFilter
      this.depthDownsampleTarget.texture[1].magFilter = THREE.NearestFilter
      this.depthDownsampleTarget.texture[1].depthBuffer = false

      this.depthDownsampleQuad = new FullScreenTriangle(new THREE.ShaderMaterial(DepthDownSample))
    } else {
      if (this.depthDownsampleTarget) {
        this.depthDownsampleTarget.dispose()
        this.depthDownsampleTarget = null
      }
      if (this.depthDownsampleQuad) {
        this.depthDownsampleQuad.dispose()
        this.depthDownsampleQuad = null
      }
    }
  }
  configureSampleDependentPasses() {
    this.configureAOPass(this.configuration.logarithmicDepthBuffer)
    this.configureDenoisePass(this.configuration.logarithmicDepthBuffer)
  }
  configureAOPass(logarithmicDepthBuffer = false) {
    this.samples = this.generateHemisphereSamples(this.configuration.aoSamples)
    this.samplesR = this.generateHemisphereSamplesR(this.configuration.aoSamples)
    const e = { ...EffectShader }
    e.fragmentShader = e.fragmentShader
      .replace('16', this.configuration.aoSamples)
      .replace('16.0', this.configuration.aoSamples + '.0')
    if (logarithmicDepthBuffer) {
      e.fragmentShader = '#define LOGDEPTH\n' + e.fragmentShader
    }
    if (this.configuration.halfRes) {
      e.fragmentShader = '#define HALFRES\n' + e.fragmentShader
    }
    if (this.effectShaderQuad) {
      this.effectShaderQuad.material.dispose()
      this.effectShaderQuad.material = new THREE.ShaderMaterial(e)
    } else {
      this.effectShaderQuad = new FullScreenTriangle(new THREE.ShaderMaterial(e))
    }
  }
  configureDenoisePass(logarithmicDepthBuffer = false) {
    this.samplesDenoise = this.generateDenoiseSamples(this.configuration.denoiseSamples, 11)
    const p = { ...PoissionBlur }
    p.fragmentShader = p.fragmentShader.replace('16', this.configuration.denoiseSamples)
    if (logarithmicDepthBuffer) {
      p.fragmentShader = '#define LOGDEPTH\n' + p.fragmentShader
    }
    if (this.poissonBlurQuad) {
      this.poissonBlurQuad.material.dispose()
      this.poissonBlurQuad.material = new THREE.ShaderMaterial(p)
    } else {
      this.poissonBlurQuad = new FullScreenTriangle(new THREE.ShaderMaterial(p))
    }
  }
  configureEffectCompositer(logarithmicDepthBuffer = false) {
    const e = { ...EffectCompositer }
    if (logarithmicDepthBuffer) {
      e.fragmentShader = '#define LOGDEPTH\n' + e.fragmentShader
    }
    if (this.configuration.halfRes && this.configuration.depthAwareUpsampling) {
      e.fragmentShader = '#define HALFRES\n' + e.fragmentShader
    }
    if (this.effectCompositerQuad) {
      this.effectCompositerQuad.material.dispose()
      this.effectCompositerQuad.material = new THREE.ShaderMaterial(e)
    } else {
      this.effectCompositerQuad = new FullScreenTriangle(new THREE.ShaderMaterial(e))
    }
  }
  /**
   *
   * @param {Number} n
   * @returns {THREE.Vector3[]}
   */
  generateHemisphereSamples(n) {
    const points = []
    for (let k = 0; k < n; k++) {
      const theta = 2.399963 * k
      const r = Math.sqrt(k + 0.5) / Math.sqrt(n)
      const x = r * Math.cos(theta)
      const y = r * Math.sin(theta)
      // Project to hemisphere
      const z = Math.sqrt(1 - (x * x + y * y))
      points.push(new THREE.Vector3(x, y, z))
    }
    return points
  }
  /**
   *
   * @param {number} n
   * @returns {number[]}
   */
  generateHemisphereSamplesR(n) {
    let samplesR = []
    for (let i = 0; i < n; i++) {
      samplesR.push((i + 1) / n)
    }
    return samplesR
  }
  /**
   *
   * @param {number} numSamples
   * @param {number} numRings
   * @returns {THREE.Vector2[]}
   */
  generateDenoiseSamples(numSamples, numRings) {
    const angleStep = (2 * Math.PI * numRings) / numSamples
    const invNumSamples = 1.0 / numSamples
    const radiusStep = invNumSamples
    const samples = []
    let radius = invNumSamples
    let angle = 0
    for (let i = 0; i < numSamples; i++) {
      samples.push(new THREE.Vector2(Math.cos(angle), Math.sin(angle)).multiplyScalar(Math.pow(radius, 0.75)))
      radius += radiusStep
      angle += angleStep
    }
    return samples
  }
  setSize(width, height) {
    this.width = width
    this.height = height
    const c = this.configuration.halfRes ? 0.5 : 1
    this.writeTargetInternal.setSize(width * c, height * c)
    this.readTargetInternal.setSize(width * c, height * c)
    if (this.configuration.halfRes) {
      this.depthDownsampleTarget.setSize(width * c, height * c)
    }
    this.outputTargetInternal.setSize(width, height)
  }
  setDepthTexture(depthTexture) {
    this.depthTexture = depthTexture
  }
  render(renderer, inputBuffer, outputBuffer) {
    const xrEnabled = renderer.xr.enabled
    renderer.xr.enabled = false

    // Copy inputBuffer to outputBuffer
    //renderer.setRenderTarget(outputBuffer);
    //  this.copyQuad.material.uniforms.tDiffuse.value = inputBuffer.texture;
    //   this.copyQuad.render(renderer);

    if (renderer.capabilities.logarithmicDepthBuffer !== this.configuration.logarithmicDepthBuffer) {
      this.configuration.logarithmicDepthBuffer = renderer.capabilities.logarithmicDepthBuffer
      this.configureAOPass(this.configuration.logarithmicDepthBuffer)
      this.configureDenoisePass(this.configuration.logarithmicDepthBuffer)
      this.configureEffectCompositer(this.configuration.logarithmicDepthBuffer)
    }
    if (inputBuffer.texture.type !== this.outputTargetInternal.texture.type) {
      this.outputTargetInternal.texture.type = inputBuffer.texture.type
      this.outputTargetInternal.texture.needsUpdate = true
    }
    let gl
    let ext
    let timerQuery
    if (this.debugMode) {
      gl = renderer.getContext()
      ext = gl.getExtension('EXT_disjoint_timer_query_webgl2')
      if (ext === null) {
        console.error('EXT_disjoint_timer_query_webgl2 not available, disabling debug mode.')
        this.debugMode = false
      }
    }
    if (this.debugMode) {
      timerQuery = gl.createQuery()
      gl.beginQuery(ext.TIME_ELAPSED_EXT, timerQuery)
    }
    this.camera.updateMatrixWorld()
    this._r.set(this.width, this.height)
    let trueRadius = this.configuration.aoRadius
    if (this.configuration.halfRes && this.configuration.screenSpaceRadius) {
      trueRadius *= 0.5
    }
    if (this.configuration.halfRes) {
      renderer.setRenderTarget(this.depthDownsampleTarget)
      this.depthDownsampleQuad.material.uniforms.sceneDepth.value = this.depthTexture
      this.depthDownsampleQuad.material.uniforms.resolution.value = this._r
      this.depthDownsampleQuad.material.uniforms['near'].value = this.camera.near
      this.depthDownsampleQuad.material.uniforms['far'].value = this.camera.far
      this.depthDownsampleQuad.material.uniforms['projectionMatrixInv'].value = this.camera.projectionMatrixInverse
      this.depthDownsampleQuad.material.uniforms['viewMatrixInv'].value = this.camera.matrixWorld
      this.depthDownsampleQuad.material.uniforms['logDepth'].value = this.configuration.logarithmicDepthBuffer
      this.depthDownsampleQuad.render(renderer)
    }
    this.effectShaderQuad.material.uniforms['sceneDiffuse'].value = inputBuffer.texture
    this.effectShaderQuad.material.uniforms['sceneDepth'].value = this.configuration.halfRes
      ? this.depthDownsampleTarget.texture[0]
      : this.depthTexture
    this.effectShaderQuad.material.uniforms['sceneNormal'].value = this.configuration.halfRes
      ? this.depthDownsampleTarget.texture[1]
      : null
    this.effectShaderQuad.material.uniforms['projMat'].value = this.camera.projectionMatrix
    this.effectShaderQuad.material.uniforms['viewMat'].value = this.camera.matrixWorldInverse
    this.effectShaderQuad.material.uniforms['projViewMat'].value = this.camera.projectionMatrix
      .clone()
      .multiply(this.camera.matrixWorldInverse.clone())
    this.effectShaderQuad.material.uniforms['projectionMatrixInv'].value = this.camera.projectionMatrixInverse
    this.effectShaderQuad.material.uniforms['viewMatrixInv'].value = this.camera.matrixWorld
    this.effectShaderQuad.material.uniforms['cameraPos'].value = this.camera.getWorldPosition(new THREE.Vector3())
    this.effectShaderQuad.material.uniforms['resolution'].value = this.configuration.halfRes
      ? this._r
          .clone()
          .multiplyScalar(1 / 2)
          .floor()
      : this._r
    this.effectShaderQuad.material.uniforms['time'].value = performance.now() / 1000
    this.effectShaderQuad.material.uniforms['samples'].value = this.samples
    this.effectShaderQuad.material.uniforms['samplesR'].value = this.samplesR
    this.effectShaderQuad.material.uniforms['bluenoise'].value = this.bluenoise
    this.effectShaderQuad.material.uniforms['radius'].value = trueRadius
    this.effectShaderQuad.material.uniforms['distanceFalloff'].value = this.configuration.distanceFalloff
    this.effectShaderQuad.material.uniforms['near'].value = this.camera.near
    this.effectShaderQuad.material.uniforms['far'].value = this.camera.far
    this.effectShaderQuad.material.uniforms['logDepth'].value = renderer.capabilities.logarithmicDepthBuffer
    this.effectShaderQuad.material.uniforms['ortho'].value = this.camera.isOrthographicCamera
    this.effectShaderQuad.material.uniforms['screenSpaceRadius'].value = this.configuration.screenSpaceRadius
    // Start the AO
    renderer.setRenderTarget(this.writeTargetInternal)
    this.effectShaderQuad.render(renderer)
    // End the AO
    // Start the blur
    for (let i = 0; i < this.configuration.denoiseIterations; i++) {
      ;[this.writeTargetInternal, this.readTargetInternal] = [this.readTargetInternal, this.writeTargetInternal]
      this.poissonBlurQuad.material.uniforms['tDiffuse'].value = this.readTargetInternal.texture
      this.poissonBlurQuad.material.uniforms['sceneDepth'].value = this.configuration.halfRes
        ? this.depthDownsampleTarget.texture[0]
        : this.depthTexture
      this.poissonBlurQuad.material.uniforms['projMat'].value = this.camera.projectionMatrix
      this.poissonBlurQuad.material.uniforms['viewMat'].value = this.camera.matrixWorldInverse
      this.poissonBlurQuad.material.uniforms['projectionMatrixInv'].value = this.camera.projectionMatrixInverse
      this.poissonBlurQuad.material.uniforms['viewMatrixInv'].value = this.camera.matrixWorld
      this.poissonBlurQuad.material.uniforms['cameraPos'].value = this.camera.getWorldPosition(new THREE.Vector3())
      this.poissonBlurQuad.material.uniforms['resolution'].value = this.configuration.halfRes
        ? this._r
            .clone()
            .multiplyScalar(1 / 2)
            .floor()
        : this._r
      this.poissonBlurQuad.material.uniforms['time'].value = performance.now() / 1000
      this.poissonBlurQuad.material.uniforms['blueNoise'].value = this.bluenoise
      this.poissonBlurQuad.material.uniforms['radius'].value =
        this.configuration.denoiseRadius * (this.configuration.halfRes ? 1 / 2 : 1)
      this.poissonBlurQuad.material.uniforms['worldRadius'].value = trueRadius
      this.poissonBlurQuad.material.uniforms['distanceFalloff'].value = this.configuration.distanceFalloff
      this.poissonBlurQuad.material.uniforms['index'].value = i
      this.poissonBlurQuad.material.uniforms['poissonDisk'].value = this.samplesDenoise
      this.poissonBlurQuad.material.uniforms['near'].value = this.camera.near
      this.poissonBlurQuad.material.uniforms['far'].value = this.camera.far
      this.poissonBlurQuad.material.uniforms['logDepth'].value = renderer.capabilities.logarithmicDepthBuffer
      this.poissonBlurQuad.material.uniforms['screenSpaceRadius'].value = this.configuration.screenSpaceRadius
      renderer.setRenderTarget(this.writeTargetInternal)
      this.poissonBlurQuad.render(renderer)
    }
    // Now, we have the blurred AO in writeTargetInternal
    // End the blur
    // Start the composition
    this.effectCompositerQuad.material.uniforms['sceneDiffuse'].value = inputBuffer.texture
    this.effectCompositerQuad.material.uniforms['sceneDepth'].value = this.depthTexture
    this.effectCompositerQuad.material.uniforms['near'].value = this.camera.near
    this.effectCompositerQuad.material.uniforms['far'].value = this.camera.far
    this.effectCompositerQuad.material.uniforms['projectionMatrixInv'].value = this.camera.projectionMatrixInverse
    this.effectCompositerQuad.material.uniforms['viewMatrixInv'].value = this.camera.matrixWorld
    this.effectCompositerQuad.material.uniforms['logDepth'].value = renderer.capabilities.logarithmicDepthBuffer
    this.effectCompositerQuad.material.uniforms['ortho'].value = this.camera.isOrthographicCamera
    this.effectCompositerQuad.material.uniforms['downsampledDepth'].value = this.configuration.halfRes
      ? this.depthDownsampleTarget.texture[0]
      : this.depthTexture
    this.effectCompositerQuad.material.uniforms['resolution'].value = this._r
    this.effectCompositerQuad.material.uniforms['blueNoise'].value = this.bluenoise
    this.effectCompositerQuad.material.uniforms['intensity'].value = this.configuration.intensity
    this.effectCompositerQuad.material.uniforms['renderMode'].value = this.configuration.renderMode
    this.effectCompositerQuad.material.uniforms['screenSpaceRadius'].value = this.configuration.screenSpaceRadius
    this.effectCompositerQuad.material.uniforms['radius'].value = trueRadius
    this.effectCompositerQuad.material.uniforms['distanceFalloff'].value = this.configuration.distanceFalloff
    this.effectCompositerQuad.material.uniforms['gammaCorrection'].value = this.autosetGamma
      ? this.renderToScreen
      : this.configuration.gammaCorrection
    this.effectCompositerQuad.material.uniforms['tDiffuse'].value = this.writeTargetInternal.texture
    this.effectCompositerQuad.material.uniforms['color'].value = this._c
      .copy(this.configuration.color)
      .convertSRGBToLinear()
    this.effectCompositerQuad.material.uniforms['colorMultiply'].value = this.configuration.colorMultiply
    this.effectCompositerQuad.material.uniforms['cameraPos'].value = this.camera.getWorldPosition(new THREE.Vector3())
    this.effectCompositerQuad.material.uniforms['fog'].value = !!this.scene.fog
    if (this.scene.fog) {
      if (this.scene.fog.isFog) {
        this.effectCompositerQuad.material.uniforms['fogExp'].value = false
        this.effectCompositerQuad.material.uniforms['fogNear'].value = this.scene.fog.near
        this.effectCompositerQuad.material.uniforms['fogFar'].value = this.scene.fog.far
      } else if (this.scene.fog.isFogExp2) {
        this.effectCompositerQuad.material.uniforms['fogExp'].value = true
        this.effectCompositerQuad.material.uniforms['fogDensity'].value = this.scene.fog.density
      } else {
        console.error(`Unsupported fog type ${this.scene.fog.constructor.name} in SSAOPass.`)
      }
    }
    renderer.setRenderTarget(
      /* this.renderToScreen ? null :
                 outputBuffer*/
      this.outputTargetInternal
    )
    this.effectCompositerQuad.render(renderer)
    renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer)
    this.copyQuad.material.uniforms['tDiffuse'].value = this.outputTargetInternal.texture
    this.copyQuad.render(renderer)
    if (this.debugMode) {
      gl.endQuery(ext.TIME_ELAPSED_EXT)
      checkTimerQuery(timerQuery, gl, this)
    }

    renderer.xr.enabled = xrEnabled
  }
  /**
   * Enables the debug mode of the AO, meaning the lastTime value will be updated.
   */
  enableDebugMode() {
    this.debugMode = true
  }
  /**
   * Disables the debug mode of the AO, meaning the lastTime value will not be updated.
   */
  disableDebugMode() {
    this.debugMode = false
  }
  /**
   * Sets the display mode of the AO
   * @param {"Combined" | "AO" | "No AO" | "Split" | "Split AO"} mode - The display mode.
   */
  setDisplayMode(mode) {
    this.configuration.renderMode = ['Combined', 'AO', 'No AO', 'Split', 'Split AO'].indexOf(mode)
  }
  /**
   *
   * @param {"Performance" | "Low" | "Medium" | "High" | "Ultra"} mode
   */
  setQualityMode(mode) {
    if (mode === 'Performance') {
      this.configuration.aoSamples = 8
      this.configuration.denoiseSamples = 4
      this.configuration.denoiseRadius = 12
    } else if (mode === 'Low') {
      this.configuration.aoSamples = 16
      this.configuration.denoiseSamples = 4
      this.configuration.denoiseRadius = 12
    } else if (mode === 'Medium') {
      this.configuration.aoSamples = 16
      this.configuration.denoiseSamples = 8
      this.configuration.denoiseRadius = 12
    } else if (mode === 'High') {
      this.configuration.aoSamples = 64
      this.configuration.denoiseSamples = 8
      this.configuration.denoiseRadius = 6
    } else if (mode === 'Ultra') {
      this.configuration.aoSamples = 64
      this.configuration.denoiseSamples = 16
      this.configuration.denoiseRadius = 6
    }
  }
}
export { N8AOPostPass }
