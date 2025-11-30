class TextTool extends ShapeTool {
	constructor() {
		super();
	}

	getShortcut() {
		return new Shortcut({
			control: false,
			key: "t",
			action: () => CanvasTools.selectTool("Text"),
		});
	}

	addPointerDownListener(e) {
		if (e.button !== 0) return;

		const startPosition = new Vector(e.offsetX, e.offsetY);
		const startPositionCtxScale = startPosition.scale(window.devicePixelRatio);

		// Hit test to find if clicking on an existing text shape
		const [r, g, b, a] = viewport.hitTestLayer.ctx.getImageData(
			startPositionCtxScale.x,
			startPositionCtxScale.y,
			1,
			1
		).data;

		const id = (r << 16) | (g << 8) | b;
		const existingShape = viewport.getShapes().find((s) => s.id == id);

		// If clicking on existing text shape, use its click handler
		if (existingShape && existingShape.isText && existingShape.isText()) {
			// Unselect other shapes
			viewport.getShapes().forEach((s) => {
				if (s !== existingShape) {
					s.unselect(false);
				}
			});
			existingShape.click();
			return;
		}

		// Otherwise, create new text at click position
		const mousePosition = viewport.getAdjustedPosition(Vector.fromOffsets(e));

		// Unselect all other shapes
		viewport.getShapes().forEach((s) => s.unselect(false));

		// Create new text with placeholder
		const text = new Text(mousePosition, propertiesPanel.getValues());
		viewport.addShapes(text);

		// Select the text shape
		text.select();

		// Enter edit mode with blinking cursor
		setTimeout(() => {
			if (text.editor) {
				Cursor.enterEditMode(
					viewport.editorLayer.canvas,
					text.editor,
					-1,
					0
				);

				text.editor.recordTextChange();
			}
		}, 10);
	}
}