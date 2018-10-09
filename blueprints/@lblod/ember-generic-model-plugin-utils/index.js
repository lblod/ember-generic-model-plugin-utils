/* eslint-env node */
const existsSync = require('exists-sync');
const fs = require('fs');
const path = require('path');

module.exports = {
  description: 'Adds models used to addon',

  normalizeEntityName() { },

  async afterInstall(options) {
    let rootPath = options.project.addonPackages['@lblod/ember-generic-model-plugin-utils'].path;
    let self = this;
    await this.exportModels(rootPath);
  },

  async exportModels(rootPath) {
    return this.runBlueprintFromDir('@lblod/ember-generic-model-plugin-utils-export-models', path.join(rootPath, 'addon', 'models'), []);
  },

  async runBlueprintFromDir(blueprint, dir, filesToIgnore) {
    let blueprintTask = this.taskFor('generate-from-blueprint');

    let files = [];

    fs.readdirSync(dir).forEach(file => {
      files.push(path.parse(file).name);
    });

    files = files.filter(file => !(/(^|\/)\.[^\/\.]/g).test(file));

    files = files.filter(file => !filesToIgnore.includes(file));

    let tasks = [];

    for(let model of files){
      let options = {
        args: [blueprint, model],
        dryRun: false,
        verbose: true,
        disableAnalytics: false
      };
      await blueprintTask.run(options);
    };
  }
};
