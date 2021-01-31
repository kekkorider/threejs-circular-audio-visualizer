varying vec2 vUv;

uniform float uTime;
uniform float uDistortionPower;

mat2 rotate(float angle) {
  return mat2(
    cos(angle), -sin(angle),
    sin(angle), cos(angle)
  );
}

void main() {
  vec3 pos = position;

  // Goes from 0 to 2.5
  // Determines the scale of the mesh
  // float animProgress = mod(uTime, 2.5);

  // float distortionPower = uDistortionPower * smoothstep(0.3, 1.7, animProgress);

  // super mega turbo distortion
  pos.y += (sin(pos.x*8. + uTime)*0.2 * cos(pos.z*5. + uTime)*2. + sin(pos.x*3. - uTime)*0.5 - cos(pos.z*17. + uTime)*0.1) * uDistortionPower;

  vec4 mvPosition = vec4(pos, 1.0 );
  mvPosition = instanceMatrix * mvPosition;

  vec4 modelViewPosition = modelViewMatrix * mvPosition;
  gl_Position = projectionMatrix * modelViewPosition;

  vUv = uv;
}
