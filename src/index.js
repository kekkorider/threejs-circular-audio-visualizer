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
  Quaternion,
  AdditiveBlending,
  Audio,
  AudioListener,
  AudioLoader,
  AudioAnalyser
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh'

import Tweakpane from 'tweakpane'
import gsap from 'gsap'

class App {
  constructor(container) {
    this.container = document.querySelector(container)
    this.volume = { value: 0 }
    this.meshRotation = { x: 0, y: 0, z: 0 }

    this._resizeCb = () => this._onResize()
  }

  init() {
    this._createScene()
    this._createCamera()
    this._createRenderer()
    this._createToruses()
    this._createClock()
    this._addListeners()
    // this._createControls()
    // this._createDebugPanel()

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

    this.camera.lookAt(this.instancedTorus.position)

    this.instancedTorus.rotation.x += 0.005 * this.meshRotation.x
    this.instancedTorus.rotation.y += 0.005 * this.meshRotation.y
    this.instancedTorus.rotation.z += 0.005 * this.meshRotation.z

    if (!!this.analyser) {
      const freq = this.analyser.getAverageFrequency()
      this.volume.value = freq * 0.8
      this.instancedTorus.material.uniforms.uDistortionPower.value = freq * 0.1
    }
  }

  _render() {
    this.renderer.render(this.scene, this.camera)
  }

  _createScene() {
    this.scene = new Scene()
  }

  _createCamera() {
    this.camera = new PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000)
    this.camera.position.set(0, 20, 100)
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
    const geometry = new TorusGeometry(5, 0.1, 6, 90)
    geometry.rotateX(Math.PI*0.5)

    const material = this._createMaterial()

    this.instancedTorus = new InstancedUniformsMesh(geometry, material, material.defines.NUM_INSTANCES)

    this._updateToruses()

    this.scene.add(this.instancedTorus)
  }

  _updateToruses(time = 0) {
    const matrix = new Matrix4()

    for (let i = 0; i < this.instancedTorus.count; i++) {
      const isEven = i % 2 === 0 ? 1 : -1

      // Set odd indices to have the value of the previous index.
      // Used to place two instances in the same place.
      const fakeIndex = i - i%2

      const position = new Vector3()
			const rotation = new Euler()
			const quaternion = new Quaternion()
      const scale = new Vector3()

      // Loops from 0.5 to count+0.5 to do per-instance calculations
      const t = gsap.utils.wrap(0.5, this.instancedTorus.count + 0.5, fakeIndex + time)

      // Normalize `t`
      const tNorm = gsap.utils.normalize(0.5, this.instancedTorus.count + 0.5, t)

      // position.x = Math.random() * 20 - 10
      position.y += 0.3*isEven - (1 - tNorm) * this.volume.value * isEven
      // position.z = Math.random() * 20 - 10

      // rotation.x = Math.PI * 2 * t * (Math.PI / 180)
      rotation.y = (Math.PI / 180) * time * 10 * isEven
      // rotation.z = Math.PI * t * (Math.PI / 180)

      quaternion.setFromEuler(rotation)

      scale.x = scale.z = t * 2
      scale.y = 1 + t

      matrix.compose(position, quaternion, scale)

      this.instancedTorus.setMatrixAt(i, matrix)
      this.instancedTorus.setUniformAt('uProgress', i, tNorm)
      this.instancedTorus.setUniformAt('uDistortion', i, tNorm)

      this.instancedTorus.instanceMatrix.needsUpdate = true
    }
  }

  _createMaterial() {
    return new ShaderMaterial({
      vertexShader: require('./shaders/sample.vertex.glsl'),
      fragmentShader: require('./shaders/sample.fragment.glsl'),
      transparent: true,
      wireframe: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uDistortionPower: { value: 0 },
        uDistortion: { value: 0 },
        uProgress: { value: 0 }
      },
      defines: {
        NUM_INSTANCES: 40
      }
    })
  }

  _loadMusic() {
    return new Promise(resolve => {
      const progressCount = document.querySelector('#progress-count')

      const audioListener = new AudioListener()
      this.camera.add(audioListener)

      const music = new Audio(audioListener)
      this.scene.add(music)

      const loader = new AudioLoader()
      loader.load('/music.mp3', audioBuffer => {
        music.setBuffer(audioBuffer)
        music.setLoop(true)
        music.setVolume(0.1)
        music.play()

        this.analyser = new AudioAnalyser(music, 32)

        gsap.to(this.meshRotation, {
          duration: 7,
          x: 0.74,
          y: 0.9,
          z: -0.4
        })

        gsap.to('#prompt', { autoAlpha: 0, duration: 1 })

        resolve()
      }, ({ loaded, total }) => {
        progressCount.textContent = `${parseInt(loaded / total * 100)}%`
      })
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

    sceneFolder.addInput(this.meshRotation, 'x', { label: 'RotX', min: -1, max: 1 })
    sceneFolder.addInput(this.meshRotation, 'y', { label: 'RotY', min: -1, max: 1 })
    sceneFolder.addInput(this.meshRotation, 'z', { label: 'RotZ', min: -1, max: 1 })

    /**
     * Torus configuration
     */
    const torusFolder = this.pane.addFolder({ title: 'Torus' })

    torusFolder.addInput(this.instancedTorus.material.uniforms.uDistortionPower, 'value', { label: 'Distortion Power', min: 0, max: 5 })
    torusFolder.addInput(this.volume, 'value', { label: 'Volume', min: 0, max: 1 })
  }

  _runIntroAnimation() {
    const tl = new gsap.timeline()

    tl
      .to(['.audio-icon', '#audio-btn'], {
        opacity: 0,
        stagger: 0.25,
        duration: 0.75,
        onComplete: () => {
          gsap.set(['.audio-icon', '#audio-btn'], { display: 'none' })
        }
      })
      .to('#progress', { autoAlpha: 1, duration: 0.6 }, '>')
      .call(() => {
        this._loadMusic().then(() => this._runLoopingAnimation())
      }, null, '<')
      .to(this.camera.position, {
        duration: 3,
        y: 10,
        z: 550,
      }, '<')
  }

  _runLoopingAnimation() {
    const tl = new gsap.timeline({
      repeat: -1,
      yoyo: true
    })

    tl
      .to(this.camera.position, { duration: 10, z: 350, overwrite: true })
  }

  _createClock() {
    this.clock = new Clock()
  }

  _addListeners() {
    window.addEventListener('resize', this._resizeCb, { passive: true })

    document.querySelector('#audio-btn').addEventListener('click', () => {
      this._runIntroAnimation()
    }, { once: true })
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
