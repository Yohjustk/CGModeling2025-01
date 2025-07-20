/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/app.ts":
/*!********************!*\
  !*** ./src/app.ts ***!
  \********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var three_examples_jsm_controls_OrbitControls__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! three/examples/jsm/controls/OrbitControls */ "./node_modules/three/examples/jsm/controls/OrbitControls.js");
/* harmony import */ var three_examples_jsm_loaders_GLTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! three/examples/jsm/loaders/GLTFLoader */ "./node_modules/three/examples/jsm/loaders/GLTFLoader.js");
/* harmony import */ var _tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @tweenjs/tween.js */ "./node_modules/@tweenjs/tween.js/dist/tween.esm.js");




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
    scene;
    renderer;
    camera;
    glbModel;
    clickableObject = null;
    toneArmPivot;
    toneArmNeedlePivot;
    record = null;
    isAnimating = false;
    isRecordSpinning = false;
    isPlaying = false;
    raycaster = new three__WEBPACK_IMPORTED_MODULE_3__.Raycaster();
    mouse = new three__WEBPACK_IMPORTED_MODULE_3__.Vector2();
    listener;
    sound;
    audioBuffer = null;
    spotLight;
    spotLightTarget;
    initialCylinderPosition = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3();
    constructor() {
        this.toneArmPivot = new three__WEBPACK_IMPORTED_MODULE_3__.Group();
        this.toneArmNeedlePivot = new three__WEBPACK_IMPORTED_MODULE_3__.Group();
        this.spotLightTarget = new three__WEBPACK_IMPORTED_MODULE_3__.Object3D();
        this.listener = new three__WEBPACK_IMPORTED_MODULE_3__.AudioListener();
        this.sound = new three__WEBPACK_IMPORTED_MODULE_3__.Audio(this.listener);
    }
    createRendererDOM = (cameraPos) => {
        // ウィンドウの現在の幅と高さを取得
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer = new three__WEBPACK_IMPORTED_MODULE_3__.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(new three__WEBPACK_IMPORTED_MODULE_3__.Color(0x000000));
        this.renderer.outputEncoding = three__WEBPACK_IMPORTED_MODULE_3__.sRGBEncoding;
        this.renderer.toneMapping = three__WEBPACK_IMPORTED_MODULE_3__.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = three__WEBPACK_IMPORTED_MODULE_3__.PCFSoftShadowMap;
        this.camera = new three__WEBPACK_IMPORTED_MODULE_3__.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.copy(cameraPos);
        this.camera.lookAt(new three__WEBPACK_IMPORTED_MODULE_3__.Vector3(0, 0, 0));
        this.camera.add(this.listener);
        const orbitControls = new three_examples_jsm_controls_OrbitControls__WEBPACK_IMPORTED_MODULE_0__.OrbitControls(this.camera, this.renderer.domElement);
        orbitControls.enableDamping = true;
        orbitControls.dampingFactor = 0.05;
        this.createScene();
        this.loadAudio();
        this.renderer.domElement.addEventListener('click', this.onMouseClick, false);
        // ウィンドウのリサイズイベントリスナー
        window.addEventListener('resize', this.onWindowResize, false);
        const render = () => {
            orbitControls.update();
            _tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.update();
            if (this.record && this.isRecordSpinning) {
                this.record.rotation.y -= ANIMATION_PARAMS.RECORD_ROTATION_SPEED;
                if (this.isPlaying && this.audioBuffer && this.sound.isPlaying) {
                    const elapsed = this.sound.context.currentTime - this.sound.playbackRate * this.sound.offset;
                    const progress = elapsed / this.audioBuffer.duration;
                    if (progress < 1.0) {
                        const targetYRotation = ANIMATION_PARAMS.TONEARM_INITIAL_Y_ROTATION + ANIMATION_PARAMS.TONEARM_PLAY_Y_ROTATION_RANGE * progress;
                        this.toneArmPivot.rotation.y = targetYRotation;
                    }
                    else if (progress >= 1.0 && !this.isAnimating) {
                        this.resetAnimation();
                    }
                }
            }
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
        return this.renderer.domElement;
    };
    createScene = () => {
        this.scene = new three__WEBPACK_IMPORTED_MODULE_3__.Scene();
        this.scene.background = new three__WEBPACK_IMPORTED_MODULE_3__.Color(0x000000);
        const hemisphereLight = new three__WEBPACK_IMPORTED_MODULE_3__.HemisphereLight(0xffffff, 0x8d8d8d, 0.1);
        this.scene.add(hemisphereLight);
        const textureLoader = new three__WEBPACK_IMPORTED_MODULE_3__.TextureLoader();
        textureLoader.load('./assets/Textures/disturb.jpg', () => {
            console.log("Spotlight texture loaded (map property no longer directly supported for SpotLight).");
            this.setupSpotLight();
        }, undefined, (error) => {
            console.error('An error occurred loading spotlight texture:', error);
            this.setupSpotLight();
        });
        const gltfLoadingManager = new three__WEBPACK_IMPORTED_MODULE_3__.LoadingManager(() => {
            if (this.glbModel) {
                this.scene.add(this.glbModel);
                this.glbModel.traverse((child) => {
                    if (child instanceof three__WEBPACK_IMPORTED_MODULE_3__.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
            }
        });
        const gltfLoader = new three_examples_jsm_loaders_GLTFLoader__WEBPACK_IMPORTED_MODULE_1__.GLTFLoader(gltfLoadingManager);
        gltfLoader.setPath('./assets/');
        gltfLoader.load('RecordPlayer01.glb', (gltf) => {
            this.glbModel = gltf.scene;
            const toneArmYRotationPartNames = ['antishake001', 'tonearm001', 'Cube001', 'Cube002'];
            const toneArmXRotationPartNames = ['tonearm001', 'Cube001', 'Cube002'];
            const toneArmYRotationParts = [];
            const toneArmXRotationParts = [];
            let antishakeObject = null;
            let tonearmObject = null;
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
                        if (child instanceof three__WEBPACK_IMPORTED_MODULE_3__.Mesh) {
                            // ガラスマテリアル
                            const glassMat = new three__WEBPACK_IMPORTED_MODULE_3__.MeshPhysicalMaterial({});
                            glassMat.color = new three__WEBPACK_IMPORTED_MODULE_3__.Color(0xffffff);
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
                const worldPosition = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3();
                antishakeObject.getWorldPosition(worldPosition);
                this.toneArmPivot.position.copy(worldPosition);
                toneArmYRotationParts.forEach(part => {
                    this.toneArmPivot.attach(part);
                });
                antishakeObject.position.set(0, 0, 0);
            }
            else {
                console.warn("Could not find 'antishake001' to set Y-axis pivot point for tonearm.");
            }
            if (tonearmObject) {
                this.toneArmPivot.add(this.toneArmNeedlePivot);
                this.toneArmNeedlePivot.position.copy(tonearmObject.position);
                toneArmXRotationParts.forEach(part => {
                    this.toneArmNeedlePivot.attach(part);
                });
                tonearmObject.position.set(0, 0, 0);
            }
            else {
                console.warn("Could not find 'tonearm001' to set X-axis pivot point for tonearm.");
            }
            this.glbModel.scale.set(10, 10, 10);
            this.glbModel.position.set(0, -1, 0);
        }, (xhr) => {
            console.log(`GLB model ${(xhr.loaded / xhr.total * 100)}% loaded`);
        }, (error) => {
            console.error('An error occurred while loading the GLB model:', error);
        });
        const floorGeometry = new three__WEBPACK_IMPORTED_MODULE_3__.PlaneGeometry(100, 100);
        const floorMaterial = new three__WEBPACK_IMPORTED_MODULE_3__.MeshStandardMaterial({ color: 0x404040, roughness: 0.8, metalness: 0.2 });
        const floorMesh = new three__WEBPACK_IMPORTED_MODULE_3__.Mesh(floorGeometry, floorMaterial);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.y = -1;
        floorMesh.receiveShadow = true;
        this.scene.add(floorMesh);
    };
    setupSpotLight = () => {
        if (this.spotLight) {
            this.scene.remove(this.spotLight);
        }
        this.spotLight = new three__WEBPACK_IMPORTED_MODULE_3__.SpotLight(0xffffff, 20);
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
    };
    loadAudio = () => {
        const audioLoader = new three__WEBPACK_IMPORTED_MODULE_3__.AudioLoader();
        audioLoader.load('./assets/teardrop-calm-reflective-piano-237449.mp3', (buffer) => {
            this.audioBuffer = buffer;
            this.sound.setBuffer(buffer);
            this.sound.setLoop(true);
            this.sound.setVolume(0.5);
            console.log("Audio loaded successfully.");
        }, (xhr) => {
            console.log(`Audio ${(xhr.loaded / xhr.total * 100)}% loaded`);
        }, (error) => {
            console.error('An error occurred while loading the audio:', error);
        });
    };
    onMouseClick = (event) => {
        if (!this.listener.context.state || this.listener.context.state === 'suspended') {
            this.listener.context.resume().then(() => {
                console.log('AudioContext resumed!');
                this.handleAnimationClick(event);
            });
        }
        else {
            this.handleAnimationClick(event);
        }
    };
    handleAnimationClick = (event) => {
        const bounds = event.target.getBoundingClientRect();
        this.mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        this.mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        if (this.clickableObject) {
            const intersects = this.raycaster.intersectObject(this.clickableObject, true);
            if (intersects.length > 0) {
                this.togglePlayState();
            }
        }
    };
    togglePlayState = () => {
        if (this.isAnimating)
            return;
        if (this.isPlaying) {
            this.pauseAnimation();
        }
        else {
            this.startPlayAnimation();
        }
    };
    startPlayAnimation = () => {
        this.isPlaying = true;
        this.isAnimating = true;
        this.isRecordSpinning = false;
        if (this.clickableObject) {
            const targetY = this.initialCylinderPosition.y - ANIMATION_PARAMS.CYLINDER_CLICK_OFFSET;
            new _tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Tween(this.clickableObject.position)
                .to({ y: targetY }, ANIMATION_PARAMS.CYLINDER_ANIMATION_DURATION)
                .easing(_tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Easing.Quadratic.Out)
                .onComplete(() => {
                new _tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Tween(this.clickableObject.position)
                    .to({ y: this.initialCylinderPosition.y }, ANIMATION_PARAMS.CYLINDER_ANIMATION_DURATION)
                    .easing(_tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Easing.Quadratic.Out)
                    .onComplete(() => {
                    this.startToneArmDownSequence();
                })
                    .start();
            })
                .start();
        }
        else {
            this.startToneArmDownSequence();
        }
    };
    pauseAnimation = () => {
        this.isPlaying = false;
        this.isRecordSpinning = false;
        _tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.removeAll();
        if (this.sound.isPlaying) {
            this.sound.pause();
        }
        this.resetToInitialState();
    };
    resetToInitialState = () => {
        this.isAnimating = true;
        new _tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Tween(this.toneArmNeedlePivot.rotation)
            .to({ z: 0 }, ANIMATION_PARAMS.TONEARM_RESET_DURATION)
            .easing(_tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Easing.Quadratic.Out)
            .onComplete(() => {
            new _tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Tween(this.toneArmPivot.rotation)
                .to({ y: 0 }, ANIMATION_PARAMS.TONEARM_RESET_DURATION)
                .easing(_tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Easing.Quadratic.Out)
                .onComplete(() => {
                this.isAnimating = false;
            })
                .start();
        })
            .start();
        if (this.clickableObject) {
            new _tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Tween(this.clickableObject.position)
                .to({ y: this.initialCylinderPosition.y }, ANIMATION_PARAMS.CYLINDER_ANIMATION_DURATION)
                .easing(_tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Easing.Quadratic.Out)
                .start();
        }
    };
    startToneArmDownSequence = () => {
        const initialYRotation = { y: this.toneArmPivot.rotation.y };
        const targetYRotation = { y: ANIMATION_PARAMS.TONEARM_INITIAL_Y_ROTATION };
        new _tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Tween(initialYRotation)
            .to(targetYRotation, ANIMATION_PARAMS.TONEARM_Y_ANIMATION_DURATION)
            .easing(_tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Easing.Quadratic.Out)
            .onUpdate(() => {
            this.toneArmPivot.rotation.y = initialYRotation.y;
        })
            .onComplete(() => {
            this.startToneArmZRotation();
        })
            .start();
    };
    startToneArmZRotation = () => {
        const initialZRotation = { z: this.toneArmNeedlePivot.rotation.z };
        const targetZRotation = { z: ANIMATION_PARAMS.TONEARM_Z_ROTATION };
        new _tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Tween(initialZRotation)
            .to(targetZRotation, ANIMATION_PARAMS.TONEARM_Z_ANIMATION_DURATION)
            .easing(_tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Easing.Quadratic.Out)
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
    };
    resetAnimation = () => {
        if (this.isAnimating)
            return;
        this.isAnimating = true;
        this.isPlaying = false;
        this.isRecordSpinning = false;
        if (this.sound.isPlaying) {
            this.sound.stop();
        }
        new _tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Tween(this.toneArmNeedlePivot.rotation)
            .to({ z: 0 }, ANIMATION_PARAMS.TONEARM_RESET_DURATION)
            .easing(_tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Easing.Quadratic.Out)
            .onComplete(() => {
            new _tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Tween(this.toneArmPivot.rotation)
                .to({ y: 0 }, ANIMATION_PARAMS.TONEARM_RESET_DURATION)
                .easing(_tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Easing.Quadratic.Out)
                .onComplete(() => {
                this.isAnimating = false;
            })
                .start();
        })
            .start();
        if (this.clickableObject) {
            new _tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Tween(this.clickableObject.position)
                .to({ y: this.initialCylinderPosition.y }, ANIMATION_PARAMS.CYLINDER_ANIMATION_DURATION)
                .easing(_tweenjs_tween_js__WEBPACK_IMPORTED_MODULE_2__.Easing.Quadratic.Out)
                .start();
        }
    };
    // ★ ウィンドウリサイズ時の処理を追加
    onWindowResize = () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        this.camera.aspect = newWidth / newHeight; // カメラのアスペクト比を更新
        this.camera.updateProjectionMatrix(); // プロジェクション行列を更新
        this.renderer.setSize(newWidth, newHeight); // レンダラーのサイズを更新
    };
}
window.addEventListener("DOMContentLoaded", () => {
    const container = new ThreeJSContainer();
    const viewport = container.createRendererDOM(new three__WEBPACK_IMPORTED_MODULE_3__.Vector3(7, 3, -2));
    document.body.appendChild(viewport);
    // Three.jsのCanvasがbodyいっぱいに広がるように、bodyとhtmlのデフォルトのマージンとパディングをリセットするCSσ
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden"; // スクロールバーが表示されないようにする
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    // ライセンス情報を表示するdiv要
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


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"main": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkcgprendering"] = self["webpackChunkcgprendering"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["vendors-node_modules_tweenjs_tween_js_dist_tween_esm_js-node_modules_three_examples_jsm_contr-84be97"], () => (__webpack_require__("./src/app.ts")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsTUFBTSxxQkFBcUI7V0FDM0I7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTs7V0FFQTtXQUNBO1dBQ0E7Ozs7O1VFaERBO1VBQ0E7VUFDQTtVQUNBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jZ3ByZW5kZXJpbmcvLi9zcmMvYXBwLnRzIiwid2VicGFjazovL2NncHJlbmRlcmluZy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9jZ3ByZW5kZXJpbmcvd2VicGFjay9ydW50aW1lL2NodW5rIGxvYWRlZCIsIndlYnBhY2s6Ly9jZ3ByZW5kZXJpbmcvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2NncHJlbmRlcmluZy93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2NncHJlbmRlcmluZy93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2NncHJlbmRlcmluZy93ZWJwYWNrL3J1bnRpbWUvanNvbnAgY2h1bmsgbG9hZGluZyIsIndlYnBhY2s6Ly9jZ3ByZW5kZXJpbmcvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9jZ3ByZW5kZXJpbmcvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL2NncHJlbmRlcmluZy93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSBcInRocmVlXCI7XG5pbXBvcnQgeyBPcmJpdENvbnRyb2xzIH0gZnJvbSBcInRocmVlL2V4YW1wbGVzL2pzbS9jb250cm9scy9PcmJpdENvbnRyb2xzXCI7XG5pbXBvcnQgeyBHTFRGTG9hZGVyIH0gZnJvbSBcInRocmVlL2V4YW1wbGVzL2pzbS9sb2FkZXJzL0dMVEZMb2FkZXJcIjtcbmltcG9ydCAqIGFzIFRXRUVOIGZyb20gXCJAdHdlZW5qcy90d2Vlbi5qc1wiO1xuXG5jb25zdCBBTklNQVRJT05fUEFSQU1TID0ge1xuICAgIENZTElOREVSX0NMSUNLX09GRlNFVDogMC4wMSxcbiAgICBDWUxJTkRFUl9BTklNQVRJT05fRFVSQVRJT046IDQ1MCxcblxuICAgIFRPTkVBUk1fSU5JVElBTF9ZX1JPVEFUSU9OOiAtMjAgKiAoTWF0aC5QSSAvIDE4MCksXG4gICAgVE9ORUFSTV9aX1JPVEFUSU9OOiAtMy43NSAqIChNYXRoLlBJIC8gMTgwKSxcbiAgICBUT05FQVJNX1lfQU5JTUFUSU9OX0RVUkFUSU9OOiAxNTAwLFxuICAgIFRPTkVBUk1fWl9BTklNQVRJT05fRFVSQVRJT046IDUwMCxcblxuICAgIFJFQ09SRF9ST1RBVElPTl9TUEVFRDogMC4wMSxcblxuICAgIFRPTkVBUk1fUExBWV9ZX1JPVEFUSU9OX1JBTkdFOiAtMTggKiAoTWF0aC5QSSAvIDE4MCksXG4gICAgVE9ORUFSTV9SRVNFVF9EVVJBVElPTjogMTAwMCxcbn07XG5cbmNsYXNzIFRocmVlSlNDb250YWluZXIge1xuICAgIHByaXZhdGUgc2NlbmU6IFRIUkVFLlNjZW5lO1xuICAgIHByaXZhdGUgcmVuZGVyZXI6IFRIUkVFLldlYkdMUmVuZGVyZXI7XG4gICAgcHJpdmF0ZSBjYW1lcmE6IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhO1xuICAgIHByaXZhdGUgZ2xiTW9kZWw/OiBUSFJFRS5Hcm91cDtcblxuICAgIHByaXZhdGUgY2xpY2thYmxlT2JqZWN0OiBUSFJFRS5PYmplY3QzRCB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgdG9uZUFybVBpdm90OiBUSFJFRS5Hcm91cDtcbiAgICBwcml2YXRlIHRvbmVBcm1OZWVkbGVQaXZvdDogVEhSRUUuR3JvdXA7XG4gICAgcHJpdmF0ZSByZWNvcmQ6IFRIUkVFLk9iamVjdDNEIHwgbnVsbCA9IG51bGw7XG5cbiAgICBwcml2YXRlIGlzQW5pbWF0aW5nOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBpc1JlY29yZFNwaW5uaW5nOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBpc1BsYXlpbmc6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIHByaXZhdGUgcmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuICAgIHByaXZhdGUgbW91c2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuXG4gICAgcHJpdmF0ZSBsaXN0ZW5lcjogVEhSRUUuQXVkaW9MaXN0ZW5lcjtcbiAgICBwcml2YXRlIHNvdW5kOiBUSFJFRS5BdWRpbztcbiAgICBwcml2YXRlIGF1ZGlvQnVmZmVyOiBBdWRpb0J1ZmZlciB8IG51bGwgPSBudWxsO1xuXG4gICAgcHJpdmF0ZSBzcG90TGlnaHQ6IFRIUkVFLlNwb3RMaWdodDtcbiAgICBwcml2YXRlIHNwb3RMaWdodFRhcmdldDogVEhSRUUuT2JqZWN0M0Q7XG5cbiAgICBwcml2YXRlIGluaXRpYWxDeWxpbmRlclBvc2l0aW9uOiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnRvbmVBcm1QaXZvdCA9IG5ldyBUSFJFRS5Hcm91cCgpO1xuICAgICAgICB0aGlzLnRvbmVBcm1OZWVkbGVQaXZvdCA9IG5ldyBUSFJFRS5Hcm91cCgpO1xuICAgICAgICB0aGlzLnNwb3RMaWdodFRhcmdldCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSBuZXcgVEhSRUUuQXVkaW9MaXN0ZW5lcigpO1xuICAgICAgICB0aGlzLnNvdW5kID0gbmV3IFRIUkVFLkF1ZGlvKHRoaXMubGlzdGVuZXIpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVSZW5kZXJlckRPTSA9IChjYW1lcmFQb3M6IFRIUkVFLlZlY3RvcjMpID0+IHtcbiAgICAgICAgLy8g44Km44Kj44Oz44OJ44Km44Gu54++5Zyo44Gu5bmF44Go6auY44GV44KS5Y+W5b6XXG4gICAgICAgIGNvbnN0IHdpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblxuICAgICAgICB0aGlzLnJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoeyBhbnRpYWxpYXM6IHRydWUgfSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRDbGVhckNvbG9yKG5ldyBUSFJFRS5Db2xvcigweDAwMDAwMCkpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLm91dHB1dEVuY29kaW5nID0gVEhSRUUuc1JHQkVuY29kaW5nO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnRvbmVNYXBwaW5nID0gVEhSRUUuQUNFU0ZpbG1pY1RvbmVNYXBwaW5nO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnRvbmVNYXBwaW5nRXhwb3N1cmUgPSAxLjA7XG5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zaGFkb3dNYXAuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2hhZG93TWFwLnR5cGUgPSBUSFJFRS5QQ0ZTb2Z0U2hhZG93TWFwO1xuXG4gICAgICAgIHRoaXMuY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDc1LCB3aWR0aCAvIGhlaWdodCwgMC4xLCAxMDAwKTtcbiAgICAgICAgdGhpcy5jYW1lcmEucG9zaXRpb24uY29weShjYW1lcmFQb3MpO1xuICAgICAgICB0aGlzLmNhbWVyYS5sb29rQXQobmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMCkpO1xuICAgICAgICB0aGlzLmNhbWVyYS5hZGQodGhpcy5saXN0ZW5lcik7XG5cbiAgICAgICAgY29uc3Qgb3JiaXRDb250cm9scyA9IG5ldyBPcmJpdENvbnRyb2xzKHRoaXMuY2FtZXJhLCB0aGlzLnJlbmRlcmVyLmRvbUVsZW1lbnQpO1xuICAgICAgICBvcmJpdENvbnRyb2xzLmVuYWJsZURhbXBpbmcgPSB0cnVlO1xuICAgICAgICBvcmJpdENvbnRyb2xzLmRhbXBpbmdGYWN0b3IgPSAwLjA1O1xuXG4gICAgICAgIHRoaXMuY3JlYXRlU2NlbmUoKTtcbiAgICAgICAgdGhpcy5sb2FkQXVkaW8oKTtcblxuICAgICAgICB0aGlzLnJlbmRlcmVyLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uTW91c2VDbGljaywgZmFsc2UpO1xuXG4gICAgICAgIC8vIOOCpuOCo+ODs+ODieOCpuOBruODquOCteOCpOOCuuOCpOODmeODs+ODiOODquOCueODiuODvFxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5vbldpbmRvd1Jlc2l6ZSwgZmFsc2UpO1xuXG4gICAgICAgIGNvbnN0IHJlbmRlcjogRnJhbWVSZXF1ZXN0Q2FsbGJhY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICBvcmJpdENvbnRyb2xzLnVwZGF0ZSgpO1xuICAgICAgICAgICAgVFdFRU4udXBkYXRlKCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnJlY29yZCAmJiB0aGlzLmlzUmVjb3JkU3Bpbm5pbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlY29yZC5yb3RhdGlvbi55IC09IEFOSU1BVElPTl9QQVJBTVMuUkVDT1JEX1JPVEFUSU9OX1NQRUVEO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNQbGF5aW5nICYmIHRoaXMuYXVkaW9CdWZmZXIgJiYgdGhpcy5zb3VuZC5pc1BsYXlpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxhcHNlZCA9IHRoaXMuc291bmQuY29udGV4dC5jdXJyZW50VGltZSAtIHRoaXMuc291bmQucGxheWJhY2tSYXRlICogdGhpcy5zb3VuZC5vZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2dyZXNzID0gZWxhcHNlZCAvIHRoaXMuYXVkaW9CdWZmZXIuZHVyYXRpb247XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2dyZXNzIDwgMS4wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRZUm90YXRpb24gPSBBTklNQVRJT05fUEFSQU1TLlRPTkVBUk1fSU5JVElBTF9ZX1JPVEFUSU9OICsgQU5JTUFUSU9OX1BBUkFNUy5UT05FQVJNX1BMQVlfWV9ST1RBVElPTl9SQU5HRSAqIHByb2dyZXNzO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b25lQXJtUGl2b3Qucm90YXRpb24ueSA9IHRhcmdldFlSb3RhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9ncmVzcyA+PSAxLjAgJiYgIXRoaXMuaXNBbmltYXRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzZXRBbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5yZW5kZXIodGhpcy5zY2VuZSwgdGhpcy5jYW1lcmEpO1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG4gICAgICAgIH1cbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucmVuZGVyZXIuZG9tRWxlbWVudDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNyZWF0ZVNjZW5lID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gICAgICAgIHRoaXMuc2NlbmUuYmFja2dyb3VuZCA9IG5ldyBUSFJFRS5Db2xvcigweDAwMDAwMCk7XG5cbiAgICAgICAgY29uc3QgaGVtaXNwaGVyZUxpZ2h0ID0gbmV3IFRIUkVFLkhlbWlzcGhlcmVMaWdodCgweGZmZmZmZiwgMHg4ZDhkOGQsIDAuMSk7XG4gICAgICAgIHRoaXMuc2NlbmUuYWRkKGhlbWlzcGhlcmVMaWdodCk7XG5cbiAgICAgICAgY29uc3QgdGV4dHVyZUxvYWRlciA9IG5ldyBUSFJFRS5UZXh0dXJlTG9hZGVyKCk7XG4gICAgICAgIHRleHR1cmVMb2FkZXIubG9hZCgnLi9hc3NldHMvVGV4dHVyZXMvZGlzdHVyYi5qcGcnLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlNwb3RsaWdodCB0ZXh0dXJlIGxvYWRlZCAobWFwIHByb3BlcnR5IG5vIGxvbmdlciBkaXJlY3RseSBzdXBwb3J0ZWQgZm9yIFNwb3RMaWdodCkuXCIpO1xuICAgICAgICAgICAgdGhpcy5zZXR1cFNwb3RMaWdodCgpO1xuICAgICAgICB9LCB1bmRlZmluZWQsIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignQW4gZXJyb3Igb2NjdXJyZWQgbG9hZGluZyBzcG90bGlnaHQgdGV4dHVyZTonLCBlcnJvcik7XG4gICAgICAgICAgICB0aGlzLnNldHVwU3BvdExpZ2h0KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGdsdGZMb2FkaW5nTWFuYWdlciA9IG5ldyBUSFJFRS5Mb2FkaW5nTWFuYWdlcigoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5nbGJNb2RlbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2NlbmUuYWRkKHRoaXMuZ2xiTW9kZWwpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2xiTW9kZWwudHJhdmVyc2UoKGNoaWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIFRIUkVFLk1lc2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLmNhc3RTaGFkb3cgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQucmVjZWl2ZVNoYWRvdyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgZ2x0ZkxvYWRlciA9IG5ldyBHTFRGTG9hZGVyKGdsdGZMb2FkaW5nTWFuYWdlcik7XG5cbiAgICAgICAgZ2x0ZkxvYWRlci5zZXRQYXRoKCcuL2Fzc2V0cy8nKTtcbiAgICAgICAgZ2x0ZkxvYWRlci5sb2FkKFxuICAgICAgICAgICAgJ1JlY29yZFBsYXllcjAxLmdsYicsXG4gICAgICAgICAgICAoZ2x0ZikgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2xiTW9kZWwgPSBnbHRmLnNjZW5lO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgdG9uZUFybVlSb3RhdGlvblBhcnROYW1lcyA9IFsnYW50aXNoYWtlMDAxJywgJ3RvbmVhcm0wMDEnLCAnQ3ViZTAwMScsICdDdWJlMDAyJ107XG4gICAgICAgICAgICAgICAgY29uc3QgdG9uZUFybVhSb3RhdGlvblBhcnROYW1lcyA9IFsndG9uZWFybTAwMScsICdDdWJlMDAxJywgJ0N1YmUwMDInXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHRvbmVBcm1ZUm90YXRpb25QYXJ0czogVEhSRUUuT2JqZWN0M0RbXSA9IFtdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvbmVBcm1YUm90YXRpb25QYXJ0czogVEhSRUUuT2JqZWN0M0RbXSA9IFtdO1xuXG4gICAgICAgICAgICAgICAgbGV0IGFudGlzaGFrZU9iamVjdDogVEhSRUUuT2JqZWN0M0QgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICAgICAgICBsZXQgdG9uZWFybU9iamVjdDogVEhSRUUuT2JqZWN0M0QgfCBudWxsID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIHRoaXMuZ2xiTW9kZWwudHJhdmVyc2UoKGNoaWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoY2hpbGQubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnQ3lsaW5kZXIwMDInOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xpY2thYmxlT2JqZWN0ID0gY2hpbGQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbml0aWFsQ3lsaW5kZXJQb3NpdGlvbi5jb3B5KGNoaWxkLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3JlY29yZDAwMSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWNvcmQgPSBjaGlsZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2Nhc2UwMDEnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIFRIUkVFLk1lc2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g44Ks44Op44K544Oe44OG44Oq44Ki44OrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdsYXNzTWF0ID0gbmV3IFRIUkVFLk1lc2hQaHlzaWNhbE1hdGVyaWFsKHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2xhc3NNYXQuY29sb3IgPSBuZXcgVEhSRUUuQ29sb3IoMHhmZmZmZmYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbGFzc01hdC50cmFuc21pc3Npb24gPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbGFzc01hdC5tZXRhbG5lc3MgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbGFzc01hdC5yb3VnaG5lc3MgPSAwLjAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbGFzc01hdC5pb3IgPSAxLjU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdsYXNzTWF0LnRoaWNrbmVzcyA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdsYXNzTWF0LnNwZWN1bGFySW50ZW5zaXR5ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQubWF0ZXJpYWwgPSBnbGFzc01hdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodG9uZUFybVlSb3RhdGlvblBhcnROYW1lcy5pbmNsdWRlcyhjaGlsZC5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9uZUFybVlSb3RhdGlvblBhcnRzLnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0b25lQXJtWFJvdGF0aW9uUGFydE5hbWVzLmluY2x1ZGVzKGNoaWxkLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b25lQXJtWFJvdGF0aW9uUGFydHMucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLm5hbWUgPT09ICdhbnRpc2hha2UwMDEnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbnRpc2hha2VPYmplY3QgPSBjaGlsZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQubmFtZSA9PT0gJ3RvbmVhcm0wMDEnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b25lYXJtT2JqZWN0ID0gY2hpbGQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmIChhbnRpc2hha2VPYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nbGJNb2RlbC5hZGQodGhpcy50b25lQXJtUGl2b3QpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB3b3JsZFBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICAgICAgICAgICAgICAgICAgYW50aXNoYWtlT2JqZWN0LmdldFdvcmxkUG9zaXRpb24od29ybGRQb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9uZUFybVBpdm90LnBvc2l0aW9uLmNvcHkod29ybGRQb3NpdGlvbik7XG5cbiAgICAgICAgICAgICAgICAgICAgdG9uZUFybVlSb3RhdGlvblBhcnRzLmZvckVhY2gocGFydCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvbmVBcm1QaXZvdC5hdHRhY2gocGFydCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBhbnRpc2hha2VPYmplY3QucG9zaXRpb24uc2V0KDAsIDAsIDApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkNvdWxkIG5vdCBmaW5kICdhbnRpc2hha2UwMDEnIHRvIHNldCBZLWF4aXMgcGl2b3QgcG9pbnQgZm9yIHRvbmVhcm0uXCIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0b25lYXJtT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9uZUFybVBpdm90LmFkZCh0aGlzLnRvbmVBcm1OZWVkbGVQaXZvdCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9uZUFybU5lZWRsZVBpdm90LnBvc2l0aW9uLmNvcHkodG9uZWFybU9iamVjdC5wb3NpdGlvbik7XG5cbiAgICAgICAgICAgICAgICAgICAgdG9uZUFybVhSb3RhdGlvblBhcnRzLmZvckVhY2gocGFydCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvbmVBcm1OZWVkbGVQaXZvdC5hdHRhY2gocGFydCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB0b25lYXJtT2JqZWN0LnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJDb3VsZCBub3QgZmluZCAndG9uZWFybTAwMScgdG8gc2V0IFgtYXhpcyBwaXZvdCBwb2ludCBmb3IgdG9uZWFybS5cIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5nbGJNb2RlbC5zY2FsZS5zZXQoMTAsIDEwLCAxMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5nbGJNb2RlbC5wb3NpdGlvbi5zZXQoMCwgLTEsIDApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICh4aHIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgR0xCIG1vZGVsICR7KHhoci5sb2FkZWQgLyB4aHIudG90YWwgKiAxMDApfSUgbG9hZGVkYCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignQW4gZXJyb3Igb2NjdXJyZWQgd2hpbGUgbG9hZGluZyB0aGUgR0xCIG1vZGVsOicsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBmbG9vckdlb21ldHJ5ID0gbmV3IFRIUkVFLlBsYW5lR2VvbWV0cnkoIDEwMCwgMTAwICk7XG4gICAgICAgIGNvbnN0IGZsb29yTWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaFN0YW5kYXJkTWF0ZXJpYWwoIHsgY29sb3I6IDB4NDA0MDQwLCByb3VnaG5lc3M6IDAuOCwgbWV0YWxuZXNzOiAwLjIgfSApO1xuICAgICAgICBjb25zdCBmbG9vck1lc2ggPSBuZXcgVEhSRUUuTWVzaCggZmxvb3JHZW9tZXRyeSwgZmxvb3JNYXRlcmlhbCApO1xuICAgICAgICBmbG9vck1lc2gucm90YXRpb24ueCA9IC0gTWF0aC5QSSAvIDI7XG4gICAgICAgIGZsb29yTWVzaC5wb3NpdGlvbi55ID0gLTE7XG4gICAgICAgIGZsb29yTWVzaC5yZWNlaXZlU2hhZG93ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5zY2VuZS5hZGQoIGZsb29yTWVzaCApO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0dXBTcG90TGlnaHQgPSAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnNwb3RMaWdodCkge1xuICAgICAgICAgICAgdGhpcy5zY2VuZS5yZW1vdmUodGhpcy5zcG90TGlnaHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zcG90TGlnaHQgPSBuZXcgVEhSRUUuU3BvdExpZ2h0KDB4ZmZmZmZmLCAyMCk7XG4gICAgICAgIHRoaXMuc3BvdExpZ2h0LnBvc2l0aW9uLnNldCg1LCAxMCwgLTYpO1xuICAgICAgICB0aGlzLnNwb3RMaWdodFRhcmdldC5wb3NpdGlvbi5zZXQoMSwgMCwgLTEpO1xuICAgICAgICB0aGlzLnNjZW5lLmFkZCh0aGlzLnNwb3RMaWdodFRhcmdldCk7XG4gICAgICAgIHRoaXMuc3BvdExpZ2h0LnRhcmdldCA9IHRoaXMuc3BvdExpZ2h0VGFyZ2V0O1xuICAgICAgICB0aGlzLnNwb3RMaWdodC5hbmdsZSA9IE1hdGguUEkgLyAxMDtcbiAgICAgICAgdGhpcy5zcG90TGlnaHQucGVudW1icmEgPSAxO1xuICAgICAgICB0aGlzLnNwb3RMaWdodC5kZWNheSA9IDI7XG4gICAgICAgIHRoaXMuc3BvdExpZ2h0LmRpc3RhbmNlID0gMDtcblxuICAgICAgICB0aGlzLnNwb3RMaWdodC5jYXN0U2hhZG93ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5zcG90TGlnaHQuc2hhZG93Lm1hcFNpemUud2lkdGggPSAxMDI0O1xuICAgICAgICB0aGlzLnNwb3RMaWdodC5zaGFkb3cubWFwU2l6ZS5oZWlnaHQgPSAxMDI0O1xuICAgICAgICB0aGlzLnNwb3RMaWdodC5zaGFkb3cuY2FtZXJhLm5lYXIgPSAxO1xuICAgICAgICB0aGlzLnNwb3RMaWdodC5zaGFkb3cuY2FtZXJhLmZhciA9IDEwO1xuICAgICAgICB0aGlzLnNwb3RMaWdodC5zaGFkb3cuZm9jdXMgPSAxO1xuICAgICAgICB0aGlzLnNjZW5lLmFkZCh0aGlzLnNwb3RMaWdodCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBsb2FkQXVkaW8gPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGF1ZGlvTG9hZGVyID0gbmV3IFRIUkVFLkF1ZGlvTG9hZGVyKCk7XG4gICAgICAgIGF1ZGlvTG9hZGVyLmxvYWQoXG4gICAgICAgICAgICAnLi9hc3NldHMvdGVhcmRyb3AtY2FsbS1yZWZsZWN0aXZlLXBpYW5vLTIzNzQ0OS5tcDMnLFxuICAgICAgICAgICAgKGJ1ZmZlcikgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuYXVkaW9CdWZmZXIgPSBidWZmZXI7XG4gICAgICAgICAgICAgICAgdGhpcy5zb3VuZC5zZXRCdWZmZXIoYnVmZmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNvdW5kLnNldExvb3AodHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zb3VuZC5zZXRWb2x1bWUoMC41KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF1ZGlvIGxvYWRlZCBzdWNjZXNzZnVsbHkuXCIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICh4aHIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQXVkaW8gJHsoeGhyLmxvYWRlZCAvIHhoci50b3RhbCAqIDEwMCl9JSBsb2FkZWRgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdBbiBlcnJvciBvY2N1cnJlZCB3aGlsZSBsb2FkaW5nIHRoZSBhdWRpbzonLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbk1vdXNlQ2xpY2sgPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmxpc3RlbmVyLmNvbnRleHQuc3RhdGUgfHwgdGhpcy5saXN0ZW5lci5jb250ZXh0LnN0YXRlID09PSAnc3VzcGVuZGVkJykge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5jb250ZXh0LnJlc3VtZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpb0NvbnRleHQgcmVzdW1lZCEnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUFuaW1hdGlvbkNsaWNrKGV2ZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVBbmltYXRpb25DbGljayhldmVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGhhbmRsZUFuaW1hdGlvbkNsaWNrID0gKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IGJvdW5kcyA9IChldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICB0aGlzLm1vdXNlLnggPSAoKGV2ZW50LmNsaWVudFggLSBib3VuZHMubGVmdCkgLyBib3VuZHMud2lkdGgpICogMiAtIDE7XG4gICAgICAgIHRoaXMubW91c2UueSA9IC0oKGV2ZW50LmNsaWVudFkgLSBib3VuZHMudG9wKSAvIGJvdW5kcy5oZWlnaHQpICogMiArIDE7XG5cbiAgICAgICAgdGhpcy5yYXljYXN0ZXIuc2V0RnJvbUNhbWVyYSh0aGlzLm1vdXNlLCB0aGlzLmNhbWVyYSk7XG5cbiAgICAgICAgaWYgKHRoaXMuY2xpY2thYmxlT2JqZWN0KSB7XG4gICAgICAgICAgICBjb25zdCBpbnRlcnNlY3RzID0gdGhpcy5yYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0KHRoaXMuY2xpY2thYmxlT2JqZWN0LCB0cnVlKTtcblxuICAgICAgICAgICAgaWYgKGludGVyc2VjdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlUGxheVN0YXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHRvZ2dsZVBsYXlTdGF0ZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNBbmltYXRpbmcpIHJldHVybjtcblxuICAgICAgICBpZiAodGhpcy5pc1BsYXlpbmcpIHtcbiAgICAgICAgICAgIHRoaXMucGF1c2VBbmltYXRpb24oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRQbGF5QW5pbWF0aW9uKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXJ0UGxheUFuaW1hdGlvbiA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLmlzQW5pbWF0aW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pc1JlY29yZFNwaW5uaW5nID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKHRoaXMuY2xpY2thYmxlT2JqZWN0KSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRZID0gdGhpcy5pbml0aWFsQ3lsaW5kZXJQb3NpdGlvbi55IC0gQU5JTUFUSU9OX1BBUkFNUy5DWUxJTkRFUl9DTElDS19PRkZTRVQ7XG4gICAgICAgICAgICBuZXcgVFdFRU4uVHdlZW4odGhpcy5jbGlja2FibGVPYmplY3QucG9zaXRpb24pXG4gICAgICAgICAgICAgICAgLnRvKHsgeTogdGFyZ2V0WSB9LCBBTklNQVRJT05fUEFSQU1TLkNZTElOREVSX0FOSU1BVElPTl9EVVJBVElPTilcbiAgICAgICAgICAgICAgICAuZWFzaW5nKFRXRUVOLkVhc2luZy5RdWFkcmF0aWMuT3V0KVxuICAgICAgICAgICAgICAgIC5vbkNvbXBsZXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbmV3IFRXRUVOLlR3ZWVuKHRoaXMuY2xpY2thYmxlT2JqZWN0IS5wb3NpdGlvbilcbiAgICAgICAgICAgICAgICAgICAgICAgIC50byh7IHk6IHRoaXMuaW5pdGlhbEN5bGluZGVyUG9zaXRpb24ueSB9LCBBTklNQVRJT05fUEFSQU1TLkNZTElOREVSX0FOSU1BVElPTl9EVVJBVElPTilcbiAgICAgICAgICAgICAgICAgICAgICAgIC5lYXNpbmcoVFdFRU4uRWFzaW5nLlF1YWRyYXRpYy5PdXQpXG4gICAgICAgICAgICAgICAgICAgICAgICAub25Db21wbGV0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGFydFRvbmVBcm1Eb3duU2VxdWVuY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3RhcnQoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5zdGFydCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zdGFydFRvbmVBcm1Eb3duU2VxdWVuY2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgcGF1c2VBbmltYXRpb24gPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNSZWNvcmRTcGlubmluZyA9IGZhbHNlO1xuXG4gICAgICAgIFRXRUVOLnJlbW92ZUFsbCgpO1xuXG4gICAgICAgIGlmICh0aGlzLnNvdW5kLmlzUGxheWluZykge1xuICAgICAgICAgICAgdGhpcy5zb3VuZC5wYXVzZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZXNldFRvSW5pdGlhbFN0YXRlKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZXNldFRvSW5pdGlhbFN0YXRlID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmlzQW5pbWF0aW5nID0gdHJ1ZTtcblxuICAgICAgICBuZXcgVFdFRU4uVHdlZW4odGhpcy50b25lQXJtTmVlZGxlUGl2b3Qucm90YXRpb24pXG4gICAgICAgICAgICAudG8oeyB6OiAwIH0sIEFOSU1BVElPTl9QQVJBTVMuVE9ORUFSTV9SRVNFVF9EVVJBVElPTilcbiAgICAgICAgICAgIC5lYXNpbmcoVFdFRU4uRWFzaW5nLlF1YWRyYXRpYy5PdXQpXG4gICAgICAgICAgICAub25Db21wbGV0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgbmV3IFRXRUVOLlR3ZWVuKHRoaXMudG9uZUFybVBpdm90LnJvdGF0aW9uKVxuICAgICAgICAgICAgICAgICAgICAudG8oeyB5OiAwIH0sIEFOSU1BVElPTl9QQVJBTVMuVE9ORUFSTV9SRVNFVF9EVVJBVElPTilcbiAgICAgICAgICAgICAgICAgICAgLmVhc2luZyhUV0VFTi5FYXNpbmcuUXVhZHJhdGljLk91dClcbiAgICAgICAgICAgICAgICAgICAgLm9uQ29tcGxldGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pc0FuaW1hdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuc3RhcnQoKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhcnQoKTtcblxuICAgICAgICBpZiAodGhpcy5jbGlja2FibGVPYmplY3QpIHtcbiAgICAgICAgICAgIG5ldyBUV0VFTi5Ud2Vlbih0aGlzLmNsaWNrYWJsZU9iamVjdC5wb3NpdGlvbilcbiAgICAgICAgICAgICAgICAudG8oeyB5OiB0aGlzLmluaXRpYWxDeWxpbmRlclBvc2l0aW9uLnkgfSwgQU5JTUFUSU9OX1BBUkFNUy5DWUxJTkRFUl9BTklNQVRJT05fRFVSQVRJT04pXG4gICAgICAgICAgICAgICAgLmVhc2luZyhUV0VFTi5FYXNpbmcuUXVhZHJhdGljLk91dClcbiAgICAgICAgICAgICAgICAuc3RhcnQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc3RhcnRUb25lQXJtRG93blNlcXVlbmNlID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBpbml0aWFsWVJvdGF0aW9uID0geyB5OiB0aGlzLnRvbmVBcm1QaXZvdC5yb3RhdGlvbi55IH07XG4gICAgICAgIGNvbnN0IHRhcmdldFlSb3RhdGlvbiA9IHsgeTogQU5JTUFUSU9OX1BBUkFNUy5UT05FQVJNX0lOSVRJQUxfWV9ST1RBVElPTiB9O1xuXG4gICAgICAgIG5ldyBUV0VFTi5Ud2Vlbihpbml0aWFsWVJvdGF0aW9uKVxuICAgICAgICAgICAgLnRvKHRhcmdldFlSb3RhdGlvbiwgQU5JTUFUSU9OX1BBUkFNUy5UT05FQVJNX1lfQU5JTUFUSU9OX0RVUkFUSU9OKVxuICAgICAgICAgICAgLmVhc2luZyhUV0VFTi5FYXNpbmcuUXVhZHJhdGljLk91dClcbiAgICAgICAgICAgIC5vblVwZGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy50b25lQXJtUGl2b3Qucm90YXRpb24ueSA9IGluaXRpYWxZUm90YXRpb24ueTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub25Db21wbGV0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydFRvbmVBcm1aUm90YXRpb24oKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhcnQoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXJ0VG9uZUFybVpSb3RhdGlvbiA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgaW5pdGlhbFpSb3RhdGlvbiA9IHsgejogdGhpcy50b25lQXJtTmVlZGxlUGl2b3Qucm90YXRpb24ueiB9O1xuICAgICAgICBjb25zdCB0YXJnZXRaUm90YXRpb24gPSB7IHo6IEFOSU1BVElPTl9QQVJBTVMuVE9ORUFSTV9aX1JPVEFUSU9OIH07XG5cbiAgICAgICAgbmV3IFRXRUVOLlR3ZWVuKGluaXRpYWxaUm90YXRpb24pXG4gICAgICAgICAgICAudG8odGFyZ2V0WlJvdGF0aW9uLCBBTklNQVRJT05fUEFSQU1TLlRPTkVBUk1fWl9BTklNQVRJT05fRFVSQVRJT04pXG4gICAgICAgICAgICAuZWFzaW5nKFRXRUVOLkVhc2luZy5RdWFkcmF0aWMuT3V0KVxuICAgICAgICAgICAgLm9uVXBkYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnRvbmVBcm1OZWVkbGVQaXZvdC5yb3RhdGlvbi56ID0gaW5pdGlhbFpSb3RhdGlvbi56O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbkNvbXBsZXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzUmVjb3JkU3Bpbm5pbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNBbmltYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5hdWRpb0J1ZmZlciAmJiAhdGhpcy5zb3VuZC5pc1BsYXlpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zb3VuZC5vZmZzZXQgPSAwO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNvdW5kLnBsYXkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0YXJ0KCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZXNldEFuaW1hdGlvbiA9ICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNBbmltYXRpbmcpIHJldHVybjtcblxuICAgICAgICB0aGlzLmlzQW5pbWF0aW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc1JlY29yZFNwaW5uaW5nID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKHRoaXMuc291bmQuaXNQbGF5aW5nKSB7XG4gICAgICAgICAgICB0aGlzLnNvdW5kLnN0b3AoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5ldyBUV0VFTi5Ud2Vlbih0aGlzLnRvbmVBcm1OZWVkbGVQaXZvdC5yb3RhdGlvbilcbiAgICAgICAgICAgIC50byh7IHo6IDAgfSwgQU5JTUFUSU9OX1BBUkFNUy5UT05FQVJNX1JFU0VUX0RVUkFUSU9OKVxuICAgICAgICAgICAgLmVhc2luZyhUV0VFTi5FYXNpbmcuUXVhZHJhdGljLk91dClcbiAgICAgICAgICAgIC5vbkNvbXBsZXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBuZXcgVFdFRU4uVHdlZW4odGhpcy50b25lQXJtUGl2b3Qucm90YXRpb24pXG4gICAgICAgICAgICAgICAgICAgIC50byh7IHk6IDAgfSwgQU5JTUFUSU9OX1BBUkFNUy5UT05FQVJNX1JFU0VUX0RVUkFUSU9OKVxuICAgICAgICAgICAgICAgICAgICAuZWFzaW5nKFRXRUVOLkVhc2luZy5RdWFkcmF0aWMuT3V0KVxuICAgICAgICAgICAgICAgICAgICAub25Db21wbGV0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlzQW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5zdGFydCgpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGFydCgpO1xuXG4gICAgICAgIGlmICh0aGlzLmNsaWNrYWJsZU9iamVjdCkge1xuICAgICAgICAgICAgbmV3IFRXRUVOLlR3ZWVuKHRoaXMuY2xpY2thYmxlT2JqZWN0LnBvc2l0aW9uKVxuICAgICAgICAgICAgICAgIC50byh7IHk6IHRoaXMuaW5pdGlhbEN5bGluZGVyUG9zaXRpb24ueSB9LCBBTklNQVRJT05fUEFSQU1TLkNZTElOREVSX0FOSU1BVElPTl9EVVJBVElPTilcbiAgICAgICAgICAgICAgICAuZWFzaW5nKFRXRUVOLkVhc2luZy5RdWFkcmF0aWMuT3V0KVxuICAgICAgICAgICAgICAgIC5zdGFydCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g4piFIOOCpuOCo+ODs+ODieOCpuODquOCteOCpOOCuuaZguOBruWHpueQhuOCkui/veWKoFxuICAgIHByaXZhdGUgb25XaW5kb3dSZXNpemUgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5ld1dpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIGNvbnN0IG5ld0hlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblxuICAgICAgICB0aGlzLmNhbWVyYS5hc3BlY3QgPSBuZXdXaWR0aCAvIG5ld0hlaWdodDsgLy8g44Kr44Oh44Op44Gu44Ki44K544Oa44Kv44OI5q+U44KS5pu05pawXG4gICAgICAgIHRoaXMuY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTsgICAgICAgLy8g44OX44Ot44K444Kn44Kv44K344On44Oz6KGM5YiX44KS5pu05pawXG5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTaXplKG5ld1dpZHRoLCBuZXdIZWlnaHQpOyAvLyDjg6zjg7Pjg4Djg6njg7zjga7jgrXjgqTjgrrjgpLmm7TmlrBcbiAgICB9XG59XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCAoKSA9PiB7XG4gICAgY29uc3QgY29udGFpbmVyID0gbmV3IFRocmVlSlNDb250YWluZXIoKTtcbiAgICBjb25zdCB2aWV3cG9ydCA9IGNvbnRhaW5lci5jcmVhdGVSZW5kZXJlckRPTShuZXcgVEhSRUUuVmVjdG9yMyg3LCAzLCAtMikpO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodmlld3BvcnQpO1xuXG4gICAgLy8gVGhyZWUuanPjga5DYW52YXPjgYxib2R544GE44Gj44Gx44GE44Gr5bqD44GM44KL44KI44GG44Gr44CBYm9keeOBqGh0bWzjga7jg4fjg5Xjgqnjg6vjg4jjga7jg57jg7zjgrjjg7Pjgajjg5Hjg4fjgqPjg7PjgrDjgpLjg6rjgrvjg4Pjg4jjgZnjgotDU8+DXG4gICAgZG9jdW1lbnQuYm9keS5zdHlsZS5tYXJnaW4gPSBcIjBcIjtcbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjsgLy8g44K544Kv44Ot44O844Or44OQ44O844GM6KGo56S644GV44KM44Gq44GE44KI44GG44Gr44GZ44KLXG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUubWFyZ2luID0gXCIwXCI7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnBhZGRpbmcgPSBcIjBcIjtcblxuICAgIC8vIOODqeOCpOOCu+ODs+OCueaDheWgseOCkuihqOekuuOBmeOCi2RpduimgVxuICAgIGNvbnN0IGluc3RydWN0aW9uRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgaW5zdHJ1Y3Rpb25EaXYuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIGluc3RydWN0aW9uRGl2LnN0eWxlLmJvdHRvbSA9ICc3MHB4JztcbiAgICBpbnN0cnVjdGlvbkRpdi5zdHlsZS5yaWdodCA9ICcxMHB4JztcbiAgICBpbnN0cnVjdGlvbkRpdi5zdHlsZS5jb2xvciA9ICd3aGl0ZSc7XG4gICAgaW5zdHJ1Y3Rpb25EaXYuc3R5bGUuZm9udEZhbWlseSA9ICdzYW5zLXNlcmlmJztcbiAgICBpbnN0cnVjdGlvbkRpdi5zdHlsZS5mb250U2l6ZSA9ICcyNHB4JztcbiAgICBpbnN0cnVjdGlvbkRpdi5zdHlsZS50ZXh0QWxpZ24gPSAncmlnaHQnO1xuICAgIGluc3RydWN0aW9uRGl2LmlubmVySFRNTCA9ICfkuLjjgYTjg5zjgr/jg7PjgpLmirzjgZfjgablho3nlJ8nO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaW5zdHJ1Y3Rpb25EaXYpO1xuXG4gICAgY29uc3QgY3JlZGl0RGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY3JlZGl0RGl2LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBjcmVkaXREaXYuc3R5bGUuYm90dG9tID0gJzEwcHgnO1xuICAgIGNyZWRpdERpdi5zdHlsZS5yaWdodCA9ICcxMHB4JztcbiAgICBjcmVkaXREaXYuc3R5bGUuY29sb3IgPSAnd2hpdGUnO1xuICAgIGNyZWRpdERpdi5zdHlsZS5mb250RmFtaWx5ID0gJ3NhbnMtc2VyaWYnO1xuICAgIGNyZWRpdERpdi5zdHlsZS5mb250U2l6ZSA9ICcxMnB4JztcbiAgICBjcmVkaXREaXYuc3R5bGUudGV4dEFsaWduID0gJ3JpZ2h0JztcbiAgICBjcmVkaXREaXYuaW5uZXJIVE1MID0gYFxuICAgICAgICBcIlJlY29yZCBQbGF5ZXJcIiBieSBLdXJ1c3VZb2ggIExpY2Vuc2U6Q0MgQlktTkM8YnI+XG4gICAgICAgIE11c2ljOiBNdXNpYyBieSA8YSBocmVmPVwiaHR0cHM6Ly9waXhhYmF5LmNvbS9qYS91c2Vycy9oYXJ1bWFjaGltdXNpYy0xMzQ3MDU5My8/dXRtX3NvdXJjZT1saW5rLWF0dHJpYnV0aW9uJnV0bV9tZWRpdW09cmVmZXJyYWwmdXRtX2NhbXBhaWduPW11c2ljJnV0bV9jb250ZW50PTIzNzQ0OVwiPk5vcnU8L2E+IGZyb20gPGEgaHJlZj1cImh0dHBzOi8vcGl4YWJheS5jb20vbXVzaWMvLz91dG1fc291cmNlPWxpbmstYXR0cmlidXRpb24mdXRtX21lZGl1bT1yZWZlcnJhbCZ1dG1fY2FtcGFpZ249bXVzaWMmdXRtX2NvbnRlbnQ9MjM3NDQ5XCI+UGl4YWJheTwvYT5cbiAgICBgO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY3JlZGl0RGl2KTtcbn0pO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbi8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBfX3dlYnBhY2tfbW9kdWxlc19fO1xuXG4iLCJ2YXIgZGVmZXJyZWQgPSBbXTtcbl9fd2VicGFja19yZXF1aXJlX18uTyA9IChyZXN1bHQsIGNodW5rSWRzLCBmbiwgcHJpb3JpdHkpID0+IHtcblx0aWYoY2h1bmtJZHMpIHtcblx0XHRwcmlvcml0eSA9IHByaW9yaXR5IHx8IDA7XG5cdFx0Zm9yKHZhciBpID0gZGVmZXJyZWQubGVuZ3RoOyBpID4gMCAmJiBkZWZlcnJlZFtpIC0gMV1bMl0gPiBwcmlvcml0eTsgaS0tKSBkZWZlcnJlZFtpXSA9IGRlZmVycmVkW2kgLSAxXTtcblx0XHRkZWZlcnJlZFtpXSA9IFtjaHVua0lkcywgZm4sIHByaW9yaXR5XTtcblx0XHRyZXR1cm47XG5cdH1cblx0dmFyIG5vdEZ1bGZpbGxlZCA9IEluZmluaXR5O1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IGRlZmVycmVkLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIFtjaHVua0lkcywgZm4sIHByaW9yaXR5XSA9IGRlZmVycmVkW2ldO1xuXHRcdHZhciBmdWxmaWxsZWQgPSB0cnVlO1xuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgY2h1bmtJZHMubGVuZ3RoOyBqKyspIHtcblx0XHRcdGlmICgocHJpb3JpdHkgJiAxID09PSAwIHx8IG5vdEZ1bGZpbGxlZCA+PSBwcmlvcml0eSkgJiYgT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5PKS5ldmVyeSgoa2V5KSA9PiAoX193ZWJwYWNrX3JlcXVpcmVfXy5PW2tleV0oY2h1bmtJZHNbal0pKSkpIHtcblx0XHRcdFx0Y2h1bmtJZHMuc3BsaWNlKGotLSwgMSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmdWxmaWxsZWQgPSBmYWxzZTtcblx0XHRcdFx0aWYocHJpb3JpdHkgPCBub3RGdWxmaWxsZWQpIG5vdEZ1bGZpbGxlZCA9IHByaW9yaXR5O1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZihmdWxmaWxsZWQpIHtcblx0XHRcdGRlZmVycmVkLnNwbGljZShpLS0sIDEpXG5cdFx0XHR2YXIgciA9IGZuKCk7XG5cdFx0XHRpZiAociAhPT0gdW5kZWZpbmVkKSByZXN1bHQgPSByO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gbm8gYmFzZVVSSVxuXG4vLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGFuZCBsb2FkaW5nIGNodW5rc1xuLy8gdW5kZWZpbmVkID0gY2h1bmsgbm90IGxvYWRlZCwgbnVsbCA9IGNodW5rIHByZWxvYWRlZC9wcmVmZXRjaGVkXG4vLyBbcmVzb2x2ZSwgcmVqZWN0LCBQcm9taXNlXSA9IGNodW5rIGxvYWRpbmcsIDAgPSBjaHVuayBsb2FkZWRcbnZhciBpbnN0YWxsZWRDaHVua3MgPSB7XG5cdFwibWFpblwiOiAwXG59O1xuXG4vLyBubyBjaHVuayBvbiBkZW1hbmQgbG9hZGluZ1xuXG4vLyBubyBwcmVmZXRjaGluZ1xuXG4vLyBubyBwcmVsb2FkZWRcblxuLy8gbm8gSE1SXG5cbi8vIG5vIEhNUiBtYW5pZmVzdFxuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLk8uaiA9IChjaHVua0lkKSA9PiAoaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID09PSAwKTtcblxuLy8gaW5zdGFsbCBhIEpTT05QIGNhbGxiYWNrIGZvciBjaHVuayBsb2FkaW5nXG52YXIgd2VicGFja0pzb25wQ2FsbGJhY2sgPSAocGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24sIGRhdGEpID0+IHtcblx0dmFyIFtjaHVua0lkcywgbW9yZU1vZHVsZXMsIHJ1bnRpbWVdID0gZGF0YTtcblx0Ly8gYWRkIFwibW9yZU1vZHVsZXNcIiB0byB0aGUgbW9kdWxlcyBvYmplY3QsXG5cdC8vIHRoZW4gZmxhZyBhbGwgXCJjaHVua0lkc1wiIGFzIGxvYWRlZCBhbmQgZmlyZSBjYWxsYmFja1xuXHR2YXIgbW9kdWxlSWQsIGNodW5rSWQsIGkgPSAwO1xuXHRpZihjaHVua0lkcy5zb21lKChpZCkgPT4gKGluc3RhbGxlZENodW5rc1tpZF0gIT09IDApKSkge1xuXHRcdGZvcihtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuXHRcdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKG1vcmVNb2R1bGVzLCBtb2R1bGVJZCkpIHtcblx0XHRcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYocnVudGltZSkgdmFyIHJlc3VsdCA9IHJ1bnRpbWUoX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cdH1cblx0aWYocGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24pIHBhcmVudENodW5rTG9hZGluZ0Z1bmN0aW9uKGRhdGEpO1xuXHRmb3IoO2kgPCBjaHVua0lkcy5sZW5ndGg7IGkrKykge1xuXHRcdGNodW5rSWQgPSBjaHVua0lkc1tpXTtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oaW5zdGFsbGVkQ2h1bmtzLCBjaHVua0lkKSAmJiBpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcblx0XHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkXVswXSgpO1xuXHRcdH1cblx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gPSAwO1xuXHR9XG5cdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fLk8ocmVzdWx0KTtcbn1cblxudmFyIGNodW5rTG9hZGluZ0dsb2JhbCA9IHNlbGZbXCJ3ZWJwYWNrQ2h1bmtjZ3ByZW5kZXJpbmdcIl0gPSBzZWxmW1wid2VicGFja0NodW5rY2dwcmVuZGVyaW5nXCJdIHx8IFtdO1xuY2h1bmtMb2FkaW5nR2xvYmFsLmZvckVhY2god2VicGFja0pzb25wQ2FsbGJhY2suYmluZChudWxsLCAwKSk7XG5jaHVua0xvYWRpbmdHbG9iYWwucHVzaCA9IHdlYnBhY2tKc29ucENhbGxiYWNrLmJpbmQobnVsbCwgY2h1bmtMb2FkaW5nR2xvYmFsLnB1c2guYmluZChjaHVua0xvYWRpbmdHbG9iYWwpKTsiLCIiLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8vIFRoaXMgZW50cnkgbW9kdWxlIGRlcGVuZHMgb24gb3RoZXIgbG9hZGVkIGNodW5rcyBhbmQgZXhlY3V0aW9uIG5lZWQgdG8gYmUgZGVsYXllZFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLk8odW5kZWZpbmVkLCBbXCJ2ZW5kb3JzLW5vZGVfbW9kdWxlc190d2VlbmpzX3R3ZWVuX2pzX2Rpc3RfdHdlZW5fZXNtX2pzLW5vZGVfbW9kdWxlc190aHJlZV9leGFtcGxlc19qc21fY29udHItODRiZTk3XCJdLCAoKSA9PiAoX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2FwcC50c1wiKSkpXG5fX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy5PKF9fd2VicGFja19leHBvcnRzX18pO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9