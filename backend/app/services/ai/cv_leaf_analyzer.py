import cv2
import numpy as np
import base64
import os

def analyze_leaf_cv(img_input):
    if isinstance(img_input, str):
        if 'base64,' in img_input:
            img_input = img_input.split('base64,')[1]
            raw_bytes = base64.b64decode(img_input.strip())
            nparr = np.frombuffer(raw_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif os.path.exists(img_input):
            img = cv2.imread(img_input)
        else:
            base_name = os.path.basename(img_input)
            repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
            possible_paths = [
                os.path.join(repo_root, 'frontend', 'public', 'sample_leaves', base_name),
                os.path.join(repo_root, 'dist', 'sample_leaves', base_name),
                os.path.join(os.getcwd(), 'frontend', 'public', 'sample_leaves', base_name),
                os.path.join(os.getcwd(), '..', 'frontend', 'public', 'sample_leaves', base_name),
                os.path.join(os.getcwd(), 'dist', 'sample_leaves', base_name),
                os.path.join(os.getcwd(), '..', 'dist', 'sample_leaves', base_name),
                os.path.join(os.getcwd(), 'backend', 'static', 'dataset_tests', base_name),
                os.path.join(os.getcwd(), 'static', 'dataset_tests', base_name),
            ]
            for p in possible_paths:
                if os.path.exists(p):
                    img = cv2.imread(p)
                    break
            if img is None:
                try:
                    raw_bytes = base64.b64decode(img_input.strip())
                    nparr = np.frombuffer(raw_bytes, np.uint8)
                    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                except Exception:
                    img = None
    elif isinstance(img_input, bytes):
        nparr = np.frombuffer(img_input, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    else:
        img = img_input

    if img is None:
        return None

    h, w = img.shape[:2]
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    leaf_mask = (hsv[:, :, 1] > 25) & (hsv[:, :, 2] > 25) & (hsv[:, :, 2] < 245)
    leaf_mask = leaf_mask.astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    leaf_mask = cv2.morphologyEx(leaf_mask, cv2.MORPH_CLOSE, kernel)
    total_leaf_pixels = int(np.count_nonzero(leaf_mask))

    if total_leaf_pixels < 500:
        total_leaf_pixels = h * w
        leaf_mask = np.ones((h, w), dtype=np.uint8) * 255

    necrosis_mask = cv2.inRange(hsv, np.array([5, 40, 20]), np.array([24, 255, 180]))
    chlorosis_mask = cv2.inRange(hsv, np.array([25, 60, 40]), np.array([42, 255, 230]))
    disease_mask = cv2.bitwise_or(necrosis_mask, chlorosis_mask)
    disease_mask = cv2.bitwise_and(disease_mask, leaf_mask)
    disease_mask = cv2.morphologyEx(disease_mask, cv2.MORPH_OPEN, kernel)

    diseased_pixels = int(np.count_nonzero(disease_mask))
    necrotic_pixels = int(np.count_nonzero(cv2.bitwise_and(necrosis_mask, leaf_mask)))
    chlorotic_pixels = int(np.count_nonzero(cv2.bitwise_and(chlorosis_mask, leaf_mask)))

    affected_pct = round((diseased_pixels / max(1, total_leaf_pixels)) * 100.0, 2)
    healthy_pct = round(max(0.0, 100.0 - affected_pct), 2)

    contours, _ = cv2.findContours(disease_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    bboxes = []
    svg_masks = []

    valid_contours = [c for c in contours if cv2.contourArea(c) > 40]
    valid_contours.sort(key=cv2.contourArea, reverse=True)

    for i, c in enumerate(valid_contours[:6]):
        bx, by, bw, bh = cv2.boundingRect(c)
        c_area = float(cv2.contourArea(c))
        c_pct = round((c_area / max(1, total_leaf_pixels)) * 100.0, 2)

        px = round((bx / w) * 100, 1)
        py = round((by / h) * 100, 1)
        pw = round((bw / w) * 100, 1)
        ph = round((bh / h) * 100, 1)

        bboxes.append({
            'x': px,
            'y': py,
            'width': pw,
            'height': ph,
            'intensity': round(min(0.98, 0.72 + (c_area / (total_leaf_pixels * 0.15))), 2),
            'label': f'Lesion #{i+1} ({c_pct}%)'
        })

        epsilon = 0.02 * cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, epsilon, True)
        pts_str = ' '.join([f'{round((pt[0][0]/w)*100, 1)},{round((pt[0][1]/h)*100, 1)}' for pt in approx])

        svg_masks.append({
            'id': f'lesion_cluster_{i+1}',
            'label': f'Necrotic Foci #{i+1}',
            'points': pts_str,
            'area_pct': c_pct,
            'color': 'rgba(239, 68, 68, 0.65)'
        })

    return {
        'total_leaf_pixels': total_leaf_pixels,
        'diseased_pixels': diseased_pixels,
        'necrotic_pixels': necrotic_pixels,
        'chlorotic_pixels': chlorotic_pixels,
        'affected_pct': affected_pct,
        'healthy_pct': healthy_pct,
        'bboxes': bboxes,
        'svg_masks': svg_masks
    }


def generate_heatmap_b64(img_input) -> str | None:
    """
    Generates a real OpenCV JET-colormap heatmap from the HSV disease mask,
    blended onto the original image. Returns base64-encoded PNG string, or None on failure.

    The heatmap IS the necrotic+chlorotic HSV pixel mask — not a synthetic overlay.
    """
    try:
        # Resolve input to a BGR numpy array
        if isinstance(img_input, str):
            if 'base64,' in img_input:
                raw = base64.b64decode(img_input.split('base64,')[1].strip())
                arr = np.frombuffer(raw, np.uint8)
                img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            elif os.path.exists(img_input):
                img = cv2.imread(img_input)
            else:
                base_name = os.path.basename(img_input)
                repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
                candidates = [
                    os.path.join(repo_root, 'frontend', 'public', 'sample_leaves', base_name),
                    os.path.join(repo_root, 'dist', 'sample_leaves', base_name),
                    os.path.join(os.getcwd(), '..', 'frontend', 'public', 'sample_leaves', base_name),
                ]
                img = None
                for p in candidates:
                    if os.path.exists(p):
                        img = cv2.imread(p)
                        break
                if img is None:
                    try:
                        arr = np.frombuffer(base64.b64decode(img_input.strip()), np.uint8)
                        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                    except Exception:
                        return None
        elif isinstance(img_input, bytes):
            arr = np.frombuffer(img_input, np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        else:
            img = img_input

        if img is None:
            return None

        h, w = img.shape[:2]
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        # Same leaf + disease masks as analyze_leaf_cv
        leaf_mask = ((hsv[:, :, 1] > 25) & (hsv[:, :, 2] > 25) & (hsv[:, :, 2] < 245)).astype(np.uint8) * 255
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        leaf_mask = cv2.morphologyEx(leaf_mask, cv2.MORPH_CLOSE, kernel)

        necrosis = cv2.inRange(hsv, np.array([5, 40, 20]),  np.array([24, 255, 180]))
        chlorosis = cv2.inRange(hsv, np.array([25, 60, 40]), np.array([42, 255, 230]))
        disease_mask = cv2.bitwise_and(cv2.bitwise_or(necrosis, chlorosis), leaf_mask)
        disease_mask = cv2.morphologyEx(disease_mask, cv2.MORPH_OPEN, kernel)

        # Dilate slightly so the heatmap is visible at small display sizes
        dilated = cv2.dilate(disease_mask, kernel, iterations=2)

        # Apply JET colormap → vivid red/yellow for diseased, blue/dark for healthy
        heat_jet = cv2.applyColorMap(dilated, cv2.COLORMAP_JET)

        # Blend: show heatmap only where leaf tissue exists, keep background dark
        leaf_3ch = cv2.cvtColor(leaf_mask, cv2.COLOR_GRAY2BGR)
        background = (img * 0.25).astype(np.uint8)   # dim the original
        blended = np.where(leaf_3ch > 0, cv2.addWeighted(img, 0.35, heat_jet, 0.65, 0), background)

        # Encode to PNG → base64
        ok, buf = cv2.imencode('.jpg', blended, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
        if not ok:
            return None
        return base64.b64encode(buf.tobytes()).decode('utf-8')

    except Exception:
        return None

