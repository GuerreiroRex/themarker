from transformers import Sam2Processor, Sam2Model
from PIL import Image, ImageDraw
import torch
import numpy as np
from skimage.measure import find_contours, approximate_polygon
import sys
import argparse
import os

# from platformdirs import user_data_dir

# # O equivalente direto para "com.themarker.temp" como caminho
# dir_path = user_data_dir("temp", "themarker", "com")

from platformdirs import user_data_dir
from pathlib import Path

def main():
    # Configurar argumentos do terminal
    parser = argparse.ArgumentParser(description='Segmentação SAM2 com saída COCO')
    parser.add_argument('--points', type=str, required=True, 
                       help='Pontos no formato "x1,y1,x2,y2"')
    
    args = parser.parse_args()

    base_dir = user_data_dir("temp", "themarker", roaming=True)
    data_dir = Path(base_dir) / "data"

    # Construir caminho para a imagem temp.png no dir_path
    image_path = os.path.join(data_dir.absolute(), "temp.png")

    # Verificar se o arquivo de imagem existe
    if not os.path.exists(image_path):
        print(f"Erro: Arquivo não encontrado em {image_path}")
        sys.exit(1)

    # Processar pontos
    points_list = [float(x) for x in args.points.split(',')]
    if len(points_list) % 2 != 0:
        raise ValueError("Número de coordenadas dos pontos deve ser par")
    
    # Converter pontos para bounding box [x_min, y_min, x_max, y_max]
    x_coords = points_list[::2]
    y_coords = points_list[1::2]
    input_boxes = [[[
        min(x_coords),
        min(y_coords),
        max(x_coords),
        max(y_coords)
    ]]]

    # Carregar imagem do diretório
    try:
        raw_image = Image.open(image_path).convert("RGB")
    except Exception as e:
        print(f"Erro ao carregar imagem: {str(e)}")
        sys.exit(1)

    # --- SALVAR IMAGEM ORIGINAL ---
    original_save_path = os.path.join(data_dir.absolute(), "original_image.png")
    raw_image.save(original_save_path)

    # --- SALVAR PEDAÇO RETANGULAR DO BBOX ---
    bbox = input_boxes[0][0]
    # Garantir que as coordenadas estão dentro dos limites da imagem
    width, height = raw_image.size
    x_min = max(0, int(bbox[0]))
    y_min = max(0, int(bbox[1]))
    x_max = min(width, int(bbox[2]))
    y_max = min(height, int(bbox[3]))
    
    # Recortar a região do bbox
    bbox_region = raw_image.crop((x_min, y_min, x_max, y_max))
    bbox_save_path = os.path.join(data_dir.absolute(), "bbox_region.png")
    bbox_region.save(bbox_save_path)

    # Carregar modelo e processador
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = Sam2Model.from_pretrained("facebook/sam2.1-hiera-base-plus").to(device)
    processor = Sam2Processor.from_pretrained("facebook/sam2.1-hiera-base-plus")

    # Processar entradas
    inputs = processor(
        images=raw_image,
        input_boxes=input_boxes,
        return_tensors="pt"
    ).to(device)

    # Inferência
    with torch.no_grad():
        outputs = model(**inputs)

    # Pós-processamento
    masks = processor.post_process_masks(
        outputs.pred_masks.cpu(), 
        inputs["original_sizes"]
    )[0]

    # Encontrar máscara com maior score
    best_mask_idx = torch.argmax(outputs.iou_scores).item()
    best_mask = masks[0, best_mask_idx].numpy().astype(np.uint8)

    # --- SALVAR MÁSCARA GERADA ---
    mask_image = Image.fromarray(best_mask * 255)
    mask_save_path = os.path.join(data_dir.absolute(), "generated_mask.png")
    mask_image.save(mask_save_path)

    # --- SALVAR IMAGEM COM MÁSCARA ---
    mask_overlay = Image.new("RGBA", raw_image.size, (0, 0, 0, 0))
    mask_rgba = Image.fromarray((best_mask * 255).astype(np.uint8), mode='L')
    mask_overlay.putalpha(mask_rgba)
    
    image_with_mask = raw_image.copy()
    image_with_mask = image_with_mask.convert("RGBA")
    image_with_mask.paste((255, 0, 0, 128), mask=mask_rgba)
    mask_overlay_save_path = os.path.join(data_dir.absolute(), "image_with_mask.png")
    image_with_mask.save(mask_overlay_save_path)

    # --- SALVAR IMAGEM COM PONTOS ---
    image_with_points = raw_image.copy()
    draw = ImageDraw.Draw(image_with_points)
    
    # Desenhar bounding box
    bbox = input_boxes[0][0]
    draw.rectangle([bbox[0], bbox[1], bbox[2], bbox[3]], outline="red", width=3)
    
    # Desenhar pontos individuais
    point_radius = 5
    for i in range(0, len(points_list), 2):
        x, y = points_list[i], points_list[i+1]
        draw.ellipse([x-point_radius, y-point_radius, x+point_radius, y+point_radius], fill="blue")
    
    points_save_path = os.path.join(data_dir.absolute(), "image_with_points.png")
    image_with_points.save(points_save_path)

    # Encontrar contorno e aproximar polígono
    contours = find_contours(best_mask, level=0.5)
    if not contours:
        raise ValueError("Nenhum contorno encontrado na máscara")

    main_contour = max(contours, key=len)
    approximated = approximate_polygon(main_contour, tolerance=2.0)

    # --- SALVAR IMAGEM COM PONTOS APROXIMADOS ---
    image_with_approx = raw_image.copy()
    draw_approx = ImageDraw.Draw(image_with_approx)
    
    # Converter contorno aproximado para formato de desenho
    approx_points = [(point[1], point[0]) for point in approximated]  # Trocar x e y
    if len(approx_points) > 1:
        draw_approx.line(approx_points, fill="green", width=3)
    
    # Desenhar pontos do polígono aproximado
    for point in approx_points:
        draw_approx.ellipse([point[0]-3, point[1]-3, point[0]+3, point[1]+3], fill="yellow")
    
    approx_save_path = os.path.join(data_dir.absolute(), "image_with_approximated_points.png")
    image_with_approx.save(approx_save_path)

    # Converter para formato (x, y) e achatatar
    segmentation = approximated[:, [1, 0]].flatten().tolist()

    # Saída direta da lista de coordenadas
    print(segmentation)

if __name__ == "__main__":
    main()