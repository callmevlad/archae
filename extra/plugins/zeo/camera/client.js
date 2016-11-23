class Camera {
  constructor(archae) {
    this._archae = archae;
  }

  mount() {
    const {_archae: archae} = this;

    let live = true;
    this._cleanup = () => {
      live = false;
    };

    return archae.requestEngines([
      '/core/engines/zeo',
    ]).then(([
      zeo,
    ]) => {
      if (live) {
        const {THREE, scene, camera, renderer} = zeo;

        const renderTarget = (() => {
          const rendererSize = renderer.getSize();
          const rendererPixelRatio = renderer.getPixelRatio();
          const renderPixelFactor = 0.05;
          const resolutionWidth = rendererSize.width * rendererPixelRatio * renderPixelFactor;
          const resolutionHeight = rendererSize.height * rendererPixelRatio * renderPixelFactor;
          const renderTarget = new THREE.WebGLRenderTarget(resolutionWidth, resolutionHeight, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            // format: THREE.RGBFormat,
            format: THREE.RGBAFormat,
          });
          return renderTarget;
        })();

        const cameraWidth = 0.2;
        const cameraHeight = 0.15;
        const cameraDepth = 0.1;

        const cameraMesh = (() => {
          const result = new THREE.Object3D();
          result.position.x = -0.5;
          result.position.y = 1.5;
          result.position.z = 0.5;
          result.rotation.y = Math.PI * (3 / 4);

          const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            wireframe: true,
            opacity: 0.5,
            transparent: true,
          });

          const baseMesh = (() => {
            const geometry = new THREE.BoxBufferGeometry(cameraWidth, cameraHeight, cameraDepth);

            const material = wireframeMaterial;

            const mesh = new THREE.Mesh(geometry, material);
            return mesh;
          })();
          result.add(baseMesh);
          result.baseMesh = baseMesh;

          const lensMesh = (() => {
            const lensWidth = cameraWidth * 0.4;
            const lensHeight = lensWidth;
            const lensDepth = lensWidth;

            const geometry = (() => {
              const result = new THREE.BoxBufferGeometry(lensWidth, lensHeight, lensDepth);
              result.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -(cameraDepth / 2) - (lensDepth / 2)));
              return result;
            })();

            const material = wireframeMaterial;

            const mesh = new THREE.Mesh(geometry, material);
            return mesh;
          })();
          result.add(lensMesh);
          result.lensMesh = lensMesh;

          const screenMesh = (() => {
            const screenWidth = cameraWidth;
            const screenHeight = cameraHeight;
            const geometry = (() => {
              const result = new THREE.PlaneBufferGeometry(screenWidth, screenHeight);
              result.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, cameraDepth / 2));
              return result;
            })();
            const material = (() => {
              const result = new THREE.MeshBasicMaterial({
                map: renderTarget.texture,
              });
              result.polygonOffset = true;
              result.polygonOffsetFactor = -1;
              return result;
            })();
            const mesh = new THREE.Mesh(geometry, material);
            return mesh;
          })();
          result.add(screenMesh);
          result.screenMesh = screenMesh;

          return result;
        })();
        scene.add(cameraMesh);

        const sourceCamera = new THREE.PerspectiveCamera(45, cameraWidth / cameraHeight, camera.near, camera.far);

        const _update = () => {
          const lensPosition = new THREE.Vector3();
          const lensRotation = new THREE.Quaternion();
          const lensScale = new THREE.Vector3();
          cameraMesh.lensMesh.updateMatrixWorld();
          cameraMesh.lensMesh.matrixWorld.decompose(lensPosition, lensRotation, lensScale);

          sourceCamera.position.copy(lensPosition);
          sourceCamera.quaternion.copy(lensRotation);

          cameraMesh.visible = false;
          renderer.render(scene, sourceCamera, renderTarget);
          renderer.setRenderTarget(null);
          cameraMesh.visible = true;
        };

        return {
          update: _update,
        }
      }
    });
  }
}

module.exports = Camera;