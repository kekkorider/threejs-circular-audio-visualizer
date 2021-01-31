varying vec2 vUv;

uniform float uTime;
uniform float uDistortionPower;
uniform float uDistortion;

void main() {
  vec3 pos = position;

  // super mega turbo distortion
  float distortion = smoothstep(0.05, 1.0, 1.0 - uDistortion);
  pos.y += (sin(pos.x*8. + uTime)*0.2 * cos(pos.z*5. + uTime)*2. + sin(pos.x*3. - uTime)*0.5 - cos(pos.z*17. + uTime)*0.1) * distortion * uDistortionPower;

  vec4 mvPosition = vec4(pos, 1.0 );
  mvPosition = instanceMatrix * mvPosition;

  vec4 modelViewPosition = modelViewMatrix * mvPosition;
  gl_Position = projectionMatrix * modelViewPosition;

  vUv = uv;
}
