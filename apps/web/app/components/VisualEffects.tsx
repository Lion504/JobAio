import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

const damp = (target: number, to: number, step: number, delta: number) => {
  const result = target + (to - target) * (1 - Math.exp(-step * delta))
  return result
}

const noiseGLSL = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
`

const baseVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const UnifiedRaysShader = {
  fragmentShader: `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uAspect;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform vec3 uAccent;
    uniform vec3 uCore;
    uniform vec3 uWhiteColor1;
    uniform vec3 uWhiteColor2;
    uniform vec3 uWhiteColor3;
    uniform vec3 uWhiteAccent;
    uniform vec3 uWhiteCore;
    uniform float uIsLightMode;
    varying vec2 vUv;

    ${noiseGLSL}
    
    vec3 screen(vec3 base, vec3 blend) {
      return 1.0 - (1.0 - base) * (1.0 - blend);
    }

    float getRayIntensity(vec2 p, float time, float offset, float seed) {
      float angle = atan(p.y, p.x);
      float dist = length(p) + offset * 0.018;
      
      float rays = 0.0;
      float rayCount = mix(2.0, 3.0, uIsLightMode);
      
      for(float i = 0.0; i < 3.0; i++) {
        float layerOffset = i * 0.7;
        float layerSpeed = 1.0 + i * 0.3 + seed * 0.1;
        float layerScale = 1.0 - i * 0.2;
        
        float noiseScale = -5.0;
        
        float angleNoise = snoise(vec2(angle * noiseScale + time * 0.07 * layerSpeed + seed * 5.0, dist * 2.0 + layerOffset)) * 0.5;
        angleNoise += snoise(vec2(angle * noiseScale * 2.0 - time * 0.1 + seed * 3.0, dist * 4.0)) * 0.25;
        angleNoise += sin(angle * 8.0 + time + seed) * 0.03;
        
        float modAngle = angle + angleNoise;
        float rayPattern = sin(modAngle * rayCount + i * 2.094 + seed * 2.0) * 0.5 + 0.5;
        rayPattern = pow(rayPattern, 2.8);
        
        float distMult = mix(3.8, 2.0, uIsLightMode);
        float powVal = mix(1.5, 1.1, uIsLightMode);
        float smoothEdge = mix(1.6, 1.8, uIsLightMode);

        float falloff = 1.0 / (1.0 + dist * distMult);
        falloff = pow(falloff, powVal);
        falloff *= smoothstep(smoothEdge, 0.0, dist);
        
        rays += rayPattern * falloff * layerScale;
      }
      
      float ripple = sin(dist * 12.0 - time * 1.5 + seed) * 0.5 + 0.5;
      ripple *= smoothstep(1.2, 0.0, dist) * 0.2;
      
      return (rays + ripple * 0.3) / 1.5;
    }

    float random(vec2 uv) {
      return fract(sin(dot(uv.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vec2 darkOrigin = vec2(-0.3, 1.2);
      vec2 lightOrigin = vec2(-0.55, 1.2);
      vec2 origin = mix(darkOrigin, lightOrigin, uIsLightMode);
      
      vec2 p = vUv - origin;
      p.x *= uAspect;
      
      float r = getRayIntensity(p * 0.75, uTime, -1.0, 0.0);
      float g = getRayIntensity(p, uTime, 0.0, 4.0);
      float b = getRayIntensity(p * 1.05, uTime, 1.0, 8.0);
      
      float powVal = mix(1.85, 1.15, uIsLightMode);
      float multVal = mix(3.0, 3.5, uIsLightMode);
      
      r = pow(r, powVal) * multVal;
      g = pow(g, powVal) * multVal;
      b = pow(b, powVal) * multVal;
      
      // Calculate Dark Mode Color
      vec3 colDark = vec3(0.0);
      colDark += r * uColor1;
      colDark += g * uColor2;
      colDark += b * uColor3;
      
      float midIntensityDark = smoothstep(0.1, 0.68, g) * smoothstep(0.78, 0.28, g);
      colDark += uAccent * midIntensityDark;
      
      float coreIntensityDark = smoothstep(0.48, 0.52, g);
      colDark = mix(colDark, uCore * (g + 1.18), coreIntensityDark);
      
      vec2 vignetteUV = vUv;
      vignetteUV.x *= uAspect;
      vec2 mouseUV = uMouse;
      mouseUV.x *= uAspect;
      
      float noiseVal = snoise(vignetteUV * 3.0 + uTime * 0.5) * 0.05;
      float distSpot = distance(vignetteUV, mouseUV) + noiseVal;
      float spotlight = smoothstep(0.35, 0.15, distSpot);
      colDark *= spotlight;
      
      // Light Mode Color
      vec3 invColor1 = vec3(1.0) - uWhiteColor1;
      vec3 invColor2 = vec3(1.0) - uWhiteColor2;
      vec3 invColor3 = vec3(1.0) - uWhiteColor3;
      vec3 invAccent = vec3(1.0) - uWhiteAccent;
      vec3 invCore = vec3(1.0) - uWhiteCore;

      vec3 colLight = vec3(0.0);
      colLight = screen(colLight, clamp(g * invColor2, 0.0, 0.9));
      colLight = screen(colLight, clamp(r * invColor1, 0.0, 0.9));
      colLight = screen(colLight, clamp(b * invColor3, 0.0, 0.9));
      
      float midIntensityLight = smoothstep(0.02, 0.35, g) * smoothstep(0.98, 0.88, g);
      colLight = screen(colLight, midIntensityLight * invAccent);
      
      float coreIntensityLight = smoothstep(0.1, 0.75, g);
      colLight = mix(colLight, invCore, coreIntensityLight);
      
      colLight = vec3(0.8) - colLight;
      
      colLight = mix(vec3(1.0), colLight, spotlight);
      
      vec3 col = mix(colDark, colLight, uIsLightMode);

      col = max(col, vec3(0.0));
      
      float noiseDiv = mix(300.0, 50.0, uIsLightMode);
      col += (random(vUv * uTime) - 0.5) / noiseDiv;

      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
}

export function Effect({ isLightMode = false }: { isLightMode?: boolean }) {
  const { viewport } = useThree()
  const mesh = useRef<THREE.Mesh>(null!)
  const material = useRef<THREE.ShaderMaterial>(null!)

  const smoothMouse = useRef(new THREE.Vector2(0.5, 0.5))

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    const { pointer } = state

    const targetX = pointer.x * 0.5 + 0.5
    const targetY = pointer.y * 0.5 + 0.5

    smoothMouse.current.x = damp(smoothMouse.current.x, targetX, 4.0, delta)
    smoothMouse.current.y = damp(smoothMouse.current.y, targetY, 4.0, delta)

    if (material.current) {
      material.current.uniforms.uTime.value = time
      material.current.uniforms.uMouse.value.copy(smoothMouse.current)
      material.current.uniforms.uAspect.value = viewport.width / viewport.height
      const targetMode = isLightMode ? 1.0 : 0.0
      material.current.uniforms.uIsLightMode.value = damp(
        material.current.uniforms.uIsLightMode.value,
        targetMode,
        4.0,
        delta
      )
    }
  })

  const shaderArgs = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uAspect: { value: 1.0 },
        uIsLightMode: { value: isLightMode ? 1.0 : 0.0 },

        uColor1: { value: new THREE.Color('#fbbf24') },
        uColor2: { value: new THREE.Color('#8400ff') },
        uColor3: { value: new THREE.Color('#00ddff') },
        uAccent: { value: new THREE.Color('#ff0084') },
        uCore: { value: new THREE.Color('#ffffff') },

        uWhiteColor1: { value: new THREE.Color('#fcb80c') },
        uWhiteColor3: { value: new THREE.Color('#e636b1') },
        uWhiteColor2: { value: new THREE.Color('#00ddff') },
        uWhiteAccent: { value: new THREE.Color('#fc0075') },
        uWhiteCore: { value: new THREE.Color('#ffffff') },
      },
      vertexShader: baseVertexShader,
      fragmentShader: UnifiedRaysShader.fragmentShader,
    }),
    [isLightMode]
  )

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 2]} />
      <mesh ref={mesh}>
        {/* eslint-disable-next-line react/no-unknown-property */}
        <planeGeometry args={[viewport.width, viewport.height]} />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <shaderMaterial ref={material} args={[shaderArgs]} />
      </mesh>
    </>
  )
}
