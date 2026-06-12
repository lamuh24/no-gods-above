import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import StatusBadge from "./StatusBadge.jsx";

export default function ModelViewer({ modelUrl, emptyHint }) {
  const mountRef = useRef(null);
  const [viewerState, setViewerState] = useState("waiting");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1014);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
    camera.position.set(2.7, 2.1, 4.2);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const grid = new THREE.GridHelper(4, 16, 0x2ce4f0, 0x222d33);
    scene.add(grid);
    scene.add(new THREE.HemisphereLight(0xf5f5ea, 0x22333a, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(3, 5, 2);
    scene.add(key);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let activeModel = null;
    if (modelUrl) {
      setViewerState("loading");
      new GLTFLoader().load(
        modelUrl,
        (gltf) => {
          activeModel = gltf.scene;
          const box = new THREE.Box3().setFromObject(activeModel);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          activeModel.position.x -= center.x;
          activeModel.position.y -= box.min.y;
          activeModel.position.z -= center.z;
          scene.add(activeModel);
          controls.target.set(0, Math.max(size.y * 0.45, 0.8), 0);
          setViewerState("ready");
        },
        undefined,
        () => setViewerState("failed")
      );
    } else {
      setViewerState("waiting");
      const material = new THREE.MeshStandardMaterial({ color: 0x2ce4f0, roughness: 0.7, metalness: 0.05, wireframe: true });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.8, 0.38), material);
      mesh.position.y = 0.9;
      scene.add(mesh);
      activeModel = mesh;
    }

    let raf = 0;
    const render = () => {
      raf = requestAnimationFrame(render);
      controls.update();
      if (activeModel && !modelUrl) activeModel.rotation.y += 0.006;
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [modelUrl]);

  return (
    <div className="viewer-shell">
      <div className="viewer-toolbar">
        <span>3D Preview</span>
        <StatusBadge
          small
          status={viewerState === "ready" ? "ready" : viewerState === "failed" ? "failed" : viewerState === "loading" ? "processing" : "not_started"}
        />
      </div>
      <div className="viewer-canvas" ref={mountRef}>
        {!modelUrl && <div className="viewer-hint">{emptyHint || "No model yet — generate or import one in Step 3."}</div>}
      </div>
    </div>
  );
}
