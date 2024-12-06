import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import * as dat from 'lil-gui'


/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Models
 */
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let mixer = null

// Store model references
let houseModel = null


gltfLoader.load(
    '/models/house.glb',
    (gltf) =>
    {
        houseModel = gltf.scene
        scene.add(houseModel)
        
        // Position house at origin
        houseModel.position.set(0, 0, 0)
    }
)
/*
floor
*/ 
const floor = new THREE.Mesh(
    new THREE.CircleGeometry(20, 64),  
    new THREE.MeshStandardMaterial({
        color: '#88674E',
        metalness: 0.3,
        roughness: 0.4,
        envMapIntensity: 5
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)


/**
 * Environment Objects
 */
// Create trees function
function createTree(x, z) {
    const tree = new THREE.Group()
    
    // Tree trunk
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8),
        new THREE.MeshStandardMaterial({ color: '#4a3320' })
    )
    trunk.position.y = 0.75
    
    // Tree top (leaves)
    const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(1, 2, 8),
        new THREE.MeshStandardMaterial({ color: '#2d5a27' })
    )
    leaves.position.y = 2.5
    
    tree.add(trunk, leaves)
    tree.position.set(x, 0, z)
    scene.add(tree)
}

// Create pond
const pond = new THREE.Mesh(
    new THREE.CircleGeometry(4, 32),
    new THREE.MeshStandardMaterial({ 
        color: '#3498db',
        metalness: 0.8,
        roughness: 0.1
    })
)
pond.rotation.x = -Math.PI * 0.5
pond.position.set(-10, 0.01, 5)  // Slightly above floor to prevent z-fighting
scene.add(pond)
    


// Add multiple trees
const treePositions = [
    { x: 10, z: 10 },
    { x: -10, z: 10 },
    { x: 10, z: -10 },
    { x: -10, z: -10 },
    { x: 15, z: 0 },
    { x: -15, z: 0 },
    { x: 0, z: 15 },
    { x: 0, z: -15 }
]

treePositions.forEach(pos => createTree(pos.x, pos.z))


/**
 * Grass
 */
function createGrass() {
    const grassGeometry = new THREE.PlaneGeometry(0.3, 0.5)
    const grassMaterial = new THREE.MeshStandardMaterial({ 
        color: '#3d5e3a',
        side: THREE.DoubleSide,
        alphaTest: 0.5
    })

    // Number of grass instances
    const instanceCount = 1000
    const grass = new THREE.InstancedMesh(grassGeometry, grassMaterial, instanceCount)
    
    // Create grass blades
    const dummy = new THREE.Object3D()
    const radius = 20 // Spread radius
    let validInstances = 0
    
    for(let i = 0; i < instanceCount; i++) {
        // Random position within a circle
        const angle = Math.random() * Math.PI * 2
        const r = Math.sqrt(Math.random()) * radius
        const x = Math.cos(angle) * r
        const z = Math.sin(angle) * r
        
        // Avoid placing grass in the pond (updated pond position: -10, 0, 5)
        const distanceToPond = Math.sqrt(
            Math.pow(x - (-10), 2) + 
            Math.pow(z - 5, 2)
        )
        // Avoid placing grass near the house (assuming house is at origin)
        const distanceToHouse = Math.sqrt(Math.pow(x, 2) + Math.pow(z, 2))
        
        // Skip if too close to pond or house
        if(distanceToPond < 5 || distanceToHouse < 4) continue
        
        dummy.position.set(x, 0.25, z)
        
        // Random rotation
        dummy.rotation.y = Math.random() * Math.PI
        dummy.rotation.z = (Math.random() - 0.5) * 0.2
        
        // Random scale
        const scale = 0.8 + Math.random() * 0.4
        dummy.scale.set(scale, scale, scale)
        
        dummy.updateMatrix()
        grass.setMatrixAt(validInstances, dummy.matrix)
        validInstances++
        
        if(validInstances >= instanceCount) break
    }
    
    scene.add(grass)
}

createGrass()


/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(-8, 4, 8)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0, 0)
controls.enableDamping = true
controls.maxPolarAngle = Math.PI
controls.minPolarAngle = 0

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Galaxy
 */
const parameters = {
    count: 200000,
    size: 0.02,
    radius: 500,
    branches: 3,
    spin: 1,
    randomness: 0.2,
    randomnessPower: 3,
    insideColor: '#ff6030',
    outsideColor: '#1b3984',
    waveSpeed: 1,
    waveHeight: 0.2,
    galaxyY: 10
}

let geometry = null
let material = null
let points = null

const generateGalaxy = () => {
    // Dispose old galaxy
    if(points !== null) {
        geometry.dispose()
        material.dispose()
        scene.remove(points)
    }

    geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(parameters.count * 3)
    const colors = new Float32Array(parameters.count * 3)
    const originalPositions = new Float32Array(parameters.count * 3)  // Store original positions

    const colorInside = new THREE.Color(parameters.insideColor)
    const colorOutside = new THREE.Color(parameters.outsideColor)

    for(let i = 0; i < parameters.count; i++) {
        const i3 = i * 3

        // Position
        const radius = Math.random() * parameters.radius
        const spinAngle = radius * parameters.spin
        const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2

        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)

        positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX
        positions[i3 + 1] = parameters.galaxyY + randomY
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

        // Store original positions
        originalPositions[i3] = positions[i3]
        originalPositions[i3 + 1] = positions[i3 + 1]
        originalPositions[i3 + 2] = positions[i3 + 2]

        // Color
        const mixedColor = colorInside.clone()
        mixedColor.lerp(colorOutside, radius / parameters.radius)

        colors[i3] = mixedColor.r
        colors[i3 + 1] = mixedColor.g
        colors[i3 + 2] = mixedColor.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3))  // Add original positions

    material = new THREE.PointsMaterial({
        size: parameters.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    })

    points = new THREE.Points(geometry, material)
    scene.add(points)
}

generateGalaxy()

/**
 * Debug GUI
 */
// Galaxy folder
const galaxyFolder = gui.addFolder('Galaxy Parameters')
galaxyFolder.add(parameters, 'count').min(100).max(1000000).step(100).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'size').min(0.001).max(0.1).step(0.001).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'spin').min(-5).max(5).step(0.001).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'galaxyY').min(5).max(30).step(0.1).onFinishChange(generateGalaxy)

// Colors folder
const colorsFolder = gui.addFolder('Colors')
colorsFolder.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy)
colorsFolder.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy)

// Animation folder
const animationFolder = gui.addFolder('Wave Animation')
animationFolder.add(parameters, 'waveSpeed').min(0).max(5).step(0.1)
animationFolder.add(parameters, 'waveHeight').min(0).max(2).step(0.1)

// Open folders by default
galaxyFolder.open()
colorsFolder.open()
animationFolder.open()

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Animate galaxy
    if(points) {
        const positions = points.geometry.attributes.position.array
        const originalPositions = points.geometry.attributes.originalPosition.array
        
        for(let i = 0; i < parameters.count; i++) {
            const i3 = i * 3
            
            // Create wave motion
            positions[i3 + 1] = originalPositions[i3 + 1] + 
                Math.sin(elapsedTime * parameters.waveSpeed + originalPositions[i3] * 0.1) * 
                parameters.waveHeight
        }
        points.geometry.attributes.position.needsUpdate = true
    }

    if(mixer)
    {
        mixer.update(elapsedTime)
    }

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()