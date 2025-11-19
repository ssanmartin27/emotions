"""
Restore InputLayer but ensure it's structured correctly for TensorFlow.js 4.x
"""

import json

model_json_path = 'public/models/emotion_model/model.json'

with open(model_json_path, 'r') as f:
    data = json.load(f)

print("Restoring InputLayer for TensorFlow.js 4.x compatibility...")

layers = data['modelTopology']['model_config']['config']['layers']

# Check if first layer is Dense with inputShape
if layers and layers[0]['class_name'] == 'Dense' and 'inputShape' in layers[0]['config']:
    input_shape = layers[0]['config'].pop('inputShape')
    print(f"Extracted inputShape: {input_shape}")
    
    # Create InputLayer
    input_layer = {
        "class_name": "InputLayer",
        "config": {
            "dtype": "float32",
            "sparse": False,
            "ragged": False,
            "name": "input_layer",
            "inputShape": input_shape
        },
        "name": "input_layer",
        "inbound_nodes": []
    }
    
    # Insert InputLayer at the beginning
    layers.insert(0, input_layer)
    print("Inserted InputLayer")
    
    # Update build_input_shape
    if 'build_input_shape' in data['modelTopology']['model_config']['config']:
        data['modelTopology']['model_config']['config']['build_input_shape'] = [None] + input_shape
        print("Updated build_input_shape")

# Save fixed model
with open(model_json_path, 'w') as f:
    json.dump(data, f, separators=(',', ':'))

print("Model fixed!")


