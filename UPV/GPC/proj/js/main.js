//import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import GUI from "../../lib/lil-gui.module.min.js";
import * as THREE from "three";
import { FBXLoader } from 'FBXloader';
import {TWEEN} from "../../lib/tween.module.min.js";
import Stats from '../../lib/stats.module.js';
import * as CANNON from '../../lib/cannon-es.module.js';


var pause = false;
var distance = 0, speed = 0;
var renderer, scene, camera;
var ambientLight, directionalLight;

var grassCube, bush, roadTile, car, signStop, coin;
var waterText;

const gui = new GUI();
const debugParams = {
    directionalLight: true,
    ambientLight: true,
    hitboxes: false,
}

// -1 nada; 0 en-progreso; 1 izquierda; 2 arriba; 3 derecha
var actionCode = -1;
const rowSize = 3 * 3, boardDepth = 20, boardBack = 5;
var playerPos = 0;
var jumpHeight = 40;
var board, boardIndex = - 1 - boardBack, boardOutIndex = 0;
const carTileTime = 500, jumpTime = 500;

const scale = 0.4;
const cubeWidth = 80;

var stats;


var hitboxMaterial = new THREE.MeshBasicMaterial({color: 'red', wireframe: true, visible: false});
var world, playerRadius = cubeWidth * 0.4;



const player = {
    mesh: null,
    hitbox: null,
    hitboxMesh: null,
    translateX(value) { this.position.x += value; },
    translateY(value) { this.position.y += value; },
    translateZ(value) { this.position.z += value; },
    position : {
        _x: 0,
        _y: 0,
        _z: 0,
        _update() {
            player.mesh.position.set(this._x, this._y, this._z);
            player.hitbox.position.set(this._x, this._y, this._z);
            player.hitboxMesh.position.set(this._x, this._y, this._z);
        },
        set x(value) {
            this._x = value;
            this._update();
        },
        set y(value) {
            this._y = value;
            this._update();
        },
        set z(value) {
            this._z = value;
            this._update();
        },
        get x() { return this._x; },
        get y() { return this._y; },
        get z() { return this._z; }
    }
}



// Acciones
init();


function apply2Material(obj, func) {
    obj.traverse(function (child) {
        if ( child.isMesh ) {
            if (child.material.isMaterial) {
                func(child.material);
            } else {
                child.material.forEach((material) => {
                    func(material);
                });
            }
        }
    });
}


class BoardRow {
    constructor(obj, depth, hitbox = [], hitboxMesh = null, fade=true) {
        this._z = 0;

        this.obj = obj;
        this.depth = depth;
        this.hitbox = hitbox;
        this.hitboxMesh = hitboxMesh == null ? new THREE.Object3D() : hitboxMesh;

        // Fade
        if (!fade) { return; }

        this.obj.traverse(function (child) {
            if ( child.isMesh ) {
                if (child.material.isMaterial) {
                    child.material = child.material.clone();
                } else {
                    child.material = child.material.map((m) => m.clone());
                }
            }
        });

        apply2Material(this.obj, (material) => {
            material.transparent = true;
            material.opacity = 0;
        });

        scene.add(this.obj);

        new TWEEN.Tween({alpha: 0}).
            to({alpha:1}, 1000).
            onUpdate((alpha) => {
                apply2Material(this.obj, (material) => {
                    material.opacity = alpha.alpha;
                });
            }).start();
    }

    get z() { return this._z; }
    set z(value) {
        this._z = value;
        this.obj.position.z = this._z;
        this.hitbox.forEach((hitbox) => { hitbox.position.z = this._z; });
        this.hitboxMesh.position.z = this._z;
    }

    fadeOut() {
        new TWEEN.Tween({alpha: 1}).
            to({alpha:0}, 1000).
            onUpdate((alpha) => {
                apply2Material(this.obj, (material) => {
                    material.opacity = alpha.alpha;
                });
            }).onComplete(() => {
                scene.remove(this.obj);
                scene.remove(this.hitboxMesh);
                this.hitbox.forEach((hitbox) => { world.removeBody(hitbox); });
            }).start();
    }
}


function random(min, max) {
    return Math.floor(min + Math.random() * (max + 1));
}


function updateAspectRatio() {
    renderer.setSize(window.innerWidth, window.innerHeight);

    camera.aspect = window.innerWidth/window.innerHeight
    camera.updateProjectionMatrix();
}


