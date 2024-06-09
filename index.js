#!/usr/bin/env node

const { program } = require('commander');
const { generateModule } = require('./generate');

program
  .version('1.0.0')
  .description('NestJS Module Generator');

program
  .command('generate <names...>')
  .description('Generate new modules with controllers, services, etc.')
  .action(async (names) => {
    for (const name of names) {
      try {
        await generateModule(name);
        console.log(`Module ${name} generated successfully`);
      } catch (err) {
        console.error(`Error generating module ${name}:`, err);
      }
    }
  });

program.parse(process.argv);
