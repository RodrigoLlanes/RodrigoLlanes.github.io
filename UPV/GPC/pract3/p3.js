//import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import * as THREE from "../lib/three.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";

var renderer, scene, camera, cameraControls;

var topCamera, topCameraSize;

const bw = 20;
const bd = 4;
const h  = 19;
const tw = 10;
const td = 2;

// Acciones
init();
loadScene();
render();


function updateAspectRatio() {
    renderer.setSize(window.innerWidth, window.innerHeight);

    camera.aspect = window.innerWidth/window.innerHeight
    camera.updateProjectionMatrix();

    topCameraSize = Math.floor(Math.min(window.innerWidth, window.innerHeight)/4);
}


function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5, 0.5, 0.5);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(200, 300, 200);
    camera.lookAt(0, 1, 0);

    cameraControls = new OrbitControls(camera, renderer.domElement);
    cameraControls.target.set(0, 1, 0);
    // TODO: Zoom 
    // cameraControls.maxDistance = 10;

    topCameraSize = Math.floor(Math.min(window.innerWidth, window.innerHeight)/4);
    topCamera = new THREE.OrthographicCamera(-70, 70, 70, -70, 1, 1000); 
    topCamera.position.set(0, 300, 0);
    topCamera.lookAt(0, 0, 0);

    window.addEventListener('resize', updateAspectRatio);
}


function planeNormal(vertices, a, b, c) {
    var a = new THREE.Vector3(vertices[a*3], vertices[a*3 +1], vertices[a*3 +2]);
    var b = new THREE.Vector3(vertices[b*3], vertices[b*3 +1], vertices[b*3 +2]);
    var c = new THREE.Vector3(vertices[c*3], vertices[c*3 +1], vertices[c*3 +2]);
    b.sub(a);
    c.sub(a);
    a.crossVectors(b, c);
    a.normalize();
    return a;
}


