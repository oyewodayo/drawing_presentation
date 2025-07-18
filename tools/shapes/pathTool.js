class PathTool extends PathGeneratedShapeTool {
	constructor() {
		super();
		this._shape = Path;
		this._lastDrawTime = 0;
		this._drawThrottle = 16; // ~60fps
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
		const pathGeneratedShape = new this._shape(
			startPosition,
			propertiesPanel.getValues()
		);

		// Store the original ID to maintain consistency during drawing
		const shapeId = pathGeneratedShape.id;
		let lastUpdateTime = 0;
		const updateInterval = 8; // ~120fps for ultra-smooth drawing

		const moveCallback = (e) => {
			const now = Date.now();
			
			// High-frequency updates for smooth drawing
			if (now - lastUpdateTime < updateInterval) {
				return;
			}
			lastUpdateTime = now;

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
			viewport
				.getStageCanvas()
				.removeEventListener("pointermove", moveCallback);
			viewport.getStageCanvas().removeEventListener("pointerup", upCallback);

			pathGeneratedShape.recenter();
			
			// Final smoothing pass after drawing is complete
			pathGeneratedShape.smoothPath();
			
			if (
				pathGeneratedShape.size.width > 0 &&
				pathGeneratedShape.size.height > 0
			) {
				viewport.addShapes(pathGeneratedShape);
			}
		};
		
		viewport.getStageCanvas().addEventListener("pointermove", moveCallback);
		viewport.getStageCanvas().addEventListener("pointerup", upCallback);
	}
}
