import readline from 'readline';
import util from 'util';
import path from 'path';
import { promises as fs } from 'fs';
import initDefaultSteps from './defaultSteps';

export default class HentaInstaller {
  steps = [];
  loadedSettings = new Map();

  constructor(title, useDefaultSteps) {
    this.title = title;
    if (useDefaultSteps) {
      initDefaultSteps(this);
    }

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.rl._writeToOutput = str => {
      if (!this.rl.stdoutMuted) {
        this.rl.output.write(str);
      }
    };

    this.question = async (str, muted) => {
      console.log(str);
      this.rl.stdoutMuted = muted;
      const resp = await new Promise((resolve) => this.rl.question('', resolve));
      this.rl.stdoutMuted = false;

      return resp;
    };
  }

  add(options) {
    this.steps.push(options);
  }

  async run() {
    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];

      const response = await this.question(`❔  ${step.text}`, step.mute);
      const [isError, result] = await step.handler(this, response);
      if (isError) {
        console.log(`⛔  ${result}`);
        i--;
        continue;
      }

      console.log(`✔ ${result}`);
    }

    await this.apply();
    this.rl.close();
  }

  async readFileOrCreate(path) {
    try {
      return await fs.readFile(path);
    } catch (err) {
      await fs.writeFile(path, '{}');
      return '{}';
    }
  }

  async getSettings(_path) {
    const fullPath = path.resolve(`./settings/${_path}`);
    if (this.loadedSettings.get(fullPath)) {
      return this.loadedSettings.get(fullPath);
    }

    const settings = JSON.parse(await this.readFileOrCreate(fullPath));
    this.loadedSettings.set(fullPath, settings);

    return settings;
  }

  check(obj, field, defaultValue = {}) {
    obj[field] = obj[field] || defaultValue;
  }

  async apply() {
    console.log('💾  Сохранение настроек...');
    const settingsToSave = Array.from(this.loadedSettings);
    await Promise.all(settingsToSave.map(([k, v]) => fs.writeFile(k, JSON.stringify(v, null, '\t'))));
    console.log('✅  Ваш бот готов.');
    console.log('🔘  Запустить бота: yarn/npm start');
  }
}