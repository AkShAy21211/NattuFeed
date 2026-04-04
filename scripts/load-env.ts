import * as fs from "fs";
import * as path from "path";

/**
 * 🛠️ Environment Loader for Standalone Scripts
 * Manually loads .env.local because tsx doesn't do it automatically like Next.js.
 */
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) return;
    
    const [key, ...valueParts] = trimmedLine.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
      process.env[key.trim()] = value;
    }
  });
  console.log("📝 Loaded .env.local variables");
}
