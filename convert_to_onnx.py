import json
import torch
import torchvision.models as models

def load_rf_data():
    with open('rf_data.json', 'r') as f:
        rf_data = json.load(f)
    return rf_data


def export_model(model_name, rf_data):
    model_func = getattr(models, model_name)
    model = model_func(pretrained=True)
    model.eval()
    dummy_input = torch.zeros((1, 3, 227, 227))
    torch.onnx.export(model, dummy_input, f'{model_name}.onnx')


if __name__ == "__main__":
    rf_data = load_rf_data()
    export_model("alexnet", rf_data)
