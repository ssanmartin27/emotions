import json

with open('public/models/emotion_model/model.json', 'r') as f:
    data = json.load(f)

layers = data['modelTopology']['model_config']['config']['layers']
weights = data['weightsManifest'][0]['weights']

print("=== LAYERS ===")
for i, layer in enumerate(layers):
    name = layer['config'].get('name', 'NO NAME')
    print(f"  {i}: {layer['class_name']} - name: '{name}'")

print("\n=== WEIGHTS ===")
for w in weights:
    print(f"  {w['name']}")

print("\n=== WEIGHT PATH ANALYSIS ===")
for weight in weights:
    weight_name = weight['name']
    # Split by /
    parts = weight_name.split('/')
    print(f"\nWeight: {weight_name}")
    print(f"  Parts: {parts}")
    
    if len(parts) >= 2:
        model_name = parts[0]  # Should be 'sequential'
        layer_name = parts[1]   # Should be 'dense', 'dense_1', etc.
        weight_type = parts[2] if len(parts) > 2 else 'N/A'
        
        print(f"  Model: '{model_name}'")
        print(f"  Layer: '{layer_name}'")
        print(f"  Weight type: '{weight_type}'")
        
        # Check if layer exists
        found = False
        for layer in layers:
            if layer['config'].get('name') == layer_name:
                found = True
                print(f"  OK: Found layer '{layer_name}'")
                break
        if not found:
            print(f"  X Layer '{layer_name}' NOT FOUND!")

