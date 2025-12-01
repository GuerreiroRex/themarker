from transformers import Sam2Processor, Sam2Model
from PIL import Image
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

    # Encontrar contorno e aproximar polígono
    contours = find_contours(best_mask, level=0.5)
    if not contours:
        raise ValueError("Nenhum contorno encontrado na máscara")

    main_contour = max(contours, key=len)
    approximated = approximate_polygon(main_contour, tolerance=2.0)

    # Converter para formato (x, y) e achatatar
    segmentation = approximated[:, [1, 0]].flatten().tolist()

    # Saída direta da lista de coordenadas
    print(segmentation)

if __name__ == "__main__":
    main()