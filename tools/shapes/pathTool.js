class PathTool extends PathGeneratedShapeTool {
	constructor() {
		super();
		this._shape = Path;
		this._lastDrawTime = 0;
		this._drawThrottle = 10; // ~100fps for responsive feel
	}

	getShortcut() {
		return new Shortcut({
			control: false,
			key: "p",
			action: () => CanvasTools.selectTool("Path"),
		});
	}

	addPointerDownListener(e) {
		if (e.button !== 0) return;

		const startPosition = viewport.getAdjustedPosition(Vector.fromOffsets(e));
		
		// Get path-specific options (no fill)
		const pathOptions = {
			...propertiesPanel.getValues(),
			fill: false,
			stroke: true
		};
		
		const pathGeneratedShape = new this._shape(
			startPosition,
			pathOptions
		);

		// Store the original ID to maintain consistency during drawing
		const shapeId = pathGeneratedShape.id;
		let lastUpdateTime = 0;
		const updateInterval = 10; // ~100fps for smooth, responsive drawing
		let isDrawing = true;
		pathGeneratedShape.isDrawing = true;

		const moveCallback = (e) => {
			if (!isDrawing) return;
			
			const now = Date.now();
			
			// High-frequency updates for smooth drawing
			if (now - lastUpdateTime < updateInterval) {
				return;
			}
			lastUpdateTime = now;

			// Check if mouse is within canvas bounds
			const rect = viewport.getStageCanvas().getBoundingClientRect();
			if (e.clientX < rect.left || e.clientX > rect.right || 
				e.clientY < rect.top || e.clientY > rect.bottom) {
				return;
			}
			const mousePosition = viewport.getAdjustedPosition(
				Vector.fromOffsets(e)
			);
			
			// Add point and preserve shape ID
			pathGeneratedShape.id = shapeId;
			pathGeneratedShape.addPoint(mousePosition);

			// Use optimized drawing for real-time feedback
			viewport.drawShapes([pathGeneratedShape]);
		};

		const upCallback = (e) => {
			isDrawing = false;
			pathGeneratedShape.isDrawing = false;

			viewport
				.getStageCanvas()
				.removeEventListener("pointermove", moveCallback);
			viewport.getStageCanvas().removeEventListener("pointerup", upCallback);
			document.removeEventListener("pointermove", moveCallback);
			document.removeEventListener("pointerup", upCallback);

			// IMPORTANT: Do final processing in the correct order
			if (pathGeneratedShape.rawPoints.length > 1) {
				// 1. Apply final smoothing pass for clean, natural curves
				pathGeneratedShape.smoothPath();

				// 2. Recenter the shape for proper positioning
				pathGeneratedShape.recenter();

				// 3. Only add if the path has meaningful size
				if (pathGeneratedShape.size.width > 0.5 && pathGeneratedShape.size.height > 0.5) {
					viewport.addShapes(pathGeneratedShape);
				} else {
					viewport.drawShapes();
				}
			} else {
				viewport.drawShapes();
			}
		};
		
		viewport.getStageCanvas().addEventListener("pointermove", moveCallback);
		viewport.getStageCanvas().addEventListener("pointerup", upCallback);
		// Also listen on document to catch mouse events outside canvas
		document.addEventListener("pointermove", moveCallback);
		document.addEventListener("pointerup", upCallback);
	}
}