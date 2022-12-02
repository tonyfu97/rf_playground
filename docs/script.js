var canvas = document.querySelector("#rfCanvas");
var actualInputCanvas = document.getElementById("actualInputCanvas");
var rfPolygonCanvas = document.getElementById("rfPolygonCanvas");
var context = canvas.getContext("2d");
var actualInputContext = canvas.getContext("2d");
var rfPolygonContext = canvas.getContext("2d");
const CANVAS_BORDER_WIDTH = 10;  // must be consistent with style.css

var model_name_menu = document.getElementById("model_name");
var layer_menu = document.getElementById("layer");
var unit_id_input = document.getElementById("unit_id");
var unit_id_label = document.getElementById("unit_id_label");

// Load rf data.
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
        // Deeper layers are too big. They are too slow to render and should
        // not be included in the dropdown menu.
        if (model_name == "vgg16" && i > 8) {
            break;
        } else if (model_name == "resnet18" && i > 15) {
            break;
        }

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

// 2 classes to store user-drawn receptive field polygon.
class RfCorner {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
};

class Rf {
    constructor() {
        this.corners = [];
        this.closePath = false;
    }

    push(x, y) {
        if (!this.closePath) {  // can't add anymore corners if the path is closed
            this.corners.push(new RfCorner(x, y));
        }
    }

    pop() {
        if (this.corners.length > 0) {
            this.corners.pop();
        }
    }

    undo() {
        if (this.closePath) {
            this.closePath = false;
        } else {
            this.pop();
        }
    }

    reset() {
        this.corners = [];
        this.closePath = false;
    }

    draw(noLine = false) {
        if (this.corners.length > 0) {
            context.beginPath();
            context.moveTo(this.corners[0].x, this.corners[0].y);
            for (let i = 1; i < this.corners.length; i++) {
                context.lineTo(this.corners[i].x, this.corners[i].y);
            }
            if (this.closePath) {
                context.closePath();
                context.fillStyle="rgba(255,200,200,0.8)";
                context.fill();
            }
            if (!noLine) {
                context.stroke();
            }
        }
    }
};
let rf = new Rf();


// RF polygon logic:
let undo_button = document.getElementById("undo");
let reset_button = document.getElementById("reset");
undo_button.addEventListener("click", () => {
    rf.undo();
    bar.update();
});
reset_button.addEventListener("click", () => {
    rf.reset();
    bar.update();
});



// Initialize bar:
function Bar(x, y, width, height, angle, rgb) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.angle = angle;  // in radians
    this.rgb = rgb;   // as string like "rgb(255, 255, 255)" or "#FFFFFF"

    this.draw = function() {
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
        this.draw();  // draw bar
        rf.draw();  // draw user-defined recepetive field polygon
    }
};
let bar = new Bar(0, 0, 5, 10, 0, "#FFFFFF");
bar.draw();


// Mouse move logic:
let barFrozen = false;  // bar will be frozen by spacebar.
window.addEventListener('mousemove',
    async (event) => {
        if (!barFrozen) {
            mouse.x = event.x + window.scrollX;
            mouse.y = event.y + window.scrollY;
        }
        bar.update();
        await loadingModelPromise;
        await updatePredictions();
});


// Enlarge/shrink/rotate/freeze the bar:
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
    } else if (name == " ") {  // spacebar
        event.preventDefault();
        barFrozen = !barFrozen;  // prevents spacebar-evoked page scrolling.
    } else if (name == "1") { // red
        document.getElementById("bar_red").value = 1;
        document.getElementById("bar_green").value = -1;
        document.getElementById("bar_blue").value = -1;
        bar.rgb = `rgb(255,0,0)`;
        document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(1, -1, -1)`;
        bar.update();
    } else if (name == "2") {  // yellow
        document.getElementById("bar_red").value = 1;
        document.getElementById("bar_green").value = 1;
        document.getElementById("bar_blue").value = -1;
        bar.rgb = `rgb(255,255,0)`;
        document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(1, 1, -1)`;
        bar.update();
    } else if (name == "3") {  // green
        document.getElementById("bar_red").value = -1;
        document.getElementById("bar_green").value = 1;
        document.getElementById("bar_blue").value = -1;
        bar.rgb = `rgb(0,255,0)`;
        document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(-1, 1, -1)`;
        bar.update();
    } else if (name == "4") {  // cyan
        document.getElementById("bar_red").value = -1;
        document.getElementById("bar_green").value = 1;
        document.getElementById("bar_blue").value = 1;
        bar.rgb = `rgb(0,255,255)`;
        document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(-1, 1, 1)`;
        bar.update();
    } else if (name == "5") {  // blue
        document.getElementById("bar_red").value = -1;
        document.getElementById("bar_green").value = -1;
        document.getElementById("bar_blue").value = 1;
        bar.rgb = `rgb(0,0,255)`;
        document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(-1, -1, 1)`;
        bar.update();
    } else if (name == "6") {  // magenta
        document.getElementById("bar_red").value = 1;
        document.getElementById("bar_green").value = -1;
        document.getElementById("bar_blue").value = 1;
        bar.rgb = `rgb(255,0,255)`;
        document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(1, -1, 1)`;
        bar.update();
    } else if (name == "7") {  // black
        document.getElementById("bar_red").value = -1;
        document.getElementById("bar_green").value = -1;
        document.getElementById("bar_blue").value = -1;
        bar.rgb = `rgb(0,0,0)`;
        document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(-1, -1, -1)`;
        bar.update();
    } else if (name == "8") {  // white
        document.getElementById("bar_red").value = 1;
        document.getElementById("bar_green").value = 1;
        document.getElementById("bar_blue").value = 1;
        bar.rgb = `rgb(255,255,255)`;
        document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(1, 1, 1)`;
        bar.update();
    } else if (name == "Enter") {
        rf.closePath = true;
        bar.update();
    }
    updatePredictions()
});


// User-drawn receptive field polygon logic:
canvas.addEventListener('mousedown', (event) => {
    let x = mouse.x - canvasPos.left - CANVAS_BORDER_WIDTH;
    x = x/canvasFactor;
    let y = mouse.y - canvasPos.top - CANVAS_BORDER_WIDTH;
    y = y/canvasFactor;
    rf.push(x, y);
    rf.draw(); 
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
};


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
});


// Volume control logic:
let maxVolumeButton = document.getElementById("volume");
let maxVolume = 5;
maxVolumeButton.addEventListener('change', (event) => {
    maxVolume = maxVolumeButton.value;
    document.getElementById("volume_label").innerHTML = `Max-Volume Response: ${maxVolume}`;
});


// Continuously playing spike sound even when mouse is not moving:
var spike = document.getElementById("audio");
canvas.addEventListener('mouseover',
    event => {
    setInterval(() => {
        if (!spike.muted && response > 0) {
        spike.volume = Math.min(response/maxVolume, 1);
        spike.play();
        }
    }, 100);
});
