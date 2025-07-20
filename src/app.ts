import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as TWEEN from "@tweenjs/tween.js";

const ANIMATION_PARAMS = {
    CYLINDER_CLICK_OFFSET: 0.01,
    CYLINDER_ANIMATION_DURATION: 450,

    TONEARM_INITIAL_Y_ROTATION: -20 * (Math.PI / 180),
    TONEARM_Z_ROTATION: -3.75 * (Math.PI / 180),
    TONEARM_Y_ANIMATION_DURATION: 1500,
    TONEARM_Z_ANIMATION_DURATION: 500,

    RECORD_ROTATION_SPEED: 0.01,

    TONEARM_PLAY_Y_ROTATION_RANGE: -18 * (Math.PI / 180),
    TONEARM_RESET_DURATION: 1000,
};

class ThreeJSContainer {
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private glbModel?: THREE.Group;

    private clickableObject: THREE.Object3D | null = null;
    private toneArmPivot: THREE.Group;
    private toneArmNeedlePivot: THREE.Group;
    private record: THREE.Object3D | null = null;

    private isAnimating: boolean = false;
    private isRecordSpinning: boolean = false;
    private isPlaying: boolean = false;

    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();

    private listener: THREE.AudioListener;
    private sound: THREE.Audio;
    private audioBuffer: AudioBuffer | null = null;

    private spotLight: THREE.SpotLight;
    private spotLightTarget: THREE.Object3D;

    private initialCylinderPosition: THREE.Vector3 = new THREE.Vector3();

    constructor() {
        this.toneArmPivot = new THREE.Group();
        this.toneArmNeedlePivot = new THREE.Group();
        this.spotLightTarget = new THREE.Object3D();

        this.listener = new THREE.AudioListener();
        this.sound = new THREE.Audio(this.listener);
    }

    public createRendererDOM = (cameraPos: THREE.Vector3) => {
        // ウィンドウの現在の幅と高さを取得
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(new THREE.Color(0x000000));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.copy(cameraPos);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.camera.add(this.listener);

        const orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        orbitControls.enableDamping = true;
        orbitControls.dampingFactor = 0.05;

        this.createScene();
        this.loadAudio();

        this.renderer.domElement.addEventListener('click', this.onMouseClick, false);

        // ウィンドウのリサイズイベントリスナー
        window.addEventListener('resize', this.onWindowResize, false);

        const render: FrameRequestCallback = () => {
            orbitControls.update();
            TWEEN.update();

            if (this.record && this.isRecordSpinning) {
                this.record.rotation.y -= ANIMATION_PARAMS.RECORD_ROTATION_SPEED;

                if (this.isPlaying && this.audioBuffer && this.sound.isPlaying) {
                    const elapsed = this.sound.context.currentTime - this.sound.playbackRate * this.sound.offset;
                    const progress = elapsed / this.audioBuffer.duration;

                    if (progress < 1.0) {
                        const targetYRotation = ANIMATION_PARAMS.TONEARM_INITIAL_Y_ROTATION + ANIMATION_PARAMS.TONEARM_PLAY_Y_ROTATION_RANGE * progress;
                        this.toneArmPivot.rotation.y = targetYRotation;
                    } else if (progress >= 1.0 && !this.isAnimating) {
                        this.resetAnimation();
                    }
                }
            }

            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);

        return this.renderer.domElement;
    }

    private createScene = () => {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 0.1);
        this.scene.add(hemisphereLight);

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('./assets/Textures/disturb.jpg', () => {
            console.log("Spotlight texture loaded (map property no longer directly supported for SpotLight).");
            this.setupSpotLight();
        }, undefined, (error) => {
            console.error('An error occurred loading spotlight texture:', error);
            this.setupSpotLight();
        });

        const gltfLoadingManager = new THREE.LoadingManager(() => {
            if (this.glbModel) {
                this.scene.add(this.glbModel);
                this.glbModel.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
            }
        });

        const gltfLoader = new GLTFLoader(gltfLoadingManager);

