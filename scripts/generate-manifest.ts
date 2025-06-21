#!/usr/bin/env tsx
/**
 * File Manifest Generator
 *
 * Generates comprehensive documentation manifest for LeaderForge codebase.
 * Supports JSON and Markdown output formats with standardized comment parsing.
 *
 * Usage: npm run generate-manifest
 * Output: docs/manifest.json, docs/manifest.md
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

// Configuration
const ROOT_DIR = path.resolve(__dirname, "..");
const SCAN_DIRS = ["apps", "packages", "components", "docs"];
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /dist/,
  /build/,
  /coverage/,
  /\.git/,
  /\.pnpm/,
  /\.turbo/
];
const OUTPUT_DIR = path.join(ROOT_DIR, "docs");
const JSON_OUTPUT = path.join(OUTPUT_DIR, "manifest.json");
const MD_OUTPUT = path.join(OUTPUT_DIR, "manifest.md");

// Types
interface FileManifest {
  path: string;
  name: string;
  directory: string;
  extension: string;
  purpose: string;
  owner?: string;
  tags: string[];
  dependencies?: string[];
  exports?: string[];
  last_modified: string;
  size_bytes: number;
  hash: string;
  complexity?: "low" | "medium" | "high";
}

interface ManifestMetadata {
  generated_at: string;
  generator_version: "1.0.0";
  total_files: number;
  total_size_bytes: number;
  file_types: Record<string, number>;
  tags: Record<string, number>;
}

// Helper functions
function shouldIgnoreFile(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

function walkDir(dir: string): string[] {
  let results: string[] = [];

  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const filePath = path.join(dir, file);

      if (shouldIgnoreFile(filePath)) return;

      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(walkDir(filePath));
      } else {
        results.push(filePath);
      }
    });
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}`);
  }

  return results;
}

/**
 * Parse standardized comment block from file
 * Supports formats:
 * // File: path/to/file.ts
 * // Purpose: Description of the file
 * // Owner: Team name
 * // Tags: tag1, tag2, tag3
 */
function parseFileHeader(filePath: string): Partial<FileManifest> {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split('\n').slice(0, 20); // Check first 20 lines

    let purpose = "";
    let owner = "";
    let tags: string[] = [];
    let dependencies: string[] = [];
    let exports: string[] = [];

    // Parse structured comments
    for (const line of lines) {
      const trimmed = line.trim();

      // Purpose from structured comment
      if (trimmed.startsWith('// Purpose:')) {
        purpose = trimmed.replace('// Purpose:', '').trim();
      }

      // Owner from structured comment
      if (trimmed.startsWith('// Owner:')) {
        owner = trimmed.replace('// Owner:', '').trim();
      }

      // Tags from structured comment
      if (trimmed.startsWith('// Tags:')) {
        const tagString = trimmed.replace('// Tags:', '').trim();
        tags = tagString.split(',').map(t => t.trim()).filter(Boolean);
      }

      // Extract imports for dependencies
      if (trimmed.startsWith('import ') && trimmed.includes('from ')) {
        const match = trimmed.match(/from ['"]([^'"]+)['"]/);
        if (match) {
          dependencies.push(match[1]);
        }
      }

      // Extract exports
      if (trimmed.startsWith('export ')) {
        const match = trimmed.match(/export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/);
        if (match) {
          exports.push(match[1]);
        }
      }
    }

    // Fallback: extract purpose from JSDoc or first comment
    if (!purpose) {
      const jsdocMatch = content.match(/\/\*\*\s*\n\s*\*\s*([^\n]+)/);
      const commentMatch = content.match(/\/\/\s*(.+)/);
      purpose = jsdocMatch?.[1]?.trim() || commentMatch?.[1]?.trim() || "—";
    }

    // Auto-detect tags based on file content and path
    const autoTags = detectAutoTags(filePath, content);
    tags = [...new Set([...tags, ...autoTags])];

    return {
      purpose,
      owner: owner || undefined,
      tags,
      dependencies: dependencies.length > 0 ? dependencies : undefined,
      exports: exports.length > 0 ? exports : undefined
    };
  } catch (error) {
    return { purpose: "Error reading file", tags: ["error"] };
  }
}

function detectAutoTags(filePath: string, content: string): string[] {
  const tags: string[] = [];
  const ext = path.extname(filePath);

  // File type tags
  if (['.tsx', '.jsx'].includes(ext)) tags.push('React');
  if (['.ts', '.tsx'].includes(ext)) tags.push('TypeScript');
  if (filePath.includes('/api/')) tags.push('API');
  if (filePath.includes('/components/')) tags.push('UI');
  if (filePath.includes('/hooks/')) tags.push('hooks');
  if (filePath.includes('/lib/')) tags.push('utility');
  if (filePath.includes('/test/') || filePath.includes('.test.')) tags.push('test');
  if (filePath.includes('/docs/')) tags.push('documentation');

  // Content-based tags
  if (content.includes('createSupabaseClient')) tags.push('database');
  if (content.includes('useQuery') || content.includes('useMutation')) tags.push('React Query');
  if (content.includes('useState') || content.includes('useEffect')) tags.push('React hooks');
  if (content.includes('NextRequest') || content.includes('NextResponse')) tags.push('Next.js API');
  if (content.includes('LangGraph') || content.includes('agent')) tags.push('AI agent');
  if (content.includes('entitlement') || content.includes('permission')) tags.push('security');

  return tags;
}

