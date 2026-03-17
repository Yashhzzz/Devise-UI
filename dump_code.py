import os

def is_binary(file_path):
    try:
        with open(file_path, 'tr') as check_file:
            check_file.read(1024)
            return False
    except UnicodeDecodeError:
        return True

def dump_codebase(root_dir, output_file):
    ignore_dirs = {'.git', 'node_modules', '.next', 'dist', 'build', '__pycache__', '.venv', 'venv', '.ruff_cache', 'temp-landingpage'}
    ignore_exts = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.mp4', '.mp3', '.wav'}
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.write("# Codebase Context\n\n")
        
        for root, dirs, files in os.walk(root_dir):
            # Modify dirs in-place to avoid walking ignored directories
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in ignore_exts:
                    continue
                
                file_path = os.path.join(root, file)
                
                # Skip the output file itself and the script
                if file_path == os.path.abspath(output_file) or file == 'dump_code.py':
                    continue
                
                if is_binary(file_path):
                    continue
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as infile:
                        content = infile.read()
                    
                    rel_path = os.path.relpath(file_path, root_dir)
                    outfile.write(f"## File: {rel_path}\n\n")
                    outfile.write(f"```{ext.replace('.', '')}\n")
                    # Using a placeholder if content is extremely large, but for a codebase context, usually we dump the whole thing.
                    outfile.write(content)
                    if not content.endswith('\n'):
                        outfile.write('\n')
                    outfile.write("```\n\n")
                    print(f"Added {rel_path}")
                except Exception as e:
                    print(f"Could not read {file_path}: {e}")

if __name__ == '__main__':
    root_directory = r'd:\devise-iris'
    output_filename = r'd:\devise-iris\codebase_context.md'
    dump_codebase(root_directory, output_filename)
    print(f"Dump complete at {output_filename}")