function initGUI() {
    var debugSettings = gui.addFolder('Debug Settings');
    debugSettings.add(debugParams, 'hitboxes').name('Render Hitboxes')
        .onChange(value => {
            hitboxMaterial.visible = value;
        });
    debugSettings.add(debugParams, 'directionalLight').name('Directional Light')
        .onChange(value => {
            directionalLight.visible = value;
        });
    debugSettings.add(debugParams, 'ambientLight').name('Ambient Light')
        .onChange(value => {
            ambientLight.visible = value;
        });
}


async function initModels() {
    const loader = new FBXLoader();
    const textureLoader = new THREE.TextureLoader();

    const grasProm = loader.loadAsync('models/Cube_Grass_Single.fbx', (obj) => {});
    grasProm.then((value) => {
        value.scale.set(scale, scale, scale);
        value.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.receiveShadow = true;
            }
        } );
        grassCube = value;
    });


    const bushProm = loader.loadAsync('models/Bush_Fruit.fbx', (obj) => {});
    bushProm.then((value) => {
        value.scale.set(scale * 0.5, scale * 0.5, scale * 0.5);
        value.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );
        bush = value;
    });


    const roadProm = loader.loadAsync('models/Street_Straight.fbx', (obj) => {});
    roadProm.then((value) => {
        value.scale.set(scale * 3, scale * 3, scale * 3);
        value.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.receiveShadow = true;
            }
        } );
        roadTile = value;
    });

    const playerProm = loader.loadAsync('models/Chicken.fbx', (obj) => {});
    playerProm.then((value) => {
        value.scale.set(scale * 0.75, scale * 0.75, scale * 0.75);
        value.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );
        player.mesh = value;
    });

    const carProm = loader.loadAsync('models/NormalCar2.fbx', (obj) => {});
    carProm.then((value) => {
        value.rotateY(Math.PI/2)
        value.rotateX(-Math.PI / 2);
        value.scale.set(scale, scale, scale);
        value.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );

        car = new THREE.Object3D();
        car.add(value);
    });

    const stopProm = loader.loadAsync('models/Sign_Stop.fbx', (obj) => {});
    stopProm.then((value) => {
        value.scale.set(scale*5, scale*5, scale*5);
        value.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );
        signStop = value;
    });

    await grasProm;
    await bushProm;
    await roadProm;
    await playerProm;
    await carProm;
    await stopProm;

    loadScene();
    render();
}


function initCannon() {
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, 0, 0),
    });

    const sphereShape = new CANNON.Sphere(playerRadius);
    player.hitbox = new CANNON.Body({ mass: 1 });
    player.hitbox.addShape(sphereShape);
    player.hitbox.position.set(0, 0, -cubeWidth);
    world.addBody(player.hitbox);

    player.hitbox.addEventListener('collide', (event) => {
        if (event.body.isBush) {
            pause = true;
            document.getElementById("gameover").innerHTML  = "Game Over </br>";
            document.getElementById('result').innerHTML = "<div style='color:gold'>Score: " + Math.floor(distance * speed * 100) / 100 +
                "</div></br></br> Press ENTER to restart";
            document.getElementById("score").innerHTML  = "";
        }
    });
}


function init() {
    initGUI();
    initCannon();

    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);
    document.addEventListener("keydown", keyDownListener, false);

    stats = Stats()
    document.body.appendChild(stats.dom)

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5, 0.5, 0.5);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(-100, 300, -300);
    camera.lookAt(0, 0, 0);

    window.addEventListener('resize', updateAspectRatio);

    initModels();
}


function grassRow() {
    const side = (rowSize - 1) / 2;

    const hitbox = new CANNON.Body({ trigger: true });
    const hitboxMesh = new THREE.Object3D();
    const row = new THREE.Object3D();
    for (let i = -side; i <= side; i++) {
        const prob = random(0, 2);
        if (boardIndex === -1 && i === 0) {
        } else if (prob === 0) {
            let b = bush.clone(true);
            b.position.set(i * cubeWidth, cubeWidth/2, 0);
            row.add(b);

            let bushMesh = new THREE.Mesh(new THREE.BoxGeometry(cubeWidth, cubeWidth/2, cubeWidth), hitboxMaterial);
            bushMesh.position.set(i * cubeWidth, cubeWidth/2, 0);
            hitboxMesh.add(bushMesh);

            let bushHitbox = new CANNON.Box(new CANNON.Vec3(cubeWidth/2, cubeWidth/4, cubeWidth/2));
            hitbox.addShape(bushHitbox, new CANNON.Vec3(i * cubeWidth, cubeWidth/2, 0));
        }
        let cube = grassCube.clone();
        cube.translateX(i * cubeWidth);
        row.add(cube);
    }
    scene.add(hitboxMesh);
    hitbox.isBush = true;
    world.addBody(hitbox);

    boardIndex++;
    const boardRow = new BoardRow(row, 1, [hitbox], hitboxMesh);
    boardRow.z = (boardIndex) * cubeWidth;
    board.push(boardRow);
}


