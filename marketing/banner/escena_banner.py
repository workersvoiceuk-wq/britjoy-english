"""
Escena 3D del banner de Britjoy English (Blender 5.x, motor Cycles).

El león es el avatar OFICIAL del dueño (PNG con transparencia) puesto como
lámina en la escena: no se redibuja ni se modifica. Se ilumina con emisión para
conservar sus colores exactos, y proyecta sombra sobre el podio.

Uso:
  python escena_banner.py --avatar <ruta/approved-britjoy-lion.png> \
      --salida <render.png> --ancho 1920 --alto 800 [--formato ancho|cuadrado] \
      [--fuente Nunito-Black.ttf] [--blend escena.blend]
"""
import argparse
import math
import sys

import bpy

LEVELS = [
    ("A1", "#58CC02"), ("A2", "#1CB0F6"), ("B1", "#CE82FF"),
    ("B2", "#FF9600"), ("C1", "#FF4B4B"), ("C2", "#2B70C9"),
]


def args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    p = argparse.ArgumentParser()
    p.add_argument("--avatar", required=True)
    p.add_argument("--salida", required=True)
    p.add_argument("--ancho", type=int, default=1920)
    p.add_argument("--alto", type=int, default=800)
    p.add_argument("--formato", choices=["ancho", "cuadrado"], default="ancho")
    p.add_argument("--muestras", type=int, default=96)
    p.add_argument("--blend")
    p.add_argument("--fuente", help="TTF para las letras de nivel (p. ej. Nunito Black)")
    return p.parse_args(argv)


def hex_rgba(h, a=1.0):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, a)


