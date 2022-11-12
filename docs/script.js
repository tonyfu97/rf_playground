var canvas = document.querySelector("#rfCanvas");
var context = canvas.getContext("2d");
var spike = document.getElementById("audio");
var model_name_menu = document.getElementById("model_name");
var layer_menu = document.getElementById("layer");
var unit_id_input = document.getElementById("unit_id");
var unit_id_label = document.getElementById("unit_id_label");
var unit_info_header = document.getElementById("unit_info");





// Load rf data.
import rf_data from '../rf_data.json' assert {type: 'json'};

// Load model, layer, and unit_id (the default values)
let model_name = model_name_menu.value;
let layer = layer_menu.value;
let conv_i = parseInt(layer.match(/\d+/)[0]) - 1;
let unit_id = parseInt(unit_id_input.value);
let num_layers = rf_data[model_name].layer_indices.length;
let num_units = rf_data[model_name].nums_units[conv_i];
unit_info_header.innerHTML = `${model_name} ${layer} no.${unit_id}`;
unit_id_label.innerHTML = `Choose a unit (0 - ${num_units-1}): `;
unit_id_input.max = num_units - 1;

const CANVAS_SIZE = 15;

let canvasPos = canvas.getBoundingClientRect();
let canvasBorderWidth = (canvasPos.right - canvasPos.left - CANVAS_SIZE)/2;
let canvasBgRgb = "rgb(128,128,128)";
let response = 0;

const populateLayerMenu = () => {
    // Clear all options first.
    layer_menu.innerHTML = '';

    // Populate with new layer options.
    for(let i = 1; i < num_layers+1; i++) {
        let thisLayerName = `conv${i}`;
        var newOption = document.createElement("option");
        newOption.textContent = thisLayerName;
        newOption.value = thisLayerName;
        layer_menu.appendChild(newOption);
    }
}
populateLayerMenu();

model_name_menu.addEventListener('change', (event) => {
    model_name = model_name_menu.value;
    num_layers = rf_data[model_name].layer_indices.length;
    conv_i = parseInt(layer.match(/\d+/)[0]) - 1
    unit_info_header.innerHTML = `${model_name} ${layer} no.${unit_id}`;
    num_units = rf_data[model_name].nums_units[conv_i];
    unit_id_label.innerHTML = `Choose a unit (0 - ${num_units-1}): `;
    unit_id_input.max = num_units - 1;
    populateLayerMenu();
});




// Change the colors of the bar and background.
var bar_color_div = document.getElementById("bar_color");
var bg_color_div = document.getElementById("bg_color");
const convertTo256 = num => Math.floor((parseFloat(num) + 1) * 128);

bar_color_div.addEventListener('change', (event) => {
    let r = document.getElementById("bar_red").value;
    let g = document.getElementById("bar_green").value;
    let b = document.getElementById("bar_blue").value;
    bar.rgb = `rgb(${convertTo256(r)},${convertTo256(g)},${convertTo256(b)})`;
    document.getElementById("bar_color_label").innerHTML = 'Bar color = ' + bar.rgb;
    bar.update();
})

bg_color_div.addEventListener('change', (event) => {
    let r = document.getElementById("bg_red").value;
    let g = document.getElementById("bg_green").value;
    let b = document.getElementById("bg_blue").value;
    let rgb = `rgb(${convertTo256(r)},${convertTo256(g)},${convertTo256(b)})`;
    document.getElementById("bg_color_label").innerHTML = 'Background color = ' + rgb;
    canvasBgRgb = rgb;
    bar.update();
})



// Load model.
const sess = new onnx.InferenceSession();
const loadingModelPromise = sess.loadModel(`../server/onnx_files/${model_name}_${layer}.onnx`);

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
        context.fillStyle = canvasBgRgb;
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.beginPath();
        context.rect(this.x, this.y, this.width, this.height);
        context.fillStyle = this.rgb;
        context.fill();
    }

    this.update = function() {
        // context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = canvasBgRgb;
        context.fillRect(0, 0, canvas.width, canvas.height);
        this.x = mouse.x - this.width / 2 - canvasPos.left - canvasBorderWidth;
        this.y = mouse.y - this.height / 2 - canvasPos.top - canvasBorderWidth;
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
        spike.volume = Math.min(response/5, 1);
        spike.play();
        }
    }, 100);
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
                rgbArray[idx++] = (imgData[offset] - 128) / 128;
            }
        }
    }
    const input = new onnx.Tensor(rgbArray, "float32", [1, 3, CANVAS_SIZE, CANVAS_SIZE]);
  
    const outputMap = await sess.run([input]);
    const outputTensor = outputMap.values().next().value;
    const responses = outputTensor.data;

    let unit_i = 0;
    let element = document.getElementById('output');
    element.innerHTML = `response = ${Math.round(responses[1] * 100) / 100}`;
    response = responses[1]
  }
