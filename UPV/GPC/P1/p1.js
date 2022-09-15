// Vertex shader
const VSHADER_SRC = `
    attribute vec3 pos;

    varying float distance;

    uniform highp vec3 center;
    
    void main() {
        gl_Position = vec4(pos, 1.0);
        gl_PointSize = 10.0;
        distance = length(pos - center);
    }
`

// Fragment shader
const FSHADER_SRC = `
    uniform highp vec3 nearColor;
    uniform highp vec3 farColor;

    varying highp float distance;
    
    void main() {
        gl_FragColor = vec4(farColor * distance + nearColor * (1.0 - distance), 1.0);
    }
`

// Global vars
const clicks = [];
let nearColor;
let farColor;
let center;

function main() {
    const canvas = document.getElementById("canvas");
    const gl = getWebGLContext(canvas);
    
    if (!initShaders(gl, VSHADER_SRC, FSHADER_SRC)) {
        console.log("WebGL can not initialize the shaders.");
    }

    gl.clearColor(0.0, 0.0, 0.3, 1.0);
    
    const coords = gl.getAttribLocation(gl.program, "pos");
    
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(coords, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coords);

    nearColor = gl.getUniformLocation(gl.program, 'nearColor');
    farColor  = gl.getUniformLocation(gl.program, 'farColor');
    center = gl.getUniformLocation(gl.program, 'center')

    canvas.onmousedown = function(evento){ click(evento, gl, canvas); };

    render(gl);
}

function click(evento, gl, canvas) {
    let x = evento.clientX;
    let y = evento.clientY;
    const rect = evento.target.getBoundingClientRect();

    // Conversion de coordenadas
    x = ((x - rect.left) - canvas.width / 2) * 2 / canvas.width;
    y = (canvas.height / 2 - (y - rect.top)) * 2 / canvas.height;

	clicks.push(x); 
    clicks.push(y); 
    clicks.push(0.0);

	render(gl);
}

function render(gl) {
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.uniform3f(nearColor, 1, 1, 0);
    gl.uniform3f(farColor, 0, 1, 1);
    gl.uniform3f(center, 0, 0, 0)

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(clicks), gl.STATIC_DRAW);
	gl.drawArrays(gl.LINE_STRIP, 0, clicks.length / 3);
    gl.drawArrays(gl.POINTS, 0, clicks.length / 3);
}

