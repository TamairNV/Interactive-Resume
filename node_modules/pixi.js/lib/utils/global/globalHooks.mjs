import { ExtensionType } from '../../extensions/Extensions.mjs';

"use strict";
class ApplicationInitHook {
  static init() {
    globalThis.__PIXI_APP_INIT__?.(this);
  }
  static destroy() {
  }
}
/** @ignore */
ApplicationInitHook.extension = ExtensionType.Application;
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
    ExtensionType.WebGLSystem,
    ExtensionType.WebGPUSystem
  ],
  name: "initHook",
  priority: -10
};

export { ApplicationInitHook, RendererInitHook };
//# sourceMappingURL=globalHooks.mjs.map
