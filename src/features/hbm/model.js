import * as T from 'three';
import { HBM_PARTS as parts } from './parts';

export function buildHbmModel(world, A) {
  const material = (color) =>
    new T.MeshStandardMaterial({ color, roughness: 0.53, metalness: 0.18 });
  let model;
  const objects = [],
    tsvs = [],
    traces = [],
    pads = [],
    heat = [],
    wisps = [];
  const matColors = new Map(),
    geometryCache = new Map();
  function register(mesh, part) {
    mesh.userData.part = part;
    objects.push(mesh);
    if (mesh.material?.isMeshStandardMaterial)
      matColors.set(mesh.material, mesh.material.color.clone());
    return mesh;
  }
  function anatomySolid(spec) {
    const data = A.rings[spec.shape];
    let geometry = geometryCache.get(spec.shape);
    if (!geometry) {
      const shape = new T.Shape();
      data.ring.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
      shape.closePath();
      const bevel = Math.min(0.012, data.h * 0.18);
      geometry = new T.ExtrudeGeometry(shape, {
        depth: data.h - 2 * bevel,
        steps: 1,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 2,
        curveSegments: 2,
      });
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(0, -data.h / 2 + bevel, 0);
      geometry.computeVertexNormals();
      geometryCache.set(spec.shape, geometry);
    }
    const m = new T.Mesh(geometry, material(spec.color));
    m.position.set(...spec.at);
    m.castShadow = true;
    m.receiveShadow = true;
    model.add(m);
    register(m, spec.part);
    m.name = spec.name;
    const e = new T.LineSegments(
      new T.EdgesGeometry(geometry, 35),
      new T.LineBasicMaterial({ color: 0xd8e2e6, transparent: true, opacity: 0.2 }),
    );
    m.add(e);
    return m;
  }
  function box(parent, w, h, d, x, y, z, color, part) {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    register(mesh, part);
    const edges = new T.LineSegments(
      new T.EdgesGeometry(mesh.geometry),
      new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }),
    );
    mesh.add(edges);
    return mesh;
  }
  function contacts(parent, rows, cols, w, d, y, radius, color, part) {
    const mesh = new T.InstancedMesh(
        new T.BoxGeometry(radius * 1.7, radius * 0.7, radius * 1.7),
        material(color),
        rows * cols,
      ),
      dummy = new T.Object3D();
    let i = 0;
    for (let a = 0; a < rows; a++)
      for (let b = 0; b < cols; b++) {
        dummy.position.set((a / (rows - 1) - 0.5) * w, y, (b / (cols - 1) - 0.5) * d);
        dummy.updateMatrix();
        mesh.setMatrixAt(i++, dummy.matrix);
      }
    mesh.castShadow = true;
    parent.add(mesh);
    register(mesh, part);
    return mesh;
  }
  function text(parent, label, x, y, z, w, color = '#ffffff') {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = color;
    ctx.font = '600 54px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 256, 64);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    const mesh = new T.Mesh(
      new T.PlaneGeometry(w, w / 4),
      new T.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        side: T.DoubleSide,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  function frontText(parent, label, x, y, z, w, h, color = '#ffffff') {
    const mesh = text(parent, label, x, y, z, w, color);
    mesh.rotation.x = 0;
    mesh.geometry.dispose();
    mesh.geometry = new T.PlaneGeometry(w, h);
    return mesh;
  }
  function makeModel() {
    model = new T.Group();
    world.add(model);
    for (const spec of A.solids) anatomySolid(spec);
    // Actual attachment planes: chip → microbump → interposer → package contact.
    for (const [x, w, d, y, rows, cols, part, h] of [
      [0, 9.9, 5.3, -1.2125, 16, 8, 'substrate', 0.045],
      [-2.45, 3.25, 3.1, -0.955, 12, 8, 'bumps', 0.11],
      [2.45, 4.05, 3.75, -0.96, 14, 10, 'bumps', 0.1],
      [-2.45, 3.0, 3.1, -0.49, 12, 8, 'bumps', 0.06],
      ...[0.08, 0.68, 1.28].map((y) => [-2.45, 3.0, 3.1, y, 12, 8, 'bumps', 0.12]),
    ]) {
      const group = new T.Group();
      group.position.x = x;
      if (x < 0) group.position.z = -0.28;
      model.add(group);
      const mesh = contacts(
        group,
        rows,
        cols,
        w,
        x < 0 ? Math.min(d, 2.65) : d,
        y,
        0.041,
        part === 'substrate' ? 0x9faeb4 : 0xc9a26c,
        part,
      );
      mesh.geometry.dispose();
      mesh.geometry = new T.BoxGeometry(0.075, h, 0.075);
    }
    // TSVs are exposed by the front die cutaway, not suspended between floating slabs.
    for (let lane = 0; lane < 16; lane++) {
      const group = new T.Group();
      group.position.x = A.lanes[lane].x;
      model.add(group);
      tsvs.push(group);
      const sections = A.viaSections;
      for (const [bottom, height] of sections) {
        const via = new T.Mesh(
          new T.CylinderGeometry(0.026, 0.026, height, 12),
          material(0xc9a56e),
        );
        via.position.set(0, bottom + height / 2, 1.48);
        group.add(via);
        register(via, 'tsv');
        for (const y of [bottom, bottom + height]) {
          const land = new T.Mesh(
            new T.CylinderGeometry(0.045, 0.045, 0.014, 12),
            material(0xd8bb85),
          );
          land.position.set(0, y, 1.48);
          group.add(land);
          register(land, 'bumps');
        }
      }
      for (const [bottom, h] of [[-1.01, 0.11], ...A.joints]) {
        const joint = new T.Mesh(new T.CylinderGeometry(0.034, 0.034, h, 12), material(0xd8bb85));
        joint.position.set(0, bottom + h / 2, 1.48);
        group.add(joint);
        register(joint, 'bumps');
      }
      // The copper redistribution layer is visible only in the front interposer window.
      const pts = interposerRoute(lane),
        trace = new T.Line(
          new T.BufferGeometry().setFromPoints(pts),
          new T.LineBasicMaterial({ color: 0xc9a369, transparent: true, opacity: 0.9 }),
        );
      model.add(trace);
      traces.push(trace);
      pads.push(box(model, 0.075, 0.06, 0.09, 0.59, -0.94, -1.25 + lane * 0.17, 0xc9a369, 'phy'));
    }
    // Bank textures are lithography-like repeated regions, not exposed packaged components.
    const bankCanvas = document.createElement('canvas');
    bankCanvas.width = 256;
    bankCanvas.height = 256;
    const ctx = bankCanvas.getContext('2d');
    ctx.fillStyle = '#91afb4';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#6d969e';
    ctx.lineWidth = 1;
    for (let i = 6; i < 256; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
    }
    for (let j = 0; j < 256; j += 32) {
      ctx.strokeStyle = '#b1c8cc';
      ctx.strokeRect(0, j, 256, 24);
    }
    const texture = new T.CanvasTexture(bankCanvas);
    texture.colorSpace = T.SRGBColorSpace;
    for (const object of objects)
      if (/bank/.test(object.name)) {
        object.material.map = texture;
        object.material.color.setHex(0xa1babf);
        matColors.set(object.material, object.material.color.clone());
      }

    const plane = new T.Mesh(
      new T.PlaneGeometry(0.7, 3.2),
      new T.MeshBasicMaterial({
        color: 0xe6a25b,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: T.DoubleSide,
      }),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(0.59, -0.345, 0);
    model.add(plane);
    heat.push(plane);
    for (let i = 0; i < 6; i++) {
      const geometry = new T.BufferGeometry().setFromPoints(
        Array.from({ length: 24 }, () => new T.Vector3()),
      );
      const wisp = new T.Line(
        geometry,
        new T.LineBasicMaterial({ color: 0xce9b63, transparent: true, opacity: 0 }),
      );
      world.add(wisp);
      wisps.push(wisp);
    }
    const ground = new T.Mesh(
      new T.PlaneGeometry(200, 200),
      new T.ShadowMaterial({ opacity: 0.1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.601;
    ground.receiveShadow = true;
    world.add(ground);
  }
  function interposerRoute(index) {
    return A.lanes[index].route.slice(1).map((p) => new T.Vector3(...p));
  }
  makeModel();
  return { model, objects, tsvs, traces, pads, heat, wisps, matColors };
}
