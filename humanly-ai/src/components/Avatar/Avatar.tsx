import React, { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, useGLTF } from '@react-three/drei'
import { Group, AnimationMixer, LoopRepeat, Mesh } from 'three'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store'

// Local Avatar URL
// NOTE: Ensure 'female.glb' is placed in 'public/avatar/' folder
const AVATAR_URL = '/avatar/female.glb'

interface AvatarModelProps {
    isSpeaking: boolean
    currentViseme: string
}

function AvatarModel({ isSpeaking, currentViseme }: AvatarModelProps) {
    const group = useRef<Group>(null)
    const mixerRef = useRef<AnimationMixer | null>(null)
    const [model, setModel] = useState<Group | null>(null)

    // Load the avatar model using useGLTF
    // This will suspend if loading and throw if error (caught by ErrorBoundary or Suspense fallback)
    const { scene, animations } = useGLTF(AVATAR_URL)

    useEffect(() => {
        if (scene) {
            const clonedScene = scene.clone()
            setModel(clonedScene)

            // Setup animation mixer
            mixerRef.current = new AnimationMixer(clonedScene)

            // If there are animations, play idle
            if (animations.length > 0) {
                const idleAction = mixerRef.current.clipAction(animations[0])
                idleAction.setLoop(LoopRepeat, Infinity)
                idleAction.play()
            }
        }
    }, [scene, animations])

    // Breathing animation
    useFrame((state, delta) => {
        if (group.current) {
            // Subtle breathing effect
            group.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02

            // Subtle head movement when speaking
            if (isSpeaking) {
                group.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.02
                group.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.5) * 0.01
            }
        }

        // Update animation mixer
        if (mixerRef.current) {
            mixerRef.current.update(delta)
        }
    })

    // Apply viseme morphs for lip sync
    useEffect(() => {
        if (model && currentViseme) {
            model.traverse((child) => {
                if (child instanceof Mesh && child.morphTargetInfluences && child.morphTargetDictionary) {
                    // Reset all mouth-related morphs
                    Object.keys(child.morphTargetDictionary).forEach((key) => {
                        if (key.toLowerCase().includes('mouth') || key.toLowerCase().includes('jaw')) {
                            const index = child.morphTargetDictionary![key]
                            if (child.morphTargetInfluences) {
                                child.morphTargetInfluences[index] = 0
                            }
                        }
                    })

                    // Apply current viseme
                    const visemeMap: Record<string, string[]> = {
                        'A': ['mouthClose'],
                        'B': ['mouthFunnel', 'mouthLowerDown'],
                        'C': ['mouthShrugLower'],
                        'D': ['mouthStretch'],
                        'E': ['mouthSmile'],
                        'F': ['mouthFrownLeft', 'mouthFrownRight'],
                        'G': ['mouthPressLeft', 'mouthPressRight'],
                        'H': ['jawOpen', 'mouthOpen'],
                        'X': ['mouthClose'],
                    }

                    const morphs = visemeMap[currentViseme] || []
                    morphs.forEach((morphName) => {
                        if (child.morphTargetDictionary![morphName] !== undefined) {
                            const index = child.morphTargetDictionary![morphName]
                            if (child.morphTargetInfluences) {
                                child.morphTargetInfluences[index] = isSpeaking ? 0.7 : 0
                            }
                        }
                    })
                }
            })
        }
    }, [model, currentViseme, isSpeaking])

    if (!model) return null

    return (
        <group ref={group} position={[0, -1.5, 0]} scale={1.5}>
            <primitive object={model} />
        </group>
    )
}

