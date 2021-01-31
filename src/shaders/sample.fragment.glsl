varying vec2 vUv;

uniform float uTime;
uniform float uProgress;

#define colorA vec3(0.5)
#define colorB vec3(0.5)
#define colorC vec3(1.0, 1.0, 0.5)
#define colorD vec3(0.8, 0.9, 0.3)

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
  return a + b*cos( 6.28318*(c*t+d) + uTime );
}

void main() {
  vec3 color = palette(vUv.y, colorA, colorB, colorC, colorD);

  float numInstances = float(NUM_INSTANCES);

  // alpha value of the meshes that restart from the center
  float alpha1 = smoothstep(0., 0.05, uProgress);

  // Alpha value of the meshes that approach the end
  float alpha2 = smoothstep(1.0, 0.95, uProgress);

  // multiply the two alphas to have the final value with both "enter" and "leave" values
  float alpha = alpha1 * alpha2;

  gl_FragColor = vec4(color, alpha);
}
