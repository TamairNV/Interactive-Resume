'use strict';

var Extensions = require('../../extensions/Extensions.js');

"use strict";
class ApplicationInitHook {
  static init() {
    globalThis.__PIXI_APP_INIT__?.(this);
  }
  static destroy() {
  }
}
/** @ignore */
ApplicationInitHook.extension = Extensions.ExtensionType.Application;
class RendererInitHook {
  constructor(renderer) {
    this._renderer = renderer;
  }
  init() {
    globalThis.__PIXI_RENDERER_INIT__?.(this._renderer);
  }
  destroy() {
    this._renderer = null;
  }
}
/** @ignore */
RendererInitHook.extension = {
  type: [
    Extensions.ExtensionType.WebGLSystem,
    Extensions.ExtensionType.WebGPUSystem
  ],
  name: "initHook",
  priority: -10
};

exports.ApplicationInitHook = ApplicationInitHook;
exports.RendererInitHook = RendererInitHook;
//# sourceMappingURL=globalHooks.js.map
