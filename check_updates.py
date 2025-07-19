#!/usr/bin/env python3
"""
📦 Structura.AI Upload Tracker
Automatically tracks file changes and updates version manifest
"""

import os
import hashlib
import json
from datetime import datetime
from pathlib import Path

class UploadTracker:
    def __init__(self, upload_dir="."):
        self.upload_dir = Path(upload_dir)
        self.manifest_file = self.upload_dir / "file_hashes.json"
        self.version_file = self.upload_dir / "upload_versions.md"
        
    def get_file_hash(self, filepath):
        """Calculate SHA256 hash of file"""
        try:
            with open(filepath, 'rb') as f:
                return hashlib.sha256(f.read()).hexdigest()[:8]
        except:
            return "00000000"
    
    def load_manifest(self):
        """Load existing file hashes"""
        if self.manifest_file.exists():
            with open(self.manifest_file, 'r') as f:
                return json.load(f)
        return {}
    
    def save_manifest(self, manifest):
        """Save file hashes"""
        with open(self.manifest_file, 'w') as f:
            json.dump(manifest, f, indent=2)
    
    def check_changes(self):
        """Check for file changes and update manifest"""
        current_manifest = self.load_manifest()
        changes = []
        
        # Check all files in upload directory
        for filepath in self.upload_dir.rglob('*'):
            if filepath.is_file() and filepath.name not in ['.DS_Store', 'file_hashes.json']:
                relative_path = str(filepath.relative_to(self.upload_dir))
                current_hash = self.get_file_hash(filepath)
                
                if relative_path in current_manifest:
                    old_hash = current_manifest[relative_path]['hash']
                    if current_hash != old_hash:
                        changes.append({
                            'file': relative_path,
                            'old_hash': old_hash,
                            'new_hash': current_hash,
                            'status': 'modified'
                        })
                else:
                    changes.append({
                        'file': relative_path,
                        'old_hash': None,
                        'new_hash': current_hash,
                        'status': 'new'
                    })
                
                # Update manifest
                current_manifest[relative_path] = {
                    'hash': current_hash,
                    'modified': datetime.now().isoformat(),
                    'uploaded': False
                }
        
        self.save_manifest(current_manifest)
        return changes
    
    def update_version_file(self, changes):
        """Update the version tracking markdown file"""
        if not changes:
            print("✅ No changes detected")
            return
        
        print(f"🔄 Found {len(changes)} changed files:")
        for change in changes:
            print(f"   • {change['file']} ({change['status']})")
        
        # Update version file with new status
        if self.version_file.exists():
            content = self.version_file.read_text()
            
            # Mark changed files as not uploaded
            for change in changes:
                filename = change['file']
                # Find the line with this file and mark it as not uploaded
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if filename in line and '✅ Uploaded' in line:
                        lines[i] = line.replace('✅ Uploaded', '❗Not yet uploaded')
                        break
                
                content = '\n'.join(lines)
            
            self.version_file.write_text(content)
            print("📝 Updated upload_versions.md")
    
    def mark_uploaded(self, filename):
        """Mark a file as uploaded"""
        if self.version_file.exists():
            content = self.version_file.read_text()
            lines = content.split('\n')
            
            for i, line in enumerate(lines):
                if filename in line and '❗Not yet uploaded' in line:
                    lines[i] = line.replace('❗Not yet uploaded', '✅ Uploaded')
                    break
            
            self.version_file.write_text('\n'.join(lines))
            print(f"✅ Marked {filename} as uploaded")

def main():
    tracker = UploadTracker()
    
    print("🔍 Checking for file changes...")
    changes = tracker.check_changes()
    
    if changes:
        tracker.update_version_file(changes)
        print("\n📋 Files that need upload:")
        for change in changes:
            print(f"   • {change['file']}")
    else:
        print("✅ All files are up to date!")
    
    print(f"\n📁 Upload directory: {tracker.upload_dir}")
    print("🌐 GitHub repo: https://github.com/rushabhai2025/structura-backend-new")

if __name__ == "__main__":
    main() 