def material(name, color, rough=0.45, emission=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = hex_rgba(color)
    bsdf.inputs["Roughness"].default_value = rough
    if emission:
        bsdf.inputs["Emission Color"].default_value = hex_rgba(color)
        bsdf.inputs["Emission Strength"].default_value = emission
    return m


def rounded_box(name, size, loc, color, bevel=0.12, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mod = o.modifiers.new("bevel", "BEVEL")
    mod.width = bevel
    mod.segments = 6
    bpy.ops.object.shade_smooth()
    o.data.materials.append(material(name + "-mat", color, rough=0.35))
    return o


FONT = None


def label(text, parent, depth, color="#FFFFFF"):
    bpy.ops.object.text_add(location=(0, 0, 0))
    t = bpy.context.object
    if FONT:
        t.data.font = FONT
    t.data.body = text
    t.data.align_x = "CENTER"
    t.data.align_y = "CENTER"
    t.data.size = 0.46
    t.data.extrude = 0.025
    t.data.bevel_depth = 0.008
    t.data.materials.append(material(text + "-txt", color, rough=0.3))
    # Se coloca en coordenadas de mundo a partir de la transformación del bloque,
    # pegado a su cara frontal y mirando a cámara.
    from mathutils import Euler, Matrix
    bpy.context.view_layer.update()
    t.matrix_world = (
        parent.matrix_world
        @ Matrix.Translation((0, -depth / 2 - 0.03, 0))
        @ Euler((math.radians(90), 0, 0)).to_matrix().to_4x4()
    )
    return t


def build(a):
    global FONT
    bpy.ops.wm.read_factory_settings(use_empty=True)
    FONT = bpy.data.fonts.load(a.fuente) if a.fuente else None
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = a.muestras
    scene.cycles.use_denoising = True
    scene.render.resolution_x = a.ancho
    scene.render.resolution_y = a.alto
    scene.render.film_transparent = False
    # "Standard" reproduce los colores del PNG oficial tal cual (AgX los alteraría).
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"

    # Fondo: degradado suave de verde menta a blanco.
    world = bpy.data.worlds.new("mundo")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = hex_rgba("#F4FCEC")
    bg.inputs["Strength"].default_value = 0.55

    # Suelo / pared curvada (ciclorama) para que no se vea horizonte.
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 4, 0))
    floor = bpy.context.object
    bend = floor.modifiers.new("curva", "SIMPLE_DEFORM")
    floor.data.materials.append(material("suelo", "#F7FDF1", rough=0.9))
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 8, 0), rotation=(math.radians(90), 0, 0))
    wall = bpy.context.object
    wall.data.materials.append(material("pared", "#E9F8DB", rough=1.0))
    floor.modifiers.remove(bend)

    wide = a.formato == "ancho"
    lion_x = 2.25 if wide else 0.0
    lion_h = 4.2

    # Podio redondeado en el verde de la marca, con canto oscuro.
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=1.55, depth=0.38, location=(lion_x, 0, 0.19))
    pod = bpy.context.object
    m = pod.modifiers.new("bevel", "BEVEL")
    m.width = 0.08
    m.segments = 6
    bpy.ops.object.shade_smooth()
    pod.data.materials.append(material("podio", "#58CC02", rough=0.35))
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=1.62, depth=0.12, location=(lion_x, 0, 0.06))
    edge = bpy.context.object
    bpy.ops.object.shade_smooth()
    edge.data.materials.append(material("canto", "#46A302", rough=0.4))

    # León oficial: lámina con la imagen PNG (alfa), sin alterar sus colores.
    img = bpy.data.images.load(a.avatar)
    w, h = img.size
    bpy.ops.mesh.primitive_plane_add(size=1, location=(lion_x, 0.15, 0.38 + lion_h / 2), rotation=(math.radians(90), 0, 0))
    lion = bpy.context.object
    lion.name = "leon-oficial"
    lion.scale = (lion_h * w / h, lion_h, 1)
    mat = bpy.data.materials.new("leon")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Cubic"
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 1.0
    transp = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(tex.outputs["Color"], emit.inputs["Color"])
    nt.links.new(tex.outputs["Alpha"], mix.inputs["Fac"])
    nt.links.new(transp.outputs[0], mix.inputs[1])
    nt.links.new(emit.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    lion.data.materials.append(mat)
    # Que la lámina no reciba luz extra pero sí proyecte sombra.
    lion.visible_diffuse = False
    lion.visible_glossy = False

    # Bloques de nivel A1–C2: dos columnas escalonadas a los lados del león.
    if wide:
        left_x, right_x, base_z = lion_x - 2.0, lion_x + 1.95, 1.2
    else:
        left_x, right_x, base_z = -2.25, 2.25, 1.0
    slots = [(left_x, base_z + 2.5), (left_x - 0.3, base_z + 1.35), (left_x, base_z + 0.2),
             (right_x, base_z + 2.5), (right_x + 0.25, base_z + 1.35), (right_x, base_z + 0.2)]
    order = [0, 1, 2, 3, 4, 5]
    for (txt, col), i in zip(LEVELS, order):
        x, z = slots[i]
        side = -1 if x < lion_x else 1
        tilt = (math.radians(6 if i % 2 else -6), 0, math.radians(14 * side))
        box = rounded_box(f"nivel-{txt}", (0.72, 0.42, 0.72), (x, -0.5, z), col, bevel=0.13, rot=tilt)
        label(txt, box, 0.42)

    # Confeti: pequeñas esferas en los colores de los niveles.
    import random
    random.seed(7)
    for i in range(26 if wide else 18):
        col = LEVELS[i % 6][1]
        x = random.uniform(-7.5, 7.5) if wide else random.uniform(-3.4, 3.4)
        z = random.uniform(0.6, 5.6)
        y = random.uniform(-0.2, 2.5)
        if abs(x - lion_x) < 3.0 and z < 5.2:
            continue
        if not wide and z > 4.2:  # deja limpia la zona del titular en la versión móvil
            continue
        bpy.ops.mesh.primitive_uv_sphere_add(radius=random.uniform(0.05, 0.11), location=(x, y, z), segments=24, ring_count=12)
        bpy.ops.object.shade_smooth()
        bpy.context.object.data.materials.append(material(f"confeti-{i}", col, rough=0.3))

    # Luces: principal cálida, relleno frío y contraluz.
    def area(name, loc, rot, energy, size, color="#FFFFFF"):
        bpy.ops.object.light_add(type="AREA", location=loc, rotation=rot)
        L = bpy.context.object
        L.data.energy = energy
        L.data.size = size
        L.data.color = hex_rgba(color)[:3]
        return L

    area("clave", (lion_x - 4, -6, 7), (math.radians(55), 0, math.radians(-30)), 650, 5, "#FFF4E0")
    area("relleno", (lion_x + 6, -5, 3), (math.radians(70), 0, math.radians(50)), 220, 6, "#E6F2FF")
    area("contra", (lion_x, 5, 6), (math.radians(-60), 0, 0), 250, 4)

    # Cámara.
    if wide:
        cam_loc, target, lens = (0.0, -15.5, 2.9), (0.0, 0.0, 2.35), 50
    else:
        cam_loc, target, lens = (0.0, -12.5, 2.8), (0.0, 0.0, 2.55), 45
    bpy.ops.object.camera_add(location=cam_loc)
    cam = bpy.context.object
    cam.data.lens = lens
    direction = [t - c for t, c in zip(target, cam_loc)]
    import mathutils
    cam.rotation_euler = mathutils.Vector(direction).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam

    if a.blend:
        bpy.ops.wm.save_as_mainfile(filepath=a.blend)
    scene.render.filepath = a.salida
    scene.render.image_settings.file_format = "PNG"
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    build(args())