function roadRow() {
    const side = (rowSize - 1) / 2;

    const hitbox = new CANNON.Body({ trigger: true });
    const hitboxMesh = new THREE.Object3D();
    const row = new THREE.Object3D();
    for (let i = -side; i <= side; i += 3) {
        let cube = roadTile.clone();
        cube.translateX((i+1) * cubeWidth);
        cube.translateY(cubeWidth / 4)
        row.add(cube);
    }
    for (let j = -1; j <=+1; j+=2) {
        for (let i = -side; i <= side; i += 3) {
            const prob = random(0, 2);
            if (prob === 0) {
                let sign = signStop.clone();
                sign.position.set(i * cubeWidth, cubeWidth / 2, j * cubeWidth)
                row.add(sign);

                let signMesh = new THREE.Mesh(new THREE.BoxGeometry(cubeWidth / 2, cubeWidth, cubeWidth / 2), hitboxMaterial);
                signMesh.position.set(i * cubeWidth, cubeWidth / 2, j * cubeWidth)
                hitboxMesh.add(signMesh);

                let signHitbox = new CANNON.Box(new CANNON.Vec3(cubeWidth / 4, cubeWidth, cubeWidth / 4));
                hitbox.addShape(signHitbox, new CANNON.Vec3(i * cubeWidth, cubeWidth / 2, j * cubeWidth));
            }
        }
    }
    const carModel = car.clone();
    carModel.position.set((side+1) * cubeWidth, cubeWidth * 0.35, 0);
    row.add(carModel);

    let carMesh = new THREE.Mesh(new THREE.BoxGeometry(cubeWidth * 1.5, cubeWidth / 2, cubeWidth * 0.75), hitboxMaterial);
    carMesh.position.set((side+1) * cubeWidth, cubeWidth * 0.35, 0);
    hitboxMesh.add(carMesh);

    let carHitbox = new CANNON.Body({ trigger: true });
    carHitbox.addShape(new CANNON.Box(new CANNON.Vec3(cubeWidth * 0.75, cubeWidth / 4, cubeWidth * 0.375)), new CANNON.Vec3((side+1) * cubeWidth, cubeWidth * 0.35, 0));

    // Car loop
    function carFadeIn() {
        return new TWEEN.Tween({alpha: 0}).to({alpha: 1}, carTileTime).onUpdate((alpha) => {
            apply2Material(carModel, (material) => {
                material.opacity = alpha.alpha;
            });
        });
    }

    function carFadeOut() {
        return new TWEEN.Tween({alpha: 1}).to({alpha: 0}, carTileTime).onUpdate((alpha) => {
            apply2Material(carModel, (material) => {
                material.opacity = alpha.alpha;
            });
        });
    }

    const carStraight = new TWEEN.Tween(carModel.position).
        to({x:-side * cubeWidth}, (rowSize + 1) * carTileTime).
        onStart(() => { carFadeIn().start(); }).
        onUpdate((pos) => {
            carMesh.position.x = pos.x;
            carHitbox.position.x = pos.x - cubeWidth * 5;
        }).onComplete(() => {
            carFadeOut().start();
            new TWEEN.Tween(carModel.position).
                to({x:-(side+1) * cubeWidth}, carTileTime).
                onUpdate((pos) => {
                    carMesh.position.x = pos.x;
                    carHitbox.position.x = pos.x - cubeWidth * 5;
                }).onComplete(() => {
                    carModel.translateX((rowSize+2) * cubeWidth);
                    carMesh.position.x += (rowSize+2) * cubeWidth;
                    carHitbox.position.x += (rowSize+2) * cubeWidth;
                    carStraight.start();
                }).start();
        }).start();

    carStraight.start();


    scene.add(hitboxMesh);
    hitbox.isBush = true;
    world.addBody(hitbox);
    carHitbox.isBush = true;
    world.addBody(carHitbox);

    boardIndex += 3;
    const boardRow = new BoardRow(row, 3, [hitbox, carHitbox], hitboxMesh);
    boardRow.z = (boardIndex - 1) * cubeWidth;
    board.push(boardRow);
}


