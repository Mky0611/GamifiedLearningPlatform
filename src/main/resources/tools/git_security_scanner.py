import subprocess
import re
import os

patterns = [
    (r'(?i)password\s*[:=]\s*([^\s;,\'"]+)', 'password assignment'),
    (r'(?i)secret\s*[:=]\s*([^\s;,\'"]+)', 'secret key'),
    (r'(?i)api[_-]?key\s*[:=]\s*([^\s;,\'"]+)', 'api key'),
    (r'(?i)bearer\s+[A-Za-z0-9\-._~+/]+=*', 'bearer token'),
    (r'ghp_[A-Za-z0-9]{36}', 'github personal access token'),
    (r'github_pat_[A-Za-z0-9_]{82}', 'github fine-grained token'),
    (r'-----BEGIN [A-Z ]+ PRIVATE KEY-----', 'private key'),
    (r'(?i)jwt[_-]?secret\s*[:=]\s*([^\s;,\'"]+)', 'jwt secret'),
]

ignore_names = ['phaser.min.js', 'package-lock.json', 'node_modules', 'git_security_scanner.py', 'scan_working_tree.py']

def scan_working_tree():
    print("=== SCANNING WORKING TREE ===")
    matches = 0
    for root, dirs, files in os.walk('.'):
        if any(ign in root for ign in ['.git', 'node_modules', 'target', '.system_generated']):
            continue
        for f in files:
            if f in ignore_names:
                continue
            if f.endswith(('.png', '.jpg', '.jpeg', '.gif', '.jar', '.exe', '.ico', '.pdf', '.zip')):
                continue
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as fl:
                    for line_no, line in enumerate(fl, 1):
                        for pat, desc in patterns:
                            # Skip environment variable placeholders like ${VAR:...}
                            if '${' in line:
                                continue
                            if any(w in line.lower() for w in ['placeholder', 'example', 'type="password"', 'for="', 'name="password"']):
                                continue
                            m = re.search(pat, line)
                            if m:
                                matches += 1
                                print(f"Found in {path}:{line_no} [{desc}] -> line contains sensitive pattern (masked)")
            except Exception as e:
                pass
    print(f"Working tree scan finished. Matches: {matches}")

def scan_git_history():
    print("\n=== SCANNING GIT HISTORY ===")
    proc = subprocess.Popen(
        ['git', 'log', '-p', '--all'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        errors='ignore'
    )

    matches = []
    current_commit = 'unknown'
    current_file = 'unknown'

    for line in proc.stdout:
        if line.startswith('commit '):
            current_commit = line.split()[1]
        elif line.startswith('diff --git '):
            parts = line.strip().split()
            current_file = parts[-1] if parts else 'unknown'
        elif line.startswith('+') and not line.startswith('+++'):
            content = line[1:].strip()
            if any(ign in current_file for ign in ignore_names):
                continue
            if '${' in content or any(w in content.lower() for w in ['placeholder', 'example', 'type="password"', 'for="', 'name="password"']):
                continue
            for pat, desc in patterns:
                for m in re.finditer(pat, content):
                    matches.append((current_commit[:8], current_file, desc))

    proc.wait()

    seen = set()
    for commit, file, desc in matches:
        key = (commit, file, desc)
        if key not in seen:
            seen.add(key)
            print(f"History commit [{commit}] {file} | {desc} (value masked)")

    print(f"Git history scan finished. Unique sensitive commits/files: {len(seen)}")

if __name__ == '__main__':
    scan_working_tree()
    scan_git_history()
