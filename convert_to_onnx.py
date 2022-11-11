import os
import json
import copy

import torch
import torch.fx as fx
import torchvision.models as models


def get_truncated_model(model, layer_index):
    """
    Create a truncated version of the neural network.

    Parameters
    ----------
    model : torch.nn.Module
        The neural network to be truncated.
    layer_index : int
        The last layer (inclusive) to be included in the truncated model.

    Returns
    -------
    truncated_model : torch.nn.Module
        The truncated model.

    Example
    -------
    model = models.alexnet(pretrained=True)
    model_to_conv2 = get_truncated_model(model, 3)
    y = model(torch.ones(1,3,200,200))
    """
    model = copy.deepcopy(model)
    model.eval()  # Make sure to trace the eval() version of the net.
    graph = fx.Tracer().trace(model)
    new_graph = fx.Graph()
    layer_counter = 0
    value_remap = {}

    for node in graph.nodes:
        # Create a new module that will be returned
        value_remap[node] = new_graph.node_copy(node, lambda n : value_remap[n])

        # If the node is a module...
        if node.op == 'call_module':
            # Get the layer object using the node.target attribute.
            layer = model
            for level in node.target.split("."):
                layer = getattr(layer, level)
            # Stop at the desired layer (i.e., truncate).
            if layer_counter == layer_index:
                new_graph.output(node)
                break

            layer_counter += 1

    return fx.GraphModule(model, new_graph)


def load_rf_data():
    with open('rf_data.json', 'r') as f:
        rf_data = json.load(f)
    return rf_data


def export_model(model_name, rf_data):
    """Load the model as onnx file. One file per conv layer."""
    model_func = getattr(models, model_name)
    model = model_func(pretrained=True)
    
    layer_indices = rf_data[model_name]['layer_indices']
    xn_list = rf_data[model_name]['xn']
    
    for conv_i in range(len(xn_list)):
        layer_index = layer_indices[conv_i]
        xn = xn_list[conv_i]

        truncated_model = get_truncated_model(model, layer_index)
        truncated_model.eval()

        dummy_input = torch.zeros((1, 3, xn, xn))
        print(dummy_input.shape)
        torch.onnx.export(truncated_model, dummy_input,
                 os.path.join('server', 'onnx_files', f'{model_name}_conv{conv_i+1}.onnx'))


if __name__ == "__main__":
    model_name = 'alexnet'
    rf_data = load_rf_data()
    export_model(model_name, rf_data)
