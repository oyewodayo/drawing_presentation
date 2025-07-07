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

		const moveCallback = (e) => {
			const now = Date.now();
			
			// Throttle drawing to improve performance
			if (now - this._lastDrawTime < this._drawThrottle) {
				return;
			}
			this._lastDrawTime = now;

			const mousePosition = viewport.getAdjustedPosition(
				Vector.fromOffsets(e)
			);
			
			// Preserve the shape ID to avoid flickering
			pathGeneratedShape.id = shapeId;
			pathGeneratedShape.addPoint(mousePosition);

			viewport.drawShapes([pathGeneratedShape]);
		};

		const upCallback = (e) => {
			viewport
				.getStageCanvas()
				.removeEventListener("pointermove", moveCallback);
			viewport.getStageCanvas().removeEventListener("pointerup", upCallback);

			pathGeneratedShape.recenter();
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