function loadScene() {
    const material_suelo = new THREE.MeshBasicMaterial({color: 'yellow', wireframe: true});
    const material_selec = new THREE.MeshBasicMaterial({color: 'black', wireframe: true});
    const material_robot = new THREE.MeshNormalMaterial({wireframe: false});

    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 100, 100), material_suelo);
    suelo.rotation.x = -Math.PI/2;
    scene.add(suelo);

    const robot = new THREE.Object3D();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(50, 50, 15, 20, 1, false), material_robot);
    
    const brazo = new THREE.Object3D();
    const eje = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 18, 10, 1, false), material_robot);
    eje.rotateZ(Math.PI/2);
    const esparrago = new THREE.Mesh(new THREE.BoxGeometry(18, 120, 12, 1, 1, 1), material_robot);
    esparrago.translateY(60);
    const rotula = new THREE.Mesh(new THREE.SphereGeometry(20, 10, 10), material_robot);
    rotula.translateY(120);
    
    const antebrazo = new THREE.Object3D();
    const disco = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 6, 10, 1), material_robot);
    const nervios = new THREE.Object3D();
    const n1 = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4, 1, 1, 1), material_robot);
    n1.translateX(8);
    n1.translateZ(8);
    const n2 = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4, 1, 1, 1), material_robot);
    n2.translateX(-8);
    n2.translateZ(8);
    const n3 = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4, 1, 1, 1), material_robot);
    n3.translateX(-8);
    n3.translateZ(-8);
    const n4 = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4, 1, 1, 1), material_robot);
    n4.translateX(8);
    n4.translateZ(-8);
    const mano = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 40, 10, 1), material_robot);
    mano.translateY(80);
    mano.rotateZ(Math.PI/2);
   
    const right_hand = new THREE.Mesh(new THREE.BoxGeometry(20, 19, 4, 1, 1, 1), material_robot);
    const left_hand = new THREE.Mesh(new THREE.BoxGeometry(20, 19, 4, 1, 1, 1), material_robot);
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array( [
	     bw/2, 0, -bd/2,  // Bottom
        -bw/2, 0, -bd/2,
         bw/2, 0,  bd/2,
        -bw/2, 0,  bd/2,

         bw/2, 0,  bd/2,  // Front
        -bw/2, 0,  bd/2,
         tw/2, h,  bd/2,
        -tw/2, h,  bd/2,
        
         bw/2, 0, -bd/2,  // Back
        -bw/2, 0, -bd/2,
         tw/2, h,  bd/2 - td,
        -tw/2, h,  bd/2 - td,

         bw/2, 0, -bd/2,  // Left
         bw/2, 0,  bd/2,
         tw/2, h,  bd/2 - td,
         tw/2, h,  bd/2,

        -bw/2, 0, -bd/2,  // Right
        -bw/2, 0,  bd/2,
        -tw/2, h,  bd/2 - td,
        -tw/2, h,  bd/2,

         tw/2, h,  bd/2 - td,  // Top
        -tw/2, h,  bd/2 - td,
         tw/2, h,  bd/2,
        -tw/2, h,  bd/2
    ]);

    const bot_n = planeNormal(vertices,  0,  2,  1);
    const fro_n = planeNormal(vertices,  4,  6,  5);
    const bac_n = planeNormal(vertices,  8,  9, 10);
    const lef_n = planeNormal(vertices, 12, 14, 13);
    const rig_n = planeNormal(vertices, 16, 17, 18);
    const top_n = planeNormal(vertices, 20, 21, 22);
    const normals = new Float32Array( [
	    bot_n.x, bot_n.y, bot_n.z,  // Bottom  
        bot_n.x, bot_n.y, bot_n.z,  
        bot_n.x, bot_n.y, bot_n.z,
        bot_n.x, bot_n.y, bot_n.z,

        fro_n.x, fro_n.y, fro_n.z,  // Front
        fro_n.x, fro_n.y, fro_n.z,
        fro_n.x, fro_n.y, fro_n.z,
        fro_n.x, fro_n.y, fro_n.z,

        bac_n.x, bac_n.y, bac_n.z,  // Back
        bac_n.x, bac_n.y, bac_n.z, 
        bac_n.x, bac_n.y, bac_n.z, 
        bac_n.x, bac_n.y, bac_n.z, 

        lef_n.x, lef_n.y, lef_n.z,  // Left
        lef_n.x, lef_n.y, lef_n.z,
        lef_n.x, lef_n.y, lef_n.z,
        lef_n.x, lef_n.y, lef_n.z,

        rig_n.x, rig_n.y, rig_n.z,  // Right
        rig_n.x, rig_n.y, rig_n.z,
        rig_n.x, rig_n.y, rig_n.z,
        rig_n.x, rig_n.y, rig_n.z,

        top_n.x, top_n.y, top_n.z,  // Top
        top_n.x, top_n.y, top_n.z,
        top_n.x, top_n.y, top_n.z,
        top_n.x, top_n.y, top_n.z
    ]);

    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    const indexes = [
        1, 0, 2,  1, 2, 3,  // Bottom
        5, 4, 6,  5, 6, 7,  // Front
        8, 9,10,    10,9,11,  // Back
        13,12,14, 13,14,15,  // Left
        16,17,18, 18,17,19,  // Right
        20,21,22, 22,21,23   // Top
        ];
    geometry.setIndex(indexes);

    const right_finger = new THREE.Mesh(geometry, material_robot);
    right_finger.translateY(9.5);
    right_hand.add(right_finger);
    right_hand.translateZ(15);

    const left_finger = new THREE.Mesh(geometry, material_robot);
    left_finger.translateY(9.5);
    left_finger.rotateY(Math.PI);
    left_hand.add(left_finger);
    left_hand.translateZ(15);
    

    mano.add(right_hand);
    right_hand.rotateX(Math.PI/2);
    right_hand.translateZ(-15);
    mano.add(left_hand);
    left_hand.rotateX(Math.PI/2);
    left_hand.translateZ(15);

    nervios.add(n1);
    nervios.add(n2);
    nervios.add(n3);
    nervios.add(n4);
    nervios.translateY(40);
    antebrazo.add(disco);
    antebrazo.add(nervios);
    antebrazo.add(mano);
    antebrazo.translateY(120);

    brazo.add(antebrazo);
    brazo.add(eje);
    brazo.add(esparrago);
    brazo.add(rotula);

    base.add(brazo);

    robot.add(base);
    robot.translateY(7.5);

    scene.add(robot);
}


function render() {
    requestAnimationFrame(render);

    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
    
    console.log(topCameraSize);
    console.log(window.innerWidth);
    renderer.clearDepth();
    renderer.setScissorTest(true);
    renderer.setScissor(0, window.innerHeight - topCameraSize, topCameraSize, topCameraSize);
    renderer.setViewport(0, window.innerHeight - topCameraSize, topCameraSize, topCameraSize);
    renderer.render(scene, topCamera);
    renderer.setScissorTest(false);
}