function calculateComplexity(filePath: string, content: string): "low" | "medium" | "high" {
  const lines = content.split('\n').length;
  const functions = (content.match(/function\s+\w+/g) || []).length;
  const classes = (content.match(/class\s+\w+/g) || []).length;
  const complexity = lines + (functions * 5) + (classes * 10);

  if (complexity < 100) return "low";
  if (complexity < 300) return "medium";
  return "high";
}

function generateFileHash(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
  } catch {
    return "unknown";
  }
}

function generateManifest(): void {
  console.log("🔍 Scanning codebase for manifest generation...");

  const manifest: FileManifest[] = [];
  const startTime = Date.now();

  // Scan all specified directories
  SCAN_DIRS.forEach(dir => {
    const fullPath = path.join(ROOT_DIR, dir);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  Directory ${dir} does not exist, skipping...`);
      return;
    }

    console.log(`📁 Scanning ${dir}/...`);
    const files = walkDir(fullPath);

    files.forEach(file => {
      const relPath = path.relative(ROOT_DIR, file);
      const ext = path.extname(file);

      // Filter for relevant file types
      if (![".ts", ".tsx", ".js", ".jsx", ".md", ".json", ".sql"].includes(ext)) return;

      try {
        const stats = fs.statSync(file);
        const content = fs.readFileSync(file, "utf8");
        const parsed = parseFileHeader(file);

        const fileManifest: FileManifest = {
          path: relPath,
          name: path.basename(file),
          directory: path.dirname(relPath),
          extension: ext,
          purpose: parsed.purpose || "—",
          owner: parsed.owner,
          tags: parsed.tags || [],
          dependencies: parsed.dependencies,
          exports: parsed.exports,
          last_modified: stats.mtime.toISOString(),
          size_bytes: stats.size,
          hash: generateFileHash(file),
          complexity: [".ts", ".tsx", ".js", ".jsx"].includes(ext)
            ? calculateComplexity(file, content)
            : undefined
        };

        manifest.push(fileManifest);
      } catch (error) {
        console.warn(`⚠️  Could not process file ${relPath}: ${error}`);
      }
    });
  });

  // Generate metadata
  const totalSize = manifest.reduce((sum, file) => sum + file.size_bytes, 0);
  const fileTypes = manifest.reduce((acc, file) => {
    acc[file.extension] = (acc[file.extension] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const allTags = manifest.flatMap(file => file.tags);
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const metadata: ManifestMetadata = {
    generated_at: new Date().toISOString(),
    generator_version: "1.0.0",
    total_files: manifest.length,
    total_size_bytes: totalSize,
    file_types: fileTypes,
    tags: tagCounts
  };

  // Write JSON manifest
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const jsonOutput = {
    metadata,
    files: manifest.sort((a, b) => a.path.localeCompare(b.path))
  };

  fs.writeFileSync(JSON_OUTPUT, JSON.stringify(jsonOutput, null, 2));

  // Generate Markdown documentation
  generateMarkdownDocs(metadata, manifest);

  const duration = Date.now() - startTime;
  console.log(`✅ Manifest generated successfully in ${duration}ms`);
  console.log(`📊 ${manifest.length} files processed`);
  console.log(`📄 JSON: ${JSON_OUTPUT}`);
  console.log(`📖 Markdown: ${MD_OUTPUT}`);
}

function generateMarkdownDocs(metadata: ManifestMetadata, manifest: FileManifest[]): void {
  const md = `# LeaderForge Codebase Manifest

*Generated on ${new Date(metadata.generated_at).toLocaleString()}*

## Overview

- **Total Files**: ${metadata.total_files.toLocaleString()}
- **Total Size**: ${(metadata.total_size_bytes / 1024 / 1024).toFixed(2)} MB
- **Generator Version**: ${metadata.generator_version}

## File Types

${Object.entries(metadata.file_types)
  .sort(([,a], [,b]) => b - a)
  .map(([ext, count]) => `- **${ext}**: ${count} files`)
  .join('\n')}

## Most Common Tags

${Object.entries(metadata.tags)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .map(([tag, count]) => `- **${tag}**: ${count} files`)
  .join('\n')}

## File Inventory

${manifest
  .sort((a, b) => a.path.localeCompare(b.path))
  .map(file => {
    const tags = file.tags.length > 0 ? file.tags.map(t => `\`${t}\``).join(', ') : 'None';
    const owner = file.owner ? `**Owner**: ${file.owner}` : '';
    const complexity = file.complexity ? `**Complexity**: ${file.complexity}` : '';
    const size = `**Size**: ${(file.size_bytes / 1024).toFixed(1)}KB`;

    return `### \`${file.path}\`

${file.purpose}

${[owner, complexity, size].filter(Boolean).join(' • ')}
**Tags**: ${tags}
**Modified**: ${new Date(file.last_modified).toLocaleDateString()}

`;
  }).join('\n')}

---

*This manifest is automatically generated. To update file documentation, modify the comment headers in individual files.*
`;

  fs.writeFileSync(MD_OUTPUT, md);
}

// Execute if run directly
if (require.main === module) {
  generateManifest();
}

export { generateManifest };