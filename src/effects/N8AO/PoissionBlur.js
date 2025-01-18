import * as THREE from 'three'

const PoissionBlur = {
  uniforms: {
    sceneDiffuse: { value: null },
    sceneDepth: { value: null },
    tDiffuse: { value: null },
    projMat: { value: new THREE.Matrix4() },
    viewMat: { value: new THREE.Matrix4() },
    projectionMatrixInv: { value: new THREE.Matrix4() },
    viewMatrixInv: { value: new THREE.Matrix4() },
    cameraPos: { value: new THREE.Vector3() },
    resolution: { value: new THREE.Vector2() },
    time: { value: 0.0 },
    r: { value: 5.0 },
    blueNoise: { value: null },
    radius: { value: 12.0 },
    worldRadius: { value: 5.0 },
    index: { value: 0.0 },
    poissonDisk: { value: [] },
    distanceFalloff: { value: 1.0 },
    near: { value: 0.1 },
    far: { value: 1000.0 },
    logDepth: { value: false },
    screenSpaceRadius: { value: false },
  },
  depthWrite: false,
  depthTest: false,

  vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = vec4(position, 1.0);
		}`,
  fragmentShader: /* glsl */ `
		uniform sampler2D sceneDiffuse;
    uniform highp sampler2D sceneDepth;
    uniform sampler2D tDiffuse;
    uniform sampler2D blueNoise;
    uniform mat4 projectionMatrixInv;
    uniform mat4 viewMatrixInv;
    uniform vec2 resolution;
    uniform float r;
    uniform float radius;
     uniform float worldRadius;
    uniform float index;
     uniform float near;
     uniform float far;
     uniform float distanceFalloff;
     uniform bool logDepth;
     uniform bool screenSpaceRadius;
    varying vec2 vUv;

    highp float linearize_depth(highp float d, highp float zNear,highp float zFar)
    {
        highp float z_n = 2.0 * d - 1.0;
        return 2.0 * zNear * zFar / (zFar + zNear - z_n * (zFar - zNear));
    }
    highp float linearize_depth_log(highp float d, highp float nearZ,highp float farZ) {
     float depth = pow(2.0, d * log2(farZ + 1.0)) - 1.0;
     float a = farZ / (farZ - nearZ);
     float b = farZ * nearZ / (nearZ - farZ);
     float linDepth = a + b / depth;
     return linearize_depth(linDepth, nearZ, farZ);
   }
   highp float linearize_depth_ortho(highp float d, highp float nearZ, highp float farZ) {
     return nearZ + (farZ - nearZ) * d;
   }
   vec3 getWorldPosLog(vec3 posS) {
     vec2 uv = posS.xy;
     float z = posS.z;
     float nearZ =near;
     float farZ = far;
     float depth = pow(2.0, z * log2(farZ + 1.0)) - 1.0;
     float a = farZ / (farZ - nearZ);
     float b = farZ * nearZ / (nearZ - farZ);
     float linDepth = a + b / depth;
     vec4 clipVec = vec4(uv, linDepth, 1.0) * 2.0 - 1.0;
     vec4 wpos = projectionMatrixInv * clipVec;
     return wpos.xyz / wpos.w;
   }
    vec3 getWorldPos(float depth, vec2 coord) {
     #ifdef LOGDEPTH
          return getWorldPosLog(vec3(coord, depth));
     #endif
        
        float z = depth * 2.0 - 1.0;
        vec4 clipSpacePosition = vec4(coord * 2.0 - 1.0, z, 1.0);
        vec4 viewSpacePosition = projectionMatrixInv * clipSpacePosition;
        // Perspective division
       vec4 worldSpacePosition = viewSpacePosition;
       worldSpacePosition.xyz /= worldSpacePosition.w;
        return worldSpacePosition.xyz;
    }
    #include <common>
    #define NUM_SAMPLES 16
    uniform vec2 poissonDisk[NUM_SAMPLES];
    void main() {
        const float pi = 3.14159;
        vec2 texelSize = vec2(1.0 / resolution.x, 1.0 / resolution.y);
        vec2 uv = vUv;
        vec4 data = texture2D(tDiffuse, vUv);
        float occlusion = data.a;
        float baseOcc = data.a;
        vec3 normal = data.rgb * 2.0 - 1.0;
        float count = 1.0;
        float d = texture2D(sceneDepth, vUv).x;
        if (d == 1.0) {
          gl_FragColor = data;
          return;
        }
        vec3 worldPos = getWorldPos(d, vUv);
        float size = radius;
        float angle;
        if (index == 0.0) {
             angle = texture2D(blueNoise, gl_FragCoord.xy / 128.0).x * PI2;
        } else if (index == 1.0) {
             angle = texture2D(blueNoise, gl_FragCoord.xy / 128.0).y * PI2;
        } else if (index == 2.0) {
             angle = texture2D(blueNoise, gl_FragCoord.xy / 128.0).z * PI2;
        } else {
             angle = texture2D(blueNoise, gl_FragCoord.xy / 128.0).w * PI2;
        }

        mat2 rotationMatrix = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        float radiusToUse = screenSpaceRadius ? distance(
          worldPos,
          getWorldPos(d, vUv +
            vec2(worldRadius, 0.0) / resolution)
        ) : worldRadius;
        float distanceFalloffToUse =screenSpaceRadius ?
            radiusToUse * distanceFalloff
        : distanceFalloff;


        for(int i = 0; i < NUM_SAMPLES; i++) {
            vec2 offset = (rotationMatrix * poissonDisk[i]) * texelSize * size;
            vec4 dataSample = texture2D(tDiffuse, uv + offset);
            float occSample = dataSample.a;
            vec3 normalSample = dataSample.rgb * 2.0 - 1.0;
            float dSample = texture2D(sceneDepth, uv + offset).x;
            vec3 worldPosSample = getWorldPos(dSample, uv + offset);
            float tangentPlaneDist = abs(dot(worldPos - worldPosSample, normal));
            float rangeCheck = dSample == 1.0 ? 0.0 :exp(-1.0 * tangentPlaneDist * (1.0 / distanceFalloffToUse)) * max(dot(normal, normalSample), 0.0) * (1.0 - abs(occSample - baseOcc));
            occlusion += occSample * rangeCheck;
            count += rangeCheck;
        }
        if (count > 0.0) {
          occlusion /= count;
        }
        #ifdef LOGDEPTH
          occlusion = clamp(occlusion, 0.0, 1.0);
          if (occlusion == 0.0) {
            occlusion = 1.0;
          }
        #endif
        gl_FragColor = vec4(0.5 + 0.5 * normal, occlusion);
    }
    `,
}

export { PoissionBlur }
