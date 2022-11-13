var canvas = document.querySelector("#rfCanvas");
var context = canvas.getContext("2d");
const CANVAS_BORDER_WIDTH = 10;  // must be consistent with style.css

var model_name_menu = document.getElementById("model_name");
var layer_menu = document.getElementById("layer");
var unit_id_input = document.getElementById("unit_id");
var unit_id_label = document.getElementById("unit_id_label");

// Load rf data.
// import rf_data from './rf_data.json' assert {type: 'json'};
let rf_data = {
    "alexnet": {
        "layer_indices": [0, 3, 6, 8, 10],
        "rf_sizes": [11, 51, 99, 131, 163],
        "xn": [15, 63, 127, 159, 191],
        "nums_units": [64, 192, 384, 256, 256]
    },
    "vgg16": {
        "layer_indices": [0, 2, 5, 7, 10, 12, 14, 17, 19, 21, 24, 26, 28],
        "rf_sizes": [3, 5, 10, 14, 24, 32, 40, 60, 76, 92, 132, 164, 196],
        "xn": [5, 7, 14, 18, 28, 36, 52, 72, 88, 104, 176, 208, 240],
        "nums_units": [64, 64, 128, 128, 256, 256, 256, 512, 512, 512, 512, 512, 512]
    },
    "resnet18": {
        "layer_indices": [0, 4, 7, 10, 13, 16, 19, 21, 24, 27, 30, 33, 35, 38, 41, 44, 47, 49, 52, 55],
        "rf_sizes": [7, 19, 27, 35, 43, 51, 67, 43, 83, 99, 115, 147, 99, 179, 211, 243, 307, 211, 371, 435],
        "xn": [9, 25, 33, 41, 49, 65, 81, 49, 97, 113, 129, 193, 129, 225, 257, 321, 385, 257, 449, 513],
        "nums_units": [64, 64, 64, 64, 64, 128, 128, 128, 128, 128, 256, 256, 256, 256, 256, 512, 512, 512, 512, 512]
    }
}

// Get model, layer, and unit_id (the default values) from index.html.
let model_name = model_name_menu.value;
let layer = layer_menu.value;
let conv_i = parseInt(layer.match(/\d+/)[0]) - 1;
let unit_id = parseInt(unit_id_input.value);
let num_layers = rf_data[model_name].layer_indices.length;
let num_units = rf_data[model_name].nums_units[conv_i];
unit_id_label.innerHTML = `Choose a unit (0 - ${num_units-1}): `;
unit_id_input.max = num_units - 1;

// populate the layer dropdown menu according to the model.
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

// Initialize canvas dimensions:
let rf_size_li = document.getElementById("rf_size_li");
let rf_size = rf_data[model_name].rf_sizes[conv_i];
let canvas_size = rf_data[model_name].xn[conv_i];
let canvasPos = canvas.getBoundingClientRect();
let canvasFactor = (canvasPos.width - 2 * CANVAS_BORDER_WIDTH) / canvas_size

// Update the string on the list item that indicates rf size and canvas size.
const updateRfSizeLi = (rf_size, canvas_size) => {
    rf_size_li.innerHTML = `RF size = ${rf_size}, Canvas size = ${canvas_size}`;
}
updateRfSizeLi(rf_size, canvas_size);

// Canvas dimension logic:
const updateCanvasSize = (model_name, conv_i) => {
    canvas_size = rf_data[model_name].xn[conv_i];
    rf_size = rf_data[model_name].rf_sizes[conv_i];
    canvas.height = canvas_size;
    canvas.width = canvas_size;
    canvasPos = canvas.getBoundingClientRect();
    canvasFactor = (canvasPos.width - 2 * CANVAS_BORDER_WIDTH) / canvas_size
    bar.update();
    updateRfSizeLi(rf_size, canvas_size);
}

// model dropdown menu logic:
model_name_menu.addEventListener('change', async (event) => {
    model_name = model_name_menu.value;
    num_layers = rf_data[model_name].layer_indices.length;
    populateLayerMenu();
    layer = layer_menu.value;
    conv_i = parseInt(layer.match(/\d+/)[0]) - 1
    num_units = rf_data[model_name].nums_units[conv_i];
    unit_id_label.innerHTML = `Choose a unit (0 - ${num_units-1}): `;
    unit_id_input.max = num_units - 1;
    sess = new onnx.InferenceSession();
    loadingModelPromise = await sess.loadModel(`./onnx_files/${model_name}_${layer}.onnx`);
    updateCanvasSize(model_name, conv_i);
});

