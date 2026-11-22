import subprocess
import re
import os
import sys

# High-risk key patterns in properties, YAML, JSON, and env files
SENSITIVE_KEY_RE = re.compile(
    r'(?i)(?:password|passwd|pwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|jwt[_-]?secret|db[_-]?pass)'
)

# Placeholders that are legitimate template indicators
COMMON_PLACEHOLDERS = {
    '', 'your_password_here', 'your_secure_db_password_here', 'changeme', 'change_me',
    'password_placeholder', 'dummy', 'todo', 'null', 'undefined', 'placeholder',
    'your_api_key_here', 'your_secret_here', '<password>', '<mat_khau_cua_ban>'
}

# Regex for common explicit secret formats
EXPLICIT_SECRET_PATTERNS = [
    (re.compile(r'ghp_[0-9a-zA-Z]{36}'), 'GitHub PAT (classic)'),
    (re.compile(r'github_pat_[0-9a-zA-Z_]{82}'), 'GitHub PAT (fine-grained)'),
    (re.compile(r'AIza[0-9A-Za-z\-_]{32,45}'), 'Google API Key'),
    (re.compile(r'AKIA[0-9A-Z]{16}'), 'AWS Access Key ID'),
    (re.compile(r'xox[baprs]-[0-9a-zA-Z]{10,48}'), 'Slack Token'),
    (re.compile(r'-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----'), 'Private Key Header'),
    (re.compile(r'(?:jdbc:[a-z]+://|[a-z]+://)[^/\s:@]+:([^/\s:@]+)@[^/\s]+'), 'Connection URI with embedded password'),
    (re.compile(r'eyJ[A-Za-z0-9-_]{10,}\.eyJ[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]+'), 'JWT Token string'),
]

IGNORE_FILES = {
    'phaser.min.js', 'package-lock.json', 'node_modules',
    'git_security_scanner.py', 'test_security_scanner.py'
}

def mask_secret(value: str) -> str:
    """Mask secret value so it is never printed in plaintext in logs or terminal."""
    if not value:
        return "[EMPTY]"
    v = value.strip()
    if len(v) <= 4:
        return "***[REDACTED]***"
    return f"{v[:2]}***[REDACTED]***{v[-2:]}"

def is_placeholder(val: str) -> bool:
    """Check if value is an obvious documentation or template placeholder."""
    v = val.strip().strip('"\'')
    if not v:
        return True
    if v.lower() in COMMON_PLACEHOLDERS:
        return True
    if (v.startswith('<') and v.endswith('>')) or (v.startswith('[') and v.endswith(']')):
        return True
    if 'placeholder' in v.lower() or 'example' in v.lower() or 'your_' in v.lower():
        # Only treat as placeholder if it looks like a generic label, not a long hash/key
        if len(v) < 35 and not any(c in v for c in ['/', '+', '=']):
            return True
    return False

def inspect_line(line: str):
    """
    Analyzes a line of code or configuration for sensitive patterns.
    Returns a list of tuples: (pattern_name, masked_snippet)
    """
    findings = []
    stripped = line.strip()
    if not stripped:
        return findings

    # 1. Check explicit secret patterns (Cloud tokens, private keys, URI credentials)
    for pattern, desc in EXPLICIT_SECRET_PATTERNS:
        for match in pattern.finditer(line):
            matched_str = match.group(0)
            # If it's a connection URI, inspect the captured password group
            if desc == 'Connection URI with embedded password':
                pwd = match.group(1)
                if not is_placeholder(pwd):
                    findings.append((desc, f"URI with password: {mask_secret(pwd)}"))
            else:
                findings.append((desc, mask_secret(matched_str)))

    # 2. Check Key-Value assignments (properties, YAML, JSON, .env)
    # Match: key = value, key: value, "key": "value"
    kv_match = re.search(r'(?<!\$\{)["\']?([a-zA-Z0-9_.\-]+)["\']?\s*[:=]\s*(.+)', stripped)
    if kv_match and not stripped.startswith('|'):
        key = kv_match.group(1)
        raw_val = kv_match.group(2).strip()

        # Remove inline comment if present
        # e.g., 'val # comment' -> 'val'
        val = raw_val
        if ' #' in val:
            val = val.split(' #', 1)[0].strip()
        elif ' //' in val:
            val = val.split(' //', 1)[0].strip()

        # Strip surrounding quotes and trailing semicolons/commas
        val = val.rstrip(';,').strip('"\'')

        if SENSITIVE_KEY_RE.search(key):
            # Check if this is an environment variable placeholder: ${VAR:DEFAULT}
            env_var_match = re.search(r'\$\{([^:}]+)(?::(.*))?\}', val)
            if env_var_match:
                # Group 2 is the default value
                default_val = env_var_match.group(2)
                if default_val is None or default_val == '':
                    # Safe: ${VAR} or ${VAR:} has no hardcoded default
                    pass
                else:
                    # An explicit default was provided inside ${VAR:DEFAULT}
                    if not is_placeholder(default_val):
                        findings.append((
                            'Env var with hardcoded secret default',
                            f"Key: {key} -> default: {mask_secret(default_val)}"
                        ))
            else:
                # Plain assignment: key=value
                # Exclude HTML input tags like <input type="password" name="password">
                if not ('type=' in stripped or 'for=' in stripped or '<input' in stripped):
                    if not is_placeholder(val):
                        findings.append((
                            'Hardcoded sensitive assignment',
                            f"Key: {key} -> {mask_secret(val)}"
                        ))

    return findings

def scan_working_tree():
    print("=== SCANNING WORKING TREE ===")
    matches = 0
    for root, dirs, files in os.walk('.'):
        if any(ign in root for ign in ['.git', 'node_modules', 'target', '.system_generated', '__pycache__']):
            continue
        for f in files:
            if f in IGNORE_FILES:
                continue
            if f.endswith(('.png', '.jpg', '.jpeg', '.gif', '.jar', '.exe', '.ico', '.pdf', '.zip', '.pyc')):
                continue
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as fl:
                    for line_no, line in enumerate(fl, 1):
                        findings = inspect_line(line)
                        for desc, masked in findings:
                            matches += 1
                            print(f"[FOUND] {path}:{line_no} | {desc} | {masked}")
            except Exception as e:
                pass
    print(f"Working tree scan finished. Matches: {matches}")
    return matches

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
            if any(ign in current_file for ign in IGNORE_FILES):
                continue
            findings = inspect_line(content)
            for desc, masked in findings:
                matches.append((current_commit[:8], current_file, desc, masked))

    proc.wait()

    seen = set()
    for commit, file, desc, masked in matches:
        key = (commit, file, desc)
        if key not in seen:
            seen.add(key)
            print(f"[HISTORY] [{commit}] {file} | {desc} | {masked}")

    print(f"Git history scan finished. Unique sensitive commits/files: {len(seen)}")
    return len(seen)

if __name__ == '__main__':
    if '--test' in sys.argv:
        # Run self-test suite
        from test_security_scanner import run_tests
        run_tests()
    else:
        scan_working_tree()
        scan_git_history()
