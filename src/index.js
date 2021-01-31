import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  TorusGeometry,
  ShaderMaterial,
  Mesh,
  Color,
  Clock,
  Matrix4,
  Vector3,
  Euler,
  Quaternion
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh'

import Tweakpane from 'tweakpane'
import gsap from 'gsap'

class App {
  constructor(container) {
    this.container = document.querySelector(container)

    this._resizeCb = () => this._onResize()
  }

  init() {
    this._createScene()
    this._createCamera()
    this._createRenderer()
    // this._createTorus()
    this._createToruses()
    this._createClock()
    this._addListeners()
    this._createControls()
    this._createDebugPanel()

    this.renderer.setAnimationLoop(() => {
      this._update()
      this._render()
    })

    console.log(this)
  }

  destroy() {
    this.renderer.dispose()
    this._removeListeners()
  }

  _update() {
    const elapsed = this.clock.getElapsedTime()

    this._updateToruses(elapsed)

    this.instancedTorus.material.uniforms.uTime.value = elapsed
  }

  _render() {
    this.renderer.render(this.scene, this.camera)
  }

  _createScene() {
    this.scene = new Scene()
  }

  _createCamera() {
    this.camera = new PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000)
    this.camera.position.set(0, 1, 10)
  }

  _createRenderer() {
    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: true
    })

    this.container.appendChild(this.renderer.domElement)

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio))
    this.renderer.setClearColor(0x121212)
    this.renderer.physicallyCorrectLights = true
  }

  _createTorus() {
    const geometry = new TorusGeometry(5, 0.1, 16, 180)
    geometry.rotateX(Math.PI*0.5)
    const material = this._createMaterial()

    this.torus = new Mesh(geometry, material)

    this.scene.add(this.torus)
  }

  _createToruses() {
    const geometry = new TorusGeometry(5, 0.1, 8, 90)
    geometry.rotateX(Math.PI*0.5)

    const material = this._createMaterial()

    this.instancedTorus = new InstancedUniformsMesh(geometry, material, material.defines.NUM_INSTANCES)

    this._updateToruses()

    this.scene.add(this.instancedTorus)
  }

  _updateToruses(time = 0) {
    const matrix = new Matrix4()

    for (let i = 0; i < this.instancedTorus.count; i++) {
      const position = new Vector3()
			const rotation = new Euler()
			const quaternion = new Quaternion()
      const scale = new Vector3()

      const t = gsap.utils.wrap(0.5, this.instancedTorus.count + 0.5, i + time)

      // position.x = Math.random() * 20 - 10
      // position.y = Math.random() * 20 - 10
      // position.z = Math.random() * 20 - 10

      rotation.x = Math.PI * 2 * t * (Math.PI / 180)
      // rotation.y = Math.random() * 2 * Math.PI
      rotation.z = Math.PI * t * (Math.PI / 180)

      quaternion.setFromEuler(rotation)

      scale.x = scale.z = t
      scale.y = 1 + t * 0.05

      matrix.compose(position, quaternion, scale)

      this.instancedTorus.setMatrixAt(i, matrix)
      this.instancedTorus.setUniformAt('uAlpha', i, t)

      this.instancedTorus.instanceMatrix.needsUpdate = true
    }
  }

  _createMaterial() {
    return new ShaderMaterial({
      vertexShader: require('./shaders/sample.vertex.glsl'),
      fragmentShader: require('./shaders/sample.fragment.glsl'),
      transparent: true,
      wireframe: true,
      uniforms: {
        uTime: { value: 0 },
        uDistortionPower: { value: 1 },
        uAlpha: { value: 0 }
      },
      defines: {
        NUM_INSTANCES: 30
      }
    })
  }

  _createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
  }

  _createDebugPanel() {
    this.pane = new Tweakpane()

    /**
     * Scene configuration
     */
    const sceneFolder = this.pane.addFolder({ title: 'Scene' })

    let params = { background: { r: 18, g: 18, b: 18 } }

    sceneFolder.addInput(params, 'background', { label: 'Background Color' }).on('change', value => {
      this.renderer.setClearColor(new Color(value.r / 255, value.g / 255, value.b / 255))
    })

    /**
     * Torus configuration
     */
    const torusFolder = this.pane.addFolder({ title: 'Torus' })

    torusFolder.addInput(this.instancedTorus.material.uniforms.uDistortionPower, 'value', { label: 'Distortion', min: 0, max: 5 })
  }

  _createClock() {
    this.clock = new Clock()
  }

  _addListeners() {
    window.addEventListener('resize', this._resizeCb, { passive: true })
  }

  _removeListeners() {
    window.removeEventListener('resize', this._resizeCb, { passive: true })
  }

  _onResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }
}

const app = new App('#app')
app.init()
