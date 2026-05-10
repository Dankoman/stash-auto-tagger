import os
import yaml
import zipfile
import hashlib

def get_sha256(filename):
    sha256_hash = hashlib.sha256()
    with open(filename, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def package_plugin():
    # Detect the plugin yml file
    yml_files = [f for f in os.listdir('.') if f.endswith('.yml') and f != 'index.yml']
    if not yml_files:
        print("No plugin .yml file found!")
        return
    
    plugin_yml_path = yml_files[0]
    plugin_id = plugin_yml_path.replace('.yml', '')
    
    print(f"Detected plugin: {plugin_id}")
    
    with open(plugin_yml_path, 'r') as f:
        config = yaml.safe_load(f)
    
    version = config.get('version', '0.0.1')
    description = config.get('description', '')
    name = config.get('name', plugin_id)
    
    zip_filename = f"{plugin_id}.zip"
    files_to_zip = [
        f"{plugin_id}.js",
        f"{plugin_id}.css",
        f"{plugin_id}.yml",
        "README.md",
        "INSTALLATION.md"
    ]
    
    # Filter files that actually exist
    files_to_zip = [f for f in files_to_zip if os.path.exists(f)]
    
    print(f"Creating {zip_filename} with files: {files_to_zip}")
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file in files_to_zip:
            zipf.write(file)
            
    sha256 = get_sha256(zip_filename)
    print(f"SHA256: {sha256}")
    
    # Update index.yml
    index_data = [{
        'name': name,
        'version': version,
        'path': zip_filename,
        'sha256': sha256,
        'description': description
    }]
    
    with open('index.yml', 'w') as f:
        yaml.dump(index_data, f, allow_unicode=True, sort_keys=False)
        
    print(f"Successfully updated index.yml to version {version}")

if __name__ == "__main__":
    package_plugin()
