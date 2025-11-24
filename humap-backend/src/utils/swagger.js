import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger le fichier openapi.yml
const swaggerFilePath = path.join(__dirname, "../../docs/openapi.yml");
const swaggerFile = fs.readFileSync(swaggerFilePath, "utf8");
const swaggerSpec = YAML.parse(swaggerFile);

export { swaggerUi, swaggerSpec };