function FallbackAvatar() {
    const headRef = useRef<Group>(null)
    const mouthRef = useRef<Mesh>(null)
    const eyeLeftRef = useRef<Group>(null)
    const eyeRightRef = useRef<Group>(null)
    const eyebrowLeftRef = useRef<Mesh>(null)
    const eyebrowRightRef = useRef<Mesh>(null)

    const [isBlinking, setIsBlinking] = useState(false)
    const { isSpeaking } = useAppStore()
    const [currentViseme, setCurrentViseme] = useState('X')

    // Listen for visemes for lipsync
    useEffect(() => {
        const handleViseme = (event: CustomEvent) => {
            setCurrentViseme(event.detail)
        }
        window.addEventListener('avatar-viseme', handleViseme as EventListener)
        return () => window.removeEventListener('avatar-viseme', handleViseme as EventListener)
    }, [])

    // Random blinking logic
    useEffect(() => {
        const triggerBlink = () => {
            setIsBlinking(true)
            setTimeout(() => setIsBlinking(false), 150)
            setTimeout(triggerBlink, Math.random() * 3000 + 2000)
        }
        const timeout = setTimeout(triggerBlink, 2000)
        return () => clearTimeout(timeout)
    }, [])

    useFrame((state) => {
        if (headRef.current) {
            // Floating and subtle tilt
            headRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05
            headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1

            if (isSpeaking) {
                headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 10) * 0.02
            } else {
                headRef.current.rotation.x = 0
            }
        }

        // Mouth lipsync animation - Enhanced
        if (mouthRef.current) {
            const visemeScaleMap: Record<string, { y: number, x: number }> = {
                'A': { y: 0.1, x: 1.0 }, // Closed
                'B': { y: 0.5, x: 0.8 }, // Labial
                'C': { y: 0.3, x: 1.1 }, // Dental
                'D': { y: 0.4, x: 1.2 }, // Fricative
                'E': { y: 0.2, x: 1.3 }, // Smile-ish
                'F': { y: 0.4, x: 0.9 }, // Labial
                'G': { y: 0.3, x: 1.0 }, // Velar
                'H': { y: 1.1, x: 0.9 }, // Wide Open
                'X': { y: 0.1, x: 1.0 }  // Silence
            }
            const target = isSpeaking ? (visemeScaleMap[currentViseme] || { y: 0.1, x: 1.0 }) : { y: 0.1, x: 1.0 }

            // Smoother more dynamic interpolation
            mouthRef.current.scale.y = mouthRef.current.scale.y * 0.7 + target.y * 1.5 * 0.3
            mouthRef.current.scale.x = mouthRef.current.scale.x * 0.8 + target.x * 0.2
        }

        // Eyebrow animation - moves during speech
        if (eyebrowLeftRef.current && eyebrowRightRef.current) {
            const eyebrowLift = isSpeaking ? Math.sin(state.clock.elapsedTime * 12) * 0.02 + 0.02 : 0
            eyebrowLeftRef.current.position.y = 0.35 + eyebrowLift
            eyebrowRightRef.current.position.y = 0.35 + eyebrowLift

            // Subtle tilt
            eyebrowLeftRef.current.rotation.z = isSpeaking ? Math.sin(state.clock.elapsedTime * 8) * 0.05 : 0
            eyebrowRightRef.current.rotation.z = isSpeaking ? -Math.sin(state.clock.elapsedTime * 8) * 0.05 : 0
        }

        // Blinking animation
        if (eyeLeftRef.current && eyeRightRef.current) {
            const targetEyeScale = isBlinking ? 0.05 : 1
            eyeLeftRef.current.scale.y = eyeLeftRef.current.scale.y * 0.5 + targetEyeScale * 0.5
            eyeRightRef.current.scale.y = eyeRightRef.current.scale.y * 0.5 + targetEyeScale * 0.5
        }
    })

    return (
        <group ref={headRef}>
            {/* Main Head Shape - Stylized Human */}
            <mesh position={[0, 0, 0.1]}>
                <sphereGeometry args={[0.7, 32, 32]} />
                <meshStandardMaterial color="#f1c27d" roughness={0.7} />
            </mesh>

            {/* Blushing Cheeks - Friendly look */}
            <group position={[0, -0.05, 0.65]}>
                <mesh position={[-0.35, 0.05, 0]}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshStandardMaterial color="#ff8a80" transparent opacity={0.3} />
                </mesh>
                <mesh position={[0.35, 0.05, 0]}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshStandardMaterial color="#ff8a80" transparent opacity={0.3} />
                </mesh>
            </group>

            {/* Eyebrows */}
            <group position={[0, 0, 0.65]}>
                <mesh ref={eyebrowLeftRef} position={[-0.22, 0.35, 0]}>
                    <boxGeometry args={[0.15, 0.02, 0.02]} />
                    <meshStandardMaterial color="#3d2b1f" />
                </mesh>
                <mesh ref={eyebrowRightRef} position={[0.22, 0.35, 0]}>
                    <boxGeometry args={[0.15, 0.02, 0.02]} />
                    <meshStandardMaterial color="#3d2b1f" />
                </mesh>
            </group>

            {/* Neck */}
            <mesh position={[0, -0.65, 0]}>
                <cylinderGeometry args={[0.18, 0.22, 0.4, 16]} />
                <meshStandardMaterial color="#f1c27d" roughness={0.7} />
            </mesh>

            {/* Stylized Hair - Bob Cut */}
            <group>
                <mesh position={[0, 0.2, -0.1]}>
                    <sphereGeometry args={[0.75, 32, 32]} />
                    <meshStandardMaterial color="#3d2b1f" roughness={1} />
                </mesh>
                {/* Hair Sides */}
                <mesh position={[-0.55, -0.1, 0]}>
                    <sphereGeometry args={[0.35, 16, 16]} />
                    <meshStandardMaterial color="#3d2b1f" roughness={1} />
                </mesh>
                <mesh position={[0.55, -0.1, 0]}>
                    <sphereGeometry args={[0.35, 16, 16]} />
                    <meshStandardMaterial color="#3d2b1f" roughness={1} />
                </mesh>
                {/* Hair Fringe/Bangs */}
                <mesh position={[0, 0.45, 0.4]} rotation={[0.4, 0, 0]}>
                    <boxGeometry args={[0.8, 0.2, 0.3]} />
                    <meshStandardMaterial color="#3d2b1f" roughness={1} />
                </mesh>
            </group>

            {/* Eyes - Stylized white with pupils */}
            <group position={[0, 0.15, 0.75]}>
                {/* Left Eye */}
                <group position={[-0.2, 0, 0]} ref={eyeLeftRef}>
                    <mesh>
                        <sphereGeometry args={[0.1, 16, 16]} />
                        <meshStandardMaterial color="white" roughness={0.3} />
                    </mesh>
                    <mesh position={[0, 0, 0.08]}>
                        <sphereGeometry args={[0.045, 8, 8]} />
                        <meshStandardMaterial color="#222" />
                    </mesh>
                </group>
                {/* Right Eye */}
                <group position={[0.2, 0, 0]} ref={eyeRightRef}>
                    <mesh>
                        <sphereGeometry args={[0.1, 16, 16]} />
                        <meshStandardMaterial color="white" roughness={0.3} />
                    </mesh>
                    <mesh position={[0, 0, 0.08]}>
                        <sphereGeometry args={[0.045, 8, 8]} />
                        <meshStandardMaterial color="#222" />
                    </mesh>
                </group>
            </group>

            {/* Nose - Subtle bump */}
            <mesh position={[0, -0.05, 0.78]}>
                <sphereGeometry args={[0.06, 12, 12]} />
                <meshStandardMaterial color="#eac086" roughness={0.8} />
            </mesh>

            {/* Mouth - Enhanced Lipsync Mesh */}
            <mesh ref={mouthRef} position={[0, -0.28, 0.75]}>
                <boxGeometry args={[0.2, 0.03, 0.02]} />
                <meshStandardMaterial color="#ff5252" roughness={0.5} />
            </mesh>
        </group>
    )
}

