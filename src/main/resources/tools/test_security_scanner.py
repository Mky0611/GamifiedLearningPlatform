import unittest
import sys
import os

# Add tools directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))
from git_security_scanner import inspect_line, mask_secret

class TestSecurityScanner(unittest.TestCase):

    def test_positive_hardcoded_password_assignment(self):
        line = "spring.datasource.password=MySecretPassword123"
        findings = inspect_line(line)
        self.assertTrue(len(findings) > 0, "Should detect raw hardcoded password assignment")
        self.assertEqual(findings[0][0], "Hardcoded sensitive assignment")

    def test_positive_env_var_with_hardcoded_secret_default(self):
        line = "spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:RealSecretDefault999}"
        findings = inspect_line(line)
        self.assertTrue(len(findings) > 0, "Should detect secret default inside ${VAR:DEFAULT}")
        self.assertEqual(findings[0][0], "Env var with hardcoded secret default")

    def test_positive_line_with_example_comment_but_real_secret(self):
        line = 'github_token = "ghp_111122223333444455556666777788889999" # this is an example for testing'
        findings = inspect_line(line)
        self.assertTrue(len(findings) > 0, "Should NOT skip line containing 'example' if it holds a real secret")
        descs = [f[0] for f in findings]
        self.assertTrue(any("GitHub PAT" in d for d in descs))

    def test_positive_connection_uri_embedded_password(self):
        line = "db.url=jdbc:postgresql://dbadmin:SuperSecretPass999@prod-db.internal:5432/main"
        findings = inspect_line(line)
        self.assertTrue(len(findings) > 0, "Should detect embedded password in connection URI")
        self.assertEqual(findings[0][0], "Connection URI with embedded password")

    def test_positive_google_api_key(self):
        line = 'const MAPS_KEY = "AIzaSyD-FakeSyntheticKeyTestingOnly123";'
        findings = inspect_line(line)
        self.assertTrue(len(findings) > 0, "Should detect Google API Key pattern")
        self.assertEqual(findings[0][0], "Google API Key")

    def test_positive_aws_key(self):
        line = "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE"
        findings = inspect_line(line)
        self.assertTrue(len(findings) > 0, "Should detect AWS Access Key ID")
        self.assertEqual(findings[0][0], "AWS Access Key ID")

    def test_positive_private_key_header(self):
        line = "-----BEGIN RSA PRIVATE KEY-----"
        findings = inspect_line(line)
        self.assertTrue(len(findings) > 0, "Should detect Private Key Header")
        self.assertEqual(findings[0][0], "Private Key Header")

    def test_positive_json_and_yaml_credentials(self):
        json_line = '"db_password": "MySecretPass_456",'
        yaml_line = "jwt_secret: TopSecretSigningKey999!"
        self.assertTrue(len(inspect_line(json_line)) > 0, "Should detect JSON password field")
        self.assertTrue(len(inspect_line(yaml_line)) > 0, "Should detect YAML secret key")

    def test_negative_safe_empty_env_placeholder(self):
        line = "spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:}"
        findings = inspect_line(line)
        self.assertEqual(len(findings), 0, "Safe empty default in env var must not be flagged")

    def test_negative_safe_template_placeholder(self):
        line = "SPRING_DATASOURCE_PASSWORD=your_secure_db_password_here"
        findings = inspect_line(line)
        self.assertEqual(len(findings), 0, "Documented placeholder template must not be flagged")

    def test_negative_html_input(self):
        line = '<input type="password" id="loginPassword" name="password" required>'
        findings = inspect_line(line)
        self.assertEqual(len(findings), 0, "HTML input field must not be flagged")

    def test_negative_java_code_call(self):
        line = "user.setPasswordHash(passwordEncoder.encode(request.getPassword()));"
        findings = inspect_line(line)
        self.assertEqual(len(findings), 0, "Java code calling setPasswordHash must not be flagged")

    def test_masking_never_reveals_raw_secret(self):
        secret = "SuperSecret123"
        masked = mask_secret(secret)
        self.assertNotIn("Secret", masked)
        self.assertIn("***[REDACTED]***", masked)

def run_tests():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestSecurityScanner)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if not result.wasSuccessful():
        sys.exit(1)

if __name__ == '__main__':
    run_tests()
