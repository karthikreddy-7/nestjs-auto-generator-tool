const fs = require("fs-extra");
const path = require("path");
const ejs = require("ejs");
const { execSync } = require("child_process");

const templatesDir = path.join(__dirname, "templates");
const appModulePath = path.join(process.cwd(), "src", "app.module.ts");

const generateModule = async (name) => {
  const moduleDir = path.join(process.cwd(), "src", name);
  const entityDir = path.join(moduleDir, "entity");

  try {
    await fs.ensureDir(moduleDir);
    await fs.ensureDir(path.join(moduleDir, "dto"));
    await fs.ensureDir(entityDir);

    const files = [
      {
        template: "controller.ejs",
        output: `${name.toLowerCase()}.controller.ts`,
      },
      { template: "service.ejs", output: `${name.toLowerCase()}.service.ts` },
      { template: "module.ejs", output: `${name.toLowerCase()}.module.ts` },
      {
        template: "dto/create-dto.ejs",
        output: `dto/${name.toLowerCase()}.create.dto.ts`,
      },
      {
        template: "dto/update-dto.ejs",
        output: `dto/${name.toLowerCase()}.update.dto.ts`,
      },
      {
        template: "dto/response-dto.ejs",
        output: `dto/${name.toLowerCase()}.response.dto.ts`,
      },
      {
        template: "entity.ejs",
        output: `entity/${name.toLowerCase()}.entity.ts`,
      },
    ];

    for (const file of files) {
      const templatePath = path.join(templatesDir, file.template);
      const outputPath = path.join(moduleDir, file.output);

      const template = await fs.readFile(templatePath, "utf-8");
      const rendered = ejs.render(template, { name });

      await fs.writeFile(outputPath, rendered);
    }

    console.log(`Installing dependencies for ${name} module...`);
    execSync(
      `cd ${moduleDir} && npm install --save @nestjs/common @nestjs/swagger`,
      { stdio: "inherit" }
    );

    await updateAppModule(name);

    console.log(`Module ${name} generated successfully in src/${name}!`);
  } catch (err) {
    console.error("Error generating module:", err);
  }
};

const updateAppModule = async (name) => {
  try {
    const appModuleContent = await fs.readFile(appModulePath, "utf-8");

    const importStatement = `import { ${name}Module } from './${name}/${name.toLowerCase()}.module';\n`;
    const updatedContent = appModuleContent.replace(
      /(imports\s*:\s*\[)([^]*?)(\])/,
      (match, p1, p2, p3) => {
        if (p2.includes(`${name}Module`)) {
          return match;
        }
        const importsArray = p2
          .trim()
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        if (importsArray.length === 0) {
          return `${p1}\n    ${name}Module\n${p3}`;
        }
        const lastImport = importsArray[importsArray.length - 1];
        if (lastImport.endsWith(",")) {
          importsArray.push(`    ${name}Module`);
        } else {
          importsArray.push(`    ,${name}Module,`);
        }
        return `${p1}\n${importsArray.join("\n")}\n${p3}`;
      }
    );

    const finalContent = importStatement + updatedContent;
    console.log(finalContent);
    await fs.writeFile(appModulePath, finalContent);
    console.log(`${name}Module added to app.module.ts`);
  } catch (err) {
    console.error("Error updating app.module.ts:", err);
  }
};

module.exports = { generateModule };
