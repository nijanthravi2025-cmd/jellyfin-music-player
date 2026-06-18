import React, { useState, useEffect, useRef } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import "./ImageCropperModal.css";

export default function ImageCropperModal({ imageSrc, onCropComplete, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Dimensions of the circular crop area
  const cropSize = 200;

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Calculate scaling to cover the crop area
  const minScale = imageSize.width && imageSize.height
    ? cropSize / Math.min(imageSize.width, imageSize.height)
    : 1;

  const currentScale = minScale * zoom;
  const dispWidth = imageSize.width * minScale;
  const dispHeight = imageSize.height * minScale;

  // Clamped bounds to keep image covering the crop circle
  const maxOffsetX = Math.max(0, (dispWidth * zoom - cropSize) / 2);
  const maxOffsetY = Math.max(0, (dispHeight * zoom - cropSize) / 2);

  const clampOffset = (x, y) => {
    return {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, x)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, y))
    };
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    setOffset(clampOffset(newX, newY));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Support for Mobile / Touchscreens
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX - offset.x, y: touch.clientY - offset.y };
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.current.x;
    const newY = touch.clientY - dragStart.current.y;
    setOffset(clampOffset(newX, newY));
  };

  // Re-clamp offsets when zoom changes to prevent image gaps
  useEffect(() => {
    setOffset(prev => clampOffset(prev.x, prev.y));
  }, [zoom]);

  const handleSave = () => {
    if (!imageSize.width) return;

    const canvas = document.createElement("canvas");
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, cropSize, cropSize);

      // We want to crop a circle, so we apply a clipping mask on the canvas
      ctx.beginPath();
      ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
      ctx.clip();

      // Draw image with scale and translation
      ctx.translate(cropSize / 2, cropSize / 2);
      ctx.scale(currentScale, currentScale);
      
      // Apply drag offset (divided by currentScale since it's translated)
      ctx.translate(offset.x / currentScale, offset.y / currentScale);

      // Draw image centered at origin
      ctx.drawImage(img, -imageSize.width / 2, -imageSize.height / 2);

      const croppedBase64 = canvas.toDataURL("image/jpeg", 0.92);
      onCropComplete(croppedBase64);
    };
    img.src = imageSrc;
  };

  return (
    <div className="crop-modal-backdrop" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onTouchMove={handleTouchMove} onTouchEnd={handleMouseUp}>
      <div className="crop-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="crop-modal-header">
          <h3>Crop Profile Picture</h3>
          <button className="crop-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="crop-modal-body">
          <p className="crop-instruction-text">Drag to position, use slider to zoom</p>
          
          {/* Crop Area Frame */}
          <div 
            className="crop-window-frame" 
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{ width: cropSize, height: cropSize }}
          >
            {imageSrc && (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="To Crop"
                className="crop-source-image"
                style={{
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  width: dispWidth,
                  height: dispHeight,
                  cursor: isDragging ? "grabbing" : "grab"
                }}
                draggable={false}
              />
            )}
            <div className="crop-overlay-circle"></div>
          </div>

          {/* Slider Control */}
          <div className="crop-zoom-control-container">
            <ZoomOut size={16} color="#a0a0a0" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="crop-zoom-slider"
            />
            <ZoomIn size={16} color="#a0a0a0" />
          </div>
        </div>

        <div className="crop-modal-footer">
          <button className="crop-btn cancel" onClick={onClose}>Cancel</button>
          <button className="crop-btn save" onClick={handleSave}>Save Crop</button>
        </div>
      </div>
    </div>
  );
}