        gltfLoader.setPath('./assets/');
        gltfLoader.load(
            'RecordPlayer01.glb',
            (gltf) => {
                this.glbModel = gltf.scene;

                const toneArmYRotationPartNames = ['antishake001', 'tonearm001', 'Cube001', 'Cube002'];
                const toneArmXRotationPartNames = ['tonearm001', 'Cube001', 'Cube002'];

                const toneArmYRotationParts: THREE.Object3D[] = [];
                const toneArmXRotationParts: THREE.Object3D[] = [];

                let antishakeObject: THREE.Object3D | null = null;
                let tonearmObject: THREE.Object3D | null = null;

                this.glbModel.traverse((child) => {
                    switch (child.name) {
                        case 'Cylinder002':
                            this.clickableObject = child;
                            this.initialCylinderPosition.copy(child.position);
                            break;
                        case 'record001':
                            this.record = child;
                            break;
                        case 'case001':
                            if (child instanceof THREE.Mesh) {
                                // ガラスマテリアル
                                const glassMat = new THREE.MeshPhysicalMaterial({});
                                glassMat.color = new THREE.Color(0xffffff);
                                glassMat.transmission = 1;
                                glassMat.metalness = 0;
                                glassMat.roughness = 0.01;
                                glassMat.ior = 1.5;
                                glassMat.thickness = 1;
                                glassMat.specularIntensity = 1;
                                child.material = glassMat;
                            }
                            break;
                    }

                    if (toneArmYRotationPartNames.includes(child.name)) {
                        toneArmYRotationParts.push(child);
                    }
                    if (toneArmXRotationPartNames.includes(child.name)) {
                        toneArmXRotationParts.push(child);
                    }
                    if (child.name === 'antishake001') {
                        antishakeObject = child;
                    }
                    if (child.name === 'tonearm001') {
                        tonearmObject = child;
                    }
                });

                if (antishakeObject) {
                    this.glbModel.add(this.toneArmPivot);
                    const worldPosition = new THREE.Vector3();
                    antishakeObject.getWorldPosition(worldPosition);
                    this.toneArmPivot.position.copy(worldPosition);

                    toneArmYRotationParts.forEach(part => {
                        this.toneArmPivot.attach(part);
                    });
                    antishakeObject.position.set(0, 0, 0);
                } else {
                    console.warn("Could not find 'antishake001' to set Y-axis pivot point for tonearm.");
                }

                if (tonearmObject) {
                    this.toneArmPivot.add(this.toneArmNeedlePivot);
                    this.toneArmNeedlePivot.position.copy(tonearmObject.position);

                    toneArmXRotationParts.forEach(part => {
                        this.toneArmNeedlePivot.attach(part);
                    });
                    tonearmObject.position.set(0, 0, 0);
                } else {
                    console.warn("Could not find 'tonearm001' to set X-axis pivot point for tonearm.");
                }

                this.glbModel.scale.set(10, 10, 10);
                this.glbModel.position.set(0, -1, 0);
            },
            (xhr) => {
                console.log(`GLB model ${(xhr.loaded / xhr.total * 100)}% loaded`);
            },
            (error) => {
                console.error('An error occurred while loading the GLB model:', error);
            }
        );