// layer dropdown menu logic:
layer_menu.addEventListener('change', async (event) => {
    layer = layer_menu.value;
    conv_i = parseInt(layer.match(/\d+/)[0]) - 1
    num_units = rf_data[model_name].nums_units[conv_i];
    unit_id_label.innerHTML = `Choose a unit (0 - ${num_units-1}): `;
    unit_id_input.max = num_units - 1;
    sess = new onnx.InferenceSession();
    loadingModelPromise = await sess.loadModel(`./onnx_files/${model_name}_${layer}.onnx`);
    updateCanvasSize(model_name, conv_i);
});

// unit input form logic:
unit_id_input.addEventListener('change', (event) => {
    unit_id = parseInt(unit_id_input.value);
});

// Get colors of the bar and background from index.html.
var bar_color_div = document.getElementById("bar_color");
var bg_color_div = document.getElementById("bg_color");
const convertTo256 = num => Math.floor((parseFloat(num) + 1) * 128);
let canvasBgRgb = "rgb(128,128,128)";

// Bar color slider logic:
bar_color_div.addEventListener('change', (event) => {
    let r = document.getElementById("bar_red").value;
    let g = document.getElementById("bar_green").value;
    let b = document.getElementById("bar_blue").value;
    bar.rgb = `rgb(${convertTo256(r)},${convertTo256(g)},${convertTo256(b)})`;
    document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(${r}, ${g}, ${b})`;
    bar.update();
})

// Background color slider logic:
bg_color_div.addEventListener('change', (event) => {
    let r = document.getElementById("bg_red").value;
    let g = document.getElementById("bg_green").value;
    let b = document.getElementById("bg_blue").value;
    let rgb = `rgb(${convertTo256(r)},${convertTo256(g)},${convertTo256(b)})`;
    document.getElementById("bg_color_label").innerHTML = `Background color = rgb(${r}, ${g}, ${b})`;
    canvasBgRgb = rgb;
    bar.update();
})


// Load model.
let sess = new onnx.InferenceSession();
let loadingModelPromise = sess.loadModel(`./onnx_files/${model_name}_${layer}.onnx`);
let response = 0;

// Initialize mouse object (used to keep track of mouse position):
let mouse = {
    x: undefined,
    y: undefined
}

// Initialize bar:
function Bar(x, y, width, height, angle, rgb) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.angle = angle;  // in radians
    this.rgb = rgb;   // as string like "rgb(255, 255, 255)" or "#FFFFFF"

    this.draw = function() {
        context.fillStyle = canvasBgRgb;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply rotation matrix
        let top_left_x = this.x + (Math.cos(this.angle) * (-this.width/2) + Math.sin(this.angle) * (-this.height/2));
        let top_left_y = this.y + (-Math.sin(this.angle) * (-this.width/2) + Math.cos(this.angle) * (-this.height/2));

        let top_right_x = this.x + (Math.cos(this.angle) * (this.width/2) + Math.sin(this.angle) * (-this.height/2));
        let top_right_y = this.y + (-Math.sin(this.angle) * (this.width/2) + Math.cos(this.angle) * (-this.height/2));

        let bottom_left_x = this.x + (Math.cos(this.angle) * (-this.width/2) + Math.sin(this.angle) * (this.height/2));
        let bottom_left_y = this.y + (-Math.sin(this.angle) * (-this.width/2) + Math.cos(this.angle) * (this.height/2));

        let bottom_right_x = this.x + (Math.cos(this.angle) * (this.width/2) + Math.sin(this.angle) * (this.height/2));
        let bottom_right_y = this.y + (-Math.sin(this.angle) * (this.width/2) + Math.cos(this.angle) * (this.height/2));
        
        // Draw the rectangle
        context.beginPath();
        // context.rect(this.x, this.y, this.width, this.height);
        context.moveTo(top_left_x, top_left_y);
        context.lineTo(top_right_x, top_right_y);
        context.lineTo(bottom_right_x, bottom_right_y);
        context.lineTo(bottom_left_x, bottom_left_y);
        context.closePath();
        context.fillStyle = this.rgb;
        context.fill();
    }

    this.convert_mouse_xy_to_canvas_xy = function() {
        this.x = mouse.x - canvasPos.left - CANVAS_BORDER_WIDTH;
        this.x = this.x/canvasFactor;
        this.y = mouse.y - canvasPos.top - CANVAS_BORDER_WIDTH;
        this.y = this.y/canvasFactor;
    }

    this.update = function() {
        context.fillStyle = canvasBgRgb;
        context.fillRect(0, 0, canvas.width, canvas.height);
        this.convert_mouse_xy_to_canvas_xy();
        this.draw();
    }
}
let bar = new Bar(0, 0, 5, 10, 0, "#FFFFFF");
bar.draw();

// Mouse move logic:
canvas.addEventListener('mousemove',
    async (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
    bar.update();
    await loadingModelPromise;
    await updatePredictions();
});

// Continuously playing spike sound even when mouse is not moving:
var spike = document.getElementById("audio");
canvas.addEventListener('mouseover',
    event => {
    setInterval(() => {
        if (!spike.muted && response > 0) {
        spike.volume = Math.min(response/5, 1);
        spike.play();
        }
    }, 100);
});

// Enlarge/shrink/rotate the bar size:
document.addEventListener('keypress', (event) => {
    var name = event.key;

    if (name == 'w') {
        bar.height *= 1.1;
        bar.update();
    } else if (name == 's') {
        bar.height *= 0.9;
        bar.update();
    } else if (name == 'd') {
        bar.width *= 1.1;
        bar.update();
    } else if (name == 'a') {
        bar.width *= 0.9;
        bar.update();
    } else if (name == 'r') {
        bar.angle += Math.PI / 32;
        bar.update();
    } else if (name == 't') {
        bar.angle -= Math.PI / 32;
        bar.update();
    }
    updatePredictions()
});

// Get prediction. This function is called whenever the mouse is moved.
async function updatePredictions() {
    const imgData = context.getImageData(0, 0, canvas_size, canvas_size).data;
    // imgData is 1D array with length 1 * 4 * xn * xn.

    // Reshape 1D array into [1, 3, xn, xn] (but still flattens it).
    let rgbArray = new Float32Array(3 * canvas_size * canvas_size);
    let idx = 0
    for (var rgb_i = 0; rgb_i < 3; rgb_i++) { // RGB only (ignoring the 4th channel)
        for (var i = 0; i < canvas_size; i++) { // Height
            for (var j = 0; j < canvas_size; j++) { // Width
                let offset = (i * canvas_size * 4) + (j * 4) + rgb_i
                // Change color range from [0, 255] to [-1, 1).
                rgbArray[idx++] = (imgData[offset] - 128) / 128;
            }
        }
    }
    const input = new onnx.Tensor(rgbArray, "float32", [1, 3, canvas_size, canvas_size]);
    await loadingModelPromise;
    const outputMap = await sess.run([input]);
    const outputTensor = outputMap.values().next().value;
    const responses = outputTensor.data;

    let element = document.getElementById('output');
    let output_size = Math.sqrt(responses.length / num_units)
    let unit_id_flatten = ((output_size ** 2) * unit_id) - 1 + (output_size * Math.floor(output_size/2)) + Math.ceil(output_size/2);
    response = responses[unit_id_flatten];
    element.innerHTML = `response = ${Math.round(response * 100) / 100}`;
}

// Mute button initialization:
let mute_button = document.getElementById("mute");
mute_button.innerHTML = 'Spike sound: off';
mute_button.style.background = 'lightcoral';

// Mute button logic:
mute_button.addEventListener('click', () => {
    if (spike.muted) {
        mute_button.innerHTML = 'Spike sound: on';
        mute_button.style.background = 'lightgreen';
    } else {
        mute_button.innerHTML = 'Spike sound: off';
        mute_button.style.background = 'lightcoral';
    }
    spike.muted = !spike.muted;
})
