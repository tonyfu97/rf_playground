// Get the model, layer, and unit id.
var model_name_menu = document.getElementById("model_name");
var layer_menu = document.getElementById("layer");
var unit_id_input = document.getElementById("unit_id");
var unit_id_label = document.getElementById("unit_id_label");

// Get model, layer, and unit_id (the default values) from index.html.
let model_name = model_name_menu.value;
let layer = layer_menu.value;
let unit_id = parseInt(unit_id_input.value);

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

// model dropdown menu logic:
model_name_menu.addEventListener('change', async (event) => {
  model_name = model_name_menu.value;
  layer = layer_menu.value;
  hide_ground_truth_img();
});

// layer dropdown menu logic:
layer_menu.addEventListener('change', async (event) => {
  layer = layer_menu.value;
  hide_ground_truth_img();
});

// unit input form logic:
unit_id_input.addEventListener('change', (event) => {
  unit_id = parseInt(unit_id_input.value);
  hide_ground_truth_img();
});

// // ultility function to hide image:
const hide_ground_truth_img = () => {
  document.getElementById('ground_truth_img_div').setAttribute('style', 'display:none;');
}
hide_ground_truth_img();

/* Configuring AWS S3 access
Reference Website: Viewing Photos in an Amazon S3 Bucket from a Browser
https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-photos-view.html
*/
var albumBucketName = 'rfmapping';
AWS.config.region = 'us-west-2'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: 'us-west-2:495c99f0-9773-4aef-9e01-29b3c4127e50',
});

// create a new service object
var s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: {Bucket: albumBucketName}
});

// utility function to create HTML.
function getHtml(template) {
    return template.join('\n');
};

// show the photos that exist in an album.
function load_ground_truth_img() {
  var img_url = `https://s3.us-west-2.amazonaws.com/rfmapping/${model_name}/${layer}/${unit_id}.png`;
  var html_template = [
    '<h3>Ground truth image:</h3>',
    '<img id="ground_truth_img" style="display:none;" src="' + img_url + '"/>',
    '<img style="width:250px;height:250px;" src="' + img_url + '"/>'
  ];
  document.getElementById('ground_truth_img_div').innerHTML = getHtml(html_template);
};

// submit button logic:
var submitButton = document.getElementById("submit");
submitButton.addEventListener("click", async() => {
  // Load the ground truth image from AWS.
  load_ground_truth_img();

  // Wait 300 ms for the image to load first.
  await delay(300);

  // Get the flatten image array of the ground truth image.
  let ground_truth_img = document.getElementById('ground_truth_img');
  let ground_truth_canvas = convert_image_to_canvas(ground_truth_img);
  let ground_truth_array = convert_canvas_to_array(ground_truth_canvas);

  // Get the flatten image array of the user-drawn RF polygon (cropped).
  let rf_polygon_canvas = document.getElementById("rfPolygonCanvas");
  let rf_polygon_array = convert_canvas_to_array(rf_polygon_canvas);

  // Metric calculations:
  let R = pcorr(ground_truth_array, rf_polygon_array);

  // Update the html element to display the metrics:
  let submission_results_div = document.getElementById('submission_results');
  submission_results_div.innerHTML = getHtml([
    '<h3>Submission results:</h3>',
        '<ul>',
            `<li id="direct_corr">Direct correlation: ${R}</li>`,
            `<li id="earth_mover">Earth mover distance:</li>`,
            `<li id="iou">Intersection over union:</li>`,
        `</ul>`
  ]);

  // Display the ground truth image.
  document.getElementById('ground_truth_img_div').setAttribute('style', 'display:inline;');
});

// ultility function to delay. Use in async function:
function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
};

// ultility function to convert image to canvas:
const convert_image_to_canvas = (image) => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext('2d').drawImage(image, 0, 0, image.width, image.height);
  return canvas;
};

// ultility function to convert canvas into array:
const convert_canvas_to_array = (temp_canvas) => {
  const ctx = temp_canvas.getContext('2d');
  
  // We need to calculate the padding because the input to the neural net is
  // larger than the ground truth (i.e., receptive field) size.
  let conv_i = parseInt(layer.match(/\d+/)[0]) - 1;
  let rf_size = rf_data[model_name].rf_sizes[conv_i];
  let padding = (temp_canvas.height - rf_size) / 2;

  let result = [];
  for (let y = padding; y < temp_canvas.height - padding; y++) {
    for (let x = padding; x < temp_canvas.width - padding; x++) {
      let data = ctx.getImageData(x, y, 1, 1).data; // get one pixel at (x, y)
      result.push(data[0]); // Get the red channel. Doesn't matter since the image is grayscale.
    }
  }
  console.log(result);
  return result;
};

// tltility function to calculate Pearson coorelation coefficient:
// Credit: https://stackoverflow.com/questions/15886527/javascript-library-for-pearson-and-or-spearman-correlations
const pcorr = (x, y) => {
  let sumX  = 0,
      sumY  = 0,
      sumXY = 0,
      sumX2 = 0,
      sumY2 = 0;
  const minLength = x.length = y.length = Math.min(x.length, y.length),
    reduce = (xi, idx) => {
      const yi = y[idx];
      sumX += xi;
      sumY += yi;
      sumXY += xi * yi;
      sumX2 += xi * xi;
      sumY2 += yi * yi;
    }
  x.forEach(reduce);
  let numerator = (minLength * sumXY - sumX * sumY);
  let denominator =  Math.sqrt((minLength * sumX2 - sumX * sumX) * (minLength * sumY2 - sumY * sumY));
  if (denominator == 0) { return 0; }
  return numerator / denominator;
};

// ultility function to calculate intersection over union (IOU):
const iou = (x, y, threshold) => {
  ;
};

