"""
Inference service.
Loads the model on startup and provides prediction functionality.
"""

import sys
import time
from pathlib import Path
from typing import Optional

import torch
import torch.nn.functional as F
from PIL import Image

from backend.app.core.config import get_settings
from backend.app.core.logging import logger


class InferenceService:
    """Singleton service for model inference."""

    def __init__(self):
        self.model = None
        self.prefilter_model = None
        self.class_names: list[str] = []
        self.device = torch.device('cpu')
        self.settings = get_settings()
        self._loaded = False

    def load(self) -> None:
        """Load model and class names on startup."""
        if self._loaded:
            return

        logger.info("Loading model...")
        start = time.time()

        # Detect device
        if torch.cuda.is_available():
            self.device = torch.device('cuda')
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            self.device = torch.device('mps')

        # Load class names
        classes_path = Path(self.settings.classes_path)
        if classes_path.exists():
            with open(classes_path, 'r') as f:
                self.class_names = [c.strip() for c in f.read().split(',') if c.strip()]

        # Load pre-filter model
        try:
            from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights
            self.prefilter_model = mobilenet_v3_small(weights=MobileNet_V3_Small_Weights.DEFAULT)
            self.prefilter_model = self.prefilter_model.to(self.device)
            self.prefilter_model.eval()
            logger.info("Loaded ImageNet pre-filter (MobileNetV3-Small)")
        except Exception as e:
            logger.error(f"Failed to load prefilter model: {e}")

        # Load model
        model_path = Path(self.settings.model_path)
        if not model_path.exists():
            logger.warning(f"Model file not found: {model_path}")
            logger.info("Service will start without a model. Upload a model to enable predictions.")
            return

        try:
            checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)

            if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
                # State dict checkpoint from new training pipeline
                model_name = checkpoint.get('model_name', self.settings.model_name)
                if 'class_names' in checkpoint:
                    self.class_names = checkpoint['class_names']
                self.model = self._create_model(model_name, len(self.class_names))
                self.model.load_state_dict(checkpoint['model_state_dict'])
            elif isinstance(checkpoint, torch.nn.Module):
                # Full model (legacy format)
                self.model = checkpoint
            else:
                # Try loading as full model directly
                self.model = checkpoint

            if isinstance(self.model, torch.nn.Module):
                self.model = self.model.to(self.device)
                self.model.eval()

            self._loaded = True
            elapsed = time.time() - start
            logger.info(f"Model loaded in {elapsed:.2f}s on {self.device} ({len(self.class_names)} classes)")

        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def _create_model(self, model_name: str, num_classes: int) -> torch.nn.Module:
        """Create model architecture by name."""
        # Add project root to path for ML imports
        project_root = Path(__file__).resolve().parents[3]
        if str(project_root) not in sys.path:
            sys.path.insert(0, str(project_root))

        if model_name in ('resnet', 'resnet50'):
            from ml.src.models.resnet import CattleResNet
            return CattleResNet(num_classes=num_classes, pretrained=False, freeze_backbone=False)
        elif model_name == 'cnn':
            from ml.src.models.cnn import CattleCNN
            return CattleCNN(num_classes=num_classes)
        elif model_name == 'mlp':
            from ml.src.models.mlp import CattleMLP
            return CattleMLP(num_classes=num_classes)
        elif model_name in ('vit', 'vit_base'):
            from ml.src.models.vit import CattleViT
            return CattleViT(num_classes=num_classes, pretrained=False, freeze_backbone=False)
        else:
            raise ValueError(f"Unknown model type: {model_name}")

    @torch.no_grad()
    def predict(self, image: Image.Image, top_k: int = 3) -> dict:
        """
        Run prediction on a PIL Image.
        Returns prediction dict.
        """
        if self.model is None:
            raise RuntimeError("Model not loaded")

        from torchvision import transforms
        start = time.time()

        # Preprocess
        transform = transforms.Compose([
            transforms.Resize((self.settings.image_size, self.settings.image_size)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ])

        tensor = transform(image).unsqueeze(0).to(self.device)

        # Pre-filter Check
        if self.prefilter_model is not None:
            pre_outputs = self.prefilter_model(tensor)
            pre_probs = F.softmax(pre_outputs, dim=1).squeeze()
            top5_probs, top5_indices = torch.topk(pre_probs, 5)
            
            # Check if any of the top 5 predictions are animals (ImageNet classes 0-397)
            is_animal = any(idx.item() < 398 for idx in top5_indices)
            if not is_animal:
                elapsed_ms = (time.time() - start) * 1000
                return {
                    'predicted_breed': 'Non-Cattle',
                    'confidence': 1.0,
                    'top_k': [],
                    'model_version': self.settings.model_version,
                    'inference_time_ms': round(elapsed_ms, 2),
                    'warning': 'Image does not appear to contain cattle. Please upload a clear picture of a bovine.'
                }

        # Inference
        outputs = self.model(tensor)
        probabilities = F.softmax(outputs, dim=1).squeeze()

        # Top-k
        top_k_val = min(top_k, len(self.class_names))
        top_probs, top_indices = torch.topk(probabilities, top_k_val)

        top_k_results = []
        for prob, idx in zip(top_probs, top_indices):
            breed_name = self.class_names[idx.item()] if idx.item() < len(self.class_names) else f"class_{idx.item()}"
            top_k_results.append({
                'breed': breed_name,
                'confidence': round(prob.item(), 4),
            })

        best = top_k_results[0]
        elapsed_ms = (time.time() - start) * 1000

        result = {
            'predicted_breed': best['breed'],
            'confidence': best['confidence'],
            'top_k': top_k_results,
            'model_version': self.settings.model_version,
            'inference_time_ms': round(elapsed_ms, 2),
        }

        # Confidence warning
        if best['confidence'] < 0.5:
            result['warning'] = 'Prediction confidence is low. Use a clear side-view image for better results.'
        elif best['confidence'] < 0.75:
            result['warning'] = 'Prediction confidence is moderate. Use a clear side-view image for better results.'

        return result

    @property
    def is_loaded(self) -> bool:
        return self._loaded and self.model is not None


# Singleton
inference_service = InferenceService()
