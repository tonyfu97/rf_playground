var canvas = document.querySelector("#rfCanvas");
var context = canvas.getContext("2d");
var spike = document.getElementById("audio"); 

const CANVAS_SIZE = 63;
let response = 0;

// Load our model.
const sess = new onnx.InferenceSession();
const loadingModelPromise = sess.loadModel("../server/onnx_files/alexnet_conv2.onnx");

let mouse = {
    x: undefined,
    y: undefined
}

function Bar(x, y, dx, dy, width, height, angle, rgb) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.width = width;
    this.height = height;
    this.angle = angle;
    this.rgb = rgb;

    this.draw = function() {
        context.beginPath();
        context.rect(this.x, this.y, this.width, this.height);
        context.fillStyle = this.rgb;
        context.fill();
    }

    this.update = function() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        this.x = mouse.x - this.width / 2 - 110;
        this.y = mouse.y - this.height / 2 - 110;
        this.draw();
    }
}

let bar = new Bar(100, 100, 0, 0, 10, 20, 0.5, "#FFFFFF");
bar.draw();

window.addEventListener('mousemove',
    event => {
    mouse.x = event.x;
    mouse.y = event.y;
    bar.update();
    updatePredictions();
});


canvas.addEventListener('mouseover',
    event => {
    setInterval(() => {
        if (response > 0) {
        spike.play();
        }
    }, 10000000/response);
});

async function updatePredictions() {
    const imgData = context.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
    // imgData is 1D array with length 1 * 4 * xn * xn.

    // Reshape 1D array into [1, 3, xn, xn].
    let rgbArray = new Float32Array(3 * CANVAS_SIZE * CANVAS_SIZE);
    let idx = 0
    for (var rgb_i = 0; rgb_i < 3; rgb_i++) { // RGB only (ignoring the 4th channel)
        for (var i = 0; i < CANVAS_SIZE; i++) { // Height
            for (var j = 0; j < CANVAS_SIZE; j++) { // Width
                let offset = (i * CANVAS_SIZE * 4) + (j * 4) + rgb_i
                rgbArray[idx++] = imgData[offset];
            }
        }
    }
    const input = new onnx.Tensor(rgbArray, "float32", [1, 3, CANVAS_SIZE, CANVAS_SIZE]);
  
    const outputMap = await sess.run([input]);
    const outputTensor = outputMap.values().next().value;
    const responses = outputTensor.data;

    let unit_i = 0;
    let element = document.getElementById('output')
    element.innerHTML = responses[1]
    response = responses[1]
  }