// Simple Error Boundary for the Avatar
class AvatarErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error: any) {
        console.warn('Avatar loading failed, showing fallback:', error)
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback
        }
        return this.props.children
    }
}

function AvatarScene() {
    const { isSpeaking } = useAppStore()
    const [currentViseme, setCurrentViseme] = useState('X')

    useEffect(() => {
        const handleViseme = (event: CustomEvent) => {
            setCurrentViseme(event.detail)
        }

        window.addEventListener('avatar-viseme', handleViseme as EventListener)
        return () => {
            window.removeEventListener('avatar-viseme', handleViseme as EventListener)
        }
    }, [])

    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
            <spotLight position={[-5, 5, 0]} intensity={0.5} angle={0.3} penumbra={1} />

            <AvatarErrorBoundary fallback={<FallbackAvatar />}>
                <Suspense fallback={<FallbackAvatar />}>
                    <AvatarModel
                        isSpeaking={isSpeaking}
                        currentViseme={currentViseme}
                    />
                </Suspense>
            </AvatarErrorBoundary>

            <ContactShadows
                position={[0, -1.5, 0]}
                opacity={0.4}
                scale={10}
                blur={2.5}
                far={4}
            />

            <Environment preset="city" />

            <OrbitControls
                enableZoom={false}
                enablePan={false}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI / 2}
                minAzimuthAngle={-Math.PI / 6}
                maxAzimuthAngle={Math.PI / 6}
            />
        </>
    )
}

interface AvatarProps {
    className?: string
    showMessage?: boolean
}

export function Avatar({ className = '', showMessage = false }: AvatarProps) {
    const { avatarMessage, isSpeaking } = useAppStore()

    return (
        <div className={`relative ${className}`}>
            {/* 3D Canvas */}
            <div className="w-full h-full min-h-[300px] rounded-2xl overflow-hidden bg-gradient-to-b from-primary-900/20 to-surface-900/40">
                <Canvas
                    camera={{ position: [0, 0, 3], fov: 45 }}
                    dpr={[1, 2]}
                >
                    <AvatarScene />
                </Canvas>
            </div>

            {/* Removed: Speaking indicator dots */}

            {/* Message bubble */}
            {showMessage && avatarMessage && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute -bottom-2 left-4 right-4 transform translate-y-full"
                >
                    <div className="glass-card p-4 mt-4">
                        <p className="text-sm text-surface-200 leading-relaxed">
                            {avatarMessage}
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    )
}

export default Avatar
