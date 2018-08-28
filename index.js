const hash = require('hash-sum');
const debug = require('debug')('nuxt:pwa');
const helpers = require('./helpers');
module.exports = function nuxtManifest(options) {
  const hook = () => {
    debug('Adding manifest');
    addManifest.call(this, options);
  };
  if (this.options.mode === 'spa') {
    return hook();
  }
  this.nuxt.hook ? this.nuxt.hook('build:before', hook) : this.nuxt.plugin('build', hook);
};

function addManifest(options) {
  // routerBase and publicPath
  const routerBase = this.options.router.base;
  let publicPath = helpers.fixUrl(`${routerBase}/${this.options.build.publicPath}`);
  if (helpers.isUrl(this.options.build.publicPath)) { // CDN
    publicPath = this.options.build.publicPath;
    if (publicPath.indexOf('//') === 0) {
      publicPath = `/${publicPath}`; // escape fixUrl
    }
  }
  // Defaults
  const defaults = {
    name: process.env.npm_package_name,
    short_name: process.env.npm_package_name,
    description: process.env.npm_package_description,
    publicPath,
    icons: [],
    start_url: `${routerBase}?standalone=true`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: this.options.loading && this.options.loading.color,
    lang: 'en'
  };
  // Combine sources
  const manifest = Object.assign({}, defaults, this.options.manifest, options);
  delete manifest.src;
  // Stringify manifest & generate hash
  const manifestSource = JSON.stringify(manifest);
  const manifestFileName = `manifest.${hash(manifestSource)}.json`;
  // Merge final manifest into options.manifest for other modules
  if (!this.options.manifest) {
    this.options.manifest = {};
  }
  Object.assign(this.options.manifest, manifest);
  // Register webpack plugin to emit manifest
  this.options.build.plugins.push({
    apply(compiler) {
      compiler.hooks.emit.tapAsync('nuxtManifest', (compilation, cb) => {
        compilation.assets[manifestFileName] = {
          source: () => manifestSource,
          size: () => manifestSource.length
        };
        cb();
      });
    }
  });
  // Add manifest meta
  if (!helpers.find(this.options.head.link, 'rel', 'manifest')) {
    const baseAttribute = { rel: 'manifest', href: helpers.fixUrl(`${manifest.publicPath}/${manifestFileName}`) };
    const attribute = manifest.crossorigin ? Object.assign({}, baseAttribute, { crossorigin: manifest.crossorigin }) : baseAttribute;
    this.options.head.link.push(attribute);
  } else {
    console.warn('Manifest meta already provided!');
  }
}
module.exports.meta = require('./package.json');