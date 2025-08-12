import * as THREE from 'three';

export class XRControl {
  gl = navigator.gl;

  /**
   * 启动XR会话
   */
  startXRSession() {
    if (!navigator.xr) {
      console.error('WebXR不支持');
      return;
    }

    navigator.xr.requestSession('immersive-ar', {})
      .then((session) => {
        console.log('XR会话启动成功');
        setupXRSession(session);
      })
      .catch((err) => {
        console.error('XR会话启动失败:', err);
      });
  }

  /**
   * 设置XR会话
   * @param {XRSession} session XR会话
   */
  setupXRSession(session) {
    const renderer = gl
      ? new THREE.WebGLRenderer({ context: gl })
      : new THREE.WebGLRenderer({ antialias: true });

    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');

    if (gl) {
      const baseLayer = new XRWebGLLayer(session, gl);
      session.updateRenderState({ baseLayer });
    }

    renderer.xr.setSession(session);
    return renderer;
  }
}
