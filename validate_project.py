#!/usr/bin/env python3
"""
DINO-RICHUP Project Validation Script
Validates project structure, dependencies, and basic functionality
"""

import os
import sys
import json
import subprocess
from pathlib import Path

class ProjectValidator:
    def __init__(self):
        self.project_root = Path(".")
        self.backend_dir = self.project_root / "backend"
        self.frontend_dir = self.project_root / "frontend"
        self.shared_dir = self.project_root / "shared"
        
        self.results = {}
        self.passed = 0
        self.total = 0
        
    def run_check(self, name, check_func):
        """Run a check and record results"""
        self.total += 1
        try:
            result = check_func()
            self.results[name] = {
                "passed": result["passed"],
                "message": result["message"]
            }
            if result["passed"]:
                self.passed += 1
                print(f"[PASS] {name}: {result['message']}")
            else:
                print(f"[FAIL] {name}: {result['message']}")
        except Exception as e:
            self.results[name] = {
                "passed": False,
                "message": f"Check failed with error: {str(e)}"
            }
            print(f"[FAIL] {name}: Check failed with error: {str(e)}")
    
    def check_project_structure(self):
        """Check if essential project directories and files exist"""
        essential_paths = [
            (self.backend_dir, "backend/"),
            (self.frontend_dir, "frontend/"),
            (self.shared_dir, "shared/"),
            (self.backend_dir / "main.py", "backend/main.py"),
            (self.backend_dir / "requirements.txt", "backend/requirements.txt"),
            (self.frontend_dir / "package.json", "frontend/package.json"),
            (self.frontend_dir / "src" / "App.tsx", "frontend/src/App.tsx"),
            (self.shared_dir / "configs" / "board_config.json", "shared/configs/board_config.json"),
        ]
        
        missing = []
        for path, display_name in essential_paths:
            if not path.exists():
                missing.append(display_name)
        
        if missing:
            return {
                "passed": False,
                "message": f"Missing files/dirs: {', '.join(missing)}"
            }
        return {
            "passed": True,
            "message": "Project structure is complete"
        }
    
    def check_backend_dependencies(self):
        """Check if backend dependencies are installed"""
        requirements_file = self.backend_dir / "requirements.txt"
        if not requirements_file.exists():
            return {
                "passed": False,
                "message": "requirements.txt not found"
            }
        
        try:
            # Try to import key dependencies
            import_test = """
try:
    import fastapi
    import socketio
    import pydantic
    import uvicorn
    print("SUCCESS")
except ImportError as e:
    print(f"FAILED: {e}")
"""
            result = subprocess.run(
                [sys.executable, "-c", import_test],
                capture_output=True,
                text=True,
                cwd=self.backend_dir
            )
            
            if "SUCCESS" in result.stdout:
                return {
                    "passed": True,
                    "message": "Backend dependencies are installed"
                }
            else:
                return {
                    "passed": False,
                    "message": f"Missing dependencies: {result.stdout.strip()}"
                }
        except Exception as e:
            return {
                "passed": False,
                "message": f"Failed to check dependencies: {str(e)}"
            }
    
    def check_frontend_dependencies(self):
        """Check if frontend dependencies are installed"""
        package_json = self.frontend_dir / "package.json"
        node_modules = self.frontend_dir / "node_modules"
        
        if not package_json.exists():
            return {
                "passed": False,
                "message": "package.json not found"
            }
        
        # Check if node_modules exists
        if node_modules.exists():
            # Check for key dependencies
            try:
                with open(package_json, 'r') as f:
                    package_data = json.load(f)
                
                key_deps = ["react", "typescript", "vite", "tailwindcss", "framer-motion"]
                missing_deps = []
                
                for dep in key_deps:
                    if dep not in package_data.get("dependencies", {}) and \
                       dep not in package_data.get("devDependencies", {}):
                        missing_deps.append(dep)
                
                if missing_deps:
                    return {
                        "passed": False,
                        "message": f"Missing key dependencies: {', '.join(missing_deps)}"
                    }
                return {
                    "passed": True,
                    "message": "Frontend dependencies are installed"
                }
            except Exception as e:
                return {
                    "passed": False,
                    "message": f"Failed to parse package.json: {str(e)}"
                }
        else:
            return {
                "passed": False,
                "message": "node_modules not found (run 'npm install' in frontend/)"
            }
    
    def check_typescript_compilation(self):
        """Check TypeScript compilation"""
        try:
            result = subprocess.run(
                ["npx", "tsc", "--noEmit"],
                capture_output=True,
                text=True,
                cwd=self.frontend_dir,
                timeout=30
            )
            
            # Check for critical errors (non-TS6133)
            lines = result.stderr.split('\n')
            critical_errors = [line for line in lines if 'error TS' in line and 'TS6133' not in line]
            
            if result.returncode == 0 or not critical_errors:
                warning_count = len([line for line in lines if 'TS6133' in line])
                return {
                    "passed": True,
                    "message": f"TypeScript compilation OK ({warning_count} unused variable warnings)"
                }
            else:
                error_summary = '; '.join(critical_errors[:2])
                return {
                    "passed": False,
                    "message": f"TypeScript errors: {error_summary}"
                }
        except subprocess.TimeoutExpired:
            return {
                "passed": False,
                "message": "TypeScript check timed out"
            }
        except Exception as e:
            return {
                "passed": False,
                "message": f"Failed to run TypeScript check: {str(e)}"
            }
    
    def check_game_logic_files(self):
        """Check if game logic files exist and are valid"""
        essential_logic_files = [
            (self.backend_dir / "engine" / "dice.py", "Dice engine"),
            (self.backend_dir / "engine" / "property.py", "Property engine"),
            (self.backend_dir / "engine" / "auction.py", "Auction engine"),
            (self.backend_dir / "engine" / "turn_manager.py", "Turn manager"),
            (self.backend_dir / "constants" / "game_rules.py", "Game rules"),
            (self.shared_dir / "configs" / "board_config.json", "Board config"),
        ]
        
        missing = []
        for path, name in essential_logic_files:
            if not path.exists():
                missing.append(name)
        
        if missing:
            return {
                "passed": False,
                "message": f"Missing logic files: {', '.join(missing)}"
            }
        
        # Check board config is valid JSON
        try:
            board_config = self.shared_dir / "configs" / "board_config.json"
            with open(board_config, 'r') as f:
                data = json.load(f)
            if "tiles" in data and len(data["tiles"]) == 40:
                return {
                    "passed": True,
                    "message": "Game logic files are valid (40 tiles in board config)"
                }
            else:
                return {
                    "passed": False,
                    "message": "Board config doesn't have 40 tiles"
                }
        except json.JSONDecodeError:
            return {
                "passed": False,
                "message": "Board config is not valid JSON"
            }
        except Exception as e:
            return {
                "passed": False,
                "message": f"Failed to validate game logic: {str(e)}"
            }
    
    def check_ui_components(self):
        """Check if UI components exist after redesign"""
        essential_ui_files = [
            (self.frontend_dir / "components" / "Board.tsx", "Board component"),
            (self.frontend_dir / "components" / "DiceAnim.tsx", "Dice animation"),
            (self.frontend_dir / "components" / "PlayerSidebar.tsx", "Player sidebar"),
            (self.frontend_dir / "components" / "AuctionModal.tsx", "Auction modal"),
            (self.frontend_dir / "components" / "RoomSettings.tsx", "Room settings"),
            (self.frontend_dir / "components" / "AudioSettings.tsx", "Audio settings"),
            (self.frontend_dir / "utils" / "audio.ts", "Audio system"),
            (self.frontend_dir / "constants" / "theme.ts", "Theme constants"),
            (self.frontend_dir / "tailwind.config.js", "Tailwind config"),
        ]
        
        missing = []
        for path, name in essential_ui_files:
            if not path.exists():
                missing.append(name)
        
        if missing:
            return {
                "passed": False,
                "message": f"Missing UI files: {', '.join(missing)}"
            }
        
        # Check audio.ts has SoundManager class
        try:
            audio_file = self.frontend_dir / "utils" / "audio.ts"
            with open(audio_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if "class SoundManager" in content and "playButtonClick" in content:
                return {
                    "passed": True,
                    "message": "UI components complete with audio system"
                }
            else:
                return {
                    "passed": False,
                    "message": "Audio system missing key components"
                }
        except Exception as e:
            return {
                "passed": False,
                "message": f"Failed to check UI components: {str(e)}"
            }
    
    def check_env_config(self):
        """Check if environment configuration exists"""
        env_files = [
            (self.project_root / ".env", ".env file"),
            (self.project_root / ".env.example", ".env.example file"),
        ]
        
        missing = []
        for path, name in env_files:
            if not path.exists():
                missing.append(name)
        
        if missing:
            return {
                "passed": False,
                "message": f"Missing env files: {', '.join(missing)}"
            }
        
        # Check .env has required variables
        try:
            env_file = self.project_root / ".env"
            with open(env_file, 'r') as f:
                content = f.read()
            
            required_vars = ["DINO_CORS_ORIGINS", "DINO_SECRET_KEY"]
            missing_vars = []
            
            for var in required_vars:
                if f"{var}=" not in content:
                    missing_vars.append(var)
            
            if missing_vars:
                return {
                    "passed": False,
                    "message": f"Missing env variables: {', '.join(missing_vars)}"
                }
            
            return {
                "passed": True,
                "message": "Environment configuration is complete"
            }
        except Exception as e:
            return {
                "passed": False,
                "message": f"Failed to check env config: {str(e)}"
            }
    
    def run_all_checks(self):
        """Run all validation checks"""
        print("="*60)
        print("DINO-RICHUP PROJECT VALIDATION")
        print("="*60)
        
        checks = [
            ("Project Structure", self.check_project_structure),
            ("Backend Dependencies", self.check_backend_dependencies),
            ("Frontend Dependencies", self.check_frontend_dependencies),
            ("TypeScript Compilation", self.check_typescript_compilation),
            ("Game Logic Files", self.check_game_logic_files),
            ("UI Components", self.check_ui_components),
            ("Environment Config", self.check_env_config),
        ]
        
        for name, check_func in checks:
            self.run_check(name, check_func)
        
        print("="*60)
        print(f"SUMMARY: {self.passed}/{self.total} checks passed")
        
        if self.passed == self.total:
            print("[SUCCESS] PROJECT VALIDATION PASSED")
            print("The project structure is complete and ready to run.")
            print("\nTo start the application:")
            print("1. Start backend: cd backend && uvicorn main:app --reload --port 8000")
            print("2. Start frontend: cd frontend && npm run dev")
            print("3. Open browser to http://localhost:3000")
            return True
        elif self.passed >= self.total // 2:
            print("[WARNING] PROJECT VALIDATION PARTIAL")
            print("Some checks failed. Review the issues above.")
            return False
        else:
            print("[ERROR] PROJECT VALIDATION FAILED")
            print("Multiple critical checks failed. Project may not run correctly.")
            return False

def main():
    """Main function"""
    validator = ProjectValidator()
    
    success = validator.run_all_checks()
    
    # Save results
    with open("validation_results.json", "w") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "results": validator.results,
            "summary": f"{validator.passed}/{validator.total} passed",
            "success": success
        }, f, indent=2)
    
    print(f"\nDetailed results saved to validation_results.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    import time
    sys.exit(main())