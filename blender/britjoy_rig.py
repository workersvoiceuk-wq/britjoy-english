"""Britjoy 2.5D rig in Blender: the official avatar artwork as ONE textured mesh,
deformed by an armature (body, head, arm, paw). Nothing is redrawn or recoloured:
an unlit (emission) shader and the Standard view transform keep the exact colours."""
import bpy, bmesh, math, os, sys
from mathutils import Vector

OUT = sys.argv[sys.argv.index('--') + 1]
IMG = os.path.join(os.path.dirname(__file__), 'avatar.png')
W, H = 655, 572
def P(x, y):  # image pixel -> scene coords (1 unit = 100 px)
    return Vector(((x - W / 2) / 100, (H / 2 - y) / 100, 0))
def smooth(e0, e1, v):
    t = max(0.0, min(1.0, (v - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# --- mesh: a dense grid covering the image, UVs straight from the pixels -------
NX, NY = 96, 84
mesh = bpy.data.meshes.new('britjoy')
verts, faces, uvs = [], [], []
for j in range(NY + 1):
    for i in range(NX + 1):
        x, y = W * i / NX, H * j / NY
        verts.append(P(x, y))
for j in range(NY):
    for i in range(NX):
        a = j * (NX + 1) + i
        faces.append((a, a + NX + 1, a + NX + 2, a + 1))
mesh.from_pydata(verts, [], faces)
uv = mesh.uv_layers.new()
for poly in mesh.polygons:
    for li in poly.loop_indices:
        v = mesh.vertices[mesh.loops[li].vertex_index].co
        uv.data[li].uv = (v.x * 100 / W + 0.5, v.y * 100 / H + 0.5)
obj = bpy.data.objects.new('britjoy', mesh)
scene.collection.objects.link(obj)

# --- unlit material: exact pixel colours with alpha ---------------------------
mat = bpy.data.materials.new('avatar')
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()
tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = bpy.data.images.load(IMG); tex.interpolation = 'Cubic'
tex.extension = 'CLIP'
emit = nt.nodes.new('ShaderNodeEmission')
transp = nt.nodes.new('ShaderNodeBsdfTransparent')
mix = nt.nodes.new('ShaderNodeMixShader')
out = nt.nodes.new('ShaderNodeOutputMaterial')
nt.links.new(tex.outputs['Color'], emit.inputs['Color'])
nt.links.new(tex.outputs['Alpha'], mix.inputs['Fac'])
nt.links.new(transp.outputs[0], mix.inputs[1])
nt.links.new(emit.outputs[0], mix.inputs[2])
nt.links.new(mix.outputs[0], out.inputs['Surface'])
obj.data.materials.append(mat)

# --- armature ----------------------------------------------------------------
arm = bpy.data.armatures.new('rig')
rig = bpy.data.objects.new('rig', arm)
scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
def bone(name, a, b, parent=None):
    eb = arm.edit_bones.new(name); eb.head = P(*a); eb.tail = P(*b); eb.roll = 0
    if parent: eb.parent = arm.edit_bones[parent]
    return eb
bone('body', (420, 600), (420, 345))
bone('head', (420, 345), (420, 20), 'body')
bone('arm', (290, 400), (155, 445), 'body')
bone('paw', (155, 445), (30, 420), 'arm')
bpy.ops.object.mode_set(mode='OBJECT')

# --- weights from regions of the artwork (smooth borders = soft joints) ------
groups = {n: obj.vertex_groups.new(name=n) for n in ('body', 'head', 'arm', 'paw')}
for v in mesh.vertices:
    x = v.co.x * 100 + W / 2
    y = H / 2 - v.co.y * 100
    head = smooth(372, 318, y) * smooth(250, 300, x)
    armw = smooth(300, 235, x) * smooth(330, 372, y)
    paw = armw * smooth(185, 135, x)
    upper = armw - paw
    body = max(0.0, 1 - head - armw)
    v.co.z = 0.004 * armw + 0.004 * paw  # the raised paw sits in front of the sleeve
    for n, w in (('body', body), ('head', head), ('arm', upper), ('paw', paw)):
        if w > 1e-4:
            groups[n].add([v.index], w, 'REPLACE')
mod = obj.modifiers.new('rig', 'ARMATURE'); mod.object = rig
obj.parent = rig

# --- which local axis turns a bone inside the picture plane? ----------------------
pb = rig.pose.bones
for b in pb:
    b.rotation_mode = 'XYZ'
def plane_axis(b):
    best = None
    for k in (0, 2):  # X or Z (Y is the bone's own length: a twist, never in-plane)
        b.rotation_euler = (0, 0, 0); b.rotation_euler[k] = 0.3
        bpy.context.view_layer.update()
        m = rig.matrix_world @ b.matrix
        z = abs((m.to_3x3() @ Vector((0, 1, 0))).z)
        if best is None or z < best[0]: best = (z, k)
    b.rotation_euler = (0, 0, 0)
    return best[1]
AX = {b.name: plane_axis(b) for b in pb}
print('in-plane axes', AX)

def key(frame, rot=None, scale=None, loc=None):
    for name, deg in (rot or {}).items():
        r = [0, 0, 0]; r[AX[name]] = math.radians(deg); pb[name].rotation_euler = r
        pb[name].keyframe_insert('rotation_euler', frame=frame)
    for name, s in (scale or {}).items():
        pb[name].scale = s; pb[name].keyframe_insert('scale', frame=frame)
    for name, l in (loc or {}).items():
        pb[name].location = l; pb[name].keyframe_insert('location', frame=frame)

def clear():
    rig.animation_data_clear()
    for b in pb:
        b.rotation_euler = (0, 0, 0); b.scale = (1, 1, 1); b.location = (0, 0, 0)

# Loops: (name, frames, keys(frame -> poses)). Body scale (x, y, z) along the bone:
# Y is the bone's length, so y > 1 = breathing in.
def idle():
    for f, (h, a, p, br) in {1: (0, 0, 0, 1.0), 19: (2.2, -3, 4, 1.012), 37: (0, -1, 0, 1.02),
                              55: (-2.2, 2, -4, 1.012), 73: (0, 0, 0, 1.0)}.items():
        key(f, rot={'head': h, 'arm': a, 'paw': p, 'body': 0}, scale={'body': (1 + (br - 1) * 0.4, br, 1)})
    return 72
def talk():
    for f, (h, a, p, br) in {1: (0, 0, 0, 1.0), 5: (4, -2, 6, 1.01), 9: (-1, 1, -3, 1.0), 13: (3, -4, 8, 1.012),
                              17: (-2, 2, -2, 1.0), 21: (2.5, -1, 5, 1.008), 25: (0, 0, 0, 1.0)}.items():
        key(f, rot={'head': h, 'arm': a, 'paw': p, 'body': 0}, scale={'body': (1, br, 1)})
    return 24
def celebrate():
    # Negative arm/paw angles raise the extended paw (checked on the rendered frames).
    for f, (h, a, p, b, br) in {1: (0, 0, 0, 0, 1.0), 7: (-3, -14, -12, 1.5, 0.97), 13: (4, -26, -20, -1, 1.03),
                                 19: (-2, -14, -6, 0, 1.0), 25: (4, -26, -22, 1.5, 1.03), 31: (-3, -12, -4, -1, 0.98),
                                 37: (2, -4, 3, 0, 1.01), 49: (0, 0, 0, 0, 1.0)}.items():
        key(f, rot={'head': h, 'arm': a, 'paw': p, 'body': b}, scale={'body': (1, br, 1)})
    return 48

# --- camera & render ------------------------------------------------------------
cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'
pad = 1.18  # room for the raised paw
cam.ortho_scale = W / 100 * pad
co = bpy.data.objects.new('cam', cam); co.location = (0.25, 0.35, 10)
scene.collection.objects.link(co); scene.camera = co
scene.render.engine = 'CYCLES'
scene.cycles.samples = 16
scene.cycles.transparent_max_bounces = 128  # the paw overlaps the sleeve when raised
scene.cycles.max_bounces = 0
scene.cycles.use_denoising = False
scene.cycles.device = 'CPU'
scene.cycles.pixel_filter_type = 'BOX'
scene.render.film_transparent = True
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.render.resolution_x = 520
scene.render.resolution_y = round(520 * (H * pad) / (W * pad))
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.fps = 24
ONLY = sys.argv[sys.argv.index('--') + 2:] or ['idle', 'talk', 'celebrate']
for name, fn in (('idle', idle), ('talk', talk), ('celebrate', celebrate)):
    if name not in ONLY: continue
    clear()
    n = fn()
    scene.frame_start, scene.frame_end = 1, n
    scene.render.filepath = os.path.join(OUT, name, 'f')
    os.makedirs(os.path.join(OUT, name), exist_ok=True)
    bpy.ops.render.render(animation=True)
    print('rendered', name, n)
