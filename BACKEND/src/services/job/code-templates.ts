/** .gitignore template contents keyed by template id */
export const GITIGNORE_TEMPLATES: Record<string, string> = {
  Python: `# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
.env
.venv
env/
venv/
ENV/

# IDE
.idea/
.vscode/
*.swp
*.swo
`,
  Node: `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Environment
.env
.env.local
.env.*.local

# Build
dist/
build/
.next/
out/
*.tsbuildinfo

# Testing
coverage/
.nyc_output/
`,
  Java: `# Compiled class files
*.class

# Build
target/
build/
out/

# IDE
.idea/
*.iml
.vscode/
*.ipr
*.iws

# Package files
*.jar
*.war
*.nar
*.ear
*.zip
*.tar.gz
*.rar
`,
  Go: `# Binaries
*.exe
*.exe~
*.dll
*.so
*.dylib

# Test binary
*.test

# Output
*.out
vendor/
`,
  Rust: `# Build
target/
Cargo.lock

# IDE
.idea/
.vscode/
*.swp
`,
  React: `# Dependencies
node_modules/

# Production
build/
dist/
.next/
out/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`,
  macOS: `.DS_Store
.AppleDouble
.LSOverride
._*
.Spotlight-V100
.Trashes
`,
  Windows: `Thumbs.db
Thumbs.db:encryptable
ehthumbs.db
ehthumbs_vista.db
Desktop.ini
`,
  VisualStudio: `# Build
[Bb]in/
[Oo]bj/
[Ll]og/
[Ll]ogs/

# Visual Studio
.vs/
*.user
*.userosscache
*.sln.docstates
`,
  Ruby: `# Gemfiles
*.gem
.bundle/
vendor/bundle/

# Logs and temp
log/
tmp/
*.log

# IDE
.idea/
.vscode/
*.swp
*.swo
`,
  iOS: `# Xcode
build/
*.pbxuser
!default.pbxuser
*.mode1v3
!default.mode1v3
*.mode2v3
!default.mode2v3
*.perspectivev3
!default.perspectivev3
xcuserdata/
*.xccheckout
*.moved-aside
DerivedData/
*.hmap
*.ipa

# CocoaPods
Pods/
*.xcworkspace
`,
  Android: `# Gradle
.gradle/
build/
local.properties

# Android Studio
*.iml
.idea/
.cxx/
*.apk
*.aab
`,
};

/** License text keyed by license id (PROPRIETARY = no file) */
export const LICENSE_TEMPLATES: Record<string, string> = {
  MIT: `MIT License

Copyright (c) {{year}} {{name}}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
  Apache: `Apache License 2.0 - See https://www.apache.org/licenses/LICENSE-2.0 for full text.`,
  GPL: `GNU General Public License v3.0 - See https://www.gnu.org/licenses/gpl-3.0.en.html for full text.`,
  BSD: `BSD 3-Clause License - See https://opensource.org/licenses/BSD-3-Clause for full text.`,
  Unlicense: `This is free and unencumbered software released into the public domain. See https://unlicense.org/ for full text.`,
  Proprietary: '', // no file
};

export function defaultReadme(repoName: string, description?: string): string {
  return `# ${repoName}

${description || 'No description provided.'}

## Getting Started

Instructions for setting up the project locally.

## Usage

Examples and documentation.

## Contributing

How to contribute to this project.

## License

See LICENSE file for details.
`;
}