function randomRow() {
    if (boardIndex === -1) {
        grassRow();
    }

    const i = random(0, 3);
    if (0 <= i && i <= 2) { grassRow(); }
    else { roadRow(); }
}


function loadScene() {
    board = [];
    while (boardIndex < boardDepth) {
        randomRow();
    }

    player.hitboxMesh = new THREE.Mesh(new THREE.SphereGeometry(playerRadius), hitboxMaterial);
    scene.add(player.hitboxMesh);

    player.translateY(cubeWidth/2);
    scene.add(player.mesh);


    // Lights
    ambientLight = new THREE.AmbientLight(0x999999);
    scene.add(ambientLight)
    
    directionalLight = new THREE.DirectionalLight(0xFFFFFF,1);
    directionalLight.position.set(-100,100,-100);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 5000;
    directionalLight.shadow.camera.left = - 2000;
    directionalLight.shadow.camera.right = 2000;
    directionalLight.shadow.camera.top = 2000;
    directionalLight.shadow.camera.bottom = - 2000;
    scene.add(directionalLight);
}


function Update(time) {
    TWEEN.update(time);
    const sec = Math.floor(time / 1000);
    const milis = Math.floor(time) - (sec * 1000);
    speed = Math.floor(100000 * distance / time) / 100;
    document.getElementById('score').innerHTML  = "Time:   " + sec + "'" + ('0000'+milis).slice(-3) + "s";
    document.getElementById('score').innerHTML  = "Distance: " + distance + "m &nbsp; &nbsp; &nbsp; Time: " + sec + "'" + ('0000'+milis).slice(-3) + "s </br> Speed: " + speed + "m/s";

    if (actionCode > 0) {
        const action = actionCode;
        actionCode = 0;
        const playerZero = cubeWidth/2;
        const up = new TWEEN.Tween( player.position ).
            to( {y: playerZero + jumpHeight}, jumpTime/2).
            easing( TWEEN.Easing.Quadratic.Out );
        const down = new TWEEN.Tween( player.position ).
            to( {y: playerZero}, jumpTime/2).
            easing( TWEEN.Easing.Quadratic.In ).
            onComplete(() => { actionCode--; });
        up.chain(down);

        if (action === 1 && playerPos > -((rowSize - 1) / 2)) {
            const left = new TWEEN.Tween( player.position ).
                to( {x: player.position.x + cubeWidth}, jumpTime).
                onComplete(() => { playerPos -= 1; });
            left.start();
        } else if (action === 2) {
            board.forEach((row) => {
                const back = new TWEEN.Tween( row ).
                    to( {z: row.z - cubeWidth}, jumpTime);
                back.start();
            });
            new TWEEN.Tween({n: 0}).to({n:1}, jumpTime).onComplete(() => {
                boardOutIndex += 1;
                distance += 1;
                if (boardOutIndex >= board[0].depth) {
                    boardOutIndex -= board[0].depth;
                    board.shift().fadeOut();
                }

                boardIndex -= 1;
                while (boardIndex < boardDepth) {
                    randomRow();
                }
            }).start();
        } else if (action === 3 && playerPos < ((rowSize - 1) / 2)) {
            const right = new TWEEN.Tween( player.position ).
            to( {x: player.position.x - cubeWidth}, jumpTime).
            onComplete(() => { playerPos++; });
            right.start();
        }

        up.start();
    }
}


function render(time) {
    requestAnimationFrame(render);
    if (pause) {return;}
    stats.update();
    
    Update(time);
    world.fixedStep();

    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
}


function keyDownListener(event) {
    const keyCode = event.which;

    if (pause) {
        if (keyCode === 13) {
            location.reload();
        }
        return;
    }

    if (actionCode === 0) {
        return;
    }

    if (keyCode === 37 || keyCode === 65) {
        actionCode = 1;
    } else if (keyCode === 39 || keyCode === 68) {
        actionCode = 3;
    } else if (keyCode === 38 || keyCode === 87) {
        actionCode = 2;
    }
}