        const floorGeometry = new THREE.PlaneGeometry( 100, 100 );
        const floorMaterial = new THREE.MeshStandardMaterial( { color: 0x404040, roughness: 0.8, metalness: 0.2 } );
        const floorMesh = new THREE.Mesh( floorGeometry, floorMaterial );
        floorMesh.rotation.x = - Math.PI / 2;
        floorMesh.position.y = -1;
        floorMesh.receiveShadow = true;
        this.scene.add( floorMesh );
    }

    private setupSpotLight = () => {
        if (this.spotLight) {
            this.scene.remove(this.spotLight);
        }

        this.spotLight = new THREE.SpotLight(0xffffff, 20);
        this.spotLight.position.set(5, 10, -6);
        this.spotLightTarget.position.set(1, 0, -1);
        this.scene.add(this.spotLightTarget);
        this.spotLight.target = this.spotLightTarget;
        this.spotLight.angle = Math.PI / 10;
        this.spotLight.penumbra = 1;
        this.spotLight.decay = 2;
        this.spotLight.distance = 0;

        this.spotLight.castShadow = true;
        this.spotLight.shadow.mapSize.width = 1024;
        this.spotLight.shadow.mapSize.height = 1024;
        this.spotLight.shadow.camera.near = 1;
        this.spotLight.shadow.camera.far = 10;
        this.spotLight.shadow.focus = 1;
        this.scene.add(this.spotLight);
    }

    private loadAudio = () => {
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(
            './assets/teardrop-calm-reflective-piano-237449.mp3',
            (buffer) => {
                this.audioBuffer = buffer;
                this.sound.setBuffer(buffer);
                this.sound.setLoop(true);
                this.sound.setVolume(0.5);
                console.log("Audio loaded successfully.");
            },
            (xhr) => {
                console.log(`Audio ${(xhr.loaded / xhr.total * 100)}% loaded`);
            },
            (error) => {
                console.error('An error occurred while loading the audio:', error);
            }
        );
    }

    private onMouseClick = (event: MouseEvent) => {
        if (!this.listener.context.state || this.listener.context.state === 'suspended') {
            this.listener.context.resume().then(() => {
                console.log('AudioContext resumed!');
                this.handleAnimationClick(event);
            });
        } else {
            this.handleAnimationClick(event);
        }
    }

    private handleAnimationClick = (event: MouseEvent) => {
        const bounds = (event.target as HTMLElement).getBoundingClientRect();
        this.mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        this.mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        if (this.clickableObject) {
            const intersects = this.raycaster.intersectObject(this.clickableObject, true);

            if (intersects.length > 0) {
                this.togglePlayState();
            }
        }
    }

    private togglePlayState = () => {
        if (this.isAnimating) return;

        if (this.isPlaying) {
            this.pauseAnimation();
        } else {
            this.startPlayAnimation();
        }
    }

    private startPlayAnimation = () => {
        this.isPlaying = true;
        this.isAnimating = true;
        this.isRecordSpinning = false;

        if (this.clickableObject) {
            const targetY = this.initialCylinderPosition.y - ANIMATION_PARAMS.CYLINDER_CLICK_OFFSET;
            new TWEEN.Tween(this.clickableObject.position)
                .to({ y: targetY }, ANIMATION_PARAMS.CYLINDER_ANIMATION_DURATION)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onComplete(() => {
                    new TWEEN.Tween(this.clickableObject!.position)
                        .to({ y: this.initialCylinderPosition.y }, ANIMATION_PARAMS.CYLINDER_ANIMATION_DURATION)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .onComplete(() => {
                            this.startToneArmDownSequence();
                        })
                        .start();
                })
                .start();
        } else {
            this.startToneArmDownSequence();
        }
    }

    private pauseAnimation = () => {
        this.isPlaying = false;
        this.isRecordSpinning = false;

        TWEEN.removeAll();

        if (this.sound.isPlaying) {
            this.sound.pause();
        }

        this.resetToInitialState();
    }

    private resetToInitialState = () => {
        this.isAnimating = true;

        new TWEEN.Tween(this.toneArmNeedlePivot.rotation)
            .to({ z: 0 }, ANIMATION_PARAMS.TONEARM_RESET_DURATION)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(() => {
                new TWEEN.Tween(this.toneArmPivot.rotation)
                    .to({ y: 0 }, ANIMATION_PARAMS.TONEARM_RESET_DURATION)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .onComplete(() => {
                        this.isAnimating = false;
                    })
                    .start();
            })
            .start();

        if (this.clickableObject) {
            new TWEEN.Tween(this.clickableObject.position)
                .to({ y: this.initialCylinderPosition.y }, ANIMATION_PARAMS.CYLINDER_ANIMATION_DURATION)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start();
        }
    }

    private startToneArmDownSequence = () => {
        const initialYRotation = { y: this.toneArmPivot.rotation.y };
        const targetYRotation = { y: ANIMATION_PARAMS.TONEARM_INITIAL_Y_ROTATION };

        new TWEEN.Tween(initialYRotation)
            .to(targetYRotation, ANIMATION_PARAMS.TONEARM_Y_ANIMATION_DURATION)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                this.toneArmPivot.rotation.y = initialYRotation.y;
            })
            .onComplete(() => {
                this.startToneArmZRotation();
            })
            .start();
    }

    private startToneArmZRotation = () => {
        const initialZRotation = { z: this.toneArmNeedlePivot.rotation.z };
        const targetZRotation = { z: ANIMATION_PARAMS.TONEARM_Z_ROTATION };

        new TWEEN.Tween(initialZRotation)
            .to(targetZRotation, ANIMATION_PARAMS.TONEARM_Z_ANIMATION_DURATION)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                this.toneArmNeedlePivot.rotation.z = initialZRotation.z;
            })
            .onComplete(() => {
                this.isRecordSpinning = true;
                this.isAnimating = false;
                if (this.audioBuffer && !this.sound.isPlaying) {
                    this.sound.offset = 0;
                    this.sound.play();
                }
            })
            .start();
    }

    private resetAnimation = () => {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.isPlaying = false;
        this.isRecordSpinning = false;

        if (this.sound.isPlaying) {
            this.sound.stop();
        }

        new TWEEN.Tween(this.toneArmNeedlePivot.rotation)
            .to({ z: 0 }, ANIMATION_PARAMS.TONEARM_RESET_DURATION)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(() => {
                new TWEEN.Tween(this.toneArmPivot.rotation)
                    .to({ y: 0 }, ANIMATION_PARAMS.TONEARM_RESET_DURATION)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .onComplete(() => {
                        this.isAnimating = false;
                    })
                    .start();
            })
            .start();

        if (this.clickableObject) {
            new TWEEN.Tween(this.clickableObject.position)
                .to({ y: this.initialCylinderPosition.y }, ANIMATION_PARAMS.CYLINDER_ANIMATION_DURATION)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start();
        }
    }

    // ★ ウィンドウリサイズ時の処理を追加
    private onWindowResize = () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        this.camera.aspect = newWidth / newHeight; // カメラのアスペクト比を更新
        this.camera.updateProjectionMatrix();       // プロジェクション行列を更新

        this.renderer.setSize(newWidth, newHeight); // レンダラーのサイズを更新
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const container = new ThreeJSContainer();
    const viewport = container.createRendererDOM(new THREE.Vector3(7, 3, -2));
    document.body.appendChild(viewport);

    // Three.jsのCanvasがbodyいっぱいに広がるように、bodyとhtmlのデフォルトのマージンとパディングをリセットするCSσ
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden"; // スクロールバーが表示されないようにする
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";

    // ライセンス情報を表示するdiv要素
    const instructionDiv = document.createElement('div');
    instructionDiv.style.position = 'absolute';
    instructionDiv.style.bottom = '70px';
    instructionDiv.style.right = '10px';
    instructionDiv.style.color = 'white';
    instructionDiv.style.fontFamily = 'sans-serif';
    instructionDiv.style.fontSize = '24px';
    instructionDiv.style.textAlign = 'right';
    instructionDiv.innerHTML = '丸いボタンを押して再生';
    document.body.appendChild(instructionDiv);

    const creditDiv = document.createElement('div');
    creditDiv.style.position = 'absolute';
    creditDiv.style.bottom = '10px';
    creditDiv.style.right = '10px';
    creditDiv.style.color = 'white';
    creditDiv.style.fontFamily = 'sans-serif';
    creditDiv.style.fontSize = '12px';
    creditDiv.style.textAlign = 'right';
    creditDiv.innerHTML = `
        "Record Player" by KurusuYoh  License:CC BY-NC<br>
        Music: Music by <a href="https://pixabay.com/ja/users/harumachimusic-13470593/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=237449">Noru</a> from <a href="https://pixabay.com/music//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=237449">Pixabay</a>
    `;
    document.body.appendChild(creditDiv);
});
