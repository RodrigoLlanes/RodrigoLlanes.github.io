//import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import * as THREE from "../lib/three.module.js";

var renderer, scene, camera;

// Acciones
init();
loadScene();
render();


function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5, 0.5, 0.5);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(200, 275, 200);
    camera.lookAt(0, 1, 0);
}


function loadScene() {
    const material_suelo = new THREE.MeshBasicMaterial({color: 'yellow', wireframe: true});
    const material_selec = new THREE.MeshBasicMaterial({color: 'black', wireframe: true});
    const material_robot = new THREE.MeshBasicMaterial({color: 'red', wireframe: true});

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
	     10,  0, -2,
        -10,  0, -2,
         10,  0,  2,
        -10,  0,  2,

          5, 19,  0,
         -5, 19,  0,
          5, 19,  2,
         -5, 19,  2
    ]);
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    const indexes = [
        0,1,2, 2,3,1,
        4,5,6, 6,7,5, 
        0,2,4, 4,2,6, 
        0,4,1, 1,5,4, 
        1,5,7, 7,1,3, 
        3,6,7, 2,3,6
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
    renderer.render(scene, camera);
}

