var canvas = document.querySelector("#rfCanvas");
var context = canvas.getContext("2d");

// Load our model.
const sess = new onnx.InferenceSession();
const loadingModelPromise = sess.loadModel("../onnx_files/alexnet_conv2.onnx");

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

let bar = new Bar(100, 100, 0, 0, 100, 200, 0.5, "#FE8E9D");
bar.draw();

window.addEventListener('mousemove',
    event => {
    mouse.x = event.x;
    mouse.y = event.y;
    bar.update();
});

async function updatePredictions() {
    // Get the predictions for the canvas data.
    const imgData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const input = new onnx.Tensor(new Float32Array(imgData.data), "float32");
  
    const outputMap = await sess.run([input]);
    const outputTensor = outputMap.values().next().value;
    const predictions = outputTensor.data;
    const maxPrediction = Math.max(...predictions);
  
    for (let i = 0; i < predictions.length; i++) {
      const element = document.getElementById(`prediction-${i}`);
      element.children[0].children[0].style.height = `${predictions[i] * 100}%`;
      element.className =
        predictions[i] === maxPrediction
          ? "prediction-col top-prediction"
          : "prediction-col";
    }
  }
