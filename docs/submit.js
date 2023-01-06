// Get the model, layer, and unit id.
var model_name_menu = document.getElementById("model_name");
var layer_menu = document.getElementById("layer");
var unit_id_input = document.getElementById("unit_id");
var unit_id_label = document.getElementById("unit_id_label");

// Get model, layer, and unit_id (the default values) from index.html.
let model_name = model_name_menu.value;
let layer = layer_menu.value;
let unit_id = parseInt(unit_id_input.value);

// model dropdown menu logic:
model_name_menu.addEventListener('change', async (event) => {
  model_name = model_name_menu.value;
  layer = layer_menu.value;
  hide_submission_results();
});

// layer dropdown menu logic:
layer_menu.addEventListener('change', async (event) => {
  layer = layer_menu.value;
  hide_submission_results();
});

// unit input form logic:
unit_id_input.addEventListener('change', (event) => {
  unit_id = parseInt(unit_id_input.value);
  hide_submission_results();
});

// ultility function to hide image
const hide_submission_results = () => {
  document.getElementById('submission_results').setAttribute('style', 'display:none;');
  document.getElementById('ground_truth_img').setAttribute('style', 'display:none;');
}
hide_submission_results();

// ultility function to show image
const show_submission_results = () => {
  document.getElementById('submission_results').setAttribute('style', 'display:inline;');
  document.getElementById('ground_truth_img').setAttribute('style', 'display:inline;');
}

/* Configuring AWS S3 access
Reference Website: Viewing Photos in an Amazon S3 Bucket from a Browser
https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-photos-view.html
*/
var albumBucketName = 'rfmapping';
AWS.config.region = 'us-west-2'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: 'us-west-2:495c99f0-9773-4aef-9e01-29b3c4127e50',
});

// Create a new service object
var s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: {Bucket: albumBucketName}
});

// A utility function to create HTML.
function getHtml(template) {
    return template.join('\n');
};

// Show the photos that exist in an album.
function viewAlbum(albumName) {
  var img_url = `https://s3.us-west-2.amazonaws.com/rfmapping/${model_name}/${layer}/${unit_id}.png`;
  var html_template = [
    '<h3>Ground truth image:</h3>',
    '<img style="width:200px;height:200px;" src="' + img_url + '"/>'
  ];
  document.getElementById('ground_truth_img').innerHTML = getHtml(html_template);
};

// Submit button logic:
var submitButton = document.getElementById("submit");
submitButton.addEventListener("click", () => {
  viewAlbum("album1");
  show_submission_results();
})

// Convert image into array TODO:
// function convertImage(image) {
//   const canvas = drawImageToCanvas(image);
//   const ctx = canvas.getContext('2d');
  
//   let result = [];
//   for (let y = 0; y < canvas.height; y++) {
//     result.push([]);
//     for (let x = 0; x < canvas.width; x++) {
//       let data = ctx.getImageData(x, y, 1, 1).data;
//       result[y].push(data[0]);
//       result[y].push(data[1]);
//       result[y].push(data[2]);
//     }
//   }